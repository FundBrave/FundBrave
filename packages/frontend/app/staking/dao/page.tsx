"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatEther, parseUnits } from "viem";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { useGetImpactDaoStakersQuery } from "@/app/generated/graphql";
import { useMyImpactDAOStake } from "@/app/hooks/useStaking";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

/**
 * Impact DAO Page
 * Allows users to stake to Impact DAO pool and vote on yield allocation
 */
export default function ImpactDAOPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");

  // Fetch DAO stakers
  const { data: stakersData, loading: stakersLoading } = useGetImpactDaoStakersQuery({
    variables: { limit: 100, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });

  // Fetch user's DAO stake
  const { stake: myStake, isLoading: myStakeLoading } = useMyImpactDAOStake();

  const allStakers = stakersData?.impactDAOStakers?.items || [];
  const totalPrincipal = allStakers.reduce((sum, s) => sum + parseFloat(s.principal), 0);
  const totalStakers = allStakers.length;

  // User's voting power (based on stake proportion)
  const myPrincipal = myStake ? parseFloat(myStake.principal) : 0;
  const myVotingPower = totalPrincipal > 0 ? (myPrincipal / totalPrincipal) * 100 : 0;

  // Yield allocation percentages (from DAO votes)
  const yieldAllocation = {
    stakers: myStake?.stakerShare || 30,
    platform: myStake?.platformShare || 20,
    dao: myStake?.daoShare || 50,
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) setStakeAmount(value);
  };

  if (stakersLoading || myStakeLoading) {
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Impact DAO</h1>
          <p className="text-text-secondary">
            Stake to earn yield and vote on how platform resources are allocated
          </p>
        </div>

        {/* DAO Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Total Staked</div>
            <div className="text-3xl font-bold text-foreground">${totalPrincipal.toLocaleString()}</div>
            <div className="text-xs text-text-secondary mt-1">DAO Treasury</div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Total Voters</div>
            <div className="text-3xl font-bold text-foreground">{totalStakers}</div>
            <div className="text-xs text-text-secondary mt-1">Active participants</div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Your Voting Power</div>
            <div className="text-3xl font-bold text-primary">{myVotingPower.toFixed(2)}%</div>
            <div className="text-xs text-text-secondary mt-1">Of total votes</div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Your DAO Stake</div>
            <div className="text-3xl font-bold text-foreground">${myPrincipal.toLocaleString()}</div>
            <div className="text-xs text-text-secondary mt-1">Principal</div>
          </div>
        </div>

        {/* User's Position */}
        {myStake && (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Your Impact DAO Position</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-text-tertiary">Staked Principal</div>
                <div className="text-2xl font-bold text-foreground">${myPrincipal.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-text-tertiary">Pending USDC Yield</div>
                <div className="text-2xl font-bold text-primary">${parseFloat(myStake.pendingUSDCYield || "0").toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-text-tertiary">Pending FBT Rewards</div>
                <div className="text-2xl font-bold text-success">{parseFloat(myStake.pendingFBTReward || "0").toFixed(2)} FBT</div>
              </div>
              <div>
                <div className="text-sm text-text-tertiary">Staked Since</div>
                <div className="text-lg font-medium text-foreground">
                  {new Date(myStake.stakedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Staking Interface */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Stake to Impact DAO</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount (USDC)
              </label>
              <input
                type="text"
                value={stakeAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-3 text-lg text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {!isConnected ? (
              <Button fullWidth size="lg" onClick={() => router.push("/auth")}>
                Connect Wallet
              </Button>
            ) : (
              <Button fullWidth size="lg" disabled>
                Stake to DAO (Coming Soon)
              </Button>
            )}

            <div className="mt-4 text-xs text-text-tertiary space-y-1">
              <p>• Earn USDC yield + FBT token rewards</p>
              <p>• Vote on platform governance decisions</p>
              <p>• Influence yield allocation across ecosystem</p>
              <p>• No lockup period</p>
            </div>
          </div>

          {/* Yield Allocation Voting */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Current Yield Allocation</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground font-medium">DAO Treasury</span>
                  <span className="text-sm font-bold text-primary">{yieldAllocation.dao}%</span>
                </div>
                <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${yieldAllocation.dao}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground font-medium">Stakers</span>
                  <span className="text-sm font-bold text-success">{yieldAllocation.stakers}%</span>
                </div>
                <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: `${yieldAllocation.stakers}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground font-medium">Platform</span>
                  <span className="text-sm font-bold text-purple-500">{yieldAllocation.platform}%</span>
                </div>
                <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${yieldAllocation.platform}%` }} />
                </div>
              </div>
            </div>

            <Button fullWidth size="lg" variant="secondary" className="mt-6" disabled>
              Vote on Allocation (Coming Soon)
            </Button>

            <p className="text-xs text-text-tertiary mt-4">
              Your voting power: {myVotingPower.toFixed(2)}% • Next vote: TBD
            </p>
          </div>
        </div>

        {/* Top DAO Stakers */}
        {allStakers.length > 0 && (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Top DAO Stakers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allStakers.slice(0, 9).map((staker, idx) => (
                <div key={staker.address} className="flex items-center justify-between p-3 bg-surface-sunken rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{staker.username || "Anonymous"}</div>
                      <div className="text-xs text-text-tertiary">{parseFloat(staker.principal).toFixed(0)} USDC</div>
                    </div>
                  </div>
                  <div className="text-xs text-primary font-medium">
                    {totalPrincipal > 0 ? ((parseFloat(staker.principal) / totalPrincipal) * 100).toFixed(1) : "0"}% power
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
