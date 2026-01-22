import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/app/provider/AuthProvider';
import type { Message } from './useMessaging';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

interface NewMessageEvent {
  conversationId: string;
  message: Message;
  receiverId: string;
}

interface MessageReadEvent {
  conversationId: string;
  messageIds: string[];
  readByUserId: string;
  readAt: Date;
}

interface TypingIndicatorEvent {
  conversationId: string;
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
  };
  isTyping: boolean;
  timestamp: Date;
}

interface UseWebSocketOptions {
  onNewMessage?: (event: NewMessageEvent) => void;
  onMessageRead?: (event: MessageReadEvent) => void;
  onTypingIndicator?: (event: TypingIndicatorEvent) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Connect to WebSocket
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Socket.IO will use cookies automatically with withCredentials
    const socket = io(WS_URL, {
      withCredentials: true, // Send cookies with WebSocket connection
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // New message event
    socket.on('new_message', (event: NewMessageEvent) => {
      if (options.onNewMessage) {
        options.onNewMessage(event);
      }
    });

    // Message read event
    socket.on('message_read', (event: MessageReadEvent) => {
      if (options.onMessageRead) {
        options.onMessageRead(event);
      }
    });

    // Typing indicator event
    socket.on('typing', (event: TypingIndicatorEvent) => {
      if (options.onTypingIndicator) {
        options.onTypingIndicator(event);
      }
    });

    // User online/offline events
    socket.on('user_online', (userId: string) => {
      if (options.onUserOnline) {
        options.onUserOnline(userId);
      }
    });

    socket.on('user_offline', (userId: string) => {
      if (options.onUserOffline) {
        options.onUserOffline(userId);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, options]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('typing', { conversationId, isTyping });
      }
    },
    []
  );

  // Join conversation room
  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_conversation', { conversationId });
    }
  }, []);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_conversation', { conversationId });
    }
  }, []);

  return {
    isConnected,
    sendTypingIndicator,
    joinConversation,
    leaveConversation,
  };
}
