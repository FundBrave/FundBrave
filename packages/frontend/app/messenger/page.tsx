"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChatSidebar,
  MobileChatDrawer,
  MobileChatToggle,
  ChatArea,
  SharedFilesSidebar,
  type Chat,
  type Message,
  type SharedFile,
} from "@/app/components/messenger";
import { BackHeader } from "@/app/components/common/BackHeader";

// Mock data for chats
const mockChats: Chat[] = [
  {
    id: "1",
    user: {
      id: "user1",
      name: "FundBrave AI",
      username: "FundBraveAI",
      avatar:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop",
      isOnline: true,
    },
    lastMessage: "Hello! How can I help you today?",
    lastMessageTime: "2024-01-15T10:30:00Z",
    unreadCount: 2,
  },
  {
    id: "2",
    user: {
      id: "user2",
      name: "Sarah Johnson",
      username: "sarahjohnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      isOnline: true,
    },
    lastMessage: "Thank you for your donation!",
    lastMessageTime: "2024-01-15T09:15:00Z",
  },
  {
    id: "3",
    user: {
      id: "user3",
      name: "Michael Chen",
      username: "michaelchen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      isOnline: false,
    },
    lastMessage: "The campaign is doing great!",
    lastMessageTime: "2024-01-14T16:45:00Z",
  },
  {
    id: "4",
    user: {
      id: "user4",
      name: "Emily Davis",
      username: "emilydavis",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      isOnline: true,
    },
    lastMessage: "Can you share the latest updates?",
    lastMessageTime: "2024-01-14T14:20:00Z",
    unreadCount: 1,
  },
  {
    id: "5",
    user: {
      id: "user5",
      name: "David Wilson",
      username: "davidwilson",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      isOnline: false,
    },
    lastMessage: "Looking forward to the event!",
    lastMessageTime: "2024-01-13T11:00:00Z",
  },
  {
    id: "group1",
    user: {
      id: "group1",
      name: "Tech Innovators",
      username: "techinnovators",
      avatar:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop",
      isOnline: false,
    },
    lastMessage: "Meeting scheduled for tomorrow",
    lastMessageTime: "2024-01-12T08:30:00Z",
    isGroup: true,
    groupName: "Tech Innovators",
    groupAvatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop",
  },
];

// Mock messages for the FundBrave AI chat
const mockMessages: Message[] = [
  {
    id: "msg1",
    senderId: "user1",
    content:
      "Hello! Welcome to FundBrave. I'm your AI assistant, here to help you navigate the platform and answer any questions you might have.",
    timestamp: "2024-01-15T10:00:00Z",
    isRead: true,
  },
  {
    id: "msg2",
    senderId: "currentUser",
    content: "Hi! I'm interested in starting a campaign for my charity project.",
    timestamp: "2024-01-15T10:05:00Z",
    isRead: true,
  },
  {
    id: "msg3",
    senderId: "user1",
    content:
      "That's wonderful! FundBrave makes it easy to create and manage fundraising campaigns. You can accept donations in cryptocurrency and reach a global audience of supporters.",
    timestamp: "2024-01-15T10:06:00Z",
    isRead: true,
  },
  {
    id: "msg4",
    senderId: "currentUser",
    content: "What are the fees for running a campaign?",
    timestamp: "2024-01-15T10:10:00Z",
    isRead: true,
  },
  {
    id: "msg5",
    senderId: "user1",
    content:
      "FundBrave charges a minimal platform fee of just 2.5% on successful donations. This helps us maintain the platform and provide you with the best fundraising experience. There are no hidden fees!",
    timestamp: "2024-01-15T10:12:00Z",
    isRead: true,
  },
  {
    id: "msg6",
    senderId: "currentUser",
    content: "That sounds great! How do I get started?",
    timestamp: "2024-01-15T10:20:00Z",
    isRead: true,
  },
  {
    id: "msg7",
    senderId: "user1",
    content:
      "Getting started is easy! Just click the \"Create Campaign\" button in your dashboard. You'll be guided through setting up your campaign with a title, description, goal amount, and images. Would you like me to walk you through the process?",
    timestamp: "2024-01-15T10:25:00Z",
    isRead: true,
  },
  {
    id: "msg8",
    senderId: "user1",
    content: "Hello! How can I help you today?",
    timestamp: "2024-01-15T10:30:00Z",
    isRead: false,
  },
];

