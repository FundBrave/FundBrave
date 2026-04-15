'use client';

import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { EncryptionKeyPair, TempWalletState, WalletType, StoredKeyPair } from '@/app/types/web3-chat';
import { saveKeyPair, loadKeyPair, saveTempWallet, loadTempWallet, deleteTempWallet } from './local-store';

const DOMAIN_SEPARATOR = 'FundBrave Chat Key v1';
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16; // 16 bytes

// ─── Key Derivation ──────────────────────────────────────────────────────────

/**
 * Derive an encryption keypair from a wallet signature.
 * The wallet signs a deterministic message — the signature is hashed to produce the secret key.
 */
export async function deriveKeyPairFromWallet(
  signMessage: (message: string) => Promise<string>,
  walletAddress: string
): Promise<EncryptionKeyPair> {
  const message = `${DOMAIN_SEPARATOR}:${walletAddress}`;
  const signature = await signMessage(message);
  const sigBytes = new TextEncoder().encode(signature);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', sigBytes));
  return nacl.box.keyPair.fromSecretKey(hash);
}

/**
 * Derive an encryption keypair from a temp wallet's private key.
 * No external signature needed — we hold the private key directly.
 */
export async function deriveKeyPairFromTempWallet(
  privateKey: `0x${string}`
): Promise<EncryptionKeyPair> {
  const keyBytes = new TextEncoder().encode(privateKey);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', keyBytes));
  return nacl.box.keyPair.fromSecretKey(hash);
}

// ─── Encrypt / Decrypt ───────────────────────────────────────────────────────

export function encrypt(
  plaintext: string,
  sharedKey: Uint8Array
): { ciphertext: Uint8Array; nonce: Uint8Array } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = decodeUTF8(plaintext);
  const ciphertext = nacl.box.after(messageBytes, nonce, sharedKey);
  return { ciphertext, nonce };
}

export function decrypt(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  sharedKey: Uint8Array
): string | null {
  const decrypted = nacl.box.open.after(ciphertext, nonce, sharedKey);
  if (!decrypted) return null;
  return encodeUTF8(decrypted);
}

/**
 * Derive a shared secret using Curve25519 key agreement.
 * nacl.box.before = precomputed shared key for encrypt/decrypt.
 */
export function deriveSharedSecret(
  ourSecretKey: Uint8Array,
  theirPublicKey: Uint8Array
): Uint8Array {
  return nacl.box.before(theirPublicKey, ourSecretKey);
}

// ─── Temp Wallet Management ──────────────────────────────────────────────────

/**
 * Derive a PBKDF2 key from the user's auth session for encrypting the temp wallet private key.
 */
async function derivePBKDF2Key(
  authSub: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authSub),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a new temp wallet, encrypt the private key, and persist to IndexedDB.
 */
export async function generateAndStoreTempWallet(
  userId: string,
  authSub: string
): Promise<{ address: string; keyPair: EncryptionKeyPair }> {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  // Encrypt private key with PBKDF2-derived AES-GCM key
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const aesKey = await derivePBKDF2Key(authSub, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM nonce
  const encryptedPrivateKey = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
      aesKey,
      new TextEncoder().encode(privateKey)
    )
  );

  const tempState: TempWalletState = {
    userId,
    encryptedPrivateKey,
    iv,
    salt,
    createdAt: Date.now(),
    isActive: true,
  };
  await saveTempWallet(tempState);

  // Derive encryption keypair from temp wallet
  const keyPair = await deriveKeyPairFromTempWallet(privateKey);
  const storedKeyPair: StoredKeyPair = {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
    walletType: 'temp' as WalletType,
    createdAt: Date.now(),
  };
  await saveKeyPair(userId, storedKeyPair);

  return { address: account.address, keyPair };
}

/**
 * Load and decrypt an existing temp wallet from IndexedDB.
 */
export async function loadAndDecryptTempWallet(
  userId: string,
  authSub: string
): Promise<{ privateKey: `0x${string}`; keyPair: EncryptionKeyPair } | null> {
  const tempState = await loadTempWallet(userId);
  if (!tempState || !tempState.isActive) return null;

  try {
    const aesKey = await derivePBKDF2Key(authSub, tempState.salt);
    const iv = tempState.iv;
    const decryptedBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
      aesKey,
      tempState.encryptedPrivateKey.buffer.slice(tempState.encryptedPrivateKey.byteOffset, tempState.encryptedPrivateKey.byteOffset + tempState.encryptedPrivateKey.byteLength) as ArrayBuffer
    );
    const privateKey = new TextDecoder().decode(decryptedBytes) as `0x${string}`;
    const keyPair = await deriveKeyPairFromTempWallet(privateKey);
    return { privateKey, keyPair };
  } catch {
    // Decryption failed — likely different auth session or corrupted data
    return null;
  }
}

/**
 * Remove temp wallet data after real wallet is connected.
 */
export async function removeTempWallet(userId: string): Promise<void> {
  await deleteTempWallet(userId);
}

// ─── Key Persistence (high-level) ────────────────────────────────────────────

export async function persistKeyPair(
  userId: string,
  keyPair: EncryptionKeyPair,
  walletType: WalletType
): Promise<void> {
  await saveKeyPair(userId, {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
    walletType,
    createdAt: Date.now(),
  });
}

export async function getStoredKeyPair(userId: string): Promise<StoredKeyPair | undefined> {
  return loadKeyPair(userId);
}

// ─── Utility: Encode keys for transport ──────────────────────────────────────

export function publicKeyToBase64(key: Uint8Array): string {
  return encodeBase64(key);
}

export function base64ToPublicKey(b64: string): Uint8Array {
  return decodeBase64(b64);
}
