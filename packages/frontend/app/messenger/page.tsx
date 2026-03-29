"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import {
  ChatSidebar,
  MobileChatDrawer,
  MobileChatToggle,
  ChatArea,
  SharedFilesSidebar,
  UserSearchModal,
  EncryptionSetupFlow,
  type Chat,
  type Message as ChatMessage,
  type SharedFile,
} from "@/app/components/messenger";
import { BackHeader } from "@/app/components/common/BackHeader";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
  type Message,
} from "@/app/hooks/useMessaging";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import { useAuth } from "@/app/provider/AuthProvider";
import { useWakuNode } from "@/app/provider/WakuProvider";
import { useEncryption } from "@/app/hooks/useEncryption";
import { useWakuChat } from "@/app/hooks/useWakuChat";
import { Loader2 } from "@/app/components/ui/icons";
import type { MessageSendStatus } from "@/app/types/web3-chat";
import { loadPeerKey, loadAllConversations } from "@/lib/waku/local-store";

// ─── Dynamic Imports (SSR-disabled) ─────────────────────────────────────────

const WakuProvider = dynamic(
  () =>
    import("@/app/provider/WakuProvider").then((mod) => ({
      default: mod.WakuProvider,
    })),
  { ssr: false }
);

// ─── Constants ──────────────────────────────────────────────────────────────

/** After this many Web3 conversations, show the wallet nudge banner */
const WALLET_NUDGE_THRESHOLD = 5;

// Mock shared files (backend doesn't have this yet)
const mockSharedFiles: SharedFile[] = [];

// ─── Inner Component (must be inside WakuProvider) ──────────────────────────

/**
 * The inner messenger component that has access to the Waku context.
 * Extracted so that WakuProvider wraps it at the page level.
 */
