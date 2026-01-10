"use client";

import Link from "next/link";
import { CampaignActionBar } from "@/app/components/campaigns";
import {
  MockDonation,
  formatRelativeTime,
  formatCurrency,
} from "@/lib/constants/mock-profile-activity";

interface DonationCardProps {
  donation: MockDonation;
}

/**
 * DonationCard - Displays a single donation with campaign info and actions
 */
export function DonationCard({ donation }: DonationCardProps) {
  return (
    <div className="bg-surface-sunken/30 rounded-xl p-4 border-subtle">
      <div className="flex gap-4">
        <img
          src={donation.campaignImage}
          alt={donation.campaignTitle}
          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <Link
            href={`/campaigns/${donation.campaignId}`}
            className="text-foreground font-semibold hover:text-primary transition-colors line-clamp-2"
          >
            {donation.campaignTitle}
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-primary font-bold text-lg">
              {formatCurrency(donation.amount, donation.currency)}
            </span>
            {donation.cryptoType && (
              <span className="text-text-tertiary text-sm">
                {donation.cryptoAmount} {donation.cryptoType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-text-secondary text-xs">
            <span>{formatRelativeTime(donation.donatedAt)}</span>
            {donation.isAnonymous && (
              <>
                <span>•</span>
                <span className="text-purple-400">Anonymous</span>
              </>
            )}
          </div>
        </div>
      </div>
      {donation.message && (
        <p className="text-text-secondary text-sm mt-3 pt-3 border-t border-border-subtle italic">
          &quot;{donation.message}&quot;
        </p>
      )}
      {/* Share/Remind Actions */}
      <div className="mt-3 pt-3 border-t border-border-subtle">
        <CampaignActionBar
          campaign={{
            id: donation.campaignId,
            title: donation.campaignTitle,
            url: `https://fundbrave.com/campaigns/${donation.campaignId}`,
            endDate: donation.campaignEndDate,
          }}
          variant="compact"
        />
      </div>
    </div>
  );
}

interface DonationsTabProps {
  donations: MockDonation[];
}

/**
 * DonationsTab - Grid of donation cards for profile page
 */
export default function DonationsTab({ donations }: DonationsTabProps) {
  if (donations.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>No donations yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {donations.map((donation) => (
        <DonationCard key={donation.id} donation={donation} />
      ))}
    </div>
  );
}
