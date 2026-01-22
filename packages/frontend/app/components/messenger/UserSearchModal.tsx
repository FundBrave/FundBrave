"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "@/app/components/ui/icons";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/button";
import { useStartConversation } from "@/app/hooks/useMessaging";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated?: (conversationId: string) => void;
}

/**
 * UserSearchModal - Search for platform users to start messaging
 */
export function UserSearchModal({
  isOpen,
  onClose,
  onConversationCreated,
}: UserSearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { startConversation, isStarting } = useStartConversation();

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || !isOpen) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${API_BASE}/users/search?q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartConversation = async (userId: string) => {
    const conversation = await startConversation(userId);

    if (conversation) {
      onClose();
      setSearchQuery("");
      setSearchResults([]);

      // Navigate to the conversation or notify parent
      if (onConversationCreated) {
        onConversationCreated(conversation.id);
      } else {
        router.push(`/messenger?conversation=${conversation.id}`);
      }
    }
  };

  const handleClose = () => {
    onClose();
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface-elevated border border-border-subtle rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-bold text-foreground">New Message</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-surface-overlay transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-border-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or username..."
              className="w-full pl-10 pr-4 py-3 bg-surface-sunken border border-border-subtle rounded-lg text-foreground placeholder:text-text-tertiary outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : searchError ? (
            <div className="px-6 py-8 text-center">
              <p className="text-error text-sm">{searchError}</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartConversation(user.id)}
                  disabled={isStarting}
                  className="w-full flex items-center gap-3 px-6 py-3 hover:bg-surface-overlay transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Avatar
                    src={user.avatarUrl || undefined}
                    alt={user.displayName || user.username || "User"}
                    fallback={(user.displayName || user.username || "?").charAt(0).toUpperCase()}
                    size="md"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {user.displayName || user.username || "Anonymous"}
                    </div>
                    {user.username && (
                      <div className="text-sm text-text-tertiary truncate">
                        @{user.username}
                      </div>
                    )}
                    {user.bio && (
                      <div className="text-xs text-text-secondary truncate mt-0.5">
                        {user.bio}
                      </div>
                    )}
                  </div>
                  {isStarting && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="px-6 py-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-text-tertiary" />
              <p className="text-text-secondary text-sm">No users found</p>
              <p className="text-text-tertiary text-xs mt-1">
                Try searching with a different name or username
              </p>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-text-tertiary" />
              <p className="text-text-secondary text-sm">Search for users to message</p>
              <p className="text-text-tertiary text-xs mt-1">
                Start typing to find platform users
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle">
          <p className="text-xs text-text-tertiary text-center">
            Only platform users can be messaged
          </p>
        </div>
      </div>
    </>
  );
}
