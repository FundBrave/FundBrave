"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { CampaignDetail } from "@/app/campaigns/data";
import { MessageCircle, FileText, Bell } from "@/app/components/ui/icons";

interface CampaignTabsProps {
  campaign: CampaignDetail;
}

export default function CampaignTabs({ campaign }: CampaignTabsProps) {
  const [activeTab, setActiveTab] = useState<"story" | "updates" | "comments">(
    "story"
  );

  // GSAP refs
  const contentRef = useRef<HTMLDivElement>(null);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf(contentRef.current);
    };
  }, []);

  // Animate content on tab change
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tabs Header */}
      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab("story")}
          className={cn(
            "px-6 py-4 text-base font-medium transition-colors relative flex items-center gap-2",
            activeTab === "story"
              ? "text-foreground"
              : "text-text-secondary hover:text-foreground/80"
          )}
        >
          <FileText size={18} />
          Story
          {activeTab === "story" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-soft-purple-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("updates")}
          className={cn(
            "px-6 py-4 text-base font-medium transition-colors relative flex items-center gap-2",
            activeTab === "updates"
              ? "text-foreground"
              : "text-text-secondary hover:text-foreground/80"
          )}
        >
          <Bell size={18} />
          Updates
          <span className="bg-surface-overlay text-foreground/80 text-xs px-2 py-0.5 rounded-full ml-1">
            {campaign.updates.length}
          </span>
          {activeTab === "updates" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-soft-purple-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={cn(
            "px-6 py-4 text-base font-medium transition-colors relative flex items-center gap-2",
            activeTab === "comments"
              ? "text-foreground"
              : "text-text-secondary hover:text-foreground/80"
          )}
        >
          <MessageCircle size={18} />
          Comments
          <span className="bg-surface-overlay text-foreground/80 text-xs px-2 py-0.5 rounded-full ml-1">
            {campaign.comments.length}
          </span>
          {activeTab === "comments" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-soft-purple-500" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div ref={contentRef} className="py-4">
        {activeTab === "story" && (
          <div className="prose prose-invert max-w-none">
            <div className="text-foreground/80 whitespace-pre-line leading-relaxed">
              {campaign.story}
            </div>
          </div>
        )}

        {activeTab === "updates" && (
          <div className="flex flex-col gap-6">
            {campaign.updates.map((update) => (
              <div
                key={update.id}
                className="bg-surface-sunken rounded-xl p-6 border border-border-subtle"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {update.title}
                  </h3>
                  <span className="text-sm text-text-tertiary">
                    {update.createdAt}
                  </span>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  {update.content}
                </p>
              </div>
            ))}
            {campaign.updates.length === 0 && (
              <div className="text-center py-10 text-text-tertiary">
                No updates yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="flex flex-col gap-6">
            {campaign.comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/20 to-soft-purple-500/20 flex items-center justify-center text-foreground font-medium shrink-0 border border-border-subtle overflow-hidden">
                  {comment.author.avatarUrl ? (
                    <img
                      src={comment.author.avatarUrl}
                      alt={comment.author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    comment.author.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      • {comment.createdAt}
                    </span>
                  </div>
                  <p className="text-foreground/80 text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
            {campaign.comments.length === 0 && (
              <div className="text-center py-10 text-text-tertiary">
                No comments yet. Be the first to support!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

