'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/app/provider/AuthProvider';
import { useWakuNode } from '@/app/provider/WakuProvider';
import {
  saveMessages,
  loadMessages,
  saveSnapshotIndex,
  loadSnapshotIndex,
} from '@/lib/waku/local-store';
import {
  uploadChatSnapshot,
  downloadChatSnapshot,
} from '@/lib/codex/codex-service';
import { getDMContentTopic } from '@/lib/waku/content-topics';
import { ChatMessageProto } from '@/lib/waku/proto/chat-message';
import type {
  Web3DecodedMessage,
  ChatHistorySnapshot,
  SnapshotIndex,
} from '@/app/types/web3-chat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Snapshot every N new messages */
const SNAPSHOT_INTERVAL = 10;

interface UseChatHistoryReturn {
  /** Load chat history for a conversation (Waku Store + Codex snapshots + local cache) */
  loadHistory: (peerUserId: string) => Promise<Web3DecodedMessage[]>;
  /** Whether history is currently loading */
  isLoadingHistory: boolean;
  /** Create a snapshot of recent messages and upload to Codex */
  createSnapshot: (
    conversationId: string,
    messages: Web3DecodedMessage[]
  ) => Promise<string | null>;
  /** Track a new message for auto-snapshot logic */
  trackMessage: (conversationId: string) => void;
}

/**
 * Manages chat history loading from multiple sources:
 * 1. Local IndexedDB cache (immediate)
 * 2. Waku Store protocol (~7 days of history)
 * 3. Codex snapshots (older history)
 *
 * Auto-snapshots every SNAPSHOT_INTERVAL messages or on page visibility change.
 */
