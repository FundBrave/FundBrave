import { cn } from "@/lib/utils";

/**
 * PostDetailSkeleton - Loading state for post detail page
 */
export function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-surface animate-pulse">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-30 bg-surface border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="h-6 w-20 bg-surface-sunken rounded" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-surface-sunken rounded-full" />
            <div className="w-8 h-8 bg-surface-sunken rounded-full" />
            <div className="w-8 h-8 bg-surface-sunken rounded-full" />
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Author Info Skeleton */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-surface-sunken flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-sunken rounded w-1/3" />
            <div className="h-3 bg-surface-sunken rounded w-1/4" />
          </div>
        </div>

        {/* Post Content Skeleton */}
        <div className="mb-4 space-y-2">
          <div className="h-4 bg-surface-sunken rounded w-full" />
          <div className="h-4 bg-surface-sunken rounded w-5/6" />
          <div className="h-4 bg-surface-sunken rounded w-4/6" />
        </div>

        {/* Image Skeleton */}
        <div className="mb-4 rounded-xl bg-surface-sunken aspect-video" />

        {/* Action Bar Skeleton */}
        <div className="py-4 border-y border-border-subtle flex items-center gap-8">
          <div className="h-5 w-16 bg-surface-sunken rounded" />
          <div className="h-5 w-16 bg-surface-sunken rounded" />
          <div className="h-5 w-16 bg-surface-sunken rounded" />
          <div className="h-5 w-16 bg-surface-sunken rounded ml-auto" />
        </div>

        {/* Comments Section Skeleton */}
        <div className="mt-6">
          {/* Comment Header Skeleton */}
          <div className="flex items-center justify-between py-4 border-b border-border-subtle">
            <div className="h-6 w-32 bg-surface-sunken rounded" />
            <div className="h-8 w-40 bg-surface-sunken rounded" />
          </div>

          {/* Comment Input Skeleton */}
          <div className="my-6 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-sunken flex-shrink-0" />
            <div className="flex-1 h-12 bg-surface-sunken rounded-lg" />
          </div>

          {/* Comment Skeletons */}
          <div className="space-y-6 py-4">
            {[...Array(3)].map((_, i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * CommentSkeleton - Loading state for individual comment
 */
function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-surface-sunken flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-sunken rounded w-1/4" />
        <div className="h-3 bg-surface-sunken rounded w-full" />
        <div className="h-3 bg-surface-sunken rounded w-3/4" />
        <div className="flex gap-4 mt-2">
          <div className="h-3 bg-surface-sunken rounded w-12" />
          <div className="h-3 bg-surface-sunken rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export default PostDetailSkeleton;
