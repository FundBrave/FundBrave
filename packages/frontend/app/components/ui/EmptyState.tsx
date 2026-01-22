"use client";

import { LucideIcon, Inbox, Search, Users, Heart, MessageSquare, Rocket, TrendingUp, Vote, Bell, Wallet, Image, FileText, FolderOpen } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "tertiary" | "destructive" | "outline" | "ghost" | "link";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 md:p-12",
      className
    )}>
      {/* Icon */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
        <div className="relative bg-surface-elevated border border-border-subtle rounded-full p-6">
          <Icon className="w-12 h-12 text-text-tertiary" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-text-secondary max-w-md mb-6">{description}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "primary"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty state variants for common scenarios

export function EmptyStateCampaigns({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Rocket}
      title="No campaigns found"
      description="There are no campaigns matching your filters. Try adjusting your search or create a new campaign."
      action={onCreate ? {
        label: "Create campaign",
        onClick: onCreate,
      } : undefined}
      secondaryAction={{
        label: "Clear filters",
        onClick: () => window.location.href = "/campaigns",
      }}
    />
  );
}

export function EmptyStateNoCampaigns({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={Rocket}
      title="Start your first campaign"
      description="Share your story, set your goal, and start raising funds for what matters most to you."
      action={{
        label: "Create campaign",
        onClick: onCreate,
      }}
    />
  );
}

export function EmptyStateSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try different keywords or browse all campaigns.`}
      action={{
        label: "Browse all campaigns",
        onClick: () => window.location.href = "/campaigns",
      }}
    />
  );
}

export function EmptyStateDonations() {
  return (
    <EmptyState
      icon={Heart}
      title="No donations yet"
      description="You haven't made any donations yet. Explore campaigns and support causes you care about."
      action={{
        label: "Explore campaigns",
        onClick: () => window.location.href = "/campaigns",
      }}
    />
  );
}

export function EmptyStatePosts({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No posts yet"
      description="Be the first to share something with the community. Start a conversation or share an update."
      action={onCreatePost ? {
        label: "Create post",
        onClick: onCreatePost,
      } : undefined}
    />
  );
}

export function EmptyStateFollowers() {
  return (
    <EmptyState
      icon={Users}
      title="No followers yet"
      description="When people follow you, they'll appear here. Keep creating great content to grow your community."
      action={{
        label: "Share your profile",
        onClick: () => {
          if (typeof window !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            alert("Profile link copied!");
          }
        },
      }}
    />
  );
}

export function EmptyStateFollowing() {
  return (
    <EmptyState
      icon={Users}
      title="Not following anyone"
      description="Discover and follow creators to see their campaigns and updates in your feed."
      action={{
        label: "Explore community",
        onClick: () => window.location.href = "/community",
      }}
    />
  );
}

export function EmptyStateNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="No notifications"
      description="You're all caught up! When you have new notifications, they'll appear here."
    />
  );
}

export function EmptyStateProposals({ onCreateProposal }: { onCreateProposal?: () => void }) {
  return (
    <EmptyState
      icon={Vote}
      title="No proposals yet"
      description="There are no governance proposals at the moment. Stake FBT tokens to create proposals and vote."
      action={onCreateProposal ? {
        label: "Create proposal",
        onClick: onCreateProposal,
      } : undefined}
      secondaryAction={{
        label: "Learn about governance",
        onClick: () => window.location.href = "/dao",
      }}
    />
  );
}

export function EmptyStateStaking() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No staking positions"
      description="You don't have any active staking positions. Start staking to earn yield and support campaigns."
      action={{
        label: "Explore staking pools",
        onClick: () => window.location.href = "/staking",
      }}
    />
  );
}

export function EmptyStateTransactions() {
  return (
    <EmptyState
      icon={Wallet}
      title="No transactions"
      description="You haven't made any transactions yet. Your transaction history will appear here."
      action={{
        label: "Make a donation",
        onClick: () => window.location.href = "/campaigns",
      }}
    />
  );
}

export function EmptyStateComments() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No comments yet"
      description="Be the first to share your thoughts and start a conversation."
    />
  );
}

export function EmptyStateUpdates({ onCreateUpdate }: { onCreateUpdate?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No updates yet"
      description="Campaign updates haven't been posted yet. Check back later for news from the creator."
      action={onCreateUpdate ? {
        label: "Post update",
        onClick: onCreateUpdate,
      } : undefined}
    />
  );
}

export function EmptyStateMessages() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No messages"
      description="You don't have any messages yet. Start a conversation with someone from the community."
      action={{
        label: "Explore community",
        onClick: () => window.location.href = "/community",
      }}
    />
  );
}

export function EmptyStateNFTs() {
  return (
    <EmptyState
      icon={Image}
      title="No NFTs"
      description="You don't own any NFTs yet. Receipt tokens from donations will appear here."
      action={{
        label: "Make a donation",
        onClick: () => window.location.href = "/campaigns",
      }}
    />
  );
}

export function EmptyStateLeaderboard() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No rankings yet"
      description="Leaderboard data is being calculated. Check back soon to see top contributors."
    />
  );
}

export function EmptyStateFavorites() {
  return (
    <EmptyState
      icon={Heart}
      title="No favorites"
      description="You haven't favorited any campaigns yet. Bookmark campaigns to easily find them later."
      action={{
        label: "Explore campaigns",
        onClick: () => window.location.href = "/campaigns",
      }}
    />
  );
}

export function EmptyStateGeneric({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Nothing to show"
      description={message || "There's no content to display at the moment."}
    />
  );
}

// Compact empty state for smaller containers
export function EmptyStateCompact({
  icon: Icon = Inbox,
  message,
  action,
}: {
  icon?: LucideIcon;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
      <Icon className="w-8 h-8 text-text-tertiary mb-3" />
      <p className="text-sm text-text-secondary mb-4">{message}</p>
      {action && (
        <Button size="sm" onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
