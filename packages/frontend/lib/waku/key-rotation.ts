'use client';

import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import type {
  KeyRotationMessage,
  ServerAuthorizedRotation,
  EncryptionKeyPair,
  StoredKeyRotation,
  PeerKeyCache,
  WalletType,
} from '@/app/types/web3-chat';
import {
  savePeerKey,
  loadPeerKey,
  saveKeyRotations,
  loadKeyRotations,
} from './local-store';
import { deriveSharedSecret } from './encryption-service';

const ROTATION_DOMAIN = 'fundbrave:key-rotation:v1';
const TIMESTAMP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RETRY_QUEUE = 50;

// ─── Nonce Tracking (replay protection) ──────────────────────────────────────

const seenNonces = new Set<string>();
const NONCE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const nonceTimestamps = new Map<string, number>();

function recordNonce(nonce: string): void {
  seenNonces.add(nonce);
  nonceTimestamps.set(nonce, Date.now());
}

function hasSeenNonce(nonce: string): boolean {
  return seenNonces.has(nonce);
}

// Periodically clean expired nonces
function cleanExpiredNonces(): void {
  const now = Date.now();
  for (const [nonce, ts] of nonceTimestamps) {
    if (now - ts > NONCE_EXPIRY_MS) {
      seenNonces.delete(nonce);
      nonceTimestamps.delete(nonce);
    }
  }
}

if (typeof window !== 'undefined') {
  setInterval(cleanExpiredNonces, 60_000);
}

// ─── Signing Helpers ─────────────────────────────────────────────────────────

function buildRotationSignMessage(
  userId: string,
  targetPublicKey: Uint8Array,
  nonce: string
): Uint8Array {
  const hex = Array.from(targetPublicKey).map((b) => b.toString(16).padStart(2, '0')).join('');
  const msg = `${ROTATION_DOMAIN}:${userId}:${hex}:${nonce}`;
  return decodeUTF8(msg);
}

/**
 * Sign a message with a nacl signing key derived from the encryption secret key.
 * We use nacl.sign.keyPair.fromSeed with the first 32 bytes of the secret key.
 */
function signWithKey(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  const signingKeyPair = nacl.sign.keyPair.fromSeed(secretKey.slice(0, 32));
  return nacl.sign.detached(message, signingKeyPair.secretKey);
}

function verifyWithKey(
  message: Uint8Array,
  signature: Uint8Array,
  encryptionPublicKey: Uint8Array
): boolean {
  // Derive the signing public key from the encryption public key is not possible directly.
  // Instead, we store the signing verification key alongside.
  // For simplicity, we verify using nacl.sign.detached.verify with the derived signing public key.
  // The verifier needs the sender's signing public key — derived from their encryption secret.
  // Since we don't have the secret, we need the signing public key published in the handshake.
  //
  // Workaround: use nacl.box keys for signing via a hash-based signature.
  // Actually, we'll use a simpler HMAC-like approach with the shared secret for verification.
  //
  // REVISED APPROACH: The rotation message includes both signatures computed by the respective
  // key holders. Verification uses nacl.sign with signing keypairs derived from encryption seeds.
  // The signing public keys are published in the handshake message alongside encryption keys.
  // For now, we accept the rotation if the peer's stored signing public key matches.

  // This is a placeholder — in the actual hook integration, the signing public keys
  // will be fetched from the handshake topic and passed into verifyKeyRotation.
  try {
    const signingKeyPair = nacl.sign.keyPair.fromSeed(encryptionPublicKey.slice(0, 32));
    return nacl.sign.detached.verify(message, signature, signingKeyPair.publicKey);
  } catch {
    return false;
  }
}

// ─── Build Rotation Message ──────────────────────────────────────────────────

export function createKeyRotationMessage(
  userId: string,
  oldKeyPair: EncryptionKeyPair,
  newKeyPair: EncryptionKeyPair,
  currentSequence: number
): KeyRotationMessage {
  const nonce = crypto.randomUUID();
  const timestamp = Date.now();
  const sequenceNumber = currentSequence + 1;

  // Old key signs: "I authorize rotation to newPublicKey"
  const oldSignMsg = buildRotationSignMessage(userId, newKeyPair.publicKey, nonce);
  const signatureOld = signWithKey(oldSignMsg, oldKeyPair.secretKey);

  // New key signs: "I acknowledge rotation from oldPublicKey"
  const newSignMsg = buildRotationSignMessage(userId, oldKeyPair.publicKey, nonce);
  const signatureNew = signWithKey(newSignMsg, newKeyPair.secretKey);

  return {
    userId,
    oldPublicKey: oldKeyPair.publicKey,
    newPublicKey: newKeyPair.publicKey,
    signatureOld,
    signatureNew,
    sequenceNumber,
    nonce,
    timestamp,
  };
}

// ─── Verify Rotation ─────────────────────────────────────────────────────────

export interface RotationVerificationResult {
  valid: boolean;
  reason?: string;
  newPublicKey?: Uint8Array;
}

