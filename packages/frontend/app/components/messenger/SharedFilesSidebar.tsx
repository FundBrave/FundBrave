"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search, Play, FileText, Music, ChevronRight } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import type { SharedFile, SharedFilesTab } from "@/app/types/messenger";

// Re-export types for backward compatibility
export type { SharedFile, SharedFilesTab };

interface SharedFilesSidebarProps {
  /** List of shared files to display */
  files: SharedFile[];
  /** Called when a file is clicked */
  onFileClick?: (fileId: string) => void;
  /** Called when "See more" is clicked */
  onSeeMore?: () => void;
  /** Whether the sidebar is collapsed */
  isCollapsed?: boolean;
  /** Called when collapse state changes */
  onToggleCollapse?: () => void;
}

/**
 * File thumbnail component based on file type
 */
function FileThumbnail({
  file,
  onClick,
}: {
  file: SharedFile;
  onClick?: () => void;
}) {
  if (file.type === "video" || file.type === "image") {
    return (
      <button
        onClick={onClick}
        className="group relative aspect-square w-full overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
        aria-label={`View ${file.type}: ${file.name}`}
      >
        <Image
          src={file.thumbnail || file.url}
          alt={file.name}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
        {/* Video play button overlay */}
        {file.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 transition-opacity group-hover:bg-black/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              <Play className="h-5 w-5 text-white" fill="white" />
            </div>
          </div>
        )}
      </button>
    );
  }

  // Audio files
  if (file.type === "audio") {
    return (
      <button
        onClick={onClick}
        className="flex aspect-square w-full flex-col items-center justify-center rounded-xl bg-surface-overlay transition-colors hover:bg-surface-sunken"
        aria-label={`Play audio: ${file.name}`}
      >
        <Music className="mb-2 h-8 w-8 text-purple-400" />
        <span className="max-w-full truncate px-2 text-xs text-text-secondary">
          {file.name}
        </span>
      </button>
    );
  }

  // Document files
  return (
    <button
      onClick={onClick}
      className="flex aspect-square w-full flex-col items-center justify-center rounded-xl bg-surface-overlay transition-colors hover:bg-surface-sunken"
      aria-label={`Open document: ${file.name}`}
    >
      <FileText className="mb-2 h-8 w-8 text-green-400" />
      <span className="max-w-full truncate px-2 text-xs text-text-secondary">
        {file.name}
      </span>
    </button>
  );
}

/**
 * Empty state for when no files of a type exist
 */
function EmptyFilesState({ type }: { type: SharedFilesTab }) {
  const messages: Record<SharedFilesTab, string> = {
    videos: "No videos shared yet",
    images: "No images shared yet",
    audio: "No audio files shared yet",
    docs: "No documents shared yet",
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-sm text-text-tertiary">{messages[type]}</p>
    </div>
  );
}

/**
 * Shared files sidebar component for the messenger.
 * Displays files shared in the current chat, filtered by type.
 * Supports collapsible animation triggered when a file is clicked.
 */
export function SharedFilesSidebar({
  files,
  onFileClick,
  onSeeMore,
  isCollapsed = false,
  onToggleCollapse,
}: SharedFilesSidebarProps) {
  const [activeTab, setActiveTab] = useState<SharedFilesTab>("videos");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle file click - triggers collapse animation
  const handleFileClick = (fileId: string) => {
    onFileClick?.(fileId);
    onToggleCollapse?.();
  };

  // Filter files by active tab and search query
  const filteredFiles = files.filter((file) => {
    // Filter by type
    const typeMap: Record<SharedFilesTab, SharedFile["type"][]> = {
      videos: ["video"],
      images: ["image"],
      audio: ["audio"],
      docs: ["document"],
    };
    if (!typeMap[activeTab].includes(file.type)) return false;

    // Filter by search
    if (
      searchQuery &&
      !file.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const tabs: { key: SharedFilesTab; label: string }[] = [
    { key: "videos", label: "Videos" },
    { key: "images", label: "Images" },
    { key: "audio", label: "Audio" },
    { key: "docs", label: "Docs" },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle p-3">
        <h2 className="font-display text-lg font-bold text-foreground">
          Shared Files
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-surface-overlay"
          aria-label="Search files"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Search className="h-5 w-5 text-text-secondary" />
        </Button>
      </div>

      {/* Search input (collapsible) */}
      {isSearchOpen && (
        <div className="border-b border-border-default px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-border-default bg-surface-overlay py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-text-tertiary focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {/* Filter Tabs - Using Button component */}
      <div
        className="flex flex-wrap gap-2 border-b border-border-default px-5 py-3"
        role="tablist"
        aria-label="Filter files by type"
      >
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="h-7 rounded-full px-3 text-xs"
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-label={`Show ${tab.label.toLowerCase()}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Files Grid */}
      <div
        className="scrollbar-auto-hide flex-1 overflow-y-auto p-5"
        role="tabpanel"
        aria-label={`${activeTab} content`}
      >
        {filteredFiles.length === 0 ? (
          <EmptyFilesState type={activeTab} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredFiles.slice(0, 6).map((file) => (
              <FileThumbnail
                key={file.id}
                file={file}
                onClick={() => handleFileClick(file.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* See More Link */}
      {filteredFiles.length > 6 && (
        <div className="border-t border-border-default px-5 py-3">
          <button
            onClick={onSeeMore}
            className="flex w-full items-center justify-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300"
          >
            See more
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default SharedFilesSidebar;
