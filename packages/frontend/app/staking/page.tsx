"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatEther, parseUnits } from "viem";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { useGetGlobalPoolStakesQuery } from "@/app/generated/graphql";
import { useMyStakes, useStake } from "@/app/hooks/useStaking";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/app/lib/contracts/config";
import { cn } from "@/lib/utils";

/**
 * Global Staking Pool Page
 * Allows users to stake USDC to the global pool that distributes yield across all campaigns
 */
export default function GlobalStakingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Local state
  const [stakeAmount, setStakeAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");

  // Fetch global pool stakes
  const { data: globalPoolData, loading: globalLoading, refetch: refetchGlobalPool } = useGetGlobalPoolStakesQuery({
    variables: { limit: 100, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });

  // Fetch user's stakes
  const { stakes: myStakes, isLoading: myStakesLoading, refetch: refetchMyStakes } = useMyStakes();

  // Staking hook for global pool
  const globalPoolAddress = CONTRACT_ADDRESSES.globalStakingPool as `0x${string}`;

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
  } = useStake(globalPoolAddress);

  // Calculate aggregate stats
  const allStakes = globalPoolData?.globalPoolStakes?.items || [];
  const totalValueLocked = allStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
  const totalStakers = allStakes.length;

  // User's global stakes (can have multiple)
  const userGlobalStakes = myStakes.filter(s => s.isGlobal);
  const userTotalStaked = userGlobalStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);

  // APY for global pool (mock for now)
  const globalAPY = 12.5; // TODO: Calculate from contract

  // Yield distribution percentages
  const yieldDistribution = {
    campaigns: 70, // 70% to campaigns
    platform: 20, // 20% to platform
    stakers: 10, // 10% to stakers
  };

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
      setStakeAmount(userTotalStaked.toString());
    }
  };

  // Check if amount needs approval
  useEffect(() => {
    if (stakeAmount) {
      const amount = parseUnits(stakeAmount, 6); // USDC has 6 decimals
      checkAllowance(amount);
    }
  }, [stakeAmount, checkAllowance]);

  // Handle approve
  const handleApprove = async () => {
    if (!stakeAmount) return;
    const amount = parseUnits(stakeAmount, 6);
    const success = await approveUSDC(amount);
    if (success) {
      await refetchAllowance();
    }
  };

  // Handle stake to global pool
  const handleStake = async () => {
    if (!stakeAmount) return;

    const amount = parseUnits(stakeAmount, 6);
    const success = await executeStake(amount); // No fundraiserId for global pool

    if (success && hash) {
      // Save to backend (global pool doesn't have fundraiserId)
      // await saveStakeToBackend("GLOBAL", amount, hash, globalPoolAddress);

      // Refetch data
      await refetchGlobalPool();
      await refetchMyStakes();

      // Clear form
      setStakeAmount("");
    }
  };

  // Handle unstake (TODO: implement)
  const handleUnstake = async () => {
    console.log("Unstake not yet implemented");
  };

  // Loading state
  if (globalLoading || myStakesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Global Staking Pool</h1>
          <p className="text-text-secondary">
            Stake USDC to earn yield while supporting all campaigns on FundBrave
          </p>
        </div>

        {/* Aggregate Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Value Locked */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Total Value Locked</div>
            <div className="text-3xl font-bold text-foreground">${totalValueLocked.toLocaleString()}</div>
            <div className="text-xs text-text-secondary mt-1">Global Pool</div>
          </div>

          {/* Global APY */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Global APY</div>
            <div className="text-3xl font-bold text-primary">{globalAPY}%</div>
            <div className="text-xs text-success mt-1">+{(globalAPY - 8.5).toFixed(1)}% vs campaign pools</div>
          </div>

          {/* Total Stakers */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Total Stakers</div>
            <div className="text-3xl font-bold text-foreground">{totalStakers}</div>
            <div className="text-xs text-text-secondary mt-1">Participants</div>
          </div>

          {/* Your Share */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Your Pool Share</div>
            <div className="text-3xl font-bold text-primary">
              {totalValueLocked > 0 ? ((userTotalStaked / totalValueLocked) * 100).toFixed(2) : "0.00"}%
            </div>
            <div className="text-xs text-text-secondary mt-1">Of global pool</div>
          </div>
        </div>

        {/* User's Global Position */}
        {userGlobalStakes.length > 0 && (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Your Global Position</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-text-tertiary">Total Staked</div>
                <div className="text-2xl font-bold text-foreground">${userTotalStaked.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-text-tertiary">Estimated Annual Yield</div>
                <div className="text-2xl font-bold text-primary">
                  ${(userTotalStaked * globalAPY / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-tertiary">Active Stakes</div>
                <div className="text-2xl font-bold text-foreground">{userGlobalStakes.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout: Stake Interface + Yield Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Stake/Unstake Interface */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Stake to Global Pool</h3>

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
                disabled={userGlobalStakes.length === 0}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                  activeTab === "unstake"
                    ? "bg-primary text-white"
                    : "bg-surface-overlay text-text-secondary hover:bg-surface-sunken",
                  userGlobalStakes.length === 0 && "opacity-50 cursor-not-allowed"
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
                <input
                  type="text"
                  value={stakeAmount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-3 pr-20 text-lg text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
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
                  {isProcessing ? <Spinner size="sm" /> : "Stake to Global Pool"}
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
          </div>

          {/* Yield Distribution */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Yield Distribution</h3>

            <div className="space-y-4 mb-6">
              {/* Campaigns Share */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground font-medium">Campaign Creators</span>
                  <span className="text-sm font-bold text-primary">{yieldDistribution.campaigns}%</span>
                </div>
                <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${yieldDistribution.campaigns}%` }}
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Supports fundraising campaigns directly
                </p>
              </div>

              {/* Platform Share */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground font-medium">Platform Development</span>
                  <span className="text-sm font-bold text-purple-500">{yieldDistribution.platform}%</span>
                </div>
                <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${yieldDistribution.platform}%` }}
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Funds platform maintenance & growth
                </p>
              </div>

              {/* Stakers Share */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground font-medium">Stakers (You)</span>
                  <span className="text-sm font-bold text-success">{yieldDistribution.stakers}%</span>
                </div>
                <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success"
                    style={{ width: `${yieldDistribution.stakers}%` }}
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Your yield for providing liquidity
                </p>
              </div>
            </div>

            {/* Benefits List */}
            <div className="bg-surface-sunken rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground mb-2">Benefits of Global Pool:</h4>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Higher APY than individual campaign pools</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Diversified risk across all campaigns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Automatic yield compounding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Support the entire FundBrave ecosystem</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>No lockup period - unstake anytime</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Global Stakers */}
        {allStakes.length > 0 && (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Global Stakers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allStakes.slice(0, 9).map((stake) => (
                <div
                  key={stake.id}
                  className="flex items-center justify-between p-3 bg-surface-sunken rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
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
                    <div className="font-bold text-sm text-foreground">
                      ${parseFloat(stake.amount).toLocaleString()}
                    </div>
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
