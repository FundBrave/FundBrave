"use client";

import { useState, useCallback } from "react";
import { CommentThread } from "@/app/components/ui/comments/CommentThread";
import {
  MOCK_COMMENTS,
  MOCK_COMMENT_AUTHOR_1,
  MOCK_COMMENT_AUTHOR_2,
  MOCK_COMMENT_AUTHOR_3,
} from "@/app/ui-library/playgrounds/_mock-data";
import type { Comment, CommentThread as CommentThreadType } from "@/app/types/comment";
import type { PlaygroundConfig } from "../types";
import { Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Build a pool of mock threads for simulated pagination.
// The real InfiniteCommentList depends on useComments/useAddComment hooks
// that require API context, so we render a simulated version using the same
// CommentThread component it delegates to internally.
// ---------------------------------------------------------------------------

function makeThread(comment: Comment, replies: Comment[] = []): CommentThreadType {
  return {
    root: comment,
    replies,
    totalRepliesCount: replies.length,
    nestedReplies: {},
  };
}

const EXTRA_COMMENTS: Comment[] = [
  {
    id: "inf-comment-004",
    content:
      "Has anyone tried the new staking calculator? It estimates yield based on campaign duration and lock period. Really useful for planning larger donations.",
    parentId: null,
    rootId: null,
    depth: 0,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    author: MOCK_COMMENT_AUTHOR_1,
    likesCount: 14,
    repliesCount: 0,
    isLiked: false,
    postId: "demo-post",
    replies: [],
  },
  {
    id: "inf-comment-005",
    content:
      "I appreciate that FundBrave shows the gas fees upfront before you confirm. No hidden costs.",
    parentId: null,
    rootId: null,
    depth: 0,
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    author: MOCK_COMMENT_AUTHOR_3,
    likesCount: 8,
    repliesCount: 0,
    isLiked: true,
    postId: "demo-post",
    replies: [],
  },
  {
    id: "inf-comment-006",
    content:
      "Would love to see a leaderboard for top donors. Gamification could drive more engagement and ultimately more funds for campaigns.",
    parentId: null,
    rootId: null,
    depth: 0,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    author: MOCK_COMMENT_AUTHOR_2,
    likesCount: 21,
    repliesCount: 0,
    isLiked: false,
    postId: "demo-post",
    replies: [],
  },
  {
    id: "inf-comment-007",
    content:
      "The multi-sig wallet support is a game changer for DAO-level contributions. We just pooled 2 ETH from our treasury.",
    parentId: null,
    rootId: null,
    depth: 0,
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    author: {
      id: "user-005",
      name: "Lena Petrov",
      username: "lenapetrov",
      avatar:
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Lena&backgroundColor=1a1a2e",
      isVerified: true,
    },
    likesCount: 16,
    repliesCount: 0,
    isLiked: false,
    postId: "demo-post",
    replies: [],
  },
  {
    id: "inf-comment-008",
    content:
      "Milestone updates like this one keep donors engaged. Transparency builds trust and trust drives repeat contributions.",
    parentId: null,
    rootId: null,
    depth: 0,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    author: MOCK_COMMENT_AUTHOR_1,
    likesCount: 10,
    repliesCount: 0,
    isLiked: false,
    postId: "demo-post",
    replies: [],
  },
];

// Build initial threads from MOCK_COMMENTS (3 threads) + extra comments
const ALL_THREADS: CommentThreadType[] = [
  // First three use the rich MOCK_COMMENTS which already have replies
  ...MOCK_COMMENTS.map((c) =>
    makeThread(
      { ...c, replies: [] },
      c.replies ?? [],
    ),
  ),
  // Additional comments for pagination demo
  ...EXTRA_COMMENTS.map((c) => makeThread(c)),
];

const PAGE_SIZE = 3;

const noop = () => {};

// ---------------------------------------------------------------------------
// Wrapper component that simulates paginated infinite scroll
// ---------------------------------------------------------------------------

function InfiniteCommentListDemo() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);

  const visibleThreads = ALL_THREADS.slice(0, visibleCount);
  const hasMore = visibleCount < ALL_THREADS.length;

  const handleLoadMore = useCallback(() => {
    setIsLoading(true);
    // Simulate network latency
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, ALL_THREADS.length));
      setIsLoading(false);
    }, 800);
  }, []);

  return (
    <div className="max-h-[500px] overflow-y-auto rounded-lg border border-white/10 bg-surface-sunken/30 p-4">
      <div className="flex flex-col gap-6">
        {visibleThreads.map((thread) => (
          <CommentThread
            key={thread.root.id}
            comment={thread.root}
            replies={thread.replies}
            nestedReplies={thread.nestedReplies}
            onReply={noop}
            onLike={noop}
            onUnlike={noop}
            onShowMoreReplies={noop}
            onDelete={noop}
            currentUserUsername="demo-viewer"
          />
        ))}

        {/* Load More / End of List */}
        {hasMore ? (
          <div className="flex justify-center py-4">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading more comments...
                </>
              ) : (
                <>Load more comments ({ALL_THREADS.length - visibleCount} remaining)</>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-foreground-muted border-t border-border-subtle">
            No more comments
          </div>
        )}
      </div>
    </div>
  );
}

const infiniteCommentListPlayground: PlaygroundConfig = {
  componentName: "InfiniteCommentList",
  importPath: "@/app/components/ui/comments/InfiniteCommentList",
  controls: [],
  renderPreview: () => <InfiniteCommentListDemo />,
};

export default infiniteCommentListPlayground;
