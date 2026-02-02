"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatEther, parseUnits } from "viem";
import { BackHeader } from "@/app/components/common/BackHeader";
import { Spinner } from "@/app/components/ui/Spinner";
import { useGetFundraiserQuery } from "@/app/generated/graphql";
import { useFundraiserStakes, useStake } from "@/app/hooks/useStaking";
import { useAccount } from "wagmi";

// Import staking components
import {
  StakingAmountInput,
  StakingStats,
  StakingUserPosition,
  StakingTabs,
  StakingActionButtons,
  StakingInfoPanel,
  RecentStakersList,
  TransactionStatus,
} from "@/app/components/campaigns/stake";

/**
 * StakePage - Per-campaign staking pool interface
 * Allows users to stake USDC to earn yield + support a campaign
 *
 * Following DeFi UX best practices:
 * - Clear transaction status with meaningful feedback
 * - Tooltips explaining APY, lock periods, and rewards
 * - Error messages that explain WHY
 * - Transaction preview before actions
 * - Mobile-first responsive design
 */
export default function StakePage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const fundraiserId = params.id as string;

  // Local state
  const [stakeAmount, setStakeAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");

  // Fetch campaign data
  const { data: campaignData, loading: campaignLoading } = useGetFundraiserQuery({
    variables: { id: fundraiserId },
    skip: !fundraiserId,
  });

  // Fetch stakes for this campaign
  const {
    stakes,
    total: totalStakers,
    isLoading: stakesLoading,
    refetch: refetchStakes,
  } = useFundraiserStakes(fundraiserId);

  // Staking hook
  const poolAddress = campaignData?.fundraiser?.stakingPoolAddr as `0x${string}` | undefined;

  const {
    stake: executeStake,
    approveUSDC,
    saveStakeToBackend,
    checkAllowance,
    isProcessing,
    isSuccess,
    hash,
    usdcBalance,
    needsApproval,
    error: stakeError,
    refetchAllowance,
    txStatus,
  } = useStake(poolAddress || "0x0");

  // Calculate pool stats
  const totalValueLocked = stakes.reduce(
    (sum, stake) => sum + parseFloat(stake.amount),
    0
  );
  const userStake = stakes.find(
    (s) => s.staker.walletAddress.toLowerCase() === address?.toLowerCase()
  );
  const userStakedAmount = userStake ? parseFloat(userStake.amount) : 0;

  // APY calculation (mock for now - would come from contract or backend)
  const estimatedAPY = 8.5; // TODO: Calculate real APY from pool data

  // Handle amount input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setStakeAmount(value);
    }
  };

  // Handle max button
  const handleMaxClick = () => {
    if (activeTab === "stake" && usdcBalance) {
      setStakeAmount(formatEther(usdcBalance));
    } else if (activeTab === "unstake") {
      setStakeAmount(userStakedAmount.toString());
    }
  };

  // Check if amount needs approval
  useEffect(() => {
    if (stakeAmount && poolAddress && activeTab === "stake") {
      const amount = parseUnits(stakeAmount, 6); // USDC has 6 decimals
      checkAllowance(amount);
    }
  }, [stakeAmount, poolAddress, activeTab, checkAllowance]);

  // Handle approve
  const handleApprove = async () => {
    if (!stakeAmount) return;
    const amount = parseUnits(stakeAmount, 6);
    const success = await approveUSDC(amount);
    if (success) {
      await refetchAllowance();
    }
  };

  // Handle stake
  const handleStake = async () => {
    if (!stakeAmount || !poolAddress) return;

    const amount = parseUnits(stakeAmount, 6);
    const success = await executeStake(amount, fundraiserId);

    if (success && hash) {
      // Save to backend
      await saveStakeToBackend(fundraiserId, amount, hash, poolAddress);
      // Refetch stakes
      await refetchStakes();
      // Clear form
      setStakeAmount("");
    }
  };

  // Handle unstake (TODO: implement unstake contract interaction)
  const handleUnstake = async () => {
    console.log("Unstake not yet implemented");
  };

  // Handle connect wallet
  const handleConnectWallet = () => {
    router.push("/auth");
  };

  // Loading state
  if (campaignLoading || stakesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Campaign not found
  if (!campaignData?.fundraiser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Campaign not found</h2>
          <button
            onClick={() => router.push("/campaigns")}
            className="text-primary hover:underline"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const campaign = campaignData.fundraiser;
  const formattedBalance = usdcBalance
    ? parseFloat(formatEther(usdcBalance)).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-background">
      <BackHeader
        title="Staking Pool"
        subtitle={campaign.name}
        fallbackHref={`/campaigns/${fundraiserId}`}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Pool Stats Cards */}
        <StakingStats
          totalValueLocked={totalValueLocked}
          estimatedAPY={estimatedAPY}
          totalStakers={totalStakers}
        />

        {/* User's Position */}
        {userStake && (
          <StakingUserPosition
            stakedAmount={userStakedAmount}
            estimatedAPY={estimatedAPY}
            stakedDate={new Date(userStake.stakedAt)}
          />
        )}

        {/* Stake/Unstake Interface */}
        <div className="bg-surface-elevated border border-white/10 rounded-xl p-6">
          {/* Tabs */}
          <StakingTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            hasStake={!!userStake}
          />

          {/* Transaction Status */}
          {(txStatus !== "idle" || stakeError) && (
            <div className="mb-6">
              <TransactionStatus
                status={txStatus}
                message={
                  txStatus === "pending"
                    ? "Waiting for wallet confirmation..."
                    : txStatus === "success"
                    ? "Your stake has been processed successfully!"
                    : stakeError || undefined
                }
                txHash={hash}
              />
            </div>
          )}

          {/* Amount Input */}
          <StakingAmountInput
            value={stakeAmount}
            onChange={handleAmountChange}
            onMaxClick={handleMaxClick}
            balance={activeTab === "stake" ? formattedBalance : undefined}
            label={`Amount to ${activeTab === "stake" ? "Stake" : "Unstake"} (USDC)`}
            placeholder="0.00"
            error={stakeError}
            disabled={isProcessing}
          />

          {/* Action Buttons */}
          <div className="mt-6">
            <StakingActionButtons
              activeTab={activeTab}
              isConnected={isConnected}
              amount={stakeAmount}
              needsApproval={needsApproval}
              isProcessing={isProcessing}
              onConnectWallet={handleConnectWallet}
              onApprove={handleApprove}
              onStake={handleStake}
              onUnstake={handleUnstake}
            />
          </div>
        </div>

        {/* Info Panel */}
        <StakingInfoPanel estimatedAPY={estimatedAPY} />

        {/* Recent Stakes List */}
        <RecentStakersList stakes={stakes} />
      </div>
    </div>
  );
}
