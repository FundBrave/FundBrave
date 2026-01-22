"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Vote,
  TrendingUp,
  Users,
  Coins,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Info,
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface YieldAllocation {
  id: string;
  name: string;
  description: string;
  currentPercentage: number;
  proposedPercentage: number;
  icon: React.ReactNode;
}

interface EpochInfo {
  currentEpoch: number;
  timeRemaining: string;
  totalVotingPower: number;
  participationRate: number;
  quorumRequired: number;
  quorumReached: boolean;
}

// Mock epoch data - Replace with actual contract data
const mockEpochInfo: EpochInfo = {
  currentEpoch: 12,
  timeRemaining: "2 days 14 hours",
  totalVotingPower: 2450000,
  participationRate: 67.3,
  quorumRequired: 50,
  quorumReached: true,
};

// Mock yield allocations - Replace with actual contract data
const mockAllocations: YieldAllocation[] = [
  {
    id: "stakers",
    name: "Stakers",
    description: "Distributed to FBT token stakers",
    currentPercentage: 30,
    proposedPercentage: 35,
    icon: <Coins className="w-5 h-5" />,
  },
  {
    id: "creators",
    name: "Campaign Creators",
    description: "Allocated to active fundraiser campaigns",
    currentPercentage: 50,
    proposedPercentage: 45,
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: "platform",
    name: "Platform Treasury",
    description: "Reserved for platform development and operations",
    currentPercentage: 15,
    proposedPercentage: 15,
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "dao",
    name: "DAO Reserve",
    description: "Held for governance-approved initiatives",
    currentPercentage: 5,
    proposedPercentage: 5,
    icon: <Vote className="w-5 h-5" />,
  },
];

export default function EpochVotingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [selectedAllocations, setSelectedAllocations] = useState<
    Record<string, number>
  >({
    stakers: 35,
    creators: 45,
    platform: 15,
    dao: 5,
  });
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAllocation = Object.values(selectedAllocations).reduce(
    (sum, val) => sum + val,
    0
  );
  const isValidAllocation = totalAllocation === 100;

  const handleSliderChange = (id: string, value: number) => {
    setSelectedAllocations((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmitVote = async () => {
    if (!isValidAllocation) return;

    setIsSubmitting(true);

    // Simulate vote submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In real app: Call smart contract to submit epoch vote
    // Then save to backend via GraphQL mutation

    setHasVoted(true);
    setIsSubmitting(false);
  };

  const handleResetToProposed = () => {
    setSelectedAllocations({
      stakers: 35,
      creators: 45,
      platform: 15,
      dao: 5,
    });
  };

  const handleResetToCurrent = () => {
    setSelectedAllocations({
      stakers: 30,
      creators: 50,
      platform: 15,
      dao: 5,
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to participate in epoch voting
            </p>
            <Button onClick={() => router.push("/auth")}>Connect Wallet</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <button
          onClick={() => router.push("/staking/dao")}
          className="text-text-secondary hover:text-foreground mb-6 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Impact DAO
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Epoch Yield Allocation Voting
          </h1>
          <p className="text-text-secondary">
            Vote on how platform yield should be distributed this epoch
          </p>
        </div>

        {/* Epoch Info Card */}
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/20 rounded-full p-2">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Epoch #{mockEpochInfo.currentEpoch}
              </h3>
              <p className="text-sm text-text-tertiary">
                Voting ends in {mockEpochInfo.timeRemaining}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-text-tertiary mb-1">
                Total Voting Power
              </div>
              <div className="text-2xl font-bold text-foreground">
                {mockEpochInfo.totalVotingPower.toLocaleString()} FBT
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary mb-1">
                Participation Rate
              </div>
              <div className="text-2xl font-bold text-primary">
                {mockEpochInfo.participationRate}%
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary mb-1">
                Quorum Status
              </div>
              <div className="flex items-center gap-2">
                {mockEpochInfo.quorumReached ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-lg font-semibold text-success">
                      Reached
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-warning" />
                    <span className="text-lg font-semibold text-warning">
                      Not Reached
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Voting Section */}
        {hasVoted ? (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-success/20 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Vote Submitted!
            </h2>
            <p className="text-text-secondary mb-6">
              Your allocation preferences have been recorded for Epoch #
              {mockEpochInfo.currentEpoch}. Results will be applied at the end
              of the voting period.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push("/staking/dao")}
              >
                Back to DAO
              </Button>
              <Button variant="outline" onClick={() => setHasVoted(false)}>
                View My Vote
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Info Banner */}
            <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-text-secondary">
                <p className="mb-2">
                  Your voting power is weighted by your FBT stake in the Impact
                  DAO pool. Adjust the sliders below to allocate 100% of yield
                  distribution across categories.
                </p>
                <p>
                  <strong>Total must equal 100%</strong> to submit your vote.
                </p>
              </div>
            </div>

            {/* Allocation Sliders */}
            <div className="space-y-4 mb-6">
              {mockAllocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="bg-surface-elevated border border-border-subtle rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-lg p-2">
                        {allocation.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {allocation.name}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {allocation.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {selectedAllocations[allocation.id]}%
                      </div>
                      <div className="text-xs text-text-tertiary">
                        Current: {allocation.currentPercentage}%
                      </div>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={selectedAllocations[allocation.id]}
                    onChange={(e) =>
                      handleSliderChange(allocation.id, Number(e.target.value))
                    }
                    className="w-full h-2 bg-surface-sunken rounded-lg appearance-none cursor-pointer accent-primary"
                  />

                  <div className="flex justify-between text-xs text-text-tertiary mt-2">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Allocation Display */}
            <div
              className={cn(
                "border rounded-xl p-6 mb-6",
                isValidAllocation
                  ? "bg-success/10 border-success/30"
                  : "bg-destructive/10 border-destructive/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary mb-1">
                    Total Allocation
                  </div>
                  <div
                    className={cn(
                      "text-3xl font-bold",
                      isValidAllocation ? "text-success" : "text-destructive"
                    )}
                  >
                    {totalAllocation}%
                  </div>
                </div>
                {isValidAllocation ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                )}
              </div>
              {!isValidAllocation && (
                <p className="text-sm text-destructive mt-2">
                  Total must equal 100% to submit vote
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleResetToCurrent}
                className="flex-1"
              >
                Reset to Current
              </Button>
              <Button
                variant="outline"
                onClick={handleResetToProposed}
                className="flex-1"
              >
                Use Proposed
              </Button>
              <Button
                onClick={handleSubmitVote}
                disabled={!isValidAllocation || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Vote className="w-4 h-4 mr-2" />
                    Submit Vote
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
