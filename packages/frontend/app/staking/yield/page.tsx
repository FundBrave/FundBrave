"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button/Button";
import { Spinner } from "@/app/components/ui/Spinner";
import { useMyStakes, useMyFBTStake, useMyImpactDAOStake } from "@/app/hooks/useStaking";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

/**
 * Yield Tracking Dashboard
 * Aggregates yield from all staking pools in one place
 */
export default function YieldDashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Fetch all user stakes
  const { stakes: campaignStakes, isLoading: campaignLoading } = useMyStakes();
  const { stake: fbtStake, isLoading: fbtLoading } = useMyFBTStake();
  const { stake: daoStake, isLoading: daoLoading } = useMyImpactDAOStake();

  // Calculate aggregate yield data
  const yieldData = useMemo(() => {
    // Campaign pools yield (from USDC staking)
    const campaignYield = campaignStakes.reduce((sum, stake) => {
      // TODO: Calculate actual yield based on APY and time staked
      const principal = parseFloat(stake.amount);
      const estimatedYield = principal * 0.085; // 8.5% APY estimate
      return sum + estimatedYield;
    }, 0);

    // FBT staking yield (in USDC)
    const fbtYield = fbtStake ? parseFloat(fbtStake.pendingYield || "0") : 0;
    const fbtClaimed = fbtStake ? parseFloat(fbtStake.claimedYield || "0") : 0;

    // DAO yield (USDC + FBT rewards)
    const daoUSDCYield = daoStake ? parseFloat(daoStake.pendingUSDCYield || "0") : 0;
    const daoFBTReward = daoStake ? parseFloat(daoStake.pendingFBTReward || "0") : 0;
    const daoClaimed = daoStake ? parseFloat(daoStake.claimedUSDCYield || "0") : 0;

    return {
      // Per-pool breakdown
      campaign: {
        pending: campaignYield,
        claimed: 0, // TODO: Track claimed yield
        total: campaignYield,
      },
      fbt: {
        pending: fbtYield,
        claimed: fbtClaimed,
        total: fbtYield + fbtClaimed,
      },
      dao: {
        pendingUSDC: daoUSDCYield,
        pendingFBT: daoFBTReward,
        claimed: daoClaimed,
        total: daoUSDCYield + daoClaimed,
      },
      // Aggregates
      totalPending: campaignYield + fbtYield + daoUSDCYield,
      totalClaimed: fbtClaimed + daoClaimed,
      totalEarned: campaignYield + fbtYield + daoUSDCYield + fbtClaimed + daoClaimed,
    };
  }, [campaignStakes, fbtStake, daoStake]);

  if (campaignLoading || fbtLoading || daoLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">Connect your wallet to view your yield earnings</p>
            <Button onClick={() => router.push("/auth")}>Connect Wallet</Button>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyStakes = campaignStakes.length > 0 || fbtStake || daoStake;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Yield Dashboard</h1>
          <p className="text-text-secondary">
            Track and claim your earnings from all staking pools
          </p>
        </div>

        {/* Total Yield Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-xl p-6">
            <div className="text-sm text-foreground/80 mb-1">Total Pending Yield</div>
            <div className="text-4xl font-bold text-foreground">${yieldData.totalPending.toFixed(2)}</div>
            <div className="text-xs text-success mt-2">Available to claim</div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Total Claimed</div>
            <div className="text-4xl font-bold text-foreground">${yieldData.totalClaimed.toFixed(2)}</div>
            <div className="text-xs text-text-secondary mt-2">Lifetime earnings</div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Total Earned</div>
            <div className="text-4xl font-bold text-success">${yieldData.totalEarned.toFixed(2)}</div>
            <div className="text-xs text-text-secondary mt-2">All-time yield</div>
          </div>
        </div>

        {!hasAnyStakes ? (
          /* No Stakes Empty State */
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Active Stakes</h3>
            <p className="text-text-secondary mb-6">
              Start staking to earn yield from platform revenue
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push("/staking")}>
                Explore Global Pool
              </Button>
              <Button variant="secondary" onClick={() => router.push("/campaigns")}>
                Browse Campaigns
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Yield Breakdown by Pool */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Campaign Pools */}
              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Campaign Pools</h3>
                  <span className="text-sm text-text-tertiary">{campaignStakes.length} active</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Pending Yield</span>
                    <span className="font-bold text-primary">${yieldData.campaign.pending.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Claimed</span>
                    <span className="font-medium text-foreground">${yieldData.campaign.claimed.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-border-subtle">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="font-bold text-lg text-foreground">${yieldData.campaign.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {yieldData.campaign.pending > 0 && (
                  <Button fullWidth className="mt-4" variant="secondary" size="sm" disabled>
                    Claim Yield (Coming Soon)
                  </Button>
                )}
              </div>

              {/* FBT Staking */}
              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">FBT Staking</h3>
                  <span className="text-sm text-text-tertiary">{fbtStake ? "Active" : "Inactive"}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Pending Yield</span>
                    <span className="font-bold text-primary">${yieldData.fbt.pending.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Claimed</span>
                    <span className="font-medium text-foreground">${yieldData.fbt.claimed.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-border-subtle">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="font-bold text-lg text-foreground">${yieldData.fbt.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {yieldData.fbt.pending > 0 ? (
                  <Button fullWidth className="mt-4" variant="secondary" size="sm" disabled>
                    Claim ${yieldData.fbt.pending.toFixed(2)}
                  </Button>
                ) : (
                  <Button fullWidth className="mt-4" variant="outline" size="sm" onClick={() => router.push("/staking/fbt")}>
                    Stake FBT
                  </Button>
                )}
              </div>

              {/* Impact DAO */}
              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Impact DAO</h3>
                  <span className="text-sm text-text-tertiary">{daoStake ? "Active" : "Inactive"}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Pending USDC</span>
                    <span className="font-bold text-primary">${yieldData.dao.pendingUSDC.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Pending FBT</span>
                    <span className="font-bold text-success">{yieldData.dao.pendingFBT.toFixed(2)} FBT</span>
                  </div>
                  <div className="pt-3 border-t border-border-subtle">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Total USDC</span>
                      <span className="font-bold text-lg text-foreground">${yieldData.dao.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {yieldData.dao.pendingUSDC > 0 || yieldData.dao.pendingFBT > 0 ? (
                  <Button fullWidth className="mt-4" variant="secondary" size="sm" disabled>
                    Claim Rewards
                  </Button>
                ) : (
                  <Button fullWidth className="mt-4" variant="outline" size="sm" onClick={() => router.push("/dao")}>
                    Stake to DAO
                  </Button>
                )}
              </div>
            </div>

            {/* Active Stakes List */}
            {campaignStakes.length > 0 && (
              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Your Campaign Stakes</h3>
                <div className="space-y-3">
                  {campaignStakes.map((stake) => (
                    <div
                      key={stake.id}
                      className="flex items-center justify-between p-4 bg-surface-sunken rounded-lg hover:bg-surface-overlay transition-colors cursor-pointer"
                      onClick={() => stake.fundraiser && router.push(`/campaigns/${stake.fundraiser.id}/stake`)}
                    >
                      <div>
                        <div className="font-medium text-foreground">
                          {stake.fundraiser?.name || "Campaign Pool"}
                        </div>
                        <div className="text-sm text-text-tertiary">
                          Staked: ${parseFloat(stake.amount).toLocaleString()} • {new Date(stake.stakedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-text-secondary">Est. Yield</div>
                        <div className="font-bold text-primary">
                          ${(parseFloat(stake.amount) * 0.085).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
