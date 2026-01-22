"use client";

import React, { useState } from "react";
import { Search, Plus, Users, X, Menu } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/button";
import { EmptyStateCompact } from "@/app/components/ui/EmptyState";
import type { Community, CommunityFilterTab } from "@/app/types/community";

// Re-export types for backward compatibility
export type { Community, CommunityFilterTab };

interface CommunitySidebarProps {
  /** List of communities to display */
  communities: Community[];
  /** Currently selected community ID */
  selectedCommunityId?: string;
  /** Called when a community is selected */
  onSelectCommunity?: (communityId: string) => void;
  /** Called when user clicks create community button */
  onCreateCommunity?: () => void;
}

/**
 * Empty state component shown when no communities match the filter
 */
function EmptyCommunityState({
  filterTab,
}: {
  filterTab: CommunityFilterTab;
}) {
  const getMessage = () => {
    switch (filterTab) {
      case "joined":
        return "You haven't joined any communities yet.";
      case "not_joined":
        return "You've joined all available communities!";
      default:
        return "No communities found.";
    }
  };

  return (
    <EmptyStateCompact
      icon={Users}
      message={getMessage()}
    />
  );
}

/**
 * Mobile drawer component for community selection
 */
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileDrawer({ isOpen, onClose, children }: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Community selection"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <span className="font-semibold text-foreground">Communities</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-11 w-11 rounded-full"
              aria-label="Close community drawer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * Mobile toggle button to open community drawer
 */
interface MobileToggleProps {
  onClick: () => void;
  selectedCommunityName?: string;
}

export function MobileCommunityToggle({
  onClick,
  selectedCommunityName,
}: MobileToggleProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border-border-subtle bg-surface-elevated px-3 py-2 text-left md:hidden"
      aria-label="Open community selection"
    >
      <Menu className="h-5 w-5 text-text-secondary" />
      <span className="truncate text-sm font-medium text-foreground">
        {selectedCommunityName || "Select Community"}
      </span>
    </Button>
  );
}

export function CommunitySidebar({
  communities,
  selectedCommunityId,
  onSelectCommunity,
  onCreateCommunity,
}: CommunitySidebarProps) {
  const [activeFilter, setActiveFilter] = useState<CommunityFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCommunities = communities.filter((community) => {
    // Filter by search query
    if (
      searchQuery &&
      !community.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filter by tab
    if (activeFilter === "joined" && !community.isJoined) return false;
    if (activeFilter === "not_joined" && community.isJoined) return false;

    return true;
  });

  const handleSelectCommunity = (communityId: string) => {
    onSelectCommunity?.(communityId);
  };

  const selectedCommunity = communities.find(
    (c) => c.id === selectedCommunityId
  );

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          Communities
        </h2>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full"
            aria-label="Search communities"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full"
            aria-label="Create community"
            onClick={onCreateCommunity}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 pb-4" role="tablist" aria-label="Filter communities">
        <Button
          variant={activeFilter === "all" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("all")}
          aria-label="Show all communities"
        >
          All
        </Button>
        <Button
          variant={activeFilter === "joined" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("joined")}
          aria-label="Show joined communities"
        >
          Joined
        </Button>
        <Button
          variant={activeFilter === "not_joined" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("not_joined")}
          aria-label="Show communities not joined"
        >
          Not joined
        </Button>
      </div>

      {/* Communities List */}
      <div className="scrollbar-auto-hide flex-1 overflow-y-auto" role="listbox" aria-label="Communities list">
        {filteredCommunities.length === 0 ? (
          <EmptyCommunityState filterTab={activeFilter} />
        ) : (
          filteredCommunities.map((community) => (
            <CommunityListItem
              key={community.id}
              community={community}
              isSelected={selectedCommunityId === community.id}
              onClick={() => handleSelectCommunity(community.id)}
            />
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-full w-full flex-col">
      {sidebarContent}
    </div>
  );
}

interface CommunityListItemProps {
  community: Community;
  isSelected: boolean;
  onClick: () => void;
}

function CommunityListItem({
  community,
  isSelected,
  onClick,
}: CommunityListItemProps) {
  return (
    <button
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-overlay",
        isSelected && "bg-surface-overlay"
      )}
    >
      {/* Avatar */}
      <Avatar
        src={community.avatar}
        alt={community.name}
        fallback={community.name.charAt(0)}
        size="lg"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-medium text-foreground">{community.name}</h3>
          <span className="ml-2 flex-shrink-0 text-xs text-text-secondary">
            {community.timestamp}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">
          {community.lastMessage}
        </p>
      </div>
    </button>
  );
}

export default CommunitySidebar;
