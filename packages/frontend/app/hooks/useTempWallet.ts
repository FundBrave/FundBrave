'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/app/provider/AuthProvider';
import { useAccount } from 'wagmi';
import {
  generateAndStoreTempWallet,
  loadAndDecryptTempWallet,
  removeTempWallet,
  getStoredKeyPair,
} from '@/lib/waku/encryption-service';
import { loadTempWallet } from '@/lib/waku/local-store';
import type { EncryptionKeyPair } from '@/app/types/web3-chat';

interface UseTempWalletReturn {
  /** Whether the user currently has an active temp wallet */
  hasTempWallet: boolean;
  /** Loading state during temp wallet operations */
  isLoading: boolean;
  /** Generate a new temp wallet and derive encryption keys */
  generateTempWallet: () => Promise<{ address: string; keyPair: EncryptionKeyPair } | null>;
  /** Load an existing temp wallet from IndexedDB */
  loadTempWallet: () => Promise<{ keyPair: EncryptionKeyPair } | null>;
  /** Delete the temp wallet (after real wallet connection) */
  deleteTempWallet: () => Promise<void>;
  /** The temp wallet address, if one exists */
  tempWalletAddress: string | null;
  /** Whether a real wallet just connected and a key rotation should be triggered */
  shouldTriggerKeyRotation: boolean;
  /** Acknowledge the key rotation trigger (reset the flag) */
  acknowledgeKeyRotation: () => void;
}

/**
 * Manages the temp wallet lifecycle for users without a connected wallet.
 *
 * Temp wallets are generated transparently so non-wallet users still get
 * E2E encrypted messaging. When a real wallet connects, this hook signals
 * that a key rotation should be triggered.
 */
export function useTempWallet(): UseTempWalletReturn {
  const { user } = useAuth();
  const { address: walletAddress } = useAccount();

  const [hasTempWallet, setHasTempWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tempWalletAddress, setTempWalletAddress] = useState<string | null>(null);
  const [shouldTriggerKeyRotation, setShouldTriggerKeyRotation] = useState(false);

  const prevWalletAddressRef = useRef<string | undefined>(undefined);
  const initialCheckDoneRef = useRef(false);

  // Check for existing temp wallet on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const checkExisting = async () => {
      try {
        const tempState = await loadTempWallet(user.id);
        if (tempState?.isActive) {
          setHasTempWallet(true);
          // We don't store the address in IndexedDB (only the encrypted private key),
          // so we cannot recover it without decryption. Address is set on generate/load.
        }
      } catch (err) {
        console.error('[useTempWallet] Failed to check temp wallet:', err);
      } finally {
        setIsLoading(false);
        initialCheckDoneRef.current = true;
      }
    };

    checkExisting();
  }, [user?.id]);

  // Detect real wallet connection -> signal key rotation
  useEffect(() => {
    if (!initialCheckDoneRef.current || !user?.id) return;

    const prevAddress = prevWalletAddressRef.current;
    prevWalletAddressRef.current = walletAddress;

    // null/undefined -> 0x... means a real wallet just connected
    if (!prevAddress && walletAddress && hasTempWallet) {
      setShouldTriggerKeyRotation(true);
    }
  }, [walletAddress, hasTempWallet, user?.id]);

  const generateTempWalletFn = useCallback(async () => {
    if (!user?.id) return null;

    setIsLoading(true);
    try {
      // Use the user's ID as the auth sub for PBKDF2 derivation.
      // In production this would be the JWT sub, but user.id is stable and available.
      const authSub = user.id;
      const result = await generateAndStoreTempWallet(user.id, authSub);
      setHasTempWallet(true);
      setTempWalletAddress(result.address);
      return result;
    } catch (err) {
      console.error('[useTempWallet] Failed to generate temp wallet:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadTempWalletFn = useCallback(async () => {
    if (!user?.id) return null;

    setIsLoading(true);
    try {
      const authSub = user.id;
      const result = await loadAndDecryptTempWallet(user.id, authSub);
      if (result) {
        setHasTempWallet(true);
        return { keyPair: result.keyPair };
      }
      return null;
    } catch (err) {
      console.error('[useTempWallet] Failed to load temp wallet:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const deleteTempWalletFn = useCallback(async () => {
    if (!user?.id) return;

    try {
      await removeTempWallet(user.id);
      setHasTempWallet(false);
      setTempWalletAddress(null);
    } catch (err) {
      console.error('[useTempWallet] Failed to delete temp wallet:', err);
    }
  }, [user?.id]);

  const acknowledgeKeyRotation = useCallback(() => {
    setShouldTriggerKeyRotation(false);
  }, []);

  return {
    hasTempWallet,
    isLoading,
    generateTempWallet: generateTempWalletFn,
    loadTempWallet: loadTempWalletFn,
    deleteTempWallet: deleteTempWalletFn,
    tempWalletAddress,
    shouldTriggerKeyRotation,
    acknowledgeKeyRotation,
  };
}
