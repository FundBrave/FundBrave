"use client";

import Link from "next/link";
import { CampaignActionBar } from "@/app/components/campaigns";
import {
  MockComment,
  formatRelativeTime,
} from "@/lib/constants/mock-profile-activity";

interface CommentCardProps {
  comment: MockComment;
}

/**
 * HeartIcon - Small heart icon for likes
 */
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * CommentIcon - Small comment bubble icon
 */
function CommentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * CommentCard - Displays a single comment on a campaign
 */
export function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className="bg-neutral-dark-400/30 rounded-xl p-4 border-subtle">
      <div className="flex gap-3">
        <img
          src={comment.campaignImage}
          alt={comment.campaignTitle}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <Link
            href={`/campaigns/${comment.campaignId}`}
            className="text-white/60 text-sm hover:text-primary transition-colors line-clamp-1"
          >
            Commented on: {comment.campaignTitle}
          </Link>
          <p className="text-white mt-2">{comment.content}</p>
          <div className="flex items-center gap-4 mt-3 text-white/40 text-sm">
            <span>{formatRelativeTime(comment.commentedAt)}</span>
            <button className="flex items-center gap-1 hover:text-white/60 transition-colors">
              <HeartIcon className="w-3.5 h-3.5" />
              {comment.likesCount}
            </button>
            <button className="flex items-center gap-1 hover:text-white/60 transition-colors">
              <CommentIcon className="w-3.5 h-3.5" />
              {comment.repliesCount} replies
            </button>
          </div>
        </div>
      </div>
      {/* Share Action */}
      <div className="mt-3 pt-3 border-t border-border-subtle">
        <CampaignActionBar
          campaign={{
            id: comment.campaignId,
            title: comment.campaignTitle,
            url: `https://fundbrave.com/campaigns/${comment.campaignId}`,
          }}
          variant="compact"
        />
      </div>
    </div>
  );
}

interface CommentsTabProps {
  comments: MockComment[];
}

/**
 * CommentsTab - List of user's comments on campaigns
 */
export default function CommentsTab({ comments }: CommentsTabProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-white/50">
        <p>No comments yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
