"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { getCampaignById } from "../data";
import CampaignHeader from "@/app/components/campaigns/view/CampaignHeader";
import CampaignStatsCard from "@/app/components/campaigns/view/CampaignStatsCard";
import CampaignStory from "@/app/components/campaigns/view/CampaignStory";
import CampaignComments from "@/app/components/campaigns/view/CampaignComments";
import CampaignUpdates from "@/app/components/campaigns/view/CampaignUpdates";
import { CampaignActionBar, CampaignStakingInterface } from "@/app/components/campaigns";
import { BackHeader } from "@/app/components/common/BackHeader";
import { ArrowLeft, Loader2 } from "@/app/components/ui/icons";
import Link from "next/link";
import Image from "next/image";
import { useCampaign } from "@/app/hooks/useCampaigns";
import { useFraudDetection } from "@/app/hooks/useFraudDetection";
import { USDC_DECIMALS } from "@/app/lib/contracts/config";
import { Button } from "@/app/components/ui/button";
import { FraudDetectionAlert, FraudRiskBadge } from "@/app/components/ai/FraudDetectionAlert";

export default function CampaignViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Fetch real campaign data from API
  const { campaign: apiCampaign, isLoading, error } = useCampaign(id);

  // Fallback to mock data if API fails
  const mockCampaign = getCampaignById(id);
  const campaign = apiCampaign || mockCampaign;

  // Fraud detection hook
  const {
    analyzeCampaign,
    isChecking: isFraudChecking,
    result: fraudResult,
    error: fraudError,
  } = useFraudDetection();

  // Run fraud check when campaign data is available
  const runFraudCheck = useCallback(async () => {
    if (!campaign) return;

    try {
      await analyzeCampaign({
        campaign_id: campaign.id,
        name: apiCampaign?.title || campaign.title,
        description: apiCampaign?.description || ('description' in campaign ? campaign.description : ''),
        creator_id: ((apiCampaign?.creator as any)?.id as string) || ('creator' in campaign && (campaign.creator as any).handle ? (campaign.creator as any).handle : 'unknown'),
        goal_amount: apiCampaign ? parseFloat(apiCampaign.goal) / Math.pow(10, USDC_DECIMALS) : ('goal' in campaign ? (typeof campaign.goal === 'string' ? parseFloat(campaign.goal) : campaign.goal) : 1000),
        category: campaign.categories?.[0] || 'general',
      });
    } catch (err) {
      console.error('Fraud check failed:', err);
    }
  }, [campaign, apiCampaign, analyzeCampaign]);

  useEffect(() => {
    if (campaign && !fraudResult && !isFraudChecking) {
      runFraudCheck();
    }
  }, [campaign, fraudResult, isFraudChecking, runFraudCheck]);

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

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-4">
            {error ? 'Campaign Loading Error' : 'Campaign Not Found'}
          </h1>
          <p className="text-text-secondary mb-6">
            {error
              ? "We couldn't load the campaign data. This might be a temporary issue."
              : "The campaign you're looking for doesn't exist or has been removed."}
          </p>
          {error && (
            <Button
              onClick={() => window.location.reload()}
              className="mb-4"
            >
              Try Again
            </Button>
          )}
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
    : 'amountRaised' in campaign
      ? (typeof campaign.amountRaised === 'string' ? parseFloat(campaign.amountRaised) : campaign.amountRaised)
      : 0;
  const targetAmount = apiCampaign
    ? parseFloat(apiCampaign.goal) / Math.pow(10, USDC_DECIMALS)
    : 'goal' in campaign
      ? (typeof campaign.goal === 'string' ? parseFloat(campaign.goal) : campaign.goal)
      : 1000;
  const daysLeft = apiCampaign && apiCampaign.deadline
    ? Math.max(0, Math.ceil((new Date(apiCampaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30; // Default to 30 days if no deadline

  // Check if campaign is fully funded (use API field if available)
  const isFullyFunded = apiCampaign?.goalReached ?? (amountRaised >= targetAmount);
  const fundingPercentage = targetAmount > 0 ? Math.round((amountRaised / targetAmount) * 100) : 0;

  // Campaign data for action bar
  const campaignData = {
    id: campaign.id,
    title: apiCampaign?.title || campaign.title,
    url: `https://fundbrave.com/campaigns/${campaign.id}`,
    endDate: apiCampaign?.deadline
      ? new Date(apiCampaign.deadline)
      : ('deadline' in campaign ? new Date(campaign.deadline) : new Date()),
    description: apiCampaign?.description || ('description' in campaign ? campaign.description : ''),
    contractAddress: undefined as string | undefined,
  };

  // Extract creator info safely with fallbacks
  const creator = 'creator' in campaign && campaign.creator
    ? {
        avatarUrl: campaign.creator.avatarUrl || '/placeholder-avatar.png',
        name: campaign.creator.name || 'Anonymous',
        handle: campaign.creator.handle || '@anonymous'
      }
    : {
        avatarUrl: '/placeholder-avatar.png',
        name: 'Anonymous',
        handle: '@anonymous'
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
                      src={creator.avatarUrl}
                      alt={creator.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground text-base">
                      {creator.name}
                    </span>
                    <button className="text-xs font-bold text-primary-400 hover:text-primary-300 uppercase tracking-wide">
                      Follow
                    </button>
                  </div>
                  <span className="text-text-tertiary text-sm">
                    {creator.handle}
                  </span>
                </div>
              </div>
            </div>

            {/* Story Section */}
            <CampaignStory story={'story' in campaign ? campaign.story : ''} />

            {/* Action Buttons (Left Column) - Using CampaignActionBar */}
            {!isFullyFunded && (
              <div className="pt-2 pb-6 sm:pb-8 border-b border-border-subtle">
                <CampaignActionBar
                  campaign={campaignData}
                  variant="buttons"
                  showDonate={true}
                  showStake={true}
                />
              </div>
            )}

            {/* Fully Funded Message */}
            {isFullyFunded && (
              <div className="pt-2 pb-6 sm:pb-8 border-b border-border-subtle">
                <div className="bg-success/10 border border-success/30 rounded-lg px-6 py-4">
                  <p className="text-success font-semibold text-lg mb-1">
                    🎉 Fully Funded!
                  </p>
                  <p className="text-text-secondary text-sm">
                    This campaign has reached {fundingPercentage}% of its goal. Thank you to all supporters!
                  </p>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <CampaignComments
              comments={'comments' in campaign ? (campaign.comments || []) : []}
              campaignId={id}
            />

            {/* Updates Section */}
            <CampaignUpdates updates={('updates' in campaign ? (campaign.updates || []) : []) as any} />
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="lg:col-span-4 lg:pl-4">
            <div className="sticky top-6 sm:top-10 space-y-4">
              {/* Fraud Risk Badge - Compact */}
              {(fraudResult || isFraudChecking) && (
                <div className="flex items-center justify-end mb-2">
                  <FraudRiskBadge result={fraudResult} isChecking={isFraudChecking} />
                </div>
              )}

              <CampaignStatsCard
                amountRaised={amountRaised}
                targetAmount={targetAmount}
                supportersCount={apiCampaign?.donorsCount || ('supportersCount' in campaign ? campaign.supportersCount : 0)}
                daysLeft={daysLeft}
                campaign={campaignData}
                isFullyFunded={isFullyFunded}
              />

              {/* Fraud Detection Alert - Show if not low risk */}
              {fraudResult && fraudResult.risk_level !== 'low' && (
                <FraudDetectionAlert
                  result={fraudResult}
                  isChecking={isFraudChecking}
                  error={fraudError}
                  onRetry={runFraudCheck}
                  inCampaignCard={false}
                />
              )}

              {/* Donate & Stake Buttons (only if not fully funded) */}
              {apiCampaign && !isFullyFunded && (
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
                    Stake USDC
                  </Button>
                </div>
              )}

              {/* Fully Funded Badge (Right Sidebar) */}
              {apiCampaign && isFullyFunded && (
                <div className="bg-success/10 border border-success/30 rounded-lg px-4 py-3 text-center">
                  <p className="text-success font-bold text-sm">
                    ✅ Goal Reached
                  </p>
                  <p className="text-text-secondary text-xs mt-1">
                    {fundingPercentage}% funded
                  </p>
                </div>
              )}

              {/* Campaign Staking Interface (only if not fully funded) */}
              {!isFullyFunded && (
                <CampaignStakingInterface
                  campaignId={id}
                  stakingPoolAddress={apiCampaign?.stakingPoolAddr ?? undefined}
                  className="mt-6"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
