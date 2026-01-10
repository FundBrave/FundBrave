import { Heart, Repeat2, Pin } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

export type IndicatorType = "liked" | "reposted" | "pinned";

export interface PostIndicatorProps {
  /** Type of indicator to display */
  type: IndicatorType;
  /** Custom text (optional - will use default based on type) */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

const indicatorConfig: Record<IndicatorType, { icon: typeof Heart; defaultText: string; colorClass: string }> = {
  liked: {
    icon: Heart,
    defaultText: "You liked this",
    colorClass: "text-pink-500",
  },
  reposted: {
    icon: Repeat2,
    defaultText: "You reposted",
    colorClass: "text-green-500",
  },
  pinned: {
    icon: Pin,
    defaultText: "Pinned post",
    colorClass: "text-primary",
  },
};

/**
 * PostIndicator - Shows status indicators like "You liked this"
 */
export function PostIndicator({ type, text, className }: PostIndicatorProps) {
  const config = indicatorConfig[type];
  const Icon = config.icon;
  const displayText = text ?? config.defaultText;

  return (
    <div className={cn("flex items-center gap-2 mb-2 text-xs", config.colorClass, className)}>
      <Icon className="w-3.5 h-3.5" fill="currentColor" />
      <span>{displayText}</span>
    </div>
  );
}

export default PostIndicator;
