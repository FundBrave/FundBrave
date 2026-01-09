"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play } from "@/app/components/ui/icons";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Toggle } from "@/app/components/ui/Toggle";
import type {
  MediaItem,
  CommunityDetails,
  InfoPanelTab,
} from "@/app/types/community";

// Re-export types for backward compatibility
export type { MediaItem, CommunityDetails, InfoPanelTab };

interface CommunityInfoPanelProps {
  /** Community details to display */
  community: CommunityDetails;
  /** Called when notifications toggle is changed */
  onToggleNotifications?: (enabled: boolean) => void;
  /** Called when a media item is clicked */
  onMediaClick?: (mediaId: string) => void;
}

export function CommunityInfoPanel({
  community,
  onToggleNotifications,
  onMediaClick,
}: CommunityInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<InfoPanelTab>("media");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    community.notificationsEnabled
  );

  const handleToggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    onToggleNotifications?.(newValue);
  };

  const tabs: { key: InfoPanelTab; label: string }[] = [
    { key: "media", label: "Media" },
    { key: "members", label: "Members" },
    { key: "files", label: "Files" },
    { key: "links", label: "Links" },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated">
      {/* Cover Image - Optional */}
      {community.coverImage && (
        <div className="relative h-32 w-full">
          <Image
            src={community.coverImage}
            alt={`${community.name} cover`}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      {/* Community Info */}
      <div className="scrollbar-auto-hide flex-1 overflow-y-auto p-5">
        {/* Name & Creator */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">{community.name}</h2>
          <p className="text-sm text-text-secondary">
            Created by{" "}
            <span className="text-primary-400">{community.creatorUsername}</span>
          </p>
          <p className="text-sm text-text-secondary">
            {formatNumber(community.memberCount, { useLocale: true })} members,{" "}
            {formatNumber(community.onlineCount, { useLocale: true })} online
          </p>
        </div>

        {/* Info Section */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-primary-400">Info</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {community.description}
          </p>
          {community.inviteLink && (
            <a
              href={community.inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-text-secondary hover:text-foreground hover:underline"
            >
              {community.inviteLink}
            </a>
          )}
          <p className="mt-1 text-xs text-text-tertiary">Invite link</p>
        </div>

        {/* Notifications Toggle */}
        <Toggle
          checked={notificationsEnabled}
          onChange={handleToggleNotifications}
          label="Notifications"
          id="notifications"
          showIndicator
          className="mb-6"
        />

        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Community content tabs">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              variant={activeTab === tab.key ? "primary" : "outline"}
              size="sm"
              aria-label={`View ${tab.label.toLowerCase()}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div role="tabpanel" aria-label={`${activeTab} content`}>
          {activeTab === "media" && (
            <MediaGrid media={community.media} onMediaClick={onMediaClick} />
          )}
          {activeTab === "members" && (
            <div className="py-8 text-center text-sm text-text-tertiary">
              Members list coming soon
            </div>
          )}
          {activeTab === "files" && (
            <div className="py-8 text-center text-sm text-text-tertiary">
              Files list coming soon
            </div>
          )}
          {activeTab === "links" && (
            <div className="py-8 text-center text-sm text-text-tertiary">
              Links list coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MediaGridProps {
  media: MediaItem[];
  onMediaClick?: (mediaId: string) => void;
}

function MediaGrid({ media, onMediaClick }: MediaGridProps) {
  if (media.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-tertiary">
        No media shared yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {media.map((item) => (
        <button
          key={item.id}
          onClick={() => onMediaClick?.(item.id)}
          className="relative aspect-square overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
          aria-label={`View ${item.type === "video" ? "video" : "image"}`}
        >
          <Image
            src={item.thumbnail}
            alt="Media thumbnail"
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          {/* Video play button overlay */}
          {item.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                <Play className="h-5 w-5 text-white" fill="white" />
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export default CommunityInfoPanel;
