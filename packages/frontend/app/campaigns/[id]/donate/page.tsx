"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { getCampaignById } from "@/app/campaigns/data";
import SuccessCard from "@/app/components/ui/SuccessCard";
import { BackHeader } from "@/app/components/common/BackHeader";
import { Loader2, ArrowLeft } from "@/app/components/ui/icons";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

// Import donation components
import {
  CampaignInfoHeader,
  DonationPresetAmounts,
  DonationCustomInput,
  CryptoSelector,
  TipSlider,
  DonationSummary,
  DonationImpactPreview,
  WalletConnection,
  SecurityBadge,
} from "@/app/components/campaigns/donate";

// Import hook and utilities
import { useDonation, formatAmount } from "@/lib/hooks/useDonation";
import { PRESET_AMOUNTS, CRYPTO_OPTIONS } from "@/lib/constants/donation";
import { useCampaign } from "@/app/hooks/useCampaigns";
import { USDC_DECIMALS } from "@/app/lib/contracts/config";

/**
 * DonatePage - Main donation page component
 * Allows users to donate to a campaign with cryptocurrency
 */
export default function DonatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Fetch real campaign data from API
  const { campaign: apiCampaign, isLoading, error } = useCampaign(id);

  // Fallback to mock data if API fails
  const mockCampaign = getCampaignById(id);
  const campaign = apiCampaign || mockCampaign;

  // Parse API campaign data
  const amountRaised = apiCampaign
    ? parseFloat(apiCampaign.amountRaised) / Math.pow(10, USDC_DECIMALS)
    : mockCampaign
      ? mockCampaign.amountRaised
      : 0;
  const targetAmount = apiCampaign
    ? parseFloat(apiCampaign.goal) / Math.pow(10, USDC_DECIMALS)
    : mockCampaign
      ? mockCampaign.targetAmount
      : 1000;

  // Extract creator info safely with fallbacks
  const creator = apiCampaign?.creator || (mockCampaign?.creator
    ? {
        avatarUrl: mockCampaign.creator.avatarUrl || '/placeholder-avatar.png',
        name: mockCampaign.creator.name || 'Anonymous',
        handle: mockCampaign.creator.handle || '@anonymous'
      }
    : {
        avatarUrl: '/placeholder-avatar.png',
        name: 'Anonymous',
        handle: '@anonymous'
      });

  // Use the donation hook to manage all state and handlers
  const {
    state,
    calculations,
    handlers,
    animatingAmount,
    showImpact,
    isMounted,
  } = useDonation({
    campaign: campaign
      ? {
          id: campaign.id,
          title: apiCampaign?.title || campaign.title,
          imageUrl: apiCampaign?.imageUrl || campaign.imageUrl,
          targetAmount: targetAmount,
          amountRaised: amountRaised,
          creator: creator,
        }
      : null,
  });

  // Handle loading state
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

  // Handle error or campaign not found
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackHeader
        title="Donate"
        subtitle={apiCampaign?.title || campaign.title}
        fallbackHref={`/campaigns/${id}`}
      />
      <div className="flex items-center justify-center py-10 px-4">
      {/* Success Overlay with SuccessCard */}
      {state.donationSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SuccessCard
              title="Donation Successful!"
              message={`Thank you for your generous donation of ${formatAmount(
                calculations.totalAmount,
                2
              )} USD to ${
                apiCampaign?.title || campaign.title
              }. Your contribution brings them ${calculations.donationImpact.toFixed(
                1
              )}% closer to their goal!`}
              buttonText="View Campaign"
              onButtonClick={() => router.push(`/campaigns/${id}`)}
              showAnimation={true}
            />
          </motion.div>
        </div>
      )}

      <div className="w-full max-w-[851px] bg-background border-border-subtle border">
        <div className="p-6 md:p-10 space-y-10">
          {/* Campaign Info Header */}
          <CampaignInfoHeader
            campaign={{
              id: campaign.id,
              title: apiCampaign?.title || campaign.title,
              imageUrl: apiCampaign?.imageUrl || campaign.imageUrl,
              targetAmount: targetAmount,
              amountRaised: amountRaised,
              creator: creator,
            }}
            showImpact={showImpact}
            donationImpact={calculations.donationImpact}
            amount={state.amount}
            formatAmount={formatAmount}
          />

          {/* Amount Selection Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Enter your donation</h3>
              <span className="text-xs text-text-tertiary">
                Press 1-5 or 0 for quick select
              </span>
            </div>

            {/* Preset Amounts */}
            <div className="mb-5">
              <DonationPresetAmounts
                presetAmounts={PRESET_AMOUNTS}
                selectedPreset={state.selectedPreset}
                onPresetClick={handlers.handlePresetClick}
              />
            </div>

            {/* Custom Amount Input */}
            <DonationCustomInput
              customAmount={state.customAmount}
              error={state.error}
              onCustomAmountChange={handlers.handleCustomAmountChange}
            />
          </div>

          {/* Crypto Selection */}
          <CryptoSelector
            cryptoOptions={CRYPTO_OPTIONS}
            selectedCrypto={state.selectedCrypto}
            cryptoAmount={calculations.cryptoAmount}
            amount={state.amount}
            onCryptoSelect={handlers.handleCryptoSelect}
          />

          {/* Tip Slider */}
          <TipSlider
            tipPercentage={state.tipPercentage}
            tipAmount={calculations.tipAmount}
            onSliderChange={handlers.handleSliderChange}
            formatAmount={formatAmount}
          />

          {/* Donation Summary */}
          <DonationSummary
            amount={state.amount}
            tipAmount={calculations.tipAmount}
            totalAmount={calculations.totalAmount}
            cryptoAmount={calculations.cryptoAmount}
            selectedCrypto={state.selectedCrypto}
            animatingAmount={animatingAmount}
            formatAmount={formatAmount}
          />

          {/* Donation Impact Preview */}
          <DonationImpactPreview
            currentProgress={calculations.currentProgress}
            newProgress={calculations.newProgress}
            isMounted={isMounted}
            amount={state.amount}
          />

          {/* Wallet Connection & Donate Button */}
          <WalletConnection
            isConnected={state.isConnected}
            isConnecting={state.isConnecting}
            isDonating={state.isDonating}
            walletAddress={state.walletAddress}
            amount={state.amount}
            totalAmount={calculations.totalAmount}
            onConnectWallet={handlers.handleConnectWallet}
            onDisconnect={handlers.handleDisconnect}
            onDonate={handlers.handleDonate}
            formatAmount={formatAmount}
            needsApproval={state.needsApproval}
            onApprove={handlers.approveUSDC}
            txHash={state.txHash}
            selectedCrypto={state.selectedCrypto}
            isWealthBuilding={state.isWealthBuilding}
            onToggleWealthBuilding={handlers.toggleWealthBuilding}
          />

          {/* Security Badge */}
          <SecurityBadge />
        </div>
      </div>
      </div>
    </div>
  );
}
