'use client';

import { useCallback, useRef } from 'react';
import { useAuth } from '@/app/provider/AuthProvider';
import { savePeerKey, loadPeerKey } from '@/lib/waku/local-store';
import type { Web3Peer, PeerKeyCache } from '@/app/types/web3-chat';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Cache TTL for resolved peer info (24 hours) */
const PEER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** In-memory cache to avoid redundant API calls within a session */
interface InMemoryPeerEntry {
  peer: Web3Peer;
  fetchedAt: number;
}

interface UsePeerResolutionReturn {
  /** Resolve a userId to peer info. Checks cache first, then API. */
  resolvePeer: (userId: string) => Promise<Web3Peer | null>;
  /** Get cached peer info without making an API call */
  getCachedPeer: (userId: string) => Promise<Web3Peer | null>;
  /** Invalidate the cache for a specific peer (e.g., after key rotation) */
  invalidatePeer: (userId: string) => void;
}

/**
 * Resolves FundBrave user IDs to peer info (display name, avatar, public key, etc.).
 *
 * Resolution strategy:
 * 1. Check in-memory session cache (fastest)
 * 2. Check IndexedDB peer_keys store (24h TTL)
 * 3. Fetch from FundBrave API by userId
 * 4. Cache the result in both layers
 */
export function usePeerResolution(): UsePeerResolutionReturn {
  const { isAuthenticated } = useAuth();

  // In-memory cache survives re-renders but not page reloads
  const memCacheRef = useRef<Map<string, InMemoryPeerEntry>>(new Map());

  const resolvePeer = useCallback(
    async (userId: string): Promise<Web3Peer | null> => {
      // 1. Check in-memory cache
      const memEntry = memCacheRef.current.get(userId);
      if (memEntry && Date.now() - memEntry.fetchedAt < PEER_CACHE_TTL_MS) {
        return memEntry.peer;
      }

      // 2. Check IndexedDB
      try {
        const stored = await loadPeerKey(userId);
        if (stored) {
          // peer_keys store has TTL enforcement built in (loadPeerKey returns undefined if expired)
          const peer: Web3Peer = {
            userId,
            publicKey: stored.publicKey,
            displayName: userId, // Will be enriched from API below if we have it
          };

          // We still want full user info, so check if we have it in memory
          if (!memEntry) {
            // Enrich from API in background but return what we have
            fetchAndCachePeer(userId).catch(() => {});
          }

          // For now return the stored version
          const enriched = memEntry?.peer ?? peer;
          return enriched;
        }
      } catch (err) {
        console.warn('[usePeerResolution] IndexedDB lookup failed:', err);
      }

      // 3. Fetch from API
      return fetchAndCachePeer(userId);
    },
    [isAuthenticated]
  );

  const fetchAndCachePeer = async (userId: string): Promise<Web3Peer | null> => {
    if (!isAuthenticated) return null;

    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.warn(`[usePeerResolution] API returned ${response.status} for user ${userId}`);
        return null;
      }

      const data = await response.json();

      const peer: Web3Peer = {
        userId: data.id || userId,
        walletAddress: data.walletAddress,
        displayName: data.displayName || data.username || userId,
        avatarUrl: data.avatarUrl,
        isOnline: data.isOnline,
      };

      // Cache in memory
      memCacheRef.current.set(userId, { peer, fetchedAt: Date.now() });

      // If the API returned a public key, also cache in IndexedDB
      if (data.encryptionPublicKey) {
        const publicKeyBytes = new Uint8Array(
          atob(data.encryptionPublicKey)
            .split('')
            .map((c) => c.charCodeAt(0))
        );
        peer.publicKey = publicKeyBytes;

        await savePeerKey(userId, {
          publicKey: publicKeyBytes,
          walletType: data.walletType || 'temp',
          fetchedAt: Date.now(),
          sequenceNumber: data.keySequenceNumber || 0,
        }).catch((err) => {
          console.warn('[usePeerResolution] Failed to cache peer key in IndexedDB:', err);
        });
      }

      return peer;
    } catch (err) {
      console.error('[usePeerResolution] API fetch failed:', err);
      return null;
    }
  };

  const getCachedPeer = useCallback(
    async (userId: string): Promise<Web3Peer | null> => {
      // Check in-memory first
      const memEntry = memCacheRef.current.get(userId);
      if (memEntry && Date.now() - memEntry.fetchedAt < PEER_CACHE_TTL_MS) {
        return memEntry.peer;
      }

      // Check IndexedDB (no API call)
      try {
        const stored = await loadPeerKey(userId);
        if (stored) {
          return {
            userId,
            publicKey: stored.publicKey,
            displayName: userId,
          };
        }
      } catch {
        // Ignore
      }

      return null;
    },
    []
  );

  const invalidatePeer = useCallback((userId: string) => {
    memCacheRef.current.delete(userId);
  }, []);

  return {
    resolvePeer,
    getCachedPeer,
    invalidatePeer,
  };
}