export function useChatHistory(): UseChatHistoryReturn {
  const { user } = useAuth();
  const { node, isReady } = useWakuNode();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Track message counts per conversation for auto-snapshot
  const messageCountsRef = useRef<Map<string, number>>(new Map());
  // Track pending snapshot data so we can snapshot on visibilitychange
  const pendingSnapshotRef = useRef<Map<string, Web3DecodedMessage[]>>(new Map());

  /**
   * Deduplicate and sort messages by timestamp, using message ID as the dedup key.
   */
  const dedupeAndSort = (messages: Web3DecodedMessage[]): Web3DecodedMessage[] => {
    const seen = new Map<string, Web3DecodedMessage>();
    for (const msg of messages) {
      // Keep the version with the best send status
      const existing = seen.get(msg.id);
      if (!existing || msg.timestamp >= existing.timestamp) {
        seen.set(msg.id, msg);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.timestamp - b.timestamp);
  };

  /**
   * Query Waku Store for recent messages on a content topic.
   * Returns raw decoded messages (still need decryption by the caller).
   */
  const queryWakuStore = useCallback(
    async (peerUserId: string): Promise<Web3DecodedMessage[]> => {
      if (!isReady || !node || !user?.id) return [];

      try {
        const contentTopic = getDMContentTopic(user.id, peerUserId);

        // Use node's createDecoder which handles routing info automatically
        const wakuNode = node as {
          createDecoder: (params: { contentTopic: string }) => unknown;
          store: {
            queryWithOrderedCallback: (
              decoders: unknown[],
              callback: (message: unknown) => void
            ) => Promise<void>;
          };
        };
        const decoder = wakuNode.createDecoder({ contentTopic });

        const messages: Web3DecodedMessage[] = [];

        await wakuNode.store.queryWithOrderedCallback(
          [decoder],
          (wakuMessage: unknown) => {
            try {
              const msg = wakuMessage as { payload?: Uint8Array };
              if (!msg.payload) return;

              const decoded = ChatMessageProto.decode(msg.payload);
              const decodedMsg: Web3DecodedMessage = {
                id: decoded.id as string,
                senderUserId: decoded.senderUserId as string,
                recipientUserId: decoded.recipientUserId as string,
                content: '', // Encrypted content — decryption is done at the hook layer
                contentType: (decoded.contentType as Web3DecodedMessage['contentType']) || 'text',
                timestamp: Number(decoded.timestamp),
                signature: decoded.signature as Uint8Array,
                isVerified: false,
                decryptionStatus: 'pending',
                sendStatus: 'delivered',
                metadata: {
                  codexCid: decoded.codexCid as string | undefined,
                  fileName: decoded.fileName as string | undefined,
                  mimeType: decoded.mimeType as string | undefined,
                  fileSize: decoded.fileSize ? Number(decoded.fileSize) : undefined,
                  replyToId: decoded.replyToId as string | undefined,
                },
              };

              messages.push(decodedMsg);
            } catch (err) {
              console.warn('[useChatHistory] Failed to decode Waku Store message:', err);
            }
          }
        );

        return messages;
      } catch (err) {
        console.error('[useChatHistory] Waku Store query failed:', err);
        return [];
      }
    },
    [node, isReady, user?.id]
  );

  /**
   * Load Codex snapshots for a conversation (older history beyond Waku Store's ~7 day window).
   */
  const loadCodexSnapshots = useCallback(
    async (conversationId: string): Promise<Web3DecodedMessage[]> => {
      try {
        const index = await loadSnapshotIndex(conversationId);
        if (!index || index.cids.length === 0) return [];

        const messages: Web3DecodedMessage[] = [];

        // Load the most recent snapshots (up to 5) to avoid loading too much data
        const recentCids = index.cids.slice(-5);
        const results = await Promise.allSettled(
          recentCids.map((cid) => downloadChatSnapshot(cid))
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.ok) {
            messages.push(...result.value.data.messages);
          }
        }

        return messages;
      } catch (err) {
        console.error('[useChatHistory] Failed to load Codex snapshots:', err);
        return [];
      }
    },
    []
  );

  /**
   * Tier 3: Fetch encrypted message archives from the backend.
   * Server stores opaque encrypted blobs it cannot read.
   */
  const loadBackendArchive = useCallback(
    async (conversationHash: string, before?: number): Promise<Web3DecodedMessage[]> => {
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (before) params.set('before', String(before));

        const res = await fetch(
          `${API_URL}/api/messages/archive/${conversationHash}?${params}`,
          { credentials: 'include' }
        );

        if (!res.ok) return [];

        const data = await res.json() as {
          archives: Array<{
            encryptedBlob: string;
            fromTimestamp: number;
            toTimestamp: number;
          }>;
        };

        const messages: Web3DecodedMessage[] = [];
        for (const archive of data.archives) {
          try {
            // Decode base64 blob -> JSON snapshot -> messages
            const blobBytes = Uint8Array.from(atob(archive.encryptedBlob), (c) => c.charCodeAt(0));
            const json = new TextDecoder().decode(blobBytes);
            const snapshot = JSON.parse(json) as ChatHistorySnapshot;
            messages.push(...snapshot.messages);
          } catch {
            // Skip corrupted archive entries
          }
        }

        return messages;
      } catch (err) {
        console.warn('[useChatHistory] Backend archive fetch failed:', err);
        return [];
      }
    },
    []
  );

  /**
   * Tier 3: Push encrypted snapshot to backend for long-term archival.
   */
  const archiveToBackend = useCallback(
    async (conversationHash: string, snapshot: ChatHistorySnapshot): Promise<boolean> => {
      try {
        const json = JSON.stringify(snapshot);
        const encryptedBlob = btoa(json);

        const res = await fetch(`${API_URL}/api/messages/archive`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationHash,
            encryptedBlob,
            fromTimestamp: snapshot.fromTimestamp,
            toTimestamp: snapshot.toTimestamp,
          }),
        });

        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  /**
   * Load history from all 4 sources, merge, dedup, and return.
   * Priority: IndexedDB cache -> Waku Store -> Codex -> Backend archive
   */
  const loadHistory = useCallback(
    async (peerUserId: string): Promise<Web3DecodedMessage[]> => {
      if (!user?.id) return [];

      setIsLoadingHistory(true);

      try {
        const { getConversationId } = await import('@/lib/waku/content-topics');
        const conversationId = getConversationId(user.id, peerUserId);

        // Tier 1 + 2: Load from local cache, Waku Store, and Codex in parallel
        const [localMessages, wakuMessages, codexMessages] = await Promise.all([
          loadMessages(conversationId),
          queryWakuStore(peerUserId),
          loadCodexSnapshots(conversationId),
        ]);

        let allMessages = dedupeAndSort([
          ...localMessages,
          ...wakuMessages,
          ...codexMessages,
        ]);

        // Tier 3: If local + Waku + Codex returned very few messages,
        // try backend archive (new device, cleared data, or Codex unavailable)
        if (allMessages.length < 10) {
          const archiveMessages = await loadBackendArchive(conversationId);
          if (archiveMessages.length > 0) {
            allMessages = dedupeAndSort([...allMessages, ...archiveMessages]);
          }
        }

        // Persist the merged result to local cache
        if (allMessages.length > 0) {
          await saveMessages(conversationId, allMessages);
        }

        // Store for potential snapshot on visibility change
        pendingSnapshotRef.current.set(conversationId, allMessages);

        return allMessages;
      } catch (err) {
        console.error('[useChatHistory] loadHistory failed:', err);
        return [];
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [user?.id, queryWakuStore, loadCodexSnapshots, loadBackendArchive]
  );

  /**
   * Create a snapshot of messages and upload to Codex.
   * Returns the CID on success, or null on failure.
   */
  const createSnapshot = useCallback(
    async (
      conversationId: string,
      messages: Web3DecodedMessage[]
    ): Promise<string | null> => {
      if (messages.length === 0) return null;

      try {
        const snapshot: ChatHistorySnapshot = {
          conversationId,
          messages,
          fromTimestamp: messages[0].timestamp,
          toTimestamp: messages[messages.length - 1].timestamp,
        };

        // Tier 2: Upload to Codex
        const result = await uploadChatSnapshot(snapshot);
        if (result.ok) {
          // Update snapshot index in IndexedDB
          const existingIndex = await loadSnapshotIndex(conversationId);
          const updatedIndex: SnapshotIndex = {
            cids: [...(existingIndex?.cids ?? []), result.data],
            lastTimestamp: snapshot.toTimestamp,
          };
          await saveSnapshotIndex(conversationId, updatedIndex);
        } else {
          console.warn('[useChatHistory] Codex snapshot upload failed:', result.error);
        }

        // Tier 3: Also push to backend archive (encrypted blob, server can't read)
        archiveToBackend(conversationId, snapshot).catch(() => {});

        return result.ok ? result.data : null;
      } catch (err) {
        console.error('[useChatHistory] createSnapshot failed:', err);
        return null;
      }
    },
    []
  );

  /**
   * Track a new message for auto-snapshot logic.
   * After SNAPSHOT_INTERVAL messages, automatically creates a snapshot.
   */
  const trackMessage = useCallback(
    (conversationId: string) => {
      const count = (messageCountsRef.current.get(conversationId) ?? 0) + 1;
      messageCountsRef.current.set(conversationId, count);

      if (count >= SNAPSHOT_INTERVAL) {
        messageCountsRef.current.set(conversationId, 0);
        const messages = pendingSnapshotRef.current.get(conversationId);
        if (messages && messages.length > 0) {
          createSnapshot(conversationId, messages).catch((err) => {
            console.warn('[useChatHistory] Auto-snapshot failed:', err);
          });
        }
      }
    },
    [createSnapshot]
  );

  // Snapshot on visibility change (tab close/hide)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Snapshot all conversations with pending messages
        for (const [conversationId, messages] of pendingSnapshotRef.current) {
          if (messages.length > 0) {
            createSnapshot(conversationId, messages).catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [createSnapshot]);

  return {
    loadHistory,
    isLoadingHistory,
    createSnapshot,
    trackMessage,
  };
}
