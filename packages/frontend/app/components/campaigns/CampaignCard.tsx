"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  Sparkles,
  Star,
  Heart,
  GraduationCap,
  Leaf,
  AlertTriangle,
  Cat,
  Users,
} from "@/app/components/ui/icons";
import { EASE, DURATION } from "@/lib/constants/animation";

// ============================================================================
// Types
// ============================================================================

export type CampaignStatus =
  | "trending"
  | "verified"
  | "endingSoon"
  | "new"
  | "featured";

export type CampaignCategory =
  | "health-medical"
  | "education"
  | "environment"
  | "emergency"
  | "animal"
  | "community";

export interface CampaignCardProps {
  id: string;
  title: string;
  imageUrl: string;
  donorsCount: number;
  amountRaised: number;
  targetAmount: number;
  currency?: string;
  status?: CampaignStatus[];
  category?: CampaignCategory;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// CampaignBadge - Status badges with CVA variants
// ============================================================================

const badgeVariants = cva(
  // Base styles for all badges
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
  {
    variants: {
      type: {
        trending:
          "bg-orange-500/20 text-orange-300 border border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.3)]",
        verified:
          "bg-primary/20 text-purple-300 border border-primary/30 shadow-[0_0_12px_rgba(69,12,240,0.3)]",
        endingSoon:
          "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 animate-pulse",
        new: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        featured:
          "bg-gradient-to-r from-primary/30 to-purple-500/30 text-purple-200 border border-purple-400/30 shadow-[0_0_16px_rgba(147,51,234,0.4)]",
      },
    },
    defaultVariants: {
      type: "trending",
    },
  }
);

interface CampaignBadgeProps extends VariantProps<typeof badgeVariants> {
  type: CampaignStatus;
}

const badgeConfig: Record<
  CampaignStatus,
  { icon: React.ElementType; label: string }
> = {
  trending: { icon: TrendingUp, label: "Trending" },
  verified: { icon: Shield, label: "Verified" },
  endingSoon: { icon: Clock, label: "Ending Soon" },
  new: { icon: Sparkles, label: "New" },
  featured: { icon: Star, label: "Featured" },
};

function CampaignBadge({ type }: CampaignBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <span className={badgeVariants({ type })}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  );
}

// ============================================================================
// CategoryTag - Campaign category indicator
// ============================================================================

const categoryConfig: Record<
  CampaignCategory,
  { icon: React.ElementType; label: string }
> = {
  "health-medical": { icon: Heart, label: "Health & Medical" },
  education: { icon: GraduationCap, label: "Education" },
  environment: { icon: Leaf, label: "Environment" },
  emergency: { icon: AlertTriangle, label: "Emergency" },
  animal: { icon: Cat, label: "Animals" },
  community: { icon: Users, label: "Community" },
};

interface CategoryTagProps {
  category: CampaignCategory;
}

function CategoryTag({ category }: CategoryTagProps) {
  const config = categoryConfig[category];

  // If category not found in config, don't render anything
  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-text-secondary border border-border-default">
      <Icon className="w-3 h-3" />
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  );
}

// ============================================================================
// Utilities
// ============================================================================

/** Format numbers with locale-appropriate separators (e.g., 1,234,567) */
const formatNumber = (num: number) => num.toLocaleString();

// ============================================================================
// CampaignCard - Main component
// ============================================================================

/**
 * CampaignCard - A card component displaying campaign information
 * Shows campaign image, title, donation progress, and a link to view the campaign
 *
 * Animation Architecture:
 * - GSAP: Card hover lift/scale, image zoom, progress bar entry animation
 * - CSS: Progress bar shimmer (infinite), CTA arrow slide
 *
 * Property Ownership:
 * - GSAP owns: card transform (y, scale), card boxShadow, image scale, progress bar width
 * - CSS owns: progress bar shimmer overlay (::after), arrow opacity/translateX transitions
 */
