"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatEther, parseUnits } from "viem";
import { BackHeader } from "@/app/components/common/BackHeader";
import { Button } from "@/app/components/ui/button/Button";
import { Input } from "@/app/components/ui/inputs/Input";
import { Spinner } from "@/app/components/ui/Spinner";
import { useGetFundraiserQuery } from "@/app/generated/graphql";
import { useFundraiserStakes, useStake } from "@/app/hooks/useStaking";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

/**
 * StakePage - Per-campaign staking pool interface
 * Allows users to stake USDC to earn yield + support a campaign
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
  const { stakes, total: totalStakers, isLoading: stakesLoading, refetch: refetchStakes } = useFundraiserStakes(fundraiserId);

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
  } = useStake(poolAddress || "0x0");

  // Calculate pool stats
  const totalValueLocked = stakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
  const userStake = stakes.find(s => s.staker.walletAddress.toLowerCase() === address?.toLowerCase());
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
    if (stakeAmount && poolAddress) {
      const amount = parseUnits(stakeAmount, 6); // USDC has 6 decimals
      checkAllowance(amount);
    }
  }, [stakeAmount, poolAddress, checkAllowance]);

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
          <Button onClick={() => router.push("/campaigns")}>Back to Campaigns</Button>
        </div>
      </div>
    );
  }

  const campaign = campaignData.fundraiser;

  return (
    <div className="min-h-screen bg-background">
      <BackHeader
        title="Staking Pool"
        subtitle={campaign.name}
        fallbackHref={`/campaigns/${fundraiserId}`}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Pool Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Value Locked */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Total Value Locked</div>
            <div className="text-3xl font-bold text-foreground">${totalValueLocked.toLocaleString()}</div>
            <div className="text-xs text-text-secondary mt-1">USDC</div>
          </div>

          {/* Estimated APY */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Estimated APY</div>
            <div className="text-3xl font-bold text-primary">{estimatedAPY}%</div>
            <div className="text-xs text-text-secondary mt-1">Annual yield</div>
          </div>

          {/* Total Stakers */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Total Stakers</div>
            <div className="text-3xl font-bold text-foreground">{totalStakers}</div>
            <div className="text-xs text-text-secondary mt-1">Participants</div>
          </div>
        </div>

        {/* User's Position */}
        {userStake && (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Your Position</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-text-tertiary">Staked Amount</div>
                <div className="text-2xl font-bold text-foreground">${userStakedAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-text-tertiary">Estimated Yield</div>
                <div className="text-2xl font-bold text-primary">${(userStakedAmount * estimatedAPY / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-text-tertiary">Staked Since</div>
                <div className="text-lg font-medium text-foreground">
                  {new Date(userStake.stakedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stake/Unstake Interface */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("stake")}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                activeTab === "stake"
                  ? "bg-primary text-white"
                  : "bg-surface-overlay text-text-secondary hover:bg-surface-sunken"
              )}
            >
              Stake
            </button>
            <button
              onClick={() => setActiveTab("unstake")}
              disabled={!userStake}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                activeTab === "unstake"
                  ? "bg-primary text-white"
                  : "bg-surface-overlay text-text-secondary hover:bg-surface-sunken",
                !userStake && "opacity-50 cursor-not-allowed"
              )}
            >
              Unstake
            </button>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Amount (USDC)
            </label>
            <div className="relative">
              <Input
                type="text"
                value={stakeAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="pr-20 text-lg"
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium rounded"
              >
                MAX
              </button>
            </div>
            {usdcBalance && activeTab === "stake" && (
              <div className="text-xs text-text-tertiary mt-1">
                Balance: {parseFloat(formatEther(usdcBalance)).toFixed(2)} USDC
              </div>
            )}
          </div>

          {/* Error Message */}
          {stakeError && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {stakeError}
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
              Transaction successful! {hash && (
                <a
                  href={`https://etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline ml-1"
                >
                  View on Etherscan
                </a>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!isConnected ? (
            <Button fullWidth size="lg" onClick={() => router.push("/auth")}>
              Connect Wallet to Stake
            </Button>
          ) : activeTab === "stake" ? (
            <div className="space-y-3">
              {needsApproval && (
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleApprove}
                  disabled={!stakeAmount || isProcessing}
                >
                  {isProcessing ? "Approving..." : "Approve USDC"}
                </Button>
              )}
              <Button
                fullWidth
                size="lg"
                onClick={handleStake}
                disabled={!stakeAmount || needsApproval || isProcessing}
              >
                {isProcessing ? <Spinner size="sm" /> : "Stake USDC"}
              </Button>
            </div>
          ) : (
            <Button
              fullWidth
              size="lg"
              onClick={handleUnstake}
              disabled={!stakeAmount || isProcessing}
              variant="secondary"
            >
              {isProcessing ? <Spinner size="sm" /> : "Unstake & Claim Yield"}
            </Button>
          )}

          {/* Info Text */}
          <div className="mt-6 text-xs text-text-tertiary space-y-1">
            <p>• Your USDC will be staked to earn {estimatedAPY}% annual yield</p>
            <p>• You can unstake at any time with no lockup period</p>
            <p>• Yield is automatically compounded</p>
            <p>• A portion of yield supports the campaign creator</p>
          </div>
        </div>

        {/* Recent Stakes List */}
        {stakes.length > 0 && (
          <div className="mt-8 bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Stakers</h3>
            <div className="space-y-3">
              {stakes.slice(0, 10).map((stake) => (
                <div
                  key={stake.id}
                  className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {stake.staker.displayName?.[0] || stake.staker.username?.[0] || "?"}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {stake.staker.displayName || stake.staker.username || "Anonymous"}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {new Date(stake.stakedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">
                      ${parseFloat(stake.amount).toLocaleString()}
                    </div>
                    <div className="text-xs text-text-secondary">USDC</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
