'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/app/provider/AuthProvider';
import { useWakuNode } from '@/app/provider/WakuProvider';
import { getTypingContentTopic, getConversationId } from '@/lib/waku/content-topics';
import { TypingIndicatorProto } from '@/lib/waku/proto/chat-message';

/** How long before a typing indicator expires if no new event received */
const TYPING_TIMEOUT_MS = 4_000;

/** Minimum interval between outgoing typing events (debounce) */
const TYPING_SEND_INTERVAL_MS = 2_000;

interface UseWakuTypingOptions {
  peerUserId: string;
}

interface UseWakuTypingReturn {
  /** Whether the peer is currently typing */
  isPeerTyping: boolean;
  /** Call this on every keystroke in the message input */
  sendTyping: () => void;
  /** Call this when the user stops typing (blur, send, etc.) */
  sendStopTyping: () => void;
}

export function useWakuTyping({ peerUserId }: UseWakuTypingOptions): UseWakuTypingReturn {
  const { user } = useAuth();
  const { node, isReady } = useWakuNode();

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef(0);
  const mountedRef = useRef(true);

  const userId = user?.id;
  const conversationId = userId && peerUserId ? getConversationId(userId, peerUserId) : null;
  const typingTopic = userId && peerUserId ? getTypingContentTopic(userId, peerUserId) : null;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // --- Subscribe to peer typing events via Waku Filter ---

  useEffect(() => {
    if (!isReady || !node || !typingTopic || !userId) return;

    let unsubscribe: (() => void) | null = null;

    const subscribe = async () => {
      try {
        const wakuNode = node as {
          createDecoder: (params: { contentTopic: string }) => unknown;
          filter: {
            subscribe: (
              decoders: unknown[],
              callback: (message: unknown) => void
            ) => Promise<{ unsubscribe: () => Promise<void> }>;
          };
        };

        const decoder = wakuNode.createDecoder({ contentTopic: typingTopic });

        const subscription = await wakuNode.filter.subscribe(
          [decoder],
          (wakuMessage: unknown) => {
            if (!mountedRef.current) return;
            try {
              const msg = wakuMessage as { payload?: Uint8Array };
              if (!msg.payload) return;

              const decoded = TypingIndicatorProto.decode(msg.payload);
              const senderId = decoded.userId as string;

              // Ignore our own typing events
              if (senderId === userId) return;

              const isTyping = decoded.isTyping as boolean;

              if (isTyping) {
                setIsPeerTyping(true);
                // Auto-expire after timeout
                if (peerTypingTimeoutRef.current) {
                  clearTimeout(peerTypingTimeoutRef.current);
                }
                peerTypingTimeoutRef.current = setTimeout(() => {
                  if (mountedRef.current) setIsPeerTyping(false);
                }, TYPING_TIMEOUT_MS);
              } else {
                setIsPeerTyping(false);
                if (peerTypingTimeoutRef.current) {
                  clearTimeout(peerTypingTimeoutRef.current);
                }
              }
            } catch (err) {
              console.error('[useWakuTyping] Failed to process typing event:', err);
            }
          }
        );

        unsubscribe = () => {
          subscription.unsubscribe().catch(() => {});
        };
      } catch (err) {
        console.error('[useWakuTyping] Filter subscription failed:', err);
      }
    };

    subscribe();

    return () => {
      if (unsubscribe) unsubscribe();
      if (peerTypingTimeoutRef.current) clearTimeout(peerTypingTimeoutRef.current);
    };
  }, [isReady, node, typingTopic, userId]);

  // --- Send typing indicator via Waku LightPush ---

  const sendTypingEvent = useCallback(
    async (isTyping: boolean) => {
      if (!isReady || !node || !typingTopic || !userId || !conversationId) return;

      // Debounce: don't send more than once per interval
      if (isTyping) {
        const now = Date.now();
        if (now - lastSentRef.current < TYPING_SEND_INTERVAL_MS) return;
        lastSentRef.current = now;
      }

      try {
        const wakuNode = node as {
          createEncoder: (params: { contentTopic: string; ephemeral: boolean }) => unknown;
          lightPush: {
            send: (
              encoder: unknown,
              message: { payload: Uint8Array }
            ) => Promise<{ recipients: number }>;
          };
        };

        // Ephemeral = true so typing events are NOT stored in Waku Store
        const encoder = wakuNode.createEncoder({
          contentTopic: typingTopic,
          ephemeral: true,
        });

        const payload = TypingIndicatorProto.encode({
          userId,
          conversationId,
          isTyping,
          timestamp: Date.now(),
        });

        await wakuNode.lightPush.send(encoder, { payload });
      } catch {
        // Typing indicators are best-effort; silently ignore failures
      }
    },
    [isReady, node, typingTopic, userId, conversationId]
  );

  const sendTyping = useCallback(() => sendTypingEvent(true), [sendTypingEvent]);
  const sendStopTyping = useCallback(() => sendTypingEvent(false), [sendTypingEvent]);

  // Cleanup: send stop typing on unmount
  useEffect(() => {
    return () => {
      sendTypingEvent(false);
    };
  }, [sendTypingEvent]);

  return { isPeerTyping, sendTyping, sendStopTyping };
}