export default function CampaignCard({
  id,
  title,
  imageUrl,
  donorsCount,
  amountRaised,
  targetAmount,
  currency = "USD",
  status,
  category,
  isLoading,
  className,
}: CampaignCardProps) {
  // Return skeleton if loading
  if (isLoading) {
    return <CampaignCardSkeleton />;
  }

  // Calculate progress percentage for the progress bar
  const progress = Math.min((amountRaised / targetAmount) * 100, 100);

  // GSAP refs
  const cardRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Convert EASE arrays to GSAP-compatible cubic-bezier strings
  const easeSnappy = `cubic-bezier(${EASE.snappy.join(",")})`;
  const easeFluid = `cubic-bezier(${EASE.fluid.join(",")})`;

  // GSAP animations with useGSAP hook (proper scoping and cleanup)
  useGSAP(
    (context, contextSafe) => {
      // Guard: contextSafe should always be available, but check for safety
      if (!contextSafe) return;

      // Animate progress bar on mount
      if (progressRef.current) {
        gsap.fromTo(
          progressRef.current,
          { width: 0 },
          {
            width: `${progress}%`,
            duration: 1,
            ease: "power2.out",
            delay: 0.3,
          }
        );
      }

      // Create contextSafe hover handlers for event-triggered animations
      const handleMouseEnter = contextSafe(() => {
        // Card lift and glow - enhanced hover effect
        gsap.to(cardRef.current, {
          y: -6,
          scale: 1.01,
          boxShadow:
            "0 20px 40px rgba(69, 12, 240, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)",
          duration: DURATION.fast,
          ease: easeSnappy,
        });

        // Image zoom effect
        if (imageRef.current) {
          gsap.to(imageRef.current, {
            scale: 1.05,
            duration: DURATION.medium,
            ease: easeFluid,
          });
        }
      });

      const handleMouseLeave = contextSafe(() => {
        // Reset card to default state
        gsap.to(cardRef.current, {
          y: 0,
          scale: 1,
          boxShadow: "none",
          duration: DURATION.fast,
          ease: easeSnappy,
        });

        // Reset image to default scale (faster reset)
        if (imageRef.current) {
          gsap.to(imageRef.current, {
            scale: 1,
            duration: DURATION.fast,
            ease: easeSnappy,
          });
        }
      });

      // Attach event listeners
      const card = cardRef.current;
      if (card) {
        card.addEventListener("mouseenter", handleMouseEnter);
        card.addEventListener("mouseleave", handleMouseLeave);
      }

      // Cleanup listeners on unmount (useGSAP handles tween cleanup)
      return () => {
        if (card) {
          card.removeEventListener("mouseenter", handleMouseEnter);
          card.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
    },
    { scope: cardRef, dependencies: [progress] }
  );

  return (
    <article
      ref={cardRef}
      aria-labelledby={`campaign-title-${id}`}
      className={cn(
        "bg-background rounded-xl overflow-hidden w-full border border-border-default group will-change-transform",
        className
      )}
    >
      {/* Image Container - Responsive height based on screen size */}
      <div className="h-[200px] sm:h-[220px] md:h-[240px] lg:h-[255px] w-full relative overflow-hidden bg-muted">
        {/* Status Badges - positioned in top-left corner */}
        {status && status.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {status.slice(0, 2).map((s) => (
              <CampaignBadge key={s} type={s} />
            ))}
          </div>
        )}

        <img
          ref={imageRef}
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover will-change-transform"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 items-start p-4 sm:p-5">
        <h3
          id={`campaign-title-${id}`}
          className="text-foreground text-[20px] font-semibold leading-[30px] tracking-[0.48px] font-['Poppins']"
        >
          {title}
        </h3>

        {/* Category Tag */}
        {category && <CategoryTag category={category} />}

        <div className="w-full flex flex-col gap-3">
          <p className="text-text-secondary text-[14px] leading-[21px] tracking-[0.56px] font-['Roboto']">
            {formatNumber(donorsCount)} members donated
          </p>

          {/* Progress Bar with Shimmer - shimmer handled by global CSS */}
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(progress)}% funded`}
            className="w-full h-[10px] bg-border-default rounded-[16px] relative overflow-hidden"
          >
            <div
              ref={progressRef}
              className="absolute top-0 left-0 h-full rounded-[16px] campaign-progress-shimmer"
              style={{
                width: 0,
                backgroundImage:
                  "linear-gradient(150.051deg, rgb(69, 12, 240) 0%, rgb(205, 130, 255) 100%)",
              }}
            />
          </div>

          <p className="text-foreground/80 text-[14px] leading-[21px] tracking-[0.56px] font-['Roboto']">
            <span className="font-bold">
              {formatNumber(amountRaised)} {currency}
            </span>{" "}
            raised of {formatNumber(targetAmount)} {currency} target
          </p>
        </div>

        {/* View Campaign Link with Arrow Animation - CSS transitions */}
        <Link href={`/campaigns/${id}`} className="mt-1 cursor-pointer group/link min-h-[44px] flex items-center active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-1">
            <span
              className="text-transparent bg-clip-text font-semibold text-[16px] tracking-[0.64px] font-['Montserrat']"
              style={{
                backgroundImage:
                  "linear-gradient(125.106deg, rgb(69, 12, 240) 0%, rgb(205, 130, 255) 100%)",
              }}
            >
              View Campaign
            </span>
            <ArrowRight
              className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-200 group-hover/link:opacity-100 group-hover/link:translate-x-0 group-active/link:opacity-100 group-active/link:translate-x-0"
              style={{ color: "rgb(69, 12, 240)" }}
            />
          </div>
        </Link>
      </div>
    </article>
  );
}

// ============================================================================
// CampaignCardSkeleton - YouTube-style skeleton loading state
// ============================================================================

/**
 * CampaignCardSkeleton - YouTube-style skeleton loading state
 *
 * Features a sweeping wave animation across the entire card
 * using a ::before pseudo-element with gradient overlay.
 * Animation is defined in globals.css for better performance.
 */
export function CampaignCardSkeleton() {
  return (
    <article
      aria-label="Loading campaign"
      aria-busy="true"
      className="bg-background rounded-xl overflow-hidden w-full border border-border-default relative campaign-skeleton"
    >
      {/* Image Placeholder */}
      <div className="h-[200px] sm:h-[220px] md:h-[240px] lg:h-[255px] w-full bg-muted" />

      {/* Content Placeholders */}
      <div className="flex flex-col gap-3 items-start p-4 sm:p-5">
        {/* Title placeholder */}
        <div className="h-[30px] w-[80%] bg-muted rounded-md" />

        {/* Category tag placeholder */}
        <div className="h-[22px] w-[100px] bg-muted rounded-md" />

        <div className="w-full flex flex-col gap-3">
          {/* Donors text placeholder */}
          <div className="h-[21px] w-[40%] bg-muted rounded-md" />

          {/* Progress bar placeholder */}
          <div className="w-full h-[10px] bg-muted rounded-[16px]" />

          {/* Amount text placeholder */}
          <div className="h-[21px] w-[70%] bg-muted rounded-md" />
        </div>

        {/* Link placeholder */}
        <div className="h-[24px] w-[120px] bg-muted rounded-md mt-1" />
      </div>
    </article>
  );
}
