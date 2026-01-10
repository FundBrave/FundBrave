"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt: string;
  /** Fallback text (usually initials) shown when image fails to load */
  fallback?: string;
  /** Size of the avatar */
  size?: AvatarSize;
  /** Whether to show a gradient border around the avatar */
  showGradientBorder?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: "h-8 w-8", text: "text-xs" },
  md: { container: "h-11 w-11", text: "text-base" },
  lg: { container: "h-12 w-12", text: "text-lg" },
  xl: { container: "h-16 w-16", text: "text-xl" },
};

/**
 * Avatar component for displaying user or community profile images
 * with optional gradient border and fallback to initials
 */
export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  showGradientBorder = false,
  className,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const displayFallback = fallback ?? alt.charAt(0).toUpperCase();
  const { container, text } = sizeClasses[size];

  const handleImageError = () => {
    setImageError(true);
  };

  if (showGradientBorder) {
    return (
      <div
        className={cn("relative flex-shrink-0", container, className)}
        role="img"
        aria-label={alt}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 to-soft-purple-500 p-[2px]">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-background">
            {src && !imageError ? (
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
                onError={handleImageError}
              />
            ) : null}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center font-semibold text-foreground",
                text,
                src && !imageError ? "opacity-0" : "opacity-100"
              )}
            >
              {displayFallback}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex-shrink-0 overflow-hidden rounded-full bg-surface-sunken",
        container,
        className
      )}
      role="img"
      aria-label={alt}
    >
      {src && !imageError ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={handleImageError}
        />
      ) : null}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center font-semibold text-foreground",
          text,
          src && !imageError ? "opacity-0" : "opacity-100"
        )}
      >
        {displayFallback}
      </div>
    </div>
  );
}

export default Avatar;
