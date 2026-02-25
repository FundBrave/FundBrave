'use client';

import type {
  Web3Conversation,
  Web3DecodedMessage,
  StoredKeyPair,
  TempWalletState,
  PeerKeyCache,
  StoredKeyRotation,
  SnapshotIndex,
  OutboxMessage,
} from '@/app/types/web3-chat';

const DB_NAME = 'fundbrave-web3-chat';
const DB_VERSION = 1;

const STORES = {
  TEMP_WALLET: 'temp_wallet',
  ENCRYPTION_KEYS: 'encryption_keys',
  CONVERSATIONS: 'conversations',
  SNAPSHOT_INDEX: 'snapshot_index',
  PEER_KEYS: 'peer_keys',
  KEY_ROTATIONS: 'key_rotations',
  MESSAGE_CACHE: 'message_cache',
  OUTBOX: 'outbox',
} as const;

// Eviction limits
const MAX_MESSAGES_PER_CONVERSATION = 200;
const MAX_SNAPSHOT_CIDS = 100;
const MAX_KEY_ROTATIONS = 10;
const PEER_KEY_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── In-Memory Fallback (Safari private browsing, etc.) ──────────────────────

class InMemoryStore {
  private stores = new Map<string, Map<string, unknown>>();

  private getStore(name: string): Map<string, unknown> {
    if (!this.stores.has(name)) {
      this.stores.set(name, new Map());
    }
    return this.stores.get(name)!;
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    return this.getStore(storeName).get(key) as T | undefined;
  }

  async put<T>(storeName: string, key: string, value: T): Promise<void> {
    this.getStore(storeName).set(key, value);
  }

  async delete(storeName: string, key: string): Promise<void> {
    this.getStore(storeName).delete(key);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return Array.from(this.getStore(storeName).values()) as T[];
  }

  async clear(storeName: string): Promise<void> {
    this.getStore(storeName).clear();
  }
}

// ─── IndexedDB Availability Check ────────────────────────────────────────────

let indexedDBAvailable: boolean | null = null;

async function checkIndexedDB(): Promise<boolean> {
  if (indexedDBAvailable !== null) return indexedDBAvailable;

  if (typeof window === 'undefined' || !window.indexedDB) {
    indexedDBAvailable = false;
    return false;
  }

  try {
    const testDB = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = window.indexedDB.open('__idb_test__', 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
    testDB.close();
    window.indexedDB.deleteDatabase('__idb_test__');
    indexedDBAvailable = true;
    return true;
  } catch {
    indexedDBAvailable = false;
    return false;
  }
}

// ─── IndexedDB Connection ────────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

function tx(
  storeName: string,
  mode: IDBTransactionMode
): Promise<{ store: IDBObjectStore; complete: Promise<void> }> {
  return openDB().then((db) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const complete = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    return { store, complete };
  });
}

// ─── Generic IDB operations ──────────────────────────────────────────────────

async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const { store, complete } = await tx(storeName, 'readonly');
  const request = store.get(key);
  await complete;
  return request.result as T | undefined;
}

async function idbPut<T>(storeName: string, key: string, value: T): Promise<void> {
  const { store, complete } = await tx(storeName, 'readwrite');
  store.put(value, key);
  await complete;
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  const { store, complete } = await tx(storeName, 'readwrite');
  store.delete(key);
  await complete;
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const { store, complete } = await tx(storeName, 'readonly');
  const request = store.getAll();
  await complete;
  return request.result as T[];
}

// ─── Store Singleton (auto-selects IDB or in-memory) ─────────────────────────

let fallbackStore: InMemoryStore | null = null;
let usingFallback = false;

