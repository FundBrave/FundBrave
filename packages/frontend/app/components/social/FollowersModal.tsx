"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFollowers } from '@/app/hooks/useFollowers';
import { useFollowing } from '@/app/hooks/useFollowing';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { FollowButton } from './FollowButton';
import type { FollowListUser } from './schemas';

interface FollowersModalProps {
  userId: string;
  initialTab?: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FollowersModal Component
 *
 * Modal displaying followers and following lists with tabs.
 * Features:
 * - Tab switching between Followers/Following
 * - Search/filter users
 * - Infinite scroll or "Load More" pagination
 * - Follow/unfollow buttons for each user
 * - Empty states for each tab
 * - Focus trap for accessibility
 *
 * @example
 * ```tsx
 * <FollowersModal
 *   userId="user-123"
 *   initialTab="followers"
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 * />
 * ```
 */
export function FollowersModal({
  userId,
  initialTab = 'followers',
  isOpen,
  onClose,
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Use focus trap for accessibility
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  // Fetch followers and following
  const followers = useFollowers({ userId, enabled: isOpen && activeTab === 'followers' });
  const following = useFollowing({ userId, enabled: isOpen && activeTab === 'following' });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const currentData = activeTab === 'followers' ? followers : following;
  const filteredUsers = currentData.users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              className="bg-[var(--neutral-dark-500)] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="followers-modal-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2
                  id="followers-modal-title"
                  className="text-lg font-semibold text-foreground"
                >
                  {activeTab === 'followers' ? 'Followers' : 'Following'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === 'followers'
                      ? 'text-foreground'
                      : 'text-foreground/60 hover:text-foreground/80'
                  }`}
                  aria-selected={activeTab === 'followers'}
                  role="tab"
                >
                  Followers ({followers.total})
                  {activeTab === 'followers' && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                      layoutId="activeTab"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === 'following'
                      ? 'text-foreground'
                      : 'text-foreground/60 hover:text-foreground/80'
                  }`}
                  aria-selected={activeTab === 'following'}
                  role="tab"
                >
                  Following ({following.total})
                  {activeTab === 'following' && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                      layoutId="activeTab"
                    />
                  )}
                </button>
              </div>

              {/* Search */}
              <div className="p-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--neutral-dark-400)] border border-white/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    aria-label={`Search ${activeTab}`}
                  />
                </div>
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {currentData.isLoading && currentData.users.length === 0 ? (
                  <LoadingState />
                ) : filteredUsers.length === 0 ? (
                  <EmptyState
                    type={activeTab}
                    hasSearchQuery={searchQuery.length > 0}
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <UserListItem key={user.id} user={user} />
                    ))}

                    {/* Load More Button */}
                    {currentData.hasMore && !searchQuery && (
                      <button
                        onClick={currentData.loadMore}
                        disabled={currentData.isLoading}
                        className="w-full py-2.5 text-sm font-medium text-[var(--primary)] hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {currentData.isLoading ? 'Loading...' : 'Load More'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// User List Item Component
function UserListItem({ user }: { user: FollowListUser }) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--purple)] flex items-center justify-center text-white font-semibold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        {user.isVerified && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <VerifiedIcon className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <h3 className="font-semibold text-foreground truncate">
            {user.name}
          </h3>
        </div>
        <p className="text-sm text-foreground/60 truncate">
          @{user.username}
        </p>
        {user.mutualFollowers && user.mutualFollowers.count > 0 && (
          <p className="text-xs text-foreground/50 mt-1">
            Followed by {user.mutualFollowers.sample.map(f => f.name).join(', ')}
            {user.mutualFollowers.count > user.mutualFollowers.sample.length &&
              ` and ${user.mutualFollowers.count - user.mutualFollowers.sample.length} others`}
          </p>
        )}
      </div>

      {/* Follow Button */}
      <FollowButton
        userId={user.id}
        initialIsFollowing={user.isFollowing}
        showMutualBadge={user.isFollowedBy}
        variant="compact"
      />
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-foreground/50">
      <motion.div
        className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <p className="mt-4 text-sm">Loading...</p>
    </div>
  );
}

// Empty State
function EmptyState({ type, hasSearchQuery }: { type: 'followers' | 'following'; hasSearchQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <EmptyIcon className="w-16 h-16 text-foreground/20 mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {hasSearchQuery
          ? 'No results found'
          : type === 'followers'
          ? 'No followers yet'
          : 'Not following anyone yet'}
      </h3>
      <p className="text-sm text-foreground/60 max-w-xs">
        {hasSearchQuery
          ? 'Try adjusting your search query'
          : type === 'followers'
          ? 'When people follow this user, they will appear here'
          : 'Start following people to see them here'}
      </p>
    </div>
  );
}

// Icon Components
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 10" fill="none">
      <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="32" cy="24" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M16 48C16 40 22 36 32 36C42 36 48 40 48 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
