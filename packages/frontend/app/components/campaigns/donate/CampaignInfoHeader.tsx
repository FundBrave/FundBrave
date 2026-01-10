"use client";

import Image from "next/image";
import { TrendingUp, Shield } from "@/app/components/ui/icons";
import type { CampaignInfoHeaderProps } from "@/types/donation";

/**
 * CampaignInfoHeader - Campaign info section at top of donate page
 * Shows campaign image, title, beneficiary, and progress
 */
export default function CampaignInfoHeader({
  campaign,
  showImpact,
  donationImpact,
  amount,
  formatAmount,
}: CampaignInfoHeaderProps) {
  const progressPercent = Math.min(
    (campaign.amountRaised / campaign.targetAmount) * 100,
    100
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="w-full sm:w-[180px] md:w-[200px] lg:w-[215px] h-[180px] sm:h-[120px] md:h-[130px] lg:h-[143px] rounded-2xl overflow-hidden relative shrink-0 group">
        <Image
          src={campaign.imageUrl}
          alt={campaign.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Donation Impact Indicator */}
        {showImpact && amount > 0 && (
          <div className="absolute inset-0 bg-gradient-to-t from-primary-500/80 to-transparent flex items-end justify-center pb-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-1 text-white text-sm font-semibold drop-shadow-md">
              <TrendingUp className="w-4 h-4" />+{donationImpact.toFixed(1)}% of
              goal
            </div>
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-foreground/80 text-lg leading-6 mb-1">
          You are supporting{" "}
          <span className="font-bold text-foreground">{campaign.title}</span>
        </p>
        <p className="text-foreground/80 text-base leading-6 mb-3">
          Your donation will benefit{" "}
          <span className="font-semibold">{campaign.creator.name}</span>
        </p>
        {/* Mini Progress Bar */}
        <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-soft-purple-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-1">
          {formatAmount(campaign.amountRaised)} /{" "}
          {formatAmount(campaign.targetAmount)} USD raised
        </p>
      </div>
    </div>
  );
}

/**
 * SecurityBadge - Security information badge
 * Displays FundBrave's donation protection message
 */
export function SecurityBadge() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start bg-gradient-to-r from-primary-500/5 to-soft-purple-500/5 rounded-2xl p-4 sm:p-5">
      <div className="w-[48px] sm:w-[58px] h-[48px] sm:h-[58px] rounded-full bg-gradient-to-br from-primary-500/20 to-soft-purple-500/20 flex items-center justify-center shrink-0">
        <Shield className="w-6 sm:w-7 h-6 sm:h-7 text-soft-purple-500" />
      </div>
      <div>
        <h4 className="text-base sm:text-lg font-semibold mb-1">
          FundBrave protects your donation
        </h4>
        <p className="text-text-secondary text-sm leading-6">
          Your donation is safest with cryptocurrency and will get to the
          beneficiary when due.{" "}
          <span className="font-medium text-soft-purple-400 hover:text-soft-purple-300 cursor-pointer transition-colors">
            See our donation policy
          </span>
        </p>
      </div>
    </div>
  );
}
