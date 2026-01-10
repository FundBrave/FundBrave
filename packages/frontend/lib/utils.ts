import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number for display with K/M suffixes for large numbers
 * @param num - The number to format
 * @param options - Formatting options
 * @returns Formatted string representation
 */
export function formatNumber(
  num: number,
  options: { useLocale?: boolean } = {}
): string {
  const { useLocale = false } = options;

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return useLocale ? num.toLocaleString() : (num / 1000).toFixed(0) + "K";
  }
  return useLocale ? num.toLocaleString() : num.toString();
}

/**
 * Format a date string to a relative time (e.g., "2h", "3d", "Just now")
 * @param dateString - ISO date string
 * @param style - "short" for "2h" or "long" for "2h ago"
 */
export function formatRelativeTime(
  dateString: string,
  style: "short" | "long" = "short"
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return style === "short" ? "now" : "Just now";
  }
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return style === "short" ? `${mins}m` : `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return style === "short" ? `${hours}h` : `${hours}h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return style === "short" ? `${days}d` : `${days}d ago`;
  }
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return style === "short" ? `${weeks}w` : `${weeks}w ago`;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format compact number (e.g., 1234 -> "1.2K", 1234567 -> "1.2M")
 * Preserves one decimal place for precision
 * @param num - Number to format
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}
