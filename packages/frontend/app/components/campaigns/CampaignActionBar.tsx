"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import Link from "next/link";
import { Share2, Bell, CalendarIcon } from "@/app/components/ui/icons";
import ShareCampaignModal from "@/app/components/ui/ShareCampaignModal";
import AddReminderModal from "@/app/components/ui/AddReminderModal";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

interface CampaignData {
  id: string;
  title: string;
  url?: string;
  endDate?: Date;
  description?: string;
}

interface CampaignActionBarProps {
  /** Campaign data for sharing and reminders */
  campaign: CampaignData;
  /**
   * Visual variant:
   * - "buttons": Full-width buttons with text (for campaign detail page)
   * - "icons": Icon-only buttons (for cards)
   * - "compact": Small text links (for profile donations)
   */
  variant?: "buttons" | "icons" | "compact";
  /** Whether to show the donate button */
  showDonate?: boolean;
  /** Whether to show the stake button */
  showStake?: boolean;
  /** Additional class names */
  className?: string;
  /** Callback when share is completed */
  onShare?: (network: string) => void;
  /** Callback when reminder is set */
  onReminderSet?: (provider: string) => void;
}

/**
 * CampaignActionBar - Reusable component for share and reminder actions
 * Handles modal state internally for maximum reusability
 */
export default function CampaignActionBar({
  campaign,
  variant = "buttons",
  showDonate = false,
  showStake = false,
  className,
  onShare,
  onReminderSet,
}: CampaignActionBarProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // GSAP refs for icon animations
  const shareRef = useRef<SVGSVGElement>(null);
  const bellRef = useRef<SVGSVGElement>(null);
  const calendarRef = useRef<SVGSVGElement>(null);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf([shareRef.current, bellRef.current, calendarRef.current]);
    };
  }, []);

  // Share icon bounce animation
  const animateShare = useCallback(() => {
    if (!shareRef.current) return;
    gsap.timeline()
      .to(shareRef.current, { y: -3, duration: 0.15, ease: "power2.out" })
      .to(shareRef.current, { y: 0, duration: 0.3, ease: "bounce.out" });
  }, []);

  // Bell icon ring/shake animation
  const animateBell = useCallback(() => {
    if (!bellRef.current) return;
    gsap.to(bellRef.current, {
      rotation: 15,
      duration: 0.1,
      yoyo: true,
      repeat: 5,
      ease: "power1.inOut",
      onComplete: () => {
        gsap.set(bellRef.current, { rotation: 0 });
      },
    });
  }, []);

  // Calendar icon bounce animation
  const animateCalendar = useCallback(() => {
    if (!calendarRef.current) return;
    gsap.timeline()
      .to(calendarRef.current, { scale: 1.2, duration: 0.15, ease: "power2.out" })
      .to(calendarRef.current, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" });
  }, []);

  const campaignUrl =
    campaign.url || `https://fundbrave.com/campaigns/${campaign.id}`;
  const campaignEndDate = campaign.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days from now

  const handleShare = (network: string) => {
    onShare?.(network);
  };

  const handleReminderSet = (provider: string) => {
    onReminderSet?.(provider);
  };

  const handleShareClick = () => {
    animateShare();
    setIsShareModalOpen(true);
  };

  const handleReminderClick = () => {
    animateBell();
    setIsReminderModalOpen(true);
  };

  const handleCalendarClick = () => {
    animateCalendar();
    setIsReminderModalOpen(true);
  };

  // Render based on variant
  if (variant === "icons") {
    return (
      <>
        <div className={cn("flex items-center gap-2", className)}>
          <button
            onClick={handleShareClick}
            className="p-2 rounded-full text-white/50 hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Share campaign"
            title="Share"
          >
            <Share2 ref={shareRef} size={18} />
          </button>
          <button
            onClick={handleReminderClick}
            className="p-2 rounded-full text-white/50 hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Set reminder"
            title="Set reminder"
          >
            <Bell ref={bellRef} size={18} />
          </button>
        </div>

        {/* Modals */}
        <ShareCampaignModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          campaignUrl={campaignUrl}
          campaignTitle={campaign.title}
          onShare={handleShare}
        />
        <AddReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          campaignTitle={campaign.title}
          campaignEndDate={campaignEndDate}
          campaignUrl={campaignUrl}
          campaignDescription={campaign.description}
          onReminderSet={handleReminderSet}
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <div
          className={cn(
            "flex items-center gap-4 text-sm text-white/50",
            className
          )}
        >
          <button
            onClick={handleShareClick}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Share2 ref={shareRef} size={14} />
            <span>Share</span>
          </button>
          <button
            onClick={handleCalendarClick}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <CalendarIcon ref={calendarRef} size={14} />
            <span>Remind</span>
          </button>
        </div>

        {/* Modals */}
        <ShareCampaignModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          campaignUrl={campaignUrl}
          campaignTitle={campaign.title}
          onShare={handleShare}
        />
        <AddReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          campaignTitle={campaign.title}
          campaignEndDate={campaignEndDate}
          campaignUrl={campaignUrl}
          campaignDescription={campaign.description}
          onReminderSet={handleReminderSet}
        />
      </>
    );
  }

  // Default: buttons variant - Donate + Stake + Share
  return (
    <>
      <div
        className={cn(
          "flex flex-row items-center gap-4 w-full",
          className
        )}
      >
        {showDonate && (
          <Button asChild variant="primary" size="lg" className="flex-1">
            <Link href={`/campaigns/${campaign.id}/donate`}>Donate</Link>
          </Button>
        )}
        {showStake && (
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link href={`/campaigns/${campaign.id}/stake`}>Stake</Link>
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          onClick={handleShareClick}
          className="flex-1 gap-2"
        >
          <Share2 ref={shareRef} size={18} />
          Share
        </Button>
      </div>

      {/* Modals */}
      <ShareCampaignModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        campaignUrl={campaignUrl}
        campaignTitle={campaign.title}
        onShare={handleShare}
      />
      <AddReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        campaignTitle={campaign.title}
        campaignEndDate={campaignEndDate}
        campaignUrl={campaignUrl}
        campaignDescription={campaign.description}
        onReminderSet={handleReminderSet}
      />
    </>
  );
}
