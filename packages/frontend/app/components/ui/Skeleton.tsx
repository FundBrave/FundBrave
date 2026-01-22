import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  animation?: "pulse" | "wave" | "none";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  animation = "pulse",
  width,
  height,
}: SkeletonProps) {
  const baseClasses = "bg-surface-elevated";

  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-lg",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "relative overflow-hidden after:absolute after:inset-0 after:translate-x-[-100%] after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
    none: "",
  };

  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === "number" ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(i === lines - 1 && "w-3/4")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6 space-y-4", className)}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton variant="rounded" className="w-full h-48" />
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <Skeleton variant="rounded" className="w-20 h-8" />
        <Skeleton variant="rounded" className="w-20 h-8" />
      </div>
    </div>
  );
}

export function SkeletonCampaignCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl overflow-hidden", className)}>
      <Skeleton variant="rectangular" className="w-full h-48" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-8 h-8" />
          <Skeleton variant="text" className="w-24 h-3" />
        </div>
        <Skeleton variant="text" className="w-full h-6" />
        <SkeletonText lines={2} />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton variant="text" className="w-20 h-4" />
            <Skeleton variant="text" className="w-16 h-4" />
          </div>
          <Skeleton variant="rounded" className="w-full h-2" />
        </div>
        <div className="flex gap-4">
          <Skeleton variant="text" className="w-24 h-4" />
          <Skeleton variant="text" className="w-24 h-4" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPostCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6 space-y-4", className)}>
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-32 h-4" />
          <Skeleton variant="text" className="w-20 h-3" />
        </div>
      </div>
      <SkeletonText lines={4} />
      <div className="flex gap-6">
        <Skeleton variant="rounded" className="w-16 h-8" />
        <Skeleton variant="rounded" className="w-16 h-8" />
        <Skeleton variant="rounded" className="w-16 h-8" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 px-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 px-4 py-3 bg-surface-elevated rounded-lg">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" className="flex-1 h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-surface-elevated rounded-lg">
          <Skeleton variant="circular" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <Skeleton variant="rounded" className="w-20 h-8" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return <Skeleton variant="circular" className={sizeClasses[size]} />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton variant="rounded" className={cn("w-24 h-10", className)} />;
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <Skeleton variant="text" className="w-1/3 h-6" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            className="flex-1"
            style={{ height: `${Math.random() * 100 + 50}px` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="w-8 h-3" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats({ columns = 4 }: { columns?: number }) {
  return (
    <div className={cn("grid gap-4", {
      "grid-cols-1 md:grid-cols-2": columns === 2,
      "grid-cols-1 md:grid-cols-3": columns === 3,
      "grid-cols-1 md:grid-cols-2 lg:grid-cols-4": columns === 4,
    })}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="bg-surface-elevated border border-border-subtle rounded-xl p-6 space-y-3">
          <Skeleton variant="text" className="w-20 h-4" />
          <Skeleton variant="text" className="w-full h-8" />
          <Skeleton variant="text" className="w-24 h-3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-start gap-6">
        <Skeleton variant="circular" className="w-24 h-24" />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" className="w-48 h-8" />
          <Skeleton variant="text" className="w-64 h-4" />
          <div className="flex gap-4">
            <Skeleton variant="text" className="w-20 h-4" />
            <Skeleton variant="text" className="w-20 h-4" />
            <Skeleton variant="text" className="w-20 h-4" />
          </div>
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}
