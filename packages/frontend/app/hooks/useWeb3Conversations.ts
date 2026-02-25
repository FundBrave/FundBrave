'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/app/provider/AuthProvider';
import {
  loadAllConversations,
  saveConversation,
  loadConversation,
  onBroadcastEvent,
} from '@/lib/waku/local-store';
import type { Web3Conversation, Web3DecodedMessage } from '@/app/types/web3-chat';

interface UseWeb3ConversationsReturn {
  /** All conversations, sorted by most recent activity */
  conversations: Web3Conversation[];
  /** Whether the conversation list is loading */
  isLoading: boolean;
  /** Update a conversation (e.g., after receiving a new message) */
  updateConversation: (update: Partial<Web3Conversation> & { id: string }) => Promise<void>;
  /** Mark a conversation as read (reset unread count to 0) */
  markAsRead: (conversationId: string) => Promise<void>;
  /** Add or get an existing conversation for a peer */
  ensureConversation: (
    peerId: string,
    contentTopic: string,
    conversationId: string
  ) => Promise<Web3Conversation>;
  /** Total unread count across all conversations */
  unreadTotal: number;
  /** Reload conversations from IndexedDB */
  refresh: () => Promise<void>;
  /** Update the last message for a conversation (called when a new message arrives) */
  onNewMessage: (conversationId: string, message: Web3DecodedMessage) => Promise<void>;
}

/**
 * Manages the conversation list stored in IndexedDB.
 *
 * Tracks unread counts locally, listens for BroadcastChannel updates
 * from other tabs, and provides CRUD operations for conversations.
 */
export function useWeb3Conversations(): UseWeb3ConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Web3Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations from IndexedDB
  const loadConversationList = useCallback(async () => {
    try {
      const all = await loadAllConversations();
      // Sort by most recent activity (updatedAt descending)
      const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt);
      setConversations(sorted);
    } catch (err) {
      console.error('[useWeb3Conversations] Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    loadConversationList();
  }, [user?.id, loadConversationList]);

  // Listen for conversation updates from other tabs
  useEffect(() => {
    const cleanup = onBroadcastEvent((event) => {
      if (event.type === 'conversation_updated') {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === event.conversation.id);
          let updated: Web3Conversation[];
          if (idx >= 0) {
            updated = [...prev];
            updated[idx] = event.conversation;
          } else {
            updated = [event.conversation, ...prev];
          }
          return updated.sort((a, b) => b.updatedAt - a.updatedAt);
        });
      }
    });

    return cleanup;
  }, []);

  const updateConversation = useCallback(
    async (update: Partial<Web3Conversation> & { id: string }) => {
      // Load the existing conversation to merge
      const existing = await loadConversation(update.id);
      if (!existing) {
        console.warn(`[useWeb3Conversations] Conversation ${update.id} not found for update`);
        return;
      }

      const updated: Web3Conversation = {
        ...existing,
        ...update,
        updatedAt: Date.now(),
      };

      await saveConversation(updated);

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === update.id);
        const next = [...prev];
        if (idx >= 0) {
          next[idx] = updated;
        } else {
          next.push(updated);
        }
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });
    },
    []
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      await updateConversation({ id: conversationId, unreadCount: 0 });
    },
    [updateConversation]
  );

  const ensureConversation = useCallback(
    async (
      peerId: string,
      contentTopic: string,
      conversationId: string
    ): Promise<Web3Conversation> => {
      // Check if already exists
      const existing = await loadConversation(conversationId);
      if (existing) return existing;

      // Create new conversation
      const now = Date.now();
      const conv: Web3Conversation = {
        id: conversationId,
        peerUserId: peerId,
        contentTopic,
        encryptionState: 'uninitialized',
        unreadCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await saveConversation(conv);

      setConversations((prev) => {
        // Avoid duplicates
        if (prev.some((c) => c.id === conversationId)) return prev;
        return [conv, ...prev].sort((a, b) => b.updatedAt - a.updatedAt);
      });

      return conv;
    },
    []
  );

  const onNewMessage = useCallback(
    async (conversationId: string, message: Web3DecodedMessage) => {
      const existing = await loadConversation(conversationId);
      if (!existing) return;

      const isFromSelf = message.senderUserId === user?.id;

      const updated: Web3Conversation = {
        ...existing,
        lastMessage: {
          content: message.content,
          timestamp: message.timestamp,
          senderUserId: message.senderUserId,
        },
        unreadCount: isFromSelf ? existing.unreadCount : existing.unreadCount + 1,
        updatedAt: Date.now(),
      };

      await saveConversation(updated);

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        const next = [...prev];
        if (idx >= 0) {
          next[idx] = updated;
        } else {
          next.push(updated);
        }
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });
    },
    [user?.id]
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadConversationList();
  }, [loadConversationList]);

  return {
    conversations,
    isLoading,
    updateConversation,
    markAsRead,
    ensureConversation,
    unreadTotal,
    refresh,
    onNewMessage,
  };
}
