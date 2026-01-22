import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/provider/AuthProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types
export interface User {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  content: string;
  mediaUrl?: string;
  senderId: string;
  sender: User;
  receiverId: string;
  receiver: User;
  conversationId: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  userId: string;
  user: User;
  lastReadMessageId: string | null;
  joinedAt: string;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedConversations {
  conversations?: Conversation[];
  items?: Conversation[]; // Backend returns 'items'
  total: number;
  hasMore: boolean;
}

export interface PaginatedMessages {
  messages?: Message[];
  items?: Message[]; // Backend might return 'items'
  total: number;
  hasMore: boolean;
}

export interface UnreadMessagesSummary {
  totalUnread: number;
  conversationCounts: {
    conversationId: string;
    count: number;
  }[];
}

// Hook for fetching conversations
export function useConversations(limit = 20, offset = 0) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE}/api/messages/conversations?limit=${limit}&offset=${offset}`,
        {
          credentials: 'include', // Send HttpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data: PaginatedConversations = await response.json();
      // Backend returns 'items', fallback to 'conversations' for compatibility
      setConversations(data.items || data.conversations || []);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, limit, offset]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchConversations,
  };
}

// Hook for fetching messages in a conversation
export function useMessages(conversationId: string | null, limit = 50, offset = 0) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!isAuthenticated || !conversationId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE}/api/messages/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
        {
          credentials: 'include', // Send HttpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data: PaginatedMessages = await response.json();
      // Backend might return 'items', fallback to 'messages' for compatibility
      setMessages(data.items || data.messages || []);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, conversationId, limit, offset]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    total,
    hasMore,
    isLoading,
    error,
    refetch: fetchMessages,
  };
}

// Hook for sending messages
export function useSendMessage() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const sendMessage = useCallback(
    async (conversationId: string, content: string, mediaUrl?: string): Promise<Message | null> => {
      if (!isAuthenticated) {
        setError('Not authenticated');
        return null;
      }

      try {
        setIsSending(true);
        setError(null);

        const response = await fetch(
          `${API_BASE}/api/messages/conversations/${conversationId}/messages`,
          {
            method: 'POST',
            credentials: 'include', // Send HttpOnly cookies
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content, mediaUrl }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const message: Message = await response.json();
        return message;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [isAuthenticated]
  );

  return {
    sendMessage,
    isSending,
    error,
  };
}

// Hook for marking messages as read
export function useMarkAsRead() {
  const { isAuthenticated } = useAuth();

  const markAsRead = useCallback(
    async (conversationId: string, upToMessageId?: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        const response = await fetch(
          `${API_BASE}/api/messages/conversations/${conversationId}/read`,
          {
            method: 'POST',
            credentials: 'include', // Send HttpOnly cookies
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ upToMessageId }),
          }
        );

        return response.ok;
      } catch (err) {
        console.error('Failed to mark messages as read:', err);
        return false;
      }
    },
    [isAuthenticated]
  );

  return { markAsRead };
}

// Hook for unread message count
export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE}/api/messages/unread/count`, {
        credentials: 'include', // Send HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCount(data.count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return {
    count,
    isLoading,
    refetch: fetchCount,
  };
}

// Hook for starting a conversation
export function useStartConversation() {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const startConversation = useCallback(
    async (recipientId: string): Promise<Conversation | null> => {
      if (!isAuthenticated) {
        setError('Not authenticated');
        return null;
      }

      try {
        setIsStarting(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/messages/conversations`, {
          method: 'POST',
          credentials: 'include', // Send HttpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipientId }),
        });

        if (!response.ok) {
          throw new Error('Failed to start conversation');
        }

        const conversation: Conversation = await response.json();
        return conversation;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      } finally {
        setIsStarting(false);
      }
    },
    [isAuthenticated]
  );

  return {
    startConversation,
    isStarting,
    error,
  };
}
