"use client";

import { useState } from "react";
import { CalendarIcon, Share2 } from "@/app/components/ui/icons";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import ShareCampaignModal from "@/app/components/ui/ShareCampaignModal";

interface CampaignData {
  id: string;
  title: string;
  url?: string;
  endDate?: Date;
  description?: string;
}

interface CampaignStatsCardProps {
  amountRaised: number;
  targetAmount: number;
  supportersCount: number;
  daysLeft: number;
  campaign: CampaignData;
  isFullyFunded?: boolean;
}

export default function CampaignStatsCard({
  amountRaised,
  targetAmount,
  supportersCount,
  daysLeft,
  campaign,
  isFullyFunded = false,
}: CampaignStatsCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const percentage = Math.min(
    Math.round((amountRaised / targetAmount) * 100),
    100
  );

  // Calculate circle circumference for SVG stroke-dasharray
  // Radius = 70 (150px width / 2 - stroke width)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const campaignUrl =
    campaign.url || `https://fundbrave.com/campaigns/${campaign.id}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        {/* Progress Circle - Responsive sizing */}
        <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] flex items-center justify-center">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              stroke="#2A2A35"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress Circle */}
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex items-center justify-center inset-0">
            <span className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-family-gilgan)]">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Stats Text */}
        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-foreground font-[family-name:var(--font-family-gilgan)] tracking-wider">
            {amountRaised.toLocaleString()} USD
          </h3>
          <div className="text-sm text-text-secondary font-medium">
            <p className="mb-1">
              Raised of{" "}
              <span className="font-bold text-foreground">
                {targetAmount.toLocaleString()} USD
              </span>{" "}
              target by
            </p>
            <p>
              <span className="font-bold text-foreground">
                {supportersCount.toLocaleString()}
              </span>{" "}
              supporters
            </p>
          </div>
          <p className="text-xs text-purple-400 font-semibold pt-3 uppercase tracking-wide">
            Campaign ending in {daysLeft} weeks
          </p>
        </div>

        {/* Action Buttons - Matching reference design */}
        {!isFullyFunded ? (
          <div className="flex flex-col gap-3 sm:gap-4 w-full">
            {/* Donate Now - Primary gradient button */}
            <Button asChild variant="primary" size="lg" fullWidth>
              <Link href={`/campaigns/${campaign.id}/donate`}>Donate Now</Link>
            </Button>
            {/* Share - Outline button with icon */}
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => setIsShareModalOpen(true)}
              className="gap-2"
            >
              <Share2 size={18} />
              Share
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4 w-full">
            {/* Fully Funded Badge */}
            <div className="bg-success/10 border border-success/30 rounded-lg px-4 py-3 text-center">
              <p className="text-success font-bold text-base mb-1">
                ✅ Goal Reached!
              </p>
              <p className="text-text-secondary text-sm">
                This campaign is fully funded
              </p>
            </div>
            {/* Share button still available */}
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => setIsShareModalOpen(true)}
              className="gap-2"
            >
              <Share2 size={18} />
              Share
            </Button>
          </div>
        )}
      </div>

      {/* Reminder Section */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 py-4 sm:py-6 border-t border-border-subtle">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-overlay flex items-center justify-center mb-1 sm:mb-2">
          <CalendarIcon className="text-purple-400" size={18} />
        </div>
        <p className="text-text-secondary text-sm">Can&apos;t donate right now?</p>
        <button className="text-purple-400 text-sm hover:text-purple-300 underline underline-offset-2 transition-colors">
          Set up a reminder
        </button>
      </div>

      {/* Share Modal */}
      <ShareCampaignModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        campaignUrl={campaignUrl}
        campaignTitle={campaign.title}
      />
    </div>
  );
}
