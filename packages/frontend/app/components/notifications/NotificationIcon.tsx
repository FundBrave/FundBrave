"use client";

import { cn } from "@/lib/utils";
import type { NotificationType } from "./schemas";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Trophy,
  Clock,
  PartyPopper,
  Star,
  Info,
} from "@/app/components/ui/icons";
import { DollarSign, Megaphone, Reply, AtSign, Users } from "lucide-react";

/**
 * Icon configuration for each notification type
 */
const iconConfig: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    bgColor: string;
    iconColor: string;
  }
> = {
  // Donation notifications - green
  donation: {
    icon: DollarSign,
    bgColor: "bg-green-500/10",
    iconColor: "text-green-500",
  },
  donation_received: {
    icon: DollarSign,
    bgColor: "bg-green-500/10",
    iconColor: "text-green-500",
  },

  // Follower notifications - primary purple
  new_follower: {
    icon: UserPlus,
    bgColor: "bg-primary-500/10",
    iconColor: "text-primary-500",
  },
  follow_back: {
    icon: Users,
    bgColor: "bg-primary-500/10",
    iconColor: "text-primary-500",
  },

  // Comment/reply notifications - purple
  comment: {
    icon: MessageCircle,
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  reply: {
    icon: Reply,
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  comment_reply: {
    icon: Reply,
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },

  // Like notifications - pink
  like_post: {
    icon: Heart,
    bgColor: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },
  like_comment: {
    icon: Heart,
    bgColor: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },
  comment_like: {
    icon: Heart,
    bgColor: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },

  // Mention notifications - soft purple
  mention: {
    icon: AtSign,
    bgColor: "bg-soft-purple-500/10",
    iconColor: "text-soft-purple-500",
  },

  // Campaign notifications
  campaign_milestone: {
    icon: Trophy,
    bgColor: "bg-yellow-500/10",
    iconColor: "text-yellow-500",
  },
  milestone: {
    icon: Trophy,
    bgColor: "bg-yellow-500/10",
    iconColor: "text-yellow-500",
  },
  campaign_update: {
    icon: Megaphone,
    bgColor: "bg-soft-purple-500/10",
    iconColor: "text-soft-purple-500",
  },
  campaign_ending: {
    icon: Clock,
    bgColor: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
  campaign_funded: {
    icon: PartyPopper,
    bgColor: "bg-green-500/10",
    iconColor: "text-green-500",
  },

  // System notifications - blue
  system: {
    icon: Info,
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
};

interface NotificationIconProps {
  type: NotificationType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "size-7",
    icon: 14,
  },
  md: {
    container: "size-9",
    icon: 18,
  },
  lg: {
    container: "size-11",
    icon: 22,
  },
};

/**
 * NotificationIcon Component
 *
 * Displays a type-specific icon with appropriate color styling
 * for different notification types.
 */
export function NotificationIcon({
  type,
  size = "md",
  className,
}: NotificationIconProps) {
  const config = iconConfig[type] || iconConfig.system;
  const Icon = config.icon;
  const sizeConfig = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full shrink-0",
        config.bgColor,
        sizeConfig.container,
        className
      )}
    >
      <Icon size={sizeConfig.icon} className={config.iconColor} />
    </div>
  );
}

export default NotificationIcon;
