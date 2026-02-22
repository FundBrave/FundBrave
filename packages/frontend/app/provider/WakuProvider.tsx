'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { WakuNodeState, WakuConnectionStatus } from '@/app/types/web3-chat';
import { broadcastEvent, onBroadcastEvent } from '@/lib/waku/local-store';

const WAKU_ENABLED = process.env.NEXT_PUBLIC_WAKU_ENABLED !== 'false';

// Backoff config
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const MAX_CONNECT_ATTEMPTS = 5;
const DEGRADED_RETRY_INTERVAL_MS = 60_000;

interface WakuContextValue {
  node: unknown | null; // LightNode from @waku/sdk
  state: WakuNodeState;
  isReady: boolean;
  isDegraded: boolean;
  isEnabled: boolean;
  restart: () => Promise<void>;
}

const WakuContext = createContext<WakuContextValue | null>(null);

const TAB_ID = typeof crypto !== 'undefined' ? crypto.randomUUID() : 'default';

interface WakuProviderProps {
  children: React.ReactNode;
}

export function WakuProvider({ children }: WakuProviderProps) {
  const nodeRef = useRef<unknown | null>(null);
  const [state, setState] = useState<WakuNodeState>({
    status: 'disconnected',
    peerCount: 0,
  });
  const connectAttemptsRef = useRef(0);
  const degradedRetryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLeaderTabRef = useRef(false);
  const mountedRef = useRef(true);

  const updateStatus = useCallback((status: WakuConnectionStatus, extra?: Partial<WakuNodeState>) => {
    setState((prev) => ({ ...prev, status, ...extra }));
  }, []);

  const connectNode = useCallback(async () => {
    if (!WAKU_ENABLED || !mountedRef.current) return;

    // Check if another tab is already running Waku
    if (!isLeaderTabRef.current) {
      broadcastEvent({ type: 'waku_active', tabId: TAB_ID });
      // Give other tabs 500ms to respond
      await new Promise((r) => setTimeout(r, 500));
    }

    updateStatus('connecting');

    let backoff = INITIAL_BACKOFF_MS;
    connectAttemptsRef.current = 0;

    while (connectAttemptsRef.current < MAX_CONNECT_ATTEMPTS && mountedRef.current) {
      try {
        // Dynamic import to avoid SSR issues
        const { createLightNode, waitForRemotePeer, Protocols } = await import('@waku/sdk');

        const node = await createLightNode({ defaultBootstrap: true });
        await node.start();
        await waitForRemotePeer(node, [Protocols.Filter, Protocols.LightPush, Protocols.Store]);

        if (!mountedRef.current) {
          await node.stop();
          return;
        }

        nodeRef.current = node;
        isLeaderTabRef.current = true;
        connectAttemptsRef.current = 0;
        broadcastEvent({ type: 'waku_active', tabId: TAB_ID });

        updateStatus('connected', {
          peerId: node.libp2p?.peerId?.toString(),
          peerCount: node.libp2p?.getPeers?.()?.length ?? 0,
          error: undefined,
        });

        // Clear any degraded retry
        if (degradedRetryRef.current) {
          clearInterval(degradedRetryRef.current);
          degradedRetryRef.current = null;
        }

        return;
      } catch (err) {
        connectAttemptsRef.current++;
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';

        if (connectAttemptsRef.current >= MAX_CONNECT_ATTEMPTS) {
          updateStatus('degraded', { error: errorMsg });
          broadcastEvent({ type: 'waku_inactive', tabId: TAB_ID });

          // Start degraded retry loop
          degradedRetryRef.current = setInterval(() => {
            if (mountedRef.current) {
              connectAttemptsRef.current = 0;
              connectNode();
            }
          }, DEGRADED_RETRY_INTERVAL_MS);
          return;
        }

        // Exponential backoff
        await new Promise((r) => setTimeout(r, backoff));
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      }
    }
  }, [updateStatus]);

  const stopNode = useCallback(async () => {
    if (degradedRetryRef.current) {
      clearInterval(degradedRetryRef.current);
      degradedRetryRef.current = null;
    }

    if (nodeRef.current) {
      try {
        const node = nodeRef.current as { stop: () => Promise<void> };
        await node.stop();
      } catch {
        // Ignore stop errors
      }
      nodeRef.current = null;
    }

    isLeaderTabRef.current = false;
    broadcastEvent({ type: 'waku_inactive', tabId: TAB_ID });
    updateStatus('disconnected');
  }, [updateStatus]);

  const restart = useCallback(async () => {
    await stopNode();
    await connectNode();
  }, [stopNode, connectNode]);

  // Multi-tab coordination
  useEffect(() => {
    const cleanup = onBroadcastEvent((event) => {
      if (event.type === 'waku_active' && event.tabId !== TAB_ID) {
        // Another tab took over — this tab becomes a follower
        if (isLeaderTabRef.current) {
          stopNode();
        }
      }
    });
    return cleanup;
  }, [stopNode]);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;

    if (WAKU_ENABLED) {
      connectNode();
    }

    return () => {
      mountedRef.current = false;
      stopNode();
    };
  }, [connectNode, stopNode]);

  const value: WakuContextValue = {
    node: nodeRef.current,
    state,
    isReady: state.status === 'connected',
    isDegraded: state.status === 'degraded',
    isEnabled: WAKU_ENABLED,
    restart,
  };

  return <WakuContext.Provider value={value}>{children}</WakuContext.Provider>;
}

export function useWakuNode(): WakuContextValue {
  const ctx = useContext(WakuContext);
  if (!ctx) {
    throw new Error('useWakuNode must be used within a WakuProvider');
  }
  return ctx;
}
