import { cn } from "@/lib/utils";

export interface VerifiedBadgeProps {
  /** Size of the badge */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-[18px] h-[18px]",
  lg: "w-5 h-5",
};

/**
 * VerifiedBadge - Blue checkmark for verified users
 */
export function VerifiedBadge({ size = "md", className }: VerifiedBadgeProps) {
  return (
    <svg
      className={cn("text-primary flex-shrink-0", sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Verified"
      role="img"
    >
      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.04 4.3l-3.71-3.71 1.41-1.41 2.3 2.3 5.3-5.3 1.41 1.41-6.71 6.71z" />
    </svg>
  );
}

export default VerifiedBadge;
