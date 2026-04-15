import protobuf from 'protobufjs';

// ─── ChatMessageProto ────────────────────────────────────────────────────────

const ChatMessageFields = new protobuf.Type('ChatMessage')
  .add(new protobuf.Field('id', 1, 'string'))
  .add(new protobuf.Field('senderUserId', 2, 'string'))
  .add(new protobuf.Field('recipientUserId', 3, 'string'))
  .add(new protobuf.Field('content', 4, 'bytes')) // encrypted
  .add(new protobuf.Field('contentType', 5, 'string'))
  .add(new protobuf.Field('timestamp', 6, 'uint64'))
  .add(new protobuf.Field('signature', 7, 'bytes'))
  .add(new protobuf.Field('nonce', 8, 'bytes'))
  // file attachment metadata (optional)
  .add(new protobuf.Field('codexCid', 9, 'string'))
  .add(new protobuf.Field('fileName', 10, 'string'))
  .add(new protobuf.Field('mimeType', 11, 'string'))
  .add(new protobuf.Field('fileSize', 12, 'uint64'))
  .add(new protobuf.Field('replyToId', 13, 'string'));

// ─── HandshakeMessageProto ───────────────────────────────────────────────────

const HandshakeMessageFields = new protobuf.Type('HandshakeMessage')
  .add(new protobuf.Field('userId', 1, 'string'))
  .add(new protobuf.Field('publicKey', 2, 'bytes'))
  .add(new protobuf.Field('walletType', 3, 'string')) // 'temp' | 'real'
  .add(new protobuf.Field('timestamp', 4, 'uint64'))
  .add(new protobuf.Field('signature', 5, 'bytes'));

// ─── KeyRotationProto ────────────────────────────────────────────────────────

const KeyRotationFields = new protobuf.Type('KeyRotation')
  .add(new protobuf.Field('userId', 1, 'string'))
  .add(new protobuf.Field('oldPublicKey', 2, 'bytes'))
  .add(new protobuf.Field('newPublicKey', 3, 'bytes'))
  .add(new protobuf.Field('signatureOld', 4, 'bytes'))
  .add(new protobuf.Field('signatureNew', 5, 'bytes'))
  .add(new protobuf.Field('sequenceNumber', 6, 'uint32'))
  .add(new protobuf.Field('nonce', 7, 'string'))
  .add(new protobuf.Field('timestamp', 8, 'uint64'));

// --- TypingIndicatorProto ------------------------------------------------

const TypingIndicatorFields = new protobuf.Type('TypingIndicator')
  .add(new protobuf.Field('userId', 1, 'string'))
  .add(new protobuf.Field('conversationId', 2, 'string'))
  .add(new protobuf.Field('isTyping', 3, 'bool'))
  .add(new protobuf.Field('timestamp', 4, 'uint64'));

// ─── Encode / Decode helpers ─────────────────────────────────────────────────

export const ChatMessageProto = {
  encode(message: Record<string, unknown>): Uint8Array {
    const errMsg = ChatMessageFields.verify(message);
    if (errMsg) throw new Error(`ChatMessage validation: ${errMsg}`);
    return ChatMessageFields.encode(ChatMessageFields.create(message)).finish();
  },
  decode(buffer: Uint8Array): Record<string, unknown> {
    return ChatMessageFields.decode(buffer) as unknown as Record<string, unknown>;
  },
};

export const HandshakeMessageProto = {
  encode(message: Record<string, unknown>): Uint8Array {
    const errMsg = HandshakeMessageFields.verify(message);
    if (errMsg) throw new Error(`HandshakeMessage validation: ${errMsg}`);
    return HandshakeMessageFields.encode(HandshakeMessageFields.create(message)).finish();
  },
  decode(buffer: Uint8Array): Record<string, unknown> {
    return HandshakeMessageFields.decode(buffer) as unknown as Record<string, unknown>;
  },
};

export const KeyRotationProto = {
  encode(message: Record<string, unknown>): Uint8Array {
    const errMsg = KeyRotationFields.verify(message);
    if (errMsg) throw new Error(`KeyRotation validation: ${errMsg}`);
    return KeyRotationFields.encode(KeyRotationFields.create(message)).finish();
  },
  decode(buffer: Uint8Array): Record<string, unknown> {
    return KeyRotationFields.decode(buffer) as unknown as Record<string, unknown>;
  },
};

export const TypingIndicatorProto = {
  encode(message: Record<string, unknown>): Uint8Array {
    const errMsg = TypingIndicatorFields.verify(message);
    if (errMsg) throw new Error(`TypingIndicator validation: ${errMsg}`);
    return TypingIndicatorFields.encode(TypingIndicatorFields.create(message)).finish();
  },
  decode(buffer: Uint8Array): Record<string, unknown> {
    return TypingIndicatorFields.decode(buffer) as unknown as Record<string, unknown>;
  },
};
