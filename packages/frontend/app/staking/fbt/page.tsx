"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatEther } from "viem";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button/Button";
import { Input } from "@/app/components/ui/inputs/Input";
import { Spinner } from "@/app/components/ui/Spinner";
import { useMyFBTStake } from "@/app/hooks/useStaking";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

/**
 * FBT Token Staking Page
 * Allows users to stake FBT tokens with timelock periods for multiplied rewards
 */

// Timelock period options with reward multipliers
const TIMELOCK_OPTIONS = [
  { days: 30, label: "30 Days", multiplier: 1.0, apy: 15 },
  { days: 60, label: "60 Days", multiplier: 1.5, apy: 22.5 },
  { days: 90, label: "90 Days", multiplier: 2.0, apy: 30 },
  { days: 180, label: "180 Days", multiplier: 3.0, apy: 45 },
];

export default function FBTStakingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Local state
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedTimelock, setSelectedTimelock] = useState(TIMELOCK_OPTIONS[0]);
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");

  // Fetch user's FBT stake
  const { stake: myStake, isLoading: stakeLoading } = useMyFBTStake();

  // Mock FBT balance (TODO: fetch from contract)
  const fbtBalance = 1000;

  // Calculate days until unlock
  const daysUntilUnlock = myStake && myStake.isActive ?
    Math.max(0, Math.floor((new Date(myStake.stakedAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setStakeAmount(value);
    }
  };

  const handleMaxClick = () => {
    if (activeTab === "stake") {
      setStakeAmount(fbtBalance.toString());
    } else if (myStake) {
      setStakeAmount(myStake.amount);
    }
  };

  const handleStake = () => {
    console.log("Stake FBT:", { amount: stakeAmount, timelock: selectedTimelock });
    // TODO: Implement FBT staking
  };

  const handleUnstake = () => {
    console.log("Unstake FBT:", stakeAmount);
    // TODO: Implement FBT unstaking
  };

  if (stakeLoading) {
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">FBT Token Staking</h1>
          <p className="text-text-secondary">
            Stake FBT tokens with time-locks to earn multiplied rewards from platform revenue
          </p>
        </div>

        {/* FBT Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Your FBT Balance</div>
            <div className="text-3xl font-bold text-foreground">{fbtBalance.toLocaleString()}</div>
            <div className="text-xs text-text-secondary mt-1">Available to stake</div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Currently Staked</div>
            <div className="text-3xl font-bold text-primary">
              {myStake ? parseFloat(myStake.amount).toLocaleString() : "0"}
            </div>
            <div className="text-xs text-text-secondary mt-1">FBT locked</div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Pending Yield</div>
            <div className="text-3xl font-bold text-success">
              ${myStake ? parseFloat(myStake.pendingYield || "0").toFixed(2) : "0.00"}
            </div>
            <div className="text-xs text-text-secondary mt-1">USDC rewards</div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="text-sm text-text-tertiary mb-1">Treasury Share</div>
            <div className="text-3xl font-bold text-purple-500">
              {myStake ? parseFloat(myStake.shareOfTreasury || "0").toFixed(3) : "0.000"}%
            </div>
            <div className="text-xs text-text-secondary mt-1">Of platform revenue</div>
          </div>
        </div>

        {/* Active Stake Info */}
        {myStake && myStake.isActive && (
          <div className="bg-surface-elevated border border-border-default rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Active Stake</h3>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                daysUntilUnlock > 0 ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
              )}>
                {daysUntilUnlock > 0 ? `Locked for ${daysUntilUnlock} days` : "Unlocked"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-text-tertiary">Staked Amount</div>
                <div className="text-2xl font-bold text-foreground">{parseFloat(myStake.amount).toLocaleString()} FBT</div>
              </div>
              <div>
                <div className="text-sm text-text-tertiary">Claimed Yield</div>
                <div className="text-2xl font-bold text-foreground">${parseFloat(myStake.claimedYield || "0").toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-text-tertiary">Staked Since</div>
                <div className="text-lg font-medium text-foreground">
                  {new Date(myStake.stakedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {myStake.pendingYield && parseFloat(myStake.pendingYield) > 0 && (
              <Button variant="secondary" className="mt-4" onClick={() => console.log("Claim yield")}>
                Claim ${parseFloat(myStake.pendingYield).toFixed(2)} USDC
              </Button>
            )}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staking Interface */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Stake FBT Tokens</h3>

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
                disabled={!myStake || daysUntilUnlock > 0}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                  activeTab === "unstake"
                    ? "bg-primary text-white"
                    : "bg-surface-overlay text-text-secondary hover:bg-surface-sunken",
                  (!myStake || daysUntilUnlock > 0) && "opacity-50 cursor-not-allowed"
                )}
              >
                Unstake
              </button>
            </div>

            {/* Timelock Period Selection (Stake tab only) */}
            {activeTab === "stake" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Lock Period (Higher multiplier = More rewards)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {TIMELOCK_OPTIONS.map((option) => (
                    <button
                      key={option.days}
                      onClick={() => setSelectedTimelock(option)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        selectedTimelock.days === option.days
                          ? "border-primary bg-primary/10"
                          : "border-border-subtle bg-surface-overlay hover:border-primary/50"
                      )}
                    >
                      <div className="font-bold text-foreground">{option.label}</div>
                      <div className="text-xs text-text-secondary mt-1">
                        {option.multiplier}x multiplier
                      </div>
                      <div className="text-sm text-primary font-semibold mt-1">
                        {option.apy}% APY
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount (FBT)
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
              <div className="text-xs text-text-tertiary mt-1">
                {activeTab === "stake"
                  ? `Balance: ${fbtBalance.toLocaleString()} FBT`
                  : myStake && `Staked: ${parseFloat(myStake.amount).toLocaleString()} FBT`
                }
              </div>
            </div>

            {/* Rewards Preview (Stake tab only) */}
            {activeTab === "stake" && stakeAmount && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="text-sm text-text-secondary mb-2">Estimated Rewards:</div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Base APY:</span>
                  <span className="font-bold text-primary">{selectedTimelock.apy}%</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-foreground">Annual Yield:</span>
                  <span className="font-bold text-success">
                    ${((parseFloat(stakeAmount) * selectedTimelock.apy) / 100).toFixed(2)} USDC
                  </span>
                </div>
              </div>
            )}

            {/* Unlock Warning (Unstake tab only) */}
            {activeTab === "unstake" && daysUntilUnlock > 0 && (
              <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="text-sm text-warning">
                  ⚠️ Your stake is still locked for {daysUntilUnlock} more days. You cannot unstake until the timelock period ends.
                </div>
              </div>
            )}

            {/* Action Button */}
            {!isConnected ? (
              <Button fullWidth size="lg" onClick={() => router.push("/auth")}>
                Connect Wallet
              </Button>
            ) : activeTab === "stake" ? (
              <Button
                fullWidth
                size="lg"
                onClick={handleStake}
                disabled={!stakeAmount || parseFloat(stakeAmount) > fbtBalance}
              >
                Stake {stakeAmount || "0"} FBT for {selectedTimelock.days} Days
              </Button>
            ) : (
              <Button
                fullWidth
                size="lg"
                onClick={handleUnstake}
                disabled={!stakeAmount || daysUntilUnlock > 0}
                variant="secondary"
              >
                {daysUntilUnlock > 0 ? `Locked for ${daysUntilUnlock} days` : "Unstake FBT"}
              </Button>
            )}
          </div>

          {/* Timelock Rewards Info */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-6">Timelock Rewards</h3>

            <div className="space-y-4 mb-6">
              {TIMELOCK_OPTIONS.map((option) => (
                <div key={option.days} className="p-4 bg-surface-sunken rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-foreground">{option.label} Lock</span>
                    <span className="text-sm font-bold text-primary">{option.multiplier}x</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-tertiary">APY:</span>
                    <span className="font-semibold text-success">{option.apy}%</span>
                  </div>
                  <div className="text-xs text-text-secondary mt-2">
                    Lock your FBT for {option.days} days to earn {option.multiplier}x rewards from platform revenue
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-surface-sunken rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground mb-2">How FBT Staking Works:</h4>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Earn yield from platform revenue (fees, donations)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Longer lock periods earn higher multipliers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Rewards paid in USDC automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <span>Claim yield anytime, even while locked</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">⚠</span>
                  <span>Cannot unstake until timelock period ends</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
