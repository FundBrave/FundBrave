# Web3 Chat Module

## Overview

The Web3 Chat module provides server-side support for FundBrave's end-to-end encrypted messaging system (Tier 3). It handles two responsibilities:

1. **Encryption key management** -- storing and rotating SHA-256 hashes of users' X25519 public keys so peers can verify each other before opening an encrypted channel.
2. **Encrypted message archival** -- accepting, paginating, and deleting opaque encrypted blobs that the server can never decrypt.

The trust model mirrors Signal: all message content is encrypted client-side before upload. The server stores binary blobs and has zero ability to read, index, or transform the plaintext. Conversation identifiers are keccak256 hashes of sorted participant IDs, so the server never learns who is in a conversation.

### Module registration

```typescript
// web3-chat.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [Web3ChatController],
  providers: [Web3ChatService],
  exports: [Web3ChatService],
})
export class Web3ChatModule {}
```

The module depends only on `PrismaModule`. `Web3ChatService` is exported so other modules can call it if needed.

---

## Endpoints

### Summary table

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 1 | `GET` | `/api/users/:userId/encryption-key-hash` | None (public) | Fetch a user's encryption public key hash |
| 2 | `POST` | `/api/users/:userId/authorize-key-rotation` | JWT | Rotate (or initially register) an encryption key hash |
| 3 | `POST` | `/api/messages/archive` | JWT | Upload an encrypted message archive chunk |
| 4 | `GET` | `/api/messages/archive/:conversationHash` | JWT | List own encrypted archives for a conversation (paginated) |
| 5 | `DELETE` | `/api/messages/archive/:id` | JWT | Permanently delete an archive record |

---

### 1. Get Encryption Key Hash

Retrieve the SHA-256 hash of a user's X25519 encryption public key. Public endpoint -- no authentication required.

**Request**

```
GET /api/users/:userId/encryption-key-hash
```

| Parameter | In | Type | Required | Description |
|-----------|----|------|----------|-------------|
| `userId` | path | `string` (UUID) | Yes | Target user's UUID |

**Response `200 OK`**

```json
{
  "keyHash": "a3f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2"
}
```

`keyHash` is `null` if the user has not registered a key yet.

**Example**

```bash
curl https://api.fundbrave.com/api/users/550e8400-e29b-41d4-a716-446655440000/encryption-key-hash
```

---

### 2. Authorize Key Rotation

Update the stored encryption key hash. Used both for first-time key registration and subsequent rotations.

**Request**

```
POST /api/users/:userId/authorize-key-rotation
Authorization: Bearer <jwt>
Content-Type: application/json
```

| Parameter | In | Type | Required | Description |
|-----------|----|------|----------|-------------|
| `userId` | path | `string` (UUID) | Yes | Must match the authenticated user's ID |
| `oldKeyHash` | body | `string` | Yes | Current key hash (`64-char hex`) or `"initial"` for first-time registration |
| `newKeyHash` | body | `string` | Yes | New key hash (`64-char hex`) |
| `walletType` | body | `"temp" \| "real"` | Yes | Whether this is a temporary or real wallet |

**Validation rules**

- `oldKeyHash` must be exactly `"initial"` or a 64-character lowercase hex string.
- `newKeyHash` must be exactly 64 hex characters.
- `walletType` must be `"temp"` or `"real"`.
- `oldKeyHash` must match the currently stored hash, OR be `"initial"` when no key has been stored yet.
- `newKeyHash` must differ from the current hash (no-op updates are rejected).

**Response `200 OK`**

```json
{
  "success": true,
  "authorizedAt": "2026-02-21T12:00:00.000Z"
}
```

**Example -- first-time registration**

```bash
curl -X POST https://api.fundbrave.com/api/users/550e8400-e29b-41d4-a716-446655440000/authorize-key-rotation \
  -H "Authorization: Bearer eyJhbGciOiJI..." \
  -H "Content-Type: application/json" \
  -d '{
    "oldKeyHash": "initial",
    "newKeyHash": "a3f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    "walletType": "real"
  }'
```

