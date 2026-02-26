// ─── Message Types ───────────────────────────────────────────────────────────

export type MessageContentType = 'text' | 'file' | 'image' | 'system';

export type MessageSendStatus = 'queued' | 'sending' | 'sent' | 'delivered';

export type DecryptionStatus = 'success' | 'failed' | 'pending';

export interface Web3MessageMetadata {
  codexCid?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  thumbnailCid?: string;
  replyToId?: string;
}

export interface Web3ChatMessage {
  id: string;
  senderUserId: string;
  recipientUserId: string;
  content: Uint8Array; // encrypted bytes
  contentType: MessageContentType;
  timestamp: number;
  signature: Uint8Array;
  nonce: Uint8Array;
  metadata?: Web3MessageMetadata;
}

export interface Web3DecodedMessage {
  id: string;
  senderUserId: string;
  recipientUserId: string;
  content: string; // decrypted plaintext
  contentType: MessageContentType;
  timestamp: number;
  signature: Uint8Array;
  isVerified: boolean;
  decryptionStatus: DecryptionStatus;
  sendStatus: MessageSendStatus;
  metadata?: Web3MessageMetadata;
}

// ─── Outbox (WhatsApp-style auto-resend) ─────────────────────────────────────

export interface OutboxMessage {
  id: string;
  conversationId: string;
  message: Web3ChatMessage;
  sendStatus: MessageSendStatus;
  retryCount: number;
  maxRetries: number;
  queuedAt: number;
  lastAttemptAt?: number;
  error?: string;
}

// --- Typing Indicators (over Waku) ----------------------------------------

export interface WakuTypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: number;
}

// ─── Conversation Types ──────────────────────────────────────────────────────

export type EncryptionState =
  | 'uninitialized'
  | 'handshake_pending'
  | 'established'
  | 'failed';

export interface Web3Conversation {
  id: string;
  peerUserId: string;
  contentTopic: string;
  encryptionState: EncryptionState;
  lastMessage?: {
    content: string;
    timestamp: number;
    senderUserId: string;
  };
  unreadCount: number;
  createdAt: number;
  updatedAt: number;
}

// ─── Peer Types ──────────────────────────────────────────────────────────────

export interface Web3Peer {
  userId: string;
  walletAddress?: string;
  ensName?: string;
  displayName: string;
  avatarUrl?: string;
  publicKey?: Uint8Array;
  isOnline?: boolean;
}

// ─── Encryption Types ────────────────────────────────────────────────────────

export type WalletType = 'temp' | 'real';

export interface EncryptionKeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface SharedKeyState {
  peerUserId: string;
  sharedSecret: Uint8Array;
  establishedAt: number;
}

export interface StoredKeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  walletType: WalletType;
  createdAt: number;
}

// ─── Key Rotation Types ─────────────────────────────────────────────────────

export interface KeyRotationMessage {
  userId: string;
  oldPublicKey: Uint8Array;
  newPublicKey: Uint8Array;
  signatureOld: Uint8Array;
  signatureNew: Uint8Array;
  sequenceNumber: number;
  nonce: string;
  timestamp: number;
}

export interface ServerAuthorizedRotation {
  userId: string;
  newPublicKey: Uint8Array;
  serverSignature: string;
  timestamp: number;
}

export interface StoredKeyRotation {
  rotations: KeyRotationMessage[];
  lastSequence: number;
}

// ─── Handshake Types ─────────────────────────────────────────────────────────

export interface HandshakeMessage {
  userId: string;
  publicKey: Uint8Array;
  walletType: WalletType;
  timestamp: number;
  signature: Uint8Array;
}

// ─── Temp Wallet Types ───────────────────────────────────────────────────────

export interface TempWalletState {
  userId: string;
  encryptedPrivateKey: Uint8Array;
  iv: Uint8Array;
  salt: Uint8Array;
  createdAt: number;
  isActive: boolean;
}

// ─── Codex Types ─────────────────────────────────────────────────────────────

export interface CodexUploadResult {
  cid: string;
  size: number;
  uploadedAt: number;
}

export interface ChatHistorySnapshot {
  conversationId: string;
  messages: Web3DecodedMessage[];
  fromTimestamp: number;
  toTimestamp: number;
  snapshotCid?: string;
}

// ─── Connection Types ────────────────────────────────────────────────────────

export type WakuConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'queuing';  // was 'degraded' -- now means outbox is active, Waku reconnecting

export interface WakuNodeState {
  status: WakuConnectionStatus;
  peerId?: string;
  peerCount: number;
  error?: string;
}

// ─── Transport Abstraction ───────────────────────────────────────────────────

export interface ChatTransport {
  messages: Web3DecodedMessage[];
  outboxMessages: OutboxMessage[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: WakuConnectionStatus;
  isEncrypted: boolean;
  sendMessage: (content: string, metadata?: Web3MessageMetadata) => Promise<void>;
  loadHistory: () => Promise<void>;
  flushOutbox: () => Promise<void>;
}

// ─── Peer Key Cache ──────────────────────────────────────────────────────────

export interface PeerKeyCache {
  publicKey: Uint8Array;
  walletType: WalletType;
  fetchedAt: number;
  sequenceNumber: number;
}

// ─── Snapshot Index ──────────────────────────────────────────────────────────

export interface SnapshotIndex {
  cids: string[];
  lastTimestamp: number;
}
