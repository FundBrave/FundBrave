"use client";

import CampaignCard from "@/app/components/campaigns/CampaignCard";
import { CampaignActionBar } from "@/app/components/campaigns";

interface Campaign {
  id: string;
  title: string;
  imageUrl: string;
  donorsCount: number;
  amountRaised: number;
  targetAmount: number;
  currency?: string;
  endDate?: Date;
}

interface CampaignCardWithActionsProps {
  campaign: Campaign;
}

/**
 * CampaignCardWithActions - Campaign card with share/remind actions
 */
export function CampaignCardWithActions({ campaign }: CampaignCardWithActionsProps) {
  return (
    <div className="flex flex-col">
      <CampaignCard
        id={campaign.id}
        title={campaign.title}
        imageUrl={campaign.imageUrl}
        donorsCount={campaign.donorsCount}
        amountRaised={campaign.amountRaised}
        targetAmount={campaign.targetAmount}
        currency={campaign.currency}
      />
      {/* Share/Remind Actions */}
      <div className="px-1 pb-2">
        <CampaignActionBar
          campaign={{
            id: campaign.id,
            title: campaign.title,
            url: `https://fundbrave.com/campaigns/${campaign.id}`,
            endDate: campaign.endDate,
          }}
          variant="compact"
        />
      </div>
    </div>
  );
}

interface CampaignsTabProps {
  campaigns: Campaign[];
}

/**
 * CampaignsTab - Grid of user's campaigns with share actions
 */
export default function CampaignsTab({ campaigns }: CampaignsTabProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>No campaigns yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {campaigns.map((campaign) => (
        <CampaignCardWithActions key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