async function ensureStore(): Promise<void> {
  if (usingFallback) return;
  const available = await checkIndexedDB();
  if (!available) {
    fallbackStore = new InMemoryStore();
    usingFallback = true;
    console.warn('[Web3Chat] IndexedDB unavailable — using in-memory store. Data will not persist.');
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function isUsingFallbackStore(): boolean {
  return usingFallback;
}

// Temp Wallet
export async function saveTempWallet(state: TempWalletState): Promise<void> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.put(STORES.TEMP_WALLET, state.userId, state);
  return idbPut(STORES.TEMP_WALLET, state.userId, state);
}

export async function loadTempWallet(userId: string): Promise<TempWalletState | undefined> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.get(STORES.TEMP_WALLET, userId);
  return idbGet(STORES.TEMP_WALLET, userId);
}

export async function deleteTempWallet(userId: string): Promise<void> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.delete(STORES.TEMP_WALLET, userId);
  return idbDelete(STORES.TEMP_WALLET, userId);
}

// Encryption Keys
export async function saveKeyPair(userId: string, keyPair: StoredKeyPair): Promise<void> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.put(STORES.ENCRYPTION_KEYS, userId, keyPair);
  return idbPut(STORES.ENCRYPTION_KEYS, userId, keyPair);
}

export async function loadKeyPair(userId: string): Promise<StoredKeyPair | undefined> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.get(STORES.ENCRYPTION_KEYS, userId);
  return idbGet(STORES.ENCRYPTION_KEYS, userId);
}

// Conversations
export async function saveConversation(conv: Web3Conversation): Promise<void> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.put(STORES.CONVERSATIONS, conv.id, conv);
  return idbPut(STORES.CONVERSATIONS, conv.id, conv);
}

export async function loadConversation(id: string): Promise<Web3Conversation | undefined> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.get(STORES.CONVERSATIONS, id);
  return idbGet(STORES.CONVERSATIONS, id);
}

export async function loadAllConversations(): Promise<Web3Conversation[]> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.getAll(STORES.CONVERSATIONS);
  return idbGetAll(STORES.CONVERSATIONS);
}

export async function deleteConversation(id: string): Promise<void> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.delete(STORES.CONVERSATIONS, id);
  return idbDelete(STORES.CONVERSATIONS, id);
}

// Snapshot Index
export async function saveSnapshotIndex(conversationId: string, index: SnapshotIndex): Promise<void> {
  await ensureStore();
  // evict: keep only last MAX_SNAPSHOT_CIDS
  const trimmed: SnapshotIndex = {
    ...index,
    cids: index.cids.slice(-MAX_SNAPSHOT_CIDS),
  };
  if (usingFallback) return fallbackStore!.put(STORES.SNAPSHOT_INDEX, conversationId, trimmed);
  return idbPut(STORES.SNAPSHOT_INDEX, conversationId, trimmed);
}

export async function loadSnapshotIndex(conversationId: string): Promise<SnapshotIndex | undefined> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.get(STORES.SNAPSHOT_INDEX, conversationId);
  return idbGet(STORES.SNAPSHOT_INDEX, conversationId);
}

// Peer Keys
export async function savePeerKey(userId: string, peerKey: PeerKeyCache): Promise<void> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.put(STORES.PEER_KEYS, userId, peerKey);
  return idbPut(STORES.PEER_KEYS, userId, peerKey);
}

export async function loadPeerKey(userId: string): Promise<PeerKeyCache | undefined> {
  await ensureStore();
  const key = usingFallback
    ? await fallbackStore!.get<PeerKeyCache>(STORES.PEER_KEYS, userId)
    : await idbGet<PeerKeyCache>(STORES.PEER_KEYS, userId);

  if (!key) return undefined;
  // TTL check
  if (Date.now() - key.fetchedAt > PEER_KEY_TTL_MS) {
    if (usingFallback) await fallbackStore!.delete(STORES.PEER_KEYS, userId);
    else await idbDelete(STORES.PEER_KEYS, userId);
    return undefined;
  }
  return key;
}

// Key Rotations
export async function saveKeyRotations(userId: string, data: StoredKeyRotation): Promise<void> {
  await ensureStore();
  // evict: keep only last MAX_KEY_ROTATIONS
  const trimmed: StoredKeyRotation = {
    ...data,
    rotations: data.rotations.slice(-MAX_KEY_ROTATIONS),
  };
  if (usingFallback) return fallbackStore!.put(STORES.KEY_ROTATIONS, userId, trimmed);
  return idbPut(STORES.KEY_ROTATIONS, userId, trimmed);
}