**Example -- key rotation**

```bash
curl -X POST https://api.fundbrave.com/api/users/550e8400-e29b-41d4-a716-446655440000/authorize-key-rotation \
  -H "Authorization: Bearer eyJhbGciOiJI..." \
  -H "Content-Type: application/json" \
  -d '{
    "oldKeyHash": "a3f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    "newKeyHash": "b4g2c3d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3",
    "walletType": "real"
  }'
```

---

### 3. Upload Encrypted Archive

Store an encrypted message archive chunk. The server treats the payload as an opaque blob and never inspects the content.

**Request**

```
POST /api/messages/archive
Authorization: Bearer <jwt>
Content-Type: application/json
```

| Parameter | In | Type | Required | Description |
|-----------|----|------|----------|-------------|
| `conversationHash` | body | `string` | Yes | 64-character keccak256 hex hash of sorted participant IDs |
| `encryptedData` | body | `string` | Yes | Base64-encoded encrypted blob (max 5 MB decoded / ~7M base64 chars) |
| `expiresAt` | body | `string` (ISO 8601) | No | Optional TTL timestamp; must be in the future |

**Validation rules**

- `conversationHash` must be exactly 64 hex characters.
- `encryptedData` must be valid base64. Max 7,000,000 base64 characters (DTO layer) and 5,242,880 decoded bytes (service layer).
- `expiresAt`, if provided, must be a valid ISO 8601 date string in the future.

**Response `201 Created`**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-02-21T12:00:00.000Z"
}
```

**Example**

```bash
curl -X POST https://api.fundbrave.com/api/messages/archive \
  -H "Authorization: Bearer eyJhbGciOiJI..." \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHash": "5d41402abc4b2a76b9719d911017c5925d41402abc4b2a76b9719d911017c592",
    "encryptedData": "SGVsbG8gV29ybGQ=",
    "expiresAt": "2026-12-31T23:59:59.000Z"
  }'
```

---

### 4. List Encrypted Archives

Retrieve cursor-paginated archives for a conversation. Only archives uploaded by the authenticated user are returned (privacy guarantee).

**Request**

```
GET /api/messages/archive/:conversationHash?limit=20&cursor=<lastId>
Authorization: Bearer <jwt>
```

| Parameter | In | Type | Required | Description |
|-----------|----|------|----------|-------------|
| `conversationHash` | path | `string` | Yes | keccak256 hex hash identifying the conversation |
| `limit` | query | `number` | No | Page size, 1--100. Default `20`. |
| `cursor` | query | `string` (UUID) | No | ID of the last archive already seen. Omit for the first page. |

Results are ordered newest-first. The server fetches `limit + 1` records to determine whether a next page exists.

**Response `200 OK`**

```json
{
  "archives": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "encryptedData": "SGVsbG8gV29ybGQ=",
      "createdAt": "2026-02-21T12:00:00.000Z"
    }
  ],
  "nextCursor": "660e8400-e29b-41d4-a716-446655440000"
}
```

`nextCursor` is `null` when there are no more pages.

**Example**

```bash
# First page
curl "https://api.fundbrave.com/api/messages/archive/5d41402abc4b2a76b9719d911017c5925d41402abc4b2a76b9719d911017c592?limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJI..."

