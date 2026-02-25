'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/app/provider/AuthProvider';
import { useAccount, useSignMessage } from 'wagmi';
import {
  deriveKeyPairFromWallet,
  deriveSharedSecret,
  encrypt,
  decrypt,
  persistKeyPair,
  getStoredKeyPair,
  publicKeyToBase64,
} from '@/lib/waku/encryption-service';
import { savePeerKey, loadPeerKey } from '@/lib/waku/local-store';
import type {
  EncryptionKeyPair,
  WalletType,
  PeerKeyCache,
} from '@/app/types/web3-chat';

interface UseEncryptionReturn {
  /** The current encryption keypair (null until initialized) */
  keyPair: EncryptionKeyPair | null;
  /** Whether the encryption system is ready to use */
  isInitialized: boolean;
  /** Loading state during key derivation */
  isLoading: boolean;
  /** The type of wallet backing the current keys */
  walletType: WalletType | null;
  /** Encrypt a plaintext string for a peer */
  encryptMessage: (
    plaintext: string,
    peerPublicKey: Uint8Array
  ) => { ciphertext: Uint8Array; nonce: Uint8Array } | null;
  /** Decrypt a ciphertext from a peer */
  decryptMessage: (
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    peerPublicKey: Uint8Array
  ) => string | null;
  /** Derive shared secret with a peer */
  deriveShared: (peerPublicKey: Uint8Array) => Uint8Array | null;
  /** Initialize keys from a real wallet signature */
  initFromWallet: () => Promise<EncryptionKeyPair | null>;
  /** Initialize keys from a temp wallet keypair (set externally) */
  setKeyPairFromTemp: (kp: EncryptionKeyPair) => void;
  /** Error message, if any */
  error: string | null;
}

/**
 * Manages E2E encryption keys and provides encrypt/decrypt operations.
 *
 * Two initialization paths:
 * 1. Real wallet: user signs a message, keypair derived from signature hash
 * 2. Temp wallet: keypair set directly from useTempWallet
 *
 * The hook caches shared secrets per peer to avoid re-deriving on each message.
 */
export function useEncryption(): UseEncryptionReturn {
  const { user } = useAuth();
  const { address: walletAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [keyPair, setKeyPair] = useState<EncryptionKeyPair | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache shared secrets: peerPublicKeyBase64 -> sharedSecret
  const sharedSecretCacheRef = useRef<Map<string, Uint8Array>>(new Map());

  // Try to load existing keypair from IndexedDB on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadExisting = async () => {
      try {
        const stored = await getStoredKeyPair(user.id);
        if (stored) {
          setKeyPair({ publicKey: stored.publicKey, secretKey: stored.secretKey });
          setWalletType(stored.walletType);
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('[useEncryption] Failed to load stored keypair:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadExisting();
  }, [user?.id]);

  // Get or derive shared secret for a peer
  const getSharedSecret = useCallback(
    (peerPublicKey: Uint8Array): Uint8Array | null => {
      if (!keyPair) return null;

      const cacheKey = publicKeyToBase64(peerPublicKey);
      const cached = sharedSecretCacheRef.current.get(cacheKey);
      if (cached) return cached;

      const shared = deriveSharedSecret(keyPair.secretKey, peerPublicKey);
      sharedSecretCacheRef.current.set(cacheKey, shared);
      return shared;
    },
    [keyPair]
  );

  const encryptMessage = useCallback(
    (
      plaintext: string,
      peerPublicKey: Uint8Array
    ): { ciphertext: Uint8Array; nonce: Uint8Array } | null => {
      const shared = getSharedSecret(peerPublicKey);
      if (!shared) return null;

      try {
        return encrypt(plaintext, shared);
      } catch (err) {
        console.error('[useEncryption] Encryption failed:', err);
        return null;
      }
    },
    [getSharedSecret]
  );

  const decryptMessage = useCallback(
    (
      ciphertext: Uint8Array,
      nonce: Uint8Array,
      peerPublicKey: Uint8Array
    ): string | null => {
      const shared = getSharedSecret(peerPublicKey);
      if (!shared) return null;

      try {
        return decrypt(ciphertext, nonce, shared);
      } catch (err) {
        console.error('[useEncryption] Decryption failed:', err);
        return null;
      }
    },
    [getSharedSecret]
  );

  const deriveShared = useCallback(
    (peerPublicKey: Uint8Array): Uint8Array | null => {
      return getSharedSecret(peerPublicKey);
    },
    [getSharedSecret]
  );

  /**
   * Initialize encryption keys from a real wallet signature.
   * Prompts the user to sign a deterministic message.
   */
  const initFromWallet = useCallback(async (): Promise<EncryptionKeyPair | null> => {
    if (!user?.id || !walletAddress) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const kp = await deriveKeyPairFromWallet(
        async (message: string) => {
          return await signMessageAsync({ message });
        },
        walletAddress
      );

      await persistKeyPair(user.id, kp, 'real');
      setKeyPair(kp);
      setWalletType('real');
      setIsInitialized(true);

      // Clear the shared secret cache since we have new keys
      sharedSecretCacheRef.current.clear();

      return kp;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to derive keys from wallet';
      console.error('[useEncryption] initFromWallet failed:', msg);
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, walletAddress, signMessageAsync]);

  /**
   * Set the keypair from a temp wallet (no signature required).
   * Called by useTempWallet after generating or loading a temp wallet.
   */
  const setKeyPairFromTemp = useCallback(
    (kp: EncryptionKeyPair) => {
      if (!user?.id) return;

      setKeyPair(kp);
      setWalletType('temp');
      setIsInitialized(true);
      sharedSecretCacheRef.current.clear();

      // Persist is already done in generateAndStoreTempWallet,
      // but we ensure state is synced
      persistKeyPair(user.id, kp, 'temp').catch((err) => {
        console.error('[useEncryption] Failed to persist temp keypair:', err);
      });
    },
    [user?.id]
  );

  return {
    keyPair,
    isInitialized,
    isLoading,
    walletType,
    encryptMessage,
    decryptMessage,
    deriveShared,
    initFromWallet,
    setKeyPairFromTemp,
    error,
  };
}