function MessengerInner() {
  const { user } = useAuth();

  // ─── Waku Node (real hook) ──────────────────────────────────────────────────

  const {
    isReady: wakuIsReady,
    isDegraded: wakuIsDegraded,
    state: wakuState,
    restart: restartWaku,
  } = useWakuNode();

  // ─── E2E Encryption (real hook) ─────────────────────────────────────────────

  const encryption = useEncryption();

  // ─── UI State ─────────────────────────────────────────────────────────────

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSharedFilesCollapsed, setIsSharedFilesCollapsed] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  // ─── Encryption Setup State (for EncryptionSetupFlow UI) ────────────────────

  const [encryptionSettingUp, setEncryptionSettingUp] = useState(false);
  const [encryptionError, setEncryptionError] = useState<string | null>(null);
  const [web3ConversationCount, setWeb3ConversationCount] = useState(0);

  // ─── Message Send Status Tracking ─────────────────────────────────────────

  const [messageSendStatuses, setMessageSendStatuses] = useState<Record<string, MessageSendStatus>>({});

  // ─── Peer Public Key for Active Conversation ──────────────────────────────

  const [peerPublicKey, setPeerPublicKey] = useState<Uint8Array | null>(null);

  // ─── Centralized Backend Hooks (kept as fallback + conversation management)

  const {
    conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations(20, 0);

  const {
    messages: apiMessages,
    isLoading: messagesLoading,
  } = useMessages(selectedConversationId, 50, 0);

  const { sendMessage: sendMessageApi } = useSendMessage();
  const { markAsRead } = useMarkAsRead();

  // ─── Convert API conversations to Chat format ─────────────────────────────

  const chats: Chat[] = useMemo(
    () =>
      (conversations || []).map((conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p.user.id !== user?.id
        );
        const otherUser = otherParticipant?.user;

        return {
          id: conv.id,
          user: {
            id: otherUser?.id || "",
            name: otherUser?.displayName || otherUser?.username || "Unknown",
            username: otherUser?.username || "unknown",
            avatar: otherUser?.avatarUrl || "",
            isOnline: otherUser?.isOnline || false,
          },
          lastMessage: conv.lastMessage?.content || "",
          lastMessageTime: conv.lastMessage?.createdAt || conv.createdAt,
          unreadCount: conv.unreadCount,
        };
      }),
    [conversations, user?.id]
  );

  // ─── Derived State ────────────────────────────────────────────────────────

  const selectedChat = chats.find((c) => c.id === selectedConversationId);
  const peerUserId = selectedChat?.user.id || "";

  // Encryption readiness from hook
  const encryptionReady = encryption.isInitialized;
  const walletTypeDetected = encryption.walletType;
  const isTempWallet = walletTypeDetected === "temp";
  const wakuConnectionStatus = wakuState.status;
  const showWalletNudge = isTempWallet && web3ConversationCount >= WALLET_NUDGE_THRESHOLD;
  const isEncrypted = encryptionReady && !wakuIsDegraded;

  // ─── Load Peer Public Key on Conversation Change ──────────────────────────

  useEffect(() => {
    if (!peerUserId) {
      setPeerPublicKey(null);
      return;
    }

    let cancelled = false;

    loadPeerKey(peerUserId).then((cached) => {
      if (!cancelled && cached) {
        setPeerPublicKey(cached.publicKey);
      }
    }).catch(() => {
      // Peer key not yet available — will be fetched during handshake
    });

    return () => { cancelled = true; };
  }, [peerUserId]);

  // ─── Bound Encrypt/Decrypt for useWakuChat ────────────────────────────────

  const encryptFn = useCallback(
    (plaintext: string) => {
      if (!peerPublicKey) return null;
      return encryption.encryptMessage(plaintext, peerPublicKey);
    },
    [peerPublicKey, encryption.encryptMessage]
  );

  const decryptFn = useCallback(
    (ciphertext: Uint8Array, nonce: Uint8Array) => {
      if (!peerPublicKey) return null;
      return encryption.decryptMessage(ciphertext, nonce, peerPublicKey);
    },
    [peerPublicKey, encryption.decryptMessage]
  );

  // ─── Waku Chat Transport (real hook, conversation-scoped) ─────────────────

  const wakuChat = useWakuChat({
    peerUserId,
    encryptFn,
    decryptFn,
    isEncryptionReady: encryptionReady,
    onMessageReceived: useCallback(() => {
      refetchConversations();
    }, [refetchConversations]),
  });

  // ─── Convert API messages to ChatMessage format ───────────────────────────

  useEffect(() => {
    if (apiMessages && apiMessages.length > 0) {
      const converted: ChatMessage[] = apiMessages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content,
        timestamp: msg.createdAt,
        isRead: msg.isRead,
      }));
      setLocalMessages(converted);
    } else {
      setLocalMessages([]);
    }
  }, [apiMessages]);

  // ─── Merge Waku messages into local messages ──────────────────────────────

  const mergedMessages = useMemo(() => {
    if (!wakuIsReady || wakuChat.messages.length === 0) return localMessages;

    // Convert Waku messages to ChatMessage format
    const wakuConverted: ChatMessage[] = wakuChat.messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderUserId,
      content: msg.content,
      timestamp: new Date(msg.timestamp).toISOString(),
      isRead: true, // Waku messages are considered read upon receipt
    }));

    // Merge and deduplicate by ID, preferring Waku messages
    const messageMap = new Map<string, ChatMessage>();
    for (const msg of localMessages) {
      messageMap.set(msg.id, msg);
    }
    for (const msg of wakuConverted) {
      messageMap.set(msg.id, msg);
    }

    return Array.from(messageMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [localMessages, wakuChat.messages, wakuIsReady]);

  // ─── Derive send statuses from Waku outbox ────────────────────────────────

  useEffect(() => {
    if (wakuChat.outboxMessages.length === 0) return;

    const outboxStatuses: Record<string, MessageSendStatus> = {};
    for (const msg of wakuChat.outboxMessages) {
      outboxStatuses[msg.id] = msg.sendStatus === "sending" ? "sending" : "queued";
    }

    setMessageSendStatuses((prev) => ({ ...prev, ...outboxStatuses }));
  }, [wakuChat.outboxMessages]);

  // ─── Track Web3 conversation count for wallet nudge ───────────────────────

  useEffect(() => {
    if (!user?.id || !encryptionReady) return;

    let cancelled = false;

    loadAllConversations().then((convs) => {
      if (!cancelled) {
        setWeb3ConversationCount(convs.length);
      }
    }).catch(() => {
      // Non-critical
    });

    return () => { cancelled = true; };
  }, [user?.id, encryptionReady]);

  // ─── WebSocket for real-time updates (degraded fallback path) ─────────────

  const { isConnected: wsConnected, joinConversation, leaveConversation } =
    useWebSocket({
      onNewMessage: (event) => {
        if (event.conversationId === selectedConversationId) {
          const newMessage: ChatMessage = {
            id: event.message.id,
            senderId: event.message.senderId,
            content: event.message.content,
            timestamp: event.message.createdAt,
            isRead: event.message.isRead,
          };
          setLocalMessages((prev) => [...prev, newMessage]);

          if (selectedConversationId && event.message.senderId !== user?.id) {
            markAsRead(selectedConversationId, event.message.id);
          }
        }
        refetchConversations();
      },
      onMessageRead: (event) => {
        if (event.conversationId === selectedConversationId) {
          setLocalMessages((prev) =>
            prev.map((msg) =>
              event.messageIds.includes(msg.id)
                ? { ...msg, isRead: true }
                : msg
            )
          );
        }
      },
      onTypingIndicator: (event) => {
        console.log("Typing:", event);
      },
    });

  // Join conversation room when selected
  useEffect(() => {
    if (selectedConversationId) {
      joinConversation(selectedConversationId);
      return () => {
        leaveConversation(selectedConversationId);
      };
    }
  }, [selectedConversationId, joinConversation, leaveConversation]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (selectedConversationId && localMessages.length > 0) {
      const lastMessage = localMessages[localMessages.length - 1];
      if (lastMessage && !lastMessage.isRead && lastMessage.senderId !== user?.id) {
        markAsRead(selectedConversationId, lastMessage.id);
      }
    }
  }, [selectedConversationId, localMessages, markAsRead, user?.id]);

  // ─── Encryption Setup Handlers ────────────────────────────────────────────

  const handleSignWithWallet = useCallback(async () => {
    if (!user?.id) return;

    setEncryptionSettingUp(true);
    setEncryptionError(null);

    try {
      const keyPair = await encryption.initFromWallet();
      if (!keyPair) {
        throw new Error("Wallet signature was rejected or failed");
      }
      // useEncryption hook auto-updates isInitialized
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to set up encryption";
      setEncryptionError(msg);
    } finally {
      setEncryptionSettingUp(false);
    }
  }, [user?.id, encryption.initFromWallet]);

  const handleUseTempWallet = useCallback(async () => {
    if (!user?.id) return;

    setEncryptionSettingUp(true);
    setEncryptionError(null);

    try {
      const { generateAndStoreTempWallet, persistKeyPair } = await import(
        "@/lib/waku/encryption-service"
      );

      const authSub = user.id;
      const result = await generateAndStoreTempWallet(user.id, authSub);

      // Persist the keypair to IndexedDB
      await persistKeyPair(user.id, result.keyPair, "temp");

      // Update the useEncryption hook state directly
      encryption.setKeyPairFromTemp(result.keyPair);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate encryption keys";
      setEncryptionError(msg);
    } finally {
      setEncryptionSettingUp(false);
    }
  }, [user?.id, encryption.setKeyPairFromTemp]);

  // ─── Send Message Handler ─────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversationId || !content.trim()) return;

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Optimistically add message to UI
      const optimisticMessage: ChatMessage = {
        id: messageId,
        senderId: user?.id || "current-user",
        content,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setLocalMessages((prev) => [...prev, optimisticMessage]);

      // Track send status
      setMessageSendStatuses((prev) => ({ ...prev, [messageId]: "sending" }));

      if (wakuIsReady && encryptionReady && !wakuIsDegraded && peerPublicKey) {
        // ─── Web3 Path: Send via Waku LightPush ─────────────────────────
        try {
          await wakuChat.sendMessage(content);

          // Update status to sent
          setMessageSendStatuses((prev) => ({ ...prev, [messageId]: "sent" }));

          // After a short delay, mark as delivered
          setTimeout(() => {
            setMessageSendStatuses((prev) => ({
              ...prev,
              [messageId]: "delivered",
            }));
          }, 1500);

          refetchConversations();
        } catch {
          // Failed — message goes to outbox (handled by useWakuChat internally)
          setMessageSendStatuses((prev) => ({ ...prev, [messageId]: "queued" }));
        }
      } else {
        // ─── Degraded Path: Send via backend (Socket.IO fallback) ─────────

        const message = await sendMessageApi(selectedConversationId, content);
        if (message) {
          setLocalMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    id: message.id,
                    senderId: message.senderId,
                    content: message.content,
                    timestamp: message.createdAt,
                    isRead: message.isRead,
                    mediaUrl: message.mediaUrl,
                  }
                : msg
            )
          );
          setMessageSendStatuses((prev) => {
            const next = { ...prev };
            delete next[messageId];
            next[message.id] = "delivered";
            return next;
          });
          refetchConversations();
        } else {
          setLocalMessages((prev) =>
            prev.filter((msg) => msg.id !== messageId)
          );
          setMessageSendStatuses((prev) => {
            const next = { ...prev };
            delete next[messageId];
            return next;
          });
        }
      }
    },
    [
      selectedConversationId,
      user?.id,
      wakuIsReady,
      encryptionReady,
      wakuIsDegraded,
      peerPublicKey,
      wakuChat.sendMessage,
      sendMessageApi,
      refetchConversations,
    ]
  );

  // ─── Event Handlers ───────────────────────────────────────────────────────

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedConversationId(chatId);
    setIsMobileDrawerOpen(false);
  }, []);

  const handleNewChat = useCallback(() => {
    setIsUserSearchOpen(true);
  }, []);

  const handleConversationCreated = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
      refetchConversations();
    },
    [refetchConversations]
  );

  const handleRetryConnection = useCallback(async () => {
    await restartWaku();
  }, [restartWaku]);

  const handleConnectWallet = useCallback(() => {
    // Open the wallet connect modal (wagmi/web3modal)
    // This triggers useWalletMigration to detect the new wallet
    // and perform key rotation automatically.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-wallet-connect"));
    }
  }, []);

  const handleEmojiClick = useCallback(() => {
    console.log("Emoji picker clicked");
  }, []);

  const handleAttachmentClick = useCallback(() => {
    console.log("Attachment clicked");
  }, []);

  const handleFileClick = useCallback((fileId: string) => {
    console.log("File clicked:", fileId);
  }, []);

  const handleToggleSharedFiles = useCallback(() => {
    setIsSharedFilesCollapsed((prev) => !prev);
  }, []);

  const handleSeeMoreFiles = useCallback(() => {
    console.log("See more files clicked");
  }, []);

  // ─── Render: Loading State ────────────────────────────────────────────────

  if ((conversationsLoading && chats.length === 0) || encryption.isLoading) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <BackHeader title="Messages" fallbackHref="/" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // ─── Render: Error State ──────────────────────────────────────────────────

  if (conversationsError) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <BackHeader title="Messages" fallbackHref="/" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-error mb-4">Failed to load conversations</p>
            <button
              onClick={() => refetchConversations()}
              className="min-h-[44px] px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Encryption Setup (first visit, no keys) ──────────────────────

  if (!encryptionReady) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <BackHeader title="Messages" fallbackHref="/" />
        <div className="flex-1 flex items-center justify-center">
          <EncryptionSetupFlow
            walletType={walletTypeDetected}
            isSettingUp={encryptionSettingUp}
            isComplete={encryptionReady}
            onSignWithWallet={handleSignWithWallet}
            onUseTempWallet={handleUseTempWallet}
            error={encryptionError}
          />
        </div>
      </div>
    );
  }

  // ─── Render: Main Messenger UI ────────────────────────────────────────────

  return (
    <div className="flex h-dvh flex-col bg-background">
      <BackHeader title="Messages" fallbackHref="/" />
      <div className="flex flex-1 w-full flex-col overflow-hidden md:flex-row">
        {/* Mobile Chat Selector */}
        <div className="border-b border-border-default p-4 md:hidden">
          <MobileChatToggle
            onClick={() => setIsMobileDrawerOpen(true)}
            selectedChatName={
              selectedChat?.isGroup
                ? selectedChat.groupName
                : selectedChat?.user.name
            }
          />
        </div>

        {/* Left Sidebar - Chats List (280px) */}
        <aside className="hidden w-[280px] flex-shrink-0 md:block">
          <ChatSidebar
            chats={chats}
            selectedChatId={selectedConversationId || ""}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
          />
        </aside>

        {/* Mobile Drawer */}
        <MobileChatDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        >
          <ChatSidebar
            chats={chats}
            selectedChatId={selectedConversationId || ""}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
          />
        </MobileChatDrawer>

        {/* Main Chat Area (flexible center) */}
        <main className="min-h-0 min-w-0 flex-1">
          {selectedChat ? (
            messagesLoading && mergedMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <ChatArea
                chatUser={selectedChat.user}
                messages={mergedMessages}
                currentUserId={user?.id || ""}
                onSendMessage={handleSendMessage}
                onEmojiClick={handleEmojiClick}
                onAttachmentClick={handleAttachmentClick}
                isSharedFilesVisible={!isSharedFilesCollapsed}
                onToggleSharedFiles={handleToggleSharedFiles}
                isEncrypted={isEncrypted}
                connectionStatus={wakuConnectionStatus}
                isDegraded={wakuIsDegraded}
                isTempWallet={showWalletNudge}
                onRetryConnection={handleRetryConnection}
                onConnectWallet={handleConnectWallet}
                messageSendStatuses={messageSendStatuses}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-3">
                <p className="text-neutral-dark-200">
                  Select a chat to start messaging
                </p>
                {encryptionReady && (
                  <p className="text-xs text-green-500 flex items-center justify-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    All messages are end-to-end encrypted
                  </p>
                )}
                {chats.length === 0 && (
                  <p className="text-text-tertiary text-sm">
                    No conversations yet. Start a new chat!
                  </p>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Shared Files with collapsible animation */}
        <aside
          className={cn(
            "hidden flex-shrink-0 transition-all duration-300 ease-out lg:block",
            isSharedFilesCollapsed
              ? "w-0 overflow-hidden p-0"
              : "w-[280px] p-4"
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out",
              isSharedFilesCollapsed
                ? "scale-95 opacity-0"
                : "scale-100 opacity-100"
            )}
          >
            <SharedFilesSidebar
              files={mockSharedFiles}
              onFileClick={handleFileClick}
              onSeeMore={handleSeeMoreFiles}
              isCollapsed={isSharedFilesCollapsed}
              onToggleCollapse={handleToggleSharedFiles}
            />
          </div>
        </aside>
      </div>

      {/* Connection indicator (dev only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 px-3 py-1 bg-surface-elevated border border-border-subtle rounded-full text-xs">
          <span
            className={cn(
              "inline-block w-2 h-2 rounded-full mr-2",
              wakuIsReady
                ? "bg-green-500"
                : wsConnected
                  ? "bg-amber-500"
                  : "bg-error"
            )}
          />
          {wakuIsReady
            ? "Waku P2P"
            : wsConnected
              ? "Socket.IO (fallback)"
              : "Disconnected"}
        </div>
      )}

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────

/**
 * Messenger page wrapped in WakuProvider.
 *
 * WakuProvider is dynamically imported with ssr: false to avoid
 * server-side rendering issues with the Waku light node (uses
 * WebSocket, libp2p, and browser APIs).
 *
 * The provider creates a Waku light node on mount and provides
 * connection state to all child components. It handles:
 * - Exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s)
 * - Degraded mode after 5 failed attempts
 * - Background retry every 60 seconds when degraded
 * - Multi-tab coordination via BroadcastChannel
 */
export default function MessengerPage() {
  return (
    <WakuProvider>
      <MessengerInner />
    </WakuProvider>
  );
}
