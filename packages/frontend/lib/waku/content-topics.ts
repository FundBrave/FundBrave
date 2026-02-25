import { keccak256, toBytes } from 'viem';

const PROTOCOL_VERSION = '1';
const APP_NAME = 'fundbrave';

function sortedPair(a: string, b: string): [string, string] {
  return a.localeCompare(b) < 0 ? [a, b] : [b, a];
}

/**
 * Deterministic DM content topic from two user IDs.
 * Topic never changes regardless of wallet changes — anchored to stable userId (UUID).
 */
export function getDMContentTopic(userId1: string, userId2: string): string {
  const [first, second] = sortedPair(userId1, userId2);
  const hash = keccak256(toBytes(`${first}:${second}`));
  const shortHash = hash.slice(2, 18); // 8 bytes = 16 hex chars
  return `/${APP_NAME}/${PROTOCOL_VERSION}/dm-${shortHash}/proto`;
}

/**
 * Handshake topic for a user — public key exchange + key rotation messages.
 * Anyone can read (public keys are intentionally public, like PGP keyservers).
 */
export function getHandshakeContentTopic(userId: string): string {
  return `/${APP_NAME}/${PROTOCOL_VERSION}/handshake-${userId}/proto`;
}

/**
 * Derive a unique conversation ID from two user IDs.
 * Same deterministic sort as content topic, but returns the full hash for IndexedDB keying.
 */
export function getConversationId(userId1: string, userId2: string): string {
  const [first, second] = sortedPair(userId1, userId2);
  return keccak256(toBytes(`${first}:${second}`));
}
