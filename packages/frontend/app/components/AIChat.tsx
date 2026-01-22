"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Minimize2, Maximize2, X, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  /** Custom className for the chat widget */
  className?: string;
  /** Initial position (floating button) */
  position?: "bottom-right" | "bottom-left";
  /** AI service endpoint URL */
  endpoint?: string;
}

/**
 * AI Chat Assistant Component
 *
 * Provides an AI-powered chat interface with Server-Sent Events (SSE) streaming.
 * Can be used as a floating chat widget or embedded in a page.
 */
export function AIChat({
  className,
  position = "bottom-right",
  endpoint = "/api/ai/chat",
}: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm FundBrave AI, your fundraising assistant. I can help you with campaign creation, donation strategies, and platform guidance. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsStreaming(true);

    const assistantMessageId = `assistant-${Date.now()}`;
    setStreamingMessageId(assistantMessageId);

    // Initialize assistant message
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // TODO: Replace with actual SSE endpoint
      // For now, simulate streaming with setTimeout
      const response = await simulateAIResponse(userMessage.content);

      // Simulate streaming character by character
      let currentContent = "";
      for (let i = 0; i < response.length; i++) {
        currentContent += response[i];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: currentContent }
              : msg
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      /*
      // Actual SSE implementation:
      const eventSource = new EventSource(
        `${endpoint}?message=${encodeURIComponent(userMessage.content)}`
      );
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.done) {
          eventSource.close();
          setIsStreaming(false);
          setStreamingMessageId(null);
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + data.token }
                : msg
            )
          );
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsStreaming(false);
        setStreamingMessageId(null);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + "\n\n[Error: Failed to connect to AI service]" }
              : msg
          )
        );
      };
      */
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "I apologize, but I encountered an error. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setStreamingMessageId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simulate AI response (replace with actual AI service)
  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("campaign") || lowerMessage.includes("fundraiser")) {
      return "To create a successful fundraising campaign on FundBrave, I recommend: (1) Set a realistic funding goal based on your project needs, (2) Create compelling campaign content with clear images and detailed description, (3) Share your campaign across social media platforms, and (4) Engage with your donors through regular updates. Would you like specific guidance on any of these steps?";
    }

    if (lowerMessage.includes("donate") || lowerMessage.includes("donation")) {
      return "FundBrave offers three donation models: (1) Direct Donations - 100% goes to the beneficiary, (2) Wealth-Building Donations - 78% to beneficiary, 20% to platform yield fund, 2% to creator, and (3) Staking Donations - earn yield while supporting causes. Which model interests you?";
    }

    if (lowerMessage.includes("stake") || lowerMessage.includes("staking")) {
      return "FundBrave's staking system allows you to earn yield while supporting campaigns. You can stake in: (1) Individual campaign pools, (2) Global staking pool for diversification, (3) FBT token staking with time-lock multipliers, or (4) Impact DAO for governance and yield allocation voting. Which would you like to learn more about?";
    }

    if (lowerMessage.includes("token") || lowerMessage.includes("fbt")) {
      return "The FundBrave Token (FBT) is our platform's utility token. It offers: (1) Governance rights in the Impact DAO, (2) Staking rewards with time-lock multipliers, (3) Access to exclusive campaigns, and (4) Voting power for yield allocation. You can earn FBT through platform participation and staking.";
    }

    return "I'm here to help you navigate FundBrave! I can assist with campaign creation, donation options, staking strategies, and general platform questions. What would you like to know more about?";
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed z-50 w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95",
            "bg-gradient-to-r from-primary to-purple-500 text-white",
            "flex items-center justify-center",
            position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6",
            className
          )}
          aria-label="Open AI Chat"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-surface-elevated border border-border-subtle rounded-2xl shadow-2xl transition-all",
            position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6",
            isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
            "flex flex-col overflow-hidden",
            className
          )}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-purple-500">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="text-white">
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  FundBrave AI
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-white/80">Always here to help</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                aria-label={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-sunken">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                        message.role === "user"
                          ? "bg-primary text-white"
                          : "bg-surface-elevated text-foreground border border-border-subtle"
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                        {message.id === streamingMessageId && (
                          <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse" />
                        )}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center">
                        <User className="w-5 h-5 text-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && streamingMessageId === null && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-surface-elevated border border-border-subtle rounded-2xl px-4 py-2.5">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <span
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-surface-elevated border-t border-border-subtle">
                <div className="flex items-end gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={isStreaming}
                    className="flex-1 px-4 py-2.5 bg-surface-sunken border border-border-default rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isStreaming}
                    size="icon"
                    className="flex-shrink-0"
                  >
                    {isStreaming ? (
                      <Spinner size="sm" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <p className="text-[10px] text-text-tertiary mt-2 text-center">
                  AI responses may be inaccurate. Verify important information.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default AIChat;
