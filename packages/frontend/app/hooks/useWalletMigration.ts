'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/app/provider/AuthProvider';
import { useAccount, useSignMessage } from 'wagmi';
import { useWakuNode } from '@/app/provider/WakuProvider';
import {
  deriveKeyPairFromWallet,
  persistKeyPair,
  getStoredKeyPair,
  removeTempWallet,
  publicKeyToBase64,
} from '@/lib/waku/encryption-service';
import {
  createKeyRotationMessage,
  processKeyRotation,
} from '@/lib/waku/key-rotation';
import { loadKeyRotations } from '@/lib/waku/local-store';
import { getHandshakeContentTopic } from '@/lib/waku/content-topics';
import { KeyRotationProto } from '@/lib/waku/proto/chat-message';
import type { EncryptionKeyPair } from '@/app/types/web3-chat';

export type MigrationStatus =
  | 'idle'
  | 'detecting'
  | 'signing'
  | 'rotating'
  | 'publishing'
  | 'complete'
  | 'error';

interface UseWalletMigrationReturn {
  /** Whether a wallet migration is currently in progress */
  isMigrating: boolean;
  /** Current step of the migration process */
  migrationStatus: MigrationStatus;
  /** Error message if migration failed */
  error: string | null;
  /** The new keypair after successful migration */
  newKeyPair: EncryptionKeyPair | null;
  /** Manually retry the migration if it failed */
  retry: () => void;
}

/**
 * Detects when a user connects a real wallet and triggers key rotation.
 *
 * Scenarios handled:
 * 1. Temp wallet user connects MetaMask -> derive new keys, publish rotation, delete temp wallet
 * 2. Real wallet user switches to different wallet -> derive new keys, publish rotation
 * 3. User disconnects wallet -> no action (keep existing keys)
 *
 * The migration flow:
 * 1. useAccount() reports address change (null -> 0x... or 0xOLD -> 0xNEW)
 * 2. Check if user currently has temp wallet keys or different real wallet keys
 * 3. Derive new keypair from real wallet signature
 * 4. Create dual-signed key rotation message
 * 5. Publish on handshake topic via Waku LightPush
 * 6. Delete temp wallet from IndexedDB (if applicable)
 * 7. Persist new keypair
 */
