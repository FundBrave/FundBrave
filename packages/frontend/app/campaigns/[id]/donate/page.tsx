"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { getCampaignById } from "@/app/campaigns/data";
import SuccessCard from "@/app/components/ui/SuccessCard";
import { BackHeader } from "@/app/components/common/BackHeader";

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

/**
 * DonatePage - Main donation page component
 * Allows users to donate to a campaign with cryptocurrency
 */
export default function DonatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const campaign = getCampaignById(id);

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
          title: campaign.title,
          imageUrl: campaign.imageUrl,
          targetAmount: campaign.targetAmount,
          amountRaised: campaign.amountRaised,
          creator: campaign.creator,
        }
      : null,
  });

  // Handle campaign not found
  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div>Campaign not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackHeader
        title="Donate"
        subtitle={campaign.title}
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
                campaign.title
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
              title: campaign.title,
              imageUrl: campaign.imageUrl,
              targetAmount: campaign.targetAmount,
              amountRaised: campaign.amountRaised,
              creator: campaign.creator,
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
          />

          {/* Security Badge */}
          <SecurityBadge />
        </div>
      </div>
      </div>
    </div>
  );
}
