"use client";

import Link from "next/link";
import { formatPostDate } from "@/lib/utils";
import type { Donation } from "@/app/generated/graphql";

interface DonationCardProps {
  donation: Donation;
}

function DonationCard({ donation }: DonationCardProps) {
  const image = donation.fundraiser.images?.[0];
  const amountUSD = parseFloat(donation.amountUSD || "0");
  const displayAmount = amountUSD > 0
    ? `$${amountUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${donation.amount} ${donation.token}`;

  return (
    <div className="bg-surface-sunken/30 rounded-xl p-4 border border-border-subtle">
      <div className="flex gap-4">
        {image ? (
          <img
            src={image}
            alt={donation.fundraiser.name}
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-2xl">💰</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link
            href={`/campaigns/${donation.fundraiser.id}`}
            className="text-foreground font-semibold hover:text-primary transition-colors line-clamp-2"
          >
            {donation.fundraiser.name}
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-primary font-bold text-lg">{displayAmount}</span>
            {donation.token && donation.token !== "USD" && (
              <span className="text-text-tertiary text-sm">
                {donation.amount} {donation.token}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-text-secondary text-xs">
            <span>{formatPostDate(donation.createdAt)}</span>
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
    </div>
  );
}

interface DonationsTabProps {
  donations: Donation[];
  isLoading?: boolean;
}

export default function DonationsTab({ donations, isLoading }: DonationsTabProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-r-transparent"></div>
        <p className="text-text-secondary mt-2">Loading donations...</p>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p className="text-lg font-medium">No donations yet</p>
        <p className="text-sm mt-1 text-text-tertiary">Donations to campaigns will appear here.</p>
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