// Mock shared files
const mockSharedFiles: SharedFile[] = [
  {
    id: "file1",
    type: "video",
    name: "Campaign Introduction",
    url: "https://example.com/video1.mp4",
    thumbnail:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop",
    uploadedAt: "2024-01-14T12:00:00Z",
  },
  {
    id: "file2",
    type: "video",
    name: "Success Story",
    url: "https://example.com/video2.mp4",
    thumbnail:
      "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=200&h=200&fit=crop",
    uploadedAt: "2024-01-13T15:30:00Z",
  },
  {
    id: "file3",
    type: "video",
    name: "Platform Demo",
    url: "https://example.com/video3.mp4",
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop",
    uploadedAt: "2024-01-12T09:00:00Z",
  },
  {
    id: "file4",
    type: "video",
    name: "Thank You Message",
    url: "https://example.com/video4.mp4",
    thumbnail:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop",
    uploadedAt: "2024-01-11T18:45:00Z",
  },
  {
    id: "file5",
    type: "image",
    name: "Campaign Banner",
    url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=200&fit=crop",
    uploadedAt: "2024-01-10T11:00:00Z",
  },
  {
    id: "file6",
    type: "image",
    name: "Team Photo",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop",
    uploadedAt: "2024-01-09T14:20:00Z",
  },
  {
    id: "file7",
    type: "document",
    name: "Campaign Report.pdf",
    url: "https://example.com/report.pdf",
    uploadedAt: "2024-01-08T10:00:00Z",
  },
  {
    id: "file8",
    type: "audio",
    name: "Podcast Episode 1.mp3",
    url: "https://example.com/podcast.mp3",
    uploadedAt: "2024-01-07T16:30:00Z",
  },
];

const CURRENT_USER_ID = "currentUser";

export default function MessengerPage() {
  const [selectedChatId, setSelectedChatId] = useState<string>("1");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isSharedFilesCollapsed, setIsSharedFilesCollapsed] = useState(false);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setIsMobileDrawerOpen(false);
    // In a real app, this would fetch the messages for the selected chat
  };

  const handleNewChat = () => {
    // Handle creating a new chat
    console.log("New chat clicked");
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg${Date.now()}`,
      senderId: CURRENT_USER_ID,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMessage]);

    // Simulate AI response after a short delay
    if (selectedChatId === "1") {
      setTimeout(() => {
        const aiResponse: Message = {
          id: `msg${Date.now() + 1}`,
          senderId: "user1",
          content:
            "Thank you for your message! Is there anything specific you'd like to know about FundBrave?",
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 1500);
    }
  };

  const handleEmojiClick = () => {
    console.log("Emoji picker clicked");
  };

  const handleAttachmentClick = () => {
    console.log("Attachment clicked");
  };

  const handleFileClick = (fileId: string) => {
    console.log("File clicked:", fileId);
    // File click is handled by SharedFilesSidebar which triggers onToggleCollapse
  };

  const handleToggleSharedFiles = () => {
    setIsSharedFilesCollapsed((prev) => !prev);
  };

  const handleSeeMoreFiles = () => {
    console.log("See more files clicked");
  };

  // Get selected chat data
  const selectedChat = mockChats.find((c) => c.id === selectedChatId);

  return (
    <div className="flex h-screen flex-col bg-background">
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
          chats={mockChats}
          selectedChatId={selectedChatId}
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
          chats={mockChats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />
      </MobileChatDrawer>

      {/* Main Chat Area (flexible center) */}
      <main className="min-h-0 min-w-0 flex-1">
        {selectedChat ? (
          <ChatArea
            chatUser={selectedChat.user}
            messages={messages}
            currentUserId={CURRENT_USER_ID}
            onSendMessage={handleSendMessage}
            onEmojiClick={handleEmojiClick}
            onAttachmentClick={handleAttachmentClick}
            isSharedFilesVisible={!isSharedFilesCollapsed}
            onToggleSharedFiles={handleToggleSharedFiles}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-neutral-dark-200">Select a chat to start messaging</p>
          </div>
        )}
      </main>

      {/* Right Sidebar - Shared Files with collapsible animation */}
      <aside
        className={cn(
          "hidden flex-shrink-0 transition-all duration-300 ease-out lg:block",
          isSharedFilesCollapsed ? "w-0 overflow-hidden p-0" : "w-[280px] p-4"
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
    </div>
  );
}