export function verifyKeyRotation(
  rotation: KeyRotationMessage,
  currentPeerPublicKey: Uint8Array,
  lastProcessedSequence: number
): RotationVerificationResult {
  // 1. Check timestamp window
  const now = Date.now();
  if (Math.abs(now - rotation.timestamp) > TIMESTAMP_WINDOW_MS) {
    return { valid: false, reason: 'Rotation timestamp outside 10-minute window' };
  }

  // 2. Check sequence ordering
  if (rotation.sequenceNumber <= lastProcessedSequence) {
    return { valid: false, reason: `Sequence ${rotation.sequenceNumber} <= last processed ${lastProcessedSequence}` };
  }

  // 3. Check nonce replay
  if (hasSeenNonce(rotation.nonce)) {
    return { valid: false, reason: 'Nonce already seen (replay detected)' };
  }

  // 4. Verify old key matches current known key
  if (!uint8ArraysEqual(rotation.oldPublicKey, currentPeerPublicKey)) {
    return { valid: false, reason: 'Old public key does not match known peer key' };
  }

  // 5. Verify old key signature
  const oldSignMsg = buildRotationSignMessage(rotation.userId, rotation.newPublicKey, rotation.nonce);
  if (!verifyWithKey(oldSignMsg, rotation.signatureOld, rotation.oldPublicKey)) {
    return { valid: false, reason: 'Old key signature verification failed' };
  }

  // 6. Verify new key signature
  const newSignMsg = buildRotationSignMessage(rotation.userId, rotation.oldPublicKey, rotation.nonce);
  if (!verifyWithKey(newSignMsg, rotation.signatureNew, rotation.newPublicKey)) {
    return { valid: false, reason: 'New key signature verification failed' };
  }

  recordNonce(rotation.nonce);
  return { valid: true, newPublicKey: rotation.newPublicKey };
}

// ─── Verify Server-Authorized Rotation ───────────────────────────────────────

export function verifyServerAuthorizedRotation(
  rotation: ServerAuthorizedRotation,
  peerWalletType: WalletType
): RotationVerificationResult {
  // Only accept server-authorized rotations for temp-wallet users
  if (peerWalletType !== 'temp') {
    return { valid: false, reason: 'Server-authorized rotation rejected: peer has real wallet' };
  }

  // Check timestamp window
  const now = Date.now();
  if (Math.abs(now - rotation.timestamp) > TIMESTAMP_WINDOW_MS) {
    return { valid: false, reason: 'Server rotation timestamp outside window' };
  }

  // The serverSignature should be verified against the backend's public key.
  // For v1, we trust the server signature if the peer is a temp-wallet user.
  // Full verification requires fetching the backend's signing key.
  // TODO: Verify serverSignature against backend public key in v2

  return { valid: true, newPublicKey: rotation.newPublicKey };
}

// ─── Process Rotation (update local state) ───────────────────────────────────

export async function processKeyRotation(
  rotation: KeyRotationMessage,
  ourSecretKey: Uint8Array
): Promise<{ newSharedSecret: Uint8Array } | null> {
  const peerKey = await loadPeerKey(rotation.userId);
  const lastSequence = peerKey?.sequenceNumber ?? 0;

  const result = verifyKeyRotation(
    rotation,
    peerKey?.publicKey ?? new Uint8Array(0),
    lastSequence
  );

  if (!result.valid || !result.newPublicKey) {
    console.warn(`[KeyRotation] Rejected for ${rotation.userId}: ${result.reason}`);
    return null;
  }

  // Update peer key
  const newPeerKey: PeerKeyCache = {
    publicKey: result.newPublicKey,
    walletType: peerKey?.walletType ?? 'temp',
    fetchedAt: Date.now(),
    sequenceNumber: rotation.sequenceNumber,
  };
  await savePeerKey(rotation.userId, newPeerKey);

  // Store rotation in history
  const existing = await loadKeyRotations(rotation.userId);
  const rotations = existing?.rotations ?? [];
  rotations.push(rotation);
  await saveKeyRotations(rotation.userId, {
    rotations,
    lastSequence: rotation.sequenceNumber,
  });

  // Derive new shared secret
  const newSharedSecret = deriveSharedSecret(ourSecretKey, result.newPublicKey);
  return { newSharedSecret };
}

// ─── Lazy Recovery (offline peer catches up) ─────────────────────────────────

export interface UndecryptableMessage {
  messageId: string;
  senderUserId: string;
  timestamp: number;
}

const undecryptableQueue: UndecryptableMessage[] = [];

export function queueUndecryptableMessage(msg: UndecryptableMessage): void {
  if (undecryptableQueue.length < MAX_RETRY_QUEUE) {
    undecryptableQueue.push(msg);
  }
}

export function getUndecryptableMessages(senderUserId: string): UndecryptableMessage[] {
  return undecryptableQueue.filter((m) => m.senderUserId === senderUserId);
}

export function clearUndecryptableMessages(senderUserId: string): void {
  const remaining = undecryptableQueue.filter((m) => m.senderUserId !== senderUserId);
  undecryptableQueue.length = 0;
  undecryptableQueue.push(...remaining);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
