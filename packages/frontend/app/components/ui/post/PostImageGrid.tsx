"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PostImage } from "@/app/types/post";

export interface PostImageGridProps {
  /** Array of images to display */
  images: PostImage[];
  /** Callback when an image is clicked */
  onImageClick?: (index: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PostImageGrid - Displays single image or responsive multi-image grid
 * Supports 1-4+ images with overflow indicator
 */
export function PostImageGrid({ images, onImageClick, className }: PostImageGridProps) {
  if (!images || images.length === 0) return null;

  const displayImages = images.slice(0, 4);
  const hasMore = images.length > 4;

  return (
    <div
      className={cn(
        "mt-3 grid gap-2 rounded-2xl overflow-hidden",
        images.length === 1 && "grid-cols-1",
        images.length === 2 && "grid-cols-2",
        images.length >= 3 && "grid-cols-2",
        className
      )}
    >
      {displayImages.map((image, index) => (
        <div
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            onImageClick?.(index);
          }}
          className={cn(
            "relative overflow-hidden cursor-pointer",
            images.length === 1 && "aspect-video",
            images.length === 2 && "aspect-[4/3]",
            images.length >= 3 && "aspect-square",
            "border border-border-subtle"
          )}
        >
          <Image
            src={image.src}
            alt={image.alt || `Post image ${index + 1}`}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
          {/* Overlay for 4th+ images */}
          {index === 3 && hasMore && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-2xl font-bold text-white">
                +{images.length - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PostImageGrid;