export function useWalletMigration(): UseWalletMigrationReturn {
  const { user } = useAuth();
  const { address: walletAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { node, isReady } = useWakuNode();

  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [newKeyPair, setNewKeyPair] = useState<EncryptionKeyPair | null>(null);

  const prevWalletRef = useRef<string | undefined>(undefined);
  const migrationAttemptedRef = useRef(false);
  const isMigratingRef = useRef(false);
  const retryTriggerRef = useRef(0);
  const [retryCount, setRetryCount] = useState(0);

  const isMigrating = migrationStatus !== 'idle' && migrationStatus !== 'complete' && migrationStatus !== 'error';

  const performMigration = useCallback(
    async (newWalletAddress: string) => {
      if (!user?.id || isMigratingRef.current) return;

      isMigratingRef.current = true;
      setMigrationStatus('detecting');
      setError(null);

      try {
        // 1. Load existing keypair
        const existingKeyPair = await getStoredKeyPair(user.id);
        if (!existingKeyPair) {
          // No existing keys — this is first-time setup, not a migration
          isMigratingRef.current = false;
          setMigrationStatus('idle');
          return;
        }

        const oldKeyPair: EncryptionKeyPair = {
          publicKey: existingKeyPair.publicKey,
          secretKey: existingKeyPair.secretKey,
        };
        const wasTempWallet = existingKeyPair.walletType === 'temp';

        // 2. Derive new keypair from wallet signature
        setMigrationStatus('signing');
        let derivedKeyPair: EncryptionKeyPair;

        try {
          derivedKeyPair = await deriveKeyPairFromWallet(
            async (message: string) => {
              return await signMessageAsync({ message });
            },
            newWalletAddress
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Signature rejected';
          throw new Error(`Wallet signature failed: ${msg}`);
        }

        // 3. Check if the new keypair is actually different
        if (publicKeyToBase64(derivedKeyPair.publicKey) === publicKeyToBase64(oldKeyPair.publicKey)) {
          // Same keys — no rotation needed
          isMigratingRef.current = false;
          setMigrationStatus('idle');
          return;
        }

        // 4. Create the key rotation message
        setMigrationStatus('rotating');

        const rotationHistory = await loadKeyRotations(user.id);
        const currentSequence = rotationHistory?.lastSequence ?? 0;

        const rotationMessage = createKeyRotationMessage(
          user.id,
          oldKeyPair,
          derivedKeyPair,
          currentSequence
        );

        // 5. Publish the rotation on the handshake topic
        setMigrationStatus('publishing');

        if (isReady && node) {
          try {
            // Use node's createEncoder which handles routing info automatically
            const wakuNode = node as {
              createEncoder: (params: { contentTopic: string }) => unknown;
              lightPush: {
                send: (
                  encoder: unknown,
                  message: { payload: Uint8Array }
                ) => Promise<{ recipients: number }>;
              };
            };
            const handshakeTopic = getHandshakeContentTopic(user.id);
            const encoder = wakuNode.createEncoder({ contentTopic: handshakeTopic });

            const payload = KeyRotationProto.encode({
              userId: rotationMessage.userId,
              oldPublicKey: rotationMessage.oldPublicKey,
              newPublicKey: rotationMessage.newPublicKey,
              signatureOld: rotationMessage.signatureOld,
              signatureNew: rotationMessage.signatureNew,
              sequenceNumber: rotationMessage.sequenceNumber,
              nonce: rotationMessage.nonce,
              timestamp: rotationMessage.timestamp,
            });

            await wakuNode.lightPush.send(encoder, { payload });
          } catch (err) {
            // Non-fatal — the rotation will be picked up from Waku Store later
            console.warn('[useWalletMigration] Failed to publish rotation via Waku:', err);
          }
        }

        // 6. Process the rotation locally (update peer keys, derive new shared secret)
        await processKeyRotation(rotationMessage, derivedKeyPair.secretKey);

        // 7. Persist new keypair
        await persistKeyPair(user.id, derivedKeyPair, 'real');

        // 8. Delete temp wallet if this was a temp -> real migration
        if (wasTempWallet) {
          await removeTempWallet(user.id);
        }

        setNewKeyPair(derivedKeyPair);
        setMigrationStatus('complete');
        migrationAttemptedRef.current = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Migration failed';
        console.error('[useWalletMigration] Migration failed:', msg);
        setError(msg);
        setMigrationStatus('error');
      } finally {
        isMigratingRef.current = false;
      }
    },
    [user?.id, signMessageAsync, isReady, node]
  );

  // Watch for wallet address changes
  useEffect(() => {
    const prevAddress = prevWalletRef.current;
    prevWalletRef.current = walletAddress;

    // Skip initial render (prevAddress is undefined on first render)
    if (prevAddress === undefined) return;

    // Skip if no user
    if (!user?.id) return;

    // Detect: null/undefined -> 0x... (new wallet connected)
    // or: 0xOLD -> 0xNEW (wallet changed)
    if (walletAddress && walletAddress !== prevAddress) {
      performMigration(walletAddress);
    }
  }, [walletAddress, user?.id, performMigration, retryCount]);

  const retry = useCallback(() => {
    if (walletAddress && migrationStatus === 'error') {
      setMigrationStatus('idle');
      setError(null);
      migrationAttemptedRef.current = false;
      setRetryCount((c) => c + 1);
    }
  }, [walletAddress, migrationStatus]);

  return {
    isMigrating,
    migrationStatus,
    error,
    newKeyPair,
    retry,
  };
}