# Next page
curl "https://api.fundbrave.com/api/messages/archive/5d41402abc4b2a76b9719d911017c5925d41402abc4b2a76b9719d911017c592?limit=10&cursor=660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer eyJhbGciOiJI..."
```

---

### 5. Delete Archive (Right to Be Forgotten)

Permanently delete an encrypted archive record. Only the original sender can delete their own archives. This operation is irreversible and satisfies GDPR Article 17 / CCPA right-to-erasure requirements.

**Request**

```
DELETE /api/messages/archive/:id
Authorization: Bearer <jwt>
```

| Parameter | In | Type | Required | Description |
|-----------|----|------|----------|-------------|
| `id` | path | `string` (UUID) | Yes | Archive record UUID |

**Response `200 OK`**

```json
{
  "success": true
}
```

**Example**

```bash
curl -X DELETE https://api.fundbrave.com/api/messages/archive/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer eyJhbGciOiJI..."
```

---

## Prisma Models

### MessageArchive

Defined in `prisma/schema.prisma` under the `message_archives` table.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID, PK) | Auto-generated record identifier |
| `conversationHash` | `String` | keccak256 hash of sorted participant user IDs |
| `encryptedData` | `Bytes` | Opaque encrypted blob -- server cannot decrypt |
| `senderUserId` | `String` (FK -> `users.id`) | User who uploaded the archive chunk |
| `createdAt` | `DateTime` | Timestamp when the record was created |
| `expiresAt` | `DateTime?` | Optional TTL for automatic cleanup; `null` = retain indefinitely |

**Indexes:**

- `(conversationHash, createdAt)` -- efficient paginated queries within a conversation
- `(senderUserId)` -- fast lookups by sender for authorization checks
- `(expiresAt)` -- efficient TTL cleanup queries

**Relations:**

- `sender` -> `User` via `senderUserId` (cascade delete)

### User.encryptionPubKeyHash

A nullable `String` field added to the `User` model:

```prisma
// Web3 Chat - Encryption Key Management
encryptionPubKeyHash String? // SHA-256 hash of user's encryption public key
```

The actual X25519 public key is never stored on the server. Only the SHA-256 hash is persisted so the server can verify key rotation requests (old hash must match) and peers can detect when a counterpart has rotated their key.

---

## Error Responses

All error responses follow a consistent structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable description"
}
```

### Error codes by endpoint

| Endpoint | Status | Code | Cause |
|----------|--------|------|-------|
| GET key hash | `404` | `USER_NOT_FOUND` | No user with the given `userId` |
| POST key rotation | `400` | `KEY_HASH_MISMATCH` | `oldKeyHash` does not match the stored hash |
| POST key rotation | `400` | `KEY_HASH_UNCHANGED` | `newKeyHash` is identical to the current hash |
| POST key rotation | `403` | `FORBIDDEN` | Authenticated user's ID does not match `userId` |
| POST key rotation | `404` | `USER_NOT_FOUND` | No user with the given `userId` |
| POST archive | `400` | `INVALID_ENCRYPTED_DATA` | `encryptedData` is not valid base64 |
| POST archive | `400` | `ARCHIVE_TOO_LARGE` | Decoded blob exceeds 5 MB |
| POST archive | `400` | `INVALID_EXPIRY` | `expiresAt` is in the past |
| DELETE archive | `403` | `FORBIDDEN` | Authenticated user is not the sender |
| DELETE archive | `404` | `ARCHIVE_NOT_FOUND` | No archive with the given `id` |
| (all JWT endpoints) | `401` | -- | Missing or invalid JWT token |

DTO validation errors (class-validator) return `400` with an array of constraint violation messages.

---

## Size Constraints

Archive uploads are subject to a **5 MB maximum** enforced at two layers:

1. **DTO layer** -- `@MaxLength(7_000_000)` on the base64-encoded `encryptedData` string. Base64 expands binary by 4/3, so 7,000,000 base64 characters corresponds to approximately 5 MB of decoded data.
2. **Service layer** -- After base64 decoding, the resulting `Buffer` is checked against `5 * 1024 * 1024` bytes (5,242,880 bytes). If exceeded, a `400 ARCHIVE_TOO_LARGE` error is returned.

### Pagination limits

The `GET /api/messages/archive/:conversationHash` endpoint accepts a `limit` query parameter:

- Minimum: `1`
- Maximum: `100`
- Default: `20`
