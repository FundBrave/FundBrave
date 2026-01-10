"use client";

import { Update } from "@/app/campaigns/data";
import { MessageSquare, Heart, Share2 } from "@/app/components/ui/icons";

interface CampaignUpdatesProps {
  updates: Update[];
}

export default function CampaignUpdates({ updates }: CampaignUpdatesProps) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-xl font-bold text-foreground font-[family-name:var(--font-family-gilgan)]" id="updates-section">
        Updates
      </h3>

      <div className="flex flex-col gap-8">
        {updates.map((update) => (
          <div 
            key={update.id} 
            className="flex flex-col gap-4 border-b border-border-subtle pb-8 last:border-0"
          >
            {/* Author Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-soft-purple-500 p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                  <img 
                    src={update.author.avatarUrl} 
                    alt={update.author.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">{update.author.name}</span>
                  <span className="text-xs text-primary-400 font-semibold bg-primary-500/10 px-2 py-0.5 rounded-full">Follow</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <span>{update.author.handle}</span>
                  <span>•</span>
                  <span>{update.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-foreground">{update.title}</h4>
              <p className="text-foreground/80 text-sm leading-relaxed">
                {update.content}
              </p>
              <button className="text-foreground font-semibold text-xs hover:underline">
                See more
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between text-xs text-text-secondary pt-2">
              <div className="flex items-center gap-4">
                <span>Liked by {update.likes} people</span>
              </div>
              <span>{update.comments} comments</span>
            </div>

            <div className="flex items-center gap-6 border-t border-border-subtle pt-4">
              <button className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-foreground transition-colors">
                <Heart size={16} />
                Like
              </button>
              <button className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-foreground transition-colors">
                <MessageSquare size={16} />
                Comment
              </button>
              <button className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-foreground transition-colors">
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full py-3 rounded-xl border border-border-subtle text-foreground font-semibold text-sm hover:bg-surface-overlay transition-colors">
        See more updates
      </button>
    </div>
  );
}

