"use client";

import { useState } from "react";
import { Heart } from "@/app/components/ui/icons";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useFundraiserComments } from "@/app/hooks/useFundraiserComments";
import { useAddComment } from "@/app/hooks/useAddComment";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { formatDistanceToNow } from "date-fns";

interface CampaignCommentsProps {
  comments: any[]; // Fallback mock comments
  campaignId: string;
}

export default function CampaignComments({ comments: mockComments, campaignId }: CampaignCommentsProps) {
  const [commentText, setCommentText] = useState("");
  const { currentUser } = useCurrentUser();

  // Fetch real comments from API
  const { threads, isLoading, totalCount, refetch } = useFundraiserComments({
    fundraiserId: campaignId,
    enabled: !!campaignId,
  });

  // Add comment mutation
  const { addComment, isAdding } = useAddComment();

  const handleSubmitComment = async () => {
    if (!commentText.trim() || isAdding) return;

    try {
      const result = await addComment({
        fundraiserId: campaignId,
        content: commentText.trim(),
      });

      if (result) {
        // Clear input after successful post
        setCommentText("");
        // Refetch comments to show the new one
        await refetch();
      } else {
        alert('Failed to post comment. Please try again.');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  // Use real comments if available, fallback to mock
  const displayComments = threads.length > 0 ? threads : mockComments.map(c => ({
    root: {
      id: c.id,
      author: {
        name: c.author.name,
        avatar: c.author.avatarUrl,
        isVerified: false,
      },
      content: c.content,
      createdAt: c.createdAt,
      likesCount: c.likes || 0,
    },
    replies: [],
  }));

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-xl font-bold text-foreground font-[family-name:var(--font-family-gilgan)]">
        Comments ({totalCount || displayComments.length})
      </h3>

      {/* Comment Input */}
      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-surface-sunken border border-border-subtle flex items-center justify-center overflow-hidden shrink-0">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground font-bold bg-gradient-to-br from-primary-500 to-soft-purple-500">
              {currentUser?.displayName?.charAt(0) || "?"}
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment..."
            className="w-full bg-surface-overlay rounded-xl p-4 border border-border-subtle hover:border-primary/30 focus:border-primary/50 focus:outline-none transition-colors text-foreground placeholder:text-text-tertiary resize-none min-h-[80px]"
            disabled={isAdding}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmitComment();
              }
            }}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isAdding}
              size="sm"
              className="gap-2"
            >
              {isAdding ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && displayComments.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-8">
        {displayComments.map((thread) => {
          const comment = thread.root;
          const formattedTime = typeof comment.createdAt === 'string' && comment.createdAt.includes('ago')
            ? comment.createdAt
            : formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

          return (
            <div key={comment.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-sunken border border-border-subtle shrink-0 overflow-hidden">
                {comment.author.avatar ? (
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground font-bold bg-gradient-to-br from-primary-500 to-soft-purple-500">
                    {comment.author.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">
                    {comment.author.name}
                  </span>
                  {comment.author.isVerified && (
                    <span className="text-primary-400 text-xs">✓</span>
                  )}
                  <span className="text-xs text-text-tertiary">
                    {formattedTime}
                  </span>
                </div>

                <p className="text-foreground/80 text-sm leading-relaxed">
                  {comment.content}
                </p>

                <div className="flex items-center gap-4 mt-1">
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary-400 transition-colors">
                    <Heart size={14} />
                    {comment.likesCount || 0}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!isLoading && displayComments.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}

