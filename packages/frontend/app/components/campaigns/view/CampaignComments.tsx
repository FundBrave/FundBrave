"use client";

import { Heart, MessageCircle } from "@/app/components/ui/icons";
import { Comment } from "@/app/campaigns/data";

interface CampaignCommentsProps {
  comments: Comment[];
}

export default function CampaignComments({ comments }: CampaignCommentsProps) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-xl font-bold text-foreground font-[family-name:var(--font-family-gilgan)]">
        Comments ({comments.length})
      </h3>

      {/* Comment Input Placeholder */}
      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-surface-sunken border border-border-subtle flex items-center justify-center overflow-hidden shrink-0">
          <img 
            src="https://picsum.photos/seed/currentuser/100/100" 
            alt="Current User" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 bg-surface-overlay rounded-xl p-4 border border-border-subtle hover:border-border-subtle transition-colors cursor-text">
          <p className="text-text-tertiary text-sm">Write your comment...</p>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex flex-col gap-8">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-sunken border border-border-subtle shrink-0 overflow-hidden">
              {comment.author.avatarUrl ? (
                <img 
                  src={comment.author.avatarUrl} 
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
                <span className="text-xs text-text-tertiary">
                  {comment.createdAt}
                </span>
              </div>
              
              <p className="text-foreground/80 text-sm leading-relaxed">
                {comment.content}
              </p>
              
              <div className="flex items-center gap-4 mt-1">
                <button className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary-400 transition-colors">
                  <Heart size={14} />
                  {comment.likes}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                  Reply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