export async function loadKeyRotations(userId: string): Promise<StoredKeyRotation | undefined> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.get(STORES.KEY_ROTATIONS, userId);
  return idbGet(STORES.KEY_ROTATIONS, userId);
}

// Message Cache
export async function saveMessages(
  conversationId: string,
  messages: Web3DecodedMessage[]
): Promise<void> {
  await ensureStore();
  // evict: keep only newest MAX_MESSAGES_PER_CONVERSATION
  const trimmed = messages
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_MESSAGES_PER_CONVERSATION);
  if (usingFallback) return fallbackStore!.put(STORES.MESSAGE_CACHE, conversationId, trimmed);
  return idbPut(STORES.MESSAGE_CACHE, conversationId, trimmed);
}

export async function loadMessages(conversationId: string): Promise<Web3DecodedMessage[]> {
  await ensureStore();
  if (usingFallback) {
    return (await fallbackStore!.get<Web3DecodedMessage[]>(STORES.MESSAGE_CACHE, conversationId)) ?? [];
  }
  return (await idbGet<Web3DecodedMessage[]>(STORES.MESSAGE_CACHE, conversationId)) ?? [];
}

// Outbox (WhatsApp-style auto-resend)
export async function saveOutboxMessage(msg: OutboxMessage): Promise<void> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.put(STORES.OUTBOX, msg.id, msg);
  return idbPut(STORES.OUTBOX, msg.id, msg);
}

export async function loadOutboxMessages(): Promise<OutboxMessage[]> {
  await ensureStore();
  const all = usingFallback
    ? await fallbackStore!.getAll<OutboxMessage>(STORES.OUTBOX)
    : await idbGetAll<OutboxMessage>(STORES.OUTBOX);
  return all.sort((a, b) => a.queuedAt - b.queuedAt); // FIFO
}

export async function deleteOutboxMessage(messageId: string): Promise<void> {
  await ensureStore();
  if (usingFallback) return fallbackStore!.delete(STORES.OUTBOX, messageId);
  return idbDelete(STORES.OUTBOX, messageId);
}

export async function updateOutboxMessage(
  messageId: string,
  update: Partial<OutboxMessage>
): Promise<void> {
  await ensureStore();
  const existing = usingFallback
    ? await fallbackStore!.get<OutboxMessage>(STORES.OUTBOX, messageId)
    : await idbGet<OutboxMessage>(STORES.OUTBOX, messageId);
  if (!existing) return;
  const updated = { ...existing, ...update };
  if (usingFallback) return fallbackStore!.put(STORES.OUTBOX, messageId, updated);
  return idbPut(STORES.OUTBOX, messageId, updated);
}

// ─── BroadcastChannel (multi-tab coordination) ───────────────────────────────

const CHANNEL_NAME = 'fundbrave-web3-chat';

export type BroadcastEvent =
  | { type: 'waku_active'; tabId: string }
  | { type: 'waku_inactive'; tabId: string }
  | { type: 'new_message'; message: Web3DecodedMessage }
  | { type: 'conversation_updated'; conversation: Web3Conversation }
  | { type: 'key_rotation'; userId: string };

let channel: BroadcastChannel | null = null;

export function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      // BroadcastChannel not available
      return null;
    }
  }
  return channel;
}

export function broadcastEvent(event: BroadcastEvent): void {
  getBroadcastChannel()?.postMessage(event);
}

export function onBroadcastEvent(handler: (event: BroadcastEvent) => void): () => void {
  const ch = getBroadcastChannel();
  if (!ch) return () => {};

  const listener = (e: MessageEvent<BroadcastEvent>) => handler(e.data);
  ch.addEventListener('message', listener);
  return () => ch.removeEventListener('message', listener);
}
