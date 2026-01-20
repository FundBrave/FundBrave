"use client";

import { useParams, useRouter } from "next/navigation";
import { getCampaignById } from "../data";
import CampaignHeader from "@/app/components/campaigns/view/CampaignHeader";
import CampaignStatsCard from "@/app/components/campaigns/view/CampaignStatsCard";
import CampaignStory from "@/app/components/campaigns/view/CampaignStory";
import CampaignComments from "@/app/components/campaigns/view/CampaignComments";
import CampaignUpdates from "@/app/components/campaigns/view/CampaignUpdates";
import { CampaignActionBar } from "@/app/components/campaigns";
import { BackHeader } from "@/app/components/common/BackHeader";
import { ArrowLeft, Loader2 } from "@/app/components/ui/icons";
import Link from "next/link";
import Image from "next/image";
import { useCampaign } from "@/app/hooks/useCampaigns";
import { USDC_DECIMALS } from "@/app/lib/contracts/config";
import { Button } from "@/app/components/ui/button";

export default function CampaignViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Fetch real campaign data from API
  const { campaign: apiCampaign, isLoading, error } = useCampaign(id);

  // Fallback to mock data if API fails
  const mockCampaign = getCampaignById(id);
  const campaign = apiCampaign || mockCampaign;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-text-secondary">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <Link
            href="/campaigns"
            className="text-primary-400 hover:text-primary-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  // Parse API campaign data
  const amountRaised = apiCampaign
    ? parseFloat(apiCampaign.amountRaised) / Math.pow(10, USDC_DECIMALS)
    : campaign.amountRaised;
  const targetAmount = apiCampaign
    ? parseFloat(apiCampaign.goal) / Math.pow(10, USDC_DECIMALS)
    : campaign.targetAmount;
  const daysLeft = apiCampaign && apiCampaign.deadline
    ? Math.max(0, Math.ceil((new Date(apiCampaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : campaign.daysLeft;

  // Campaign data for action bar
  const campaignData = {
    id: campaign.id,
    title: apiCampaign?.title || campaign.title,
    url: `https://fundbrave.com/campaigns/${campaign.id}`,
    endDate: apiCampaign?.deadline || campaign.endDate,
    description: apiCampaign?.description || campaign.story,
    contractAddress: apiCampaign?.contractAddress,
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-[family-name:var(--font-family-montserrat)]">
      <BackHeader title="Campaign" fallbackHref="/campaigns" />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            {/* Header Section (Title, Image, Categories) */}
            <CampaignHeader
              title={campaign.title}
              imageUrl={campaign.imageUrl}
              categories={campaign.categories}
            />

            {/* Creator Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <h3 className="text-base sm:text-lg font-bold text-foreground font-[family-name:var(--font-family-gilgan)]">
                Campaign Creator
              </h3>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary-500 to-soft-purple-500 p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-background relative">
                    <Image
                      src={campaign.creator.avatarUrl}
                      alt={campaign.creator.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground text-base">
                      {campaign.creator.name}
                    </span>
                    <button className="text-xs font-bold text-primary-400 hover:text-primary-300 uppercase tracking-wide">
                      Follow
                    </button>
                  </div>
                  <span className="text-text-tertiary text-sm">
                    {campaign.creator.handle}
                  </span>
                </div>
              </div>
            </div>

            {/* Story Section */}
            <CampaignStory story={campaign.story} />

            {/* Action Buttons (Left Column) - Using CampaignActionBar */}
            <div className="pt-2 pb-6 sm:pb-8 border-b border-border-subtle">
              <CampaignActionBar
                campaign={campaignData}
                variant="buttons"
                showDonate={true}
              />
            </div>

            {/* Comments Section */}
            <CampaignComments comments={campaign.comments} />

            {/* Updates Section */}
            <CampaignUpdates updates={campaign.updates} />
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="lg:col-span-4 lg:pl-4">
            <div className="sticky top-6 sm:top-10 space-y-4">
              <CampaignStatsCard
                amountRaised={amountRaised}
                targetAmount={targetAmount}
                supportersCount={apiCampaign?.donorsCount || campaign.supportersCount}
                daysLeft={daysLeft}
                campaign={campaignData}
              />

              {/* Donate & Stake Buttons */}
              {apiCampaign && (
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push(`/campaigns/${id}/donate`)}
                    className="w-full py-3 bg-primary hover:bg-primary/90"
                  >
                    Donate Now
                  </Button>
                  <Button
                    onClick={() => router.push(`/campaigns/${id}/stake`)}
                    variant="outline"
                    className="w-full py-3"
                  >
                    Stake to Earn Yield
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
