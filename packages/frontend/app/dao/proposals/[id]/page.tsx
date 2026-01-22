"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

type ProposalStatus = "active" | "passed" | "rejected" | "pending" | "executed";

interface ProposalDetails {
  id: string;
  title: string;
  description: string;
  proposer: string;
  proposerName?: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  startTime: string;
  endTime: string;
  executionTime?: string;
  category: "yield-allocation" | "parameter-change" | "treasury" | "general";
  details: {
    currentValue?: string;
    proposedValue?: string;
    impact?: string;
    timeline?: string;
  };
}

// Mock proposal data - Replace with actual GraphQL query
const mockProposal: ProposalDetails = {
  id: "prop-1",
  title: "Increase Staker Yield Allocation to 35%",
  description: `
This proposal seeks to increase the yield allocation to stakers from the current 30% to 35%, while decreasing the platform's share from 20% to 15%.

## Rationale

The FundBrave platform has seen tremendous growth in staking participation over the past quarter, with TVL increasing by 150%. To reward our loyal stakers and encourage continued platform growth, we propose increasing the staker yield share.

## Impact Analysis

- **Stakers:** Will receive 16.7% more yield on their stakes
- **Platform:** Will receive 25% less revenue (from 20% to 15%)
- **Campaign Creators:** No change (remains at 50%)

## Implementation

If passed, this change will be implemented at the start of the next epoch (7 days after proposal execution).

## Risk Assessment

**LOW RISK** - This change maintains healthy platform operations while rewarding stakers. Platform revenue will remain sufficient for development and operations.
  `,
  proposer: "0x1234567890123456789012345678901234567890",
  proposerName: "Core Team",
  status: "active",
  votesFor: 125000,
  votesAgainst: 45000,
  totalVotes: 170000,
  quorum: 100000,
  startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
  endTime: new Date(Date.now() + 86400000 * 5).toISOString(),
  category: "yield-allocation",
  details: {
    currentValue: "30% to stakers, 20% to platform, 50% to creators",
    proposedValue: "35% to stakers, 15% to platform, 50% to creators",
    impact: "+16.7% yield for stakers, -25% platform revenue",
    timeline: "Implemented at next epoch start (7 days post-execution)",
  },
};

// Mock user voting power - Replace with actual FBT balance query
const mockVotingPower = 5000;

export default function ProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { address, isConnected } = useAccount();

  const [isVoting, setIsVoting] = useState(false);
  const [userVote, setUserVote] = useState<"for" | "against" | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const proposal = mockProposal; // In real app, fetch by params.id

  const quorumReached = proposal.totalVotes >= proposal.quorum;
  const votePercentage =
    proposal.totalVotes > 0 ? (proposal.votesFor / proposal.totalVotes) * 100 : 0;

  const getTimeRemaining = () => {
    const now = Date.now();
    const end = new Date(proposal.endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return "Voting ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const handleVote = async (vote: "for" | "against") => {
    if (!isConnected || hasVoted) return;

    setIsVoting(true);
    setUserVote(vote);

    // Simulate voting transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setHasVoted(true);
    setIsVoting(false);

    // In real app: Call smart contract vote function
    // Then update backend via GraphQL mutation
  };

  const getStatusBadge = () => {
    switch (proposal.status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Clock className="w-4 h-4" />
            Active
          </span>
        );
      case "passed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Passed
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-error/10 text-error text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      case "executed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            Executed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-500/10 text-gray-500 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  const getCategoryColor = () => {
    switch (proposal.category) {
      case "yield-allocation":
        return "text-purple-400 bg-purple-500/10";
      case "parameter-change":
        return "text-blue-400 bg-blue-500/10";
      case "treasury":
        return "text-green-400 bg-green-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to view and vote on proposals
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <button
          onClick={() => router.push("/dao/proposals")}
          className="text-text-secondary hover:text-foreground mb-6 flex items-center gap-2 transition-colors"
        >
          ← Back to Proposals
        </button>

        {/* Proposal Header */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {getStatusBadge()}
                <span
                  className={cn("px-2 py-1 rounded-full text-xs capitalize", getCategoryColor())}
                >
                  {proposal.category.replace("-", " ")}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{proposal.title}</h1>
              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Proposed by {proposal.proposerName || proposal.proposer.slice(0, 10) + "..."}
                </span>
                {proposal.status === "active" && (
                  <span className="flex items-center gap-1 text-warning">
                    <Calendar className="w-4 h-4" />
                    {getTimeRemaining()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Voting Progress */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Voting Results</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-success font-medium">
                  <ThumbsUp className="w-5 h-5" />
                  For: {proposal.votesFor.toLocaleString()} votes
                </span>
                <span className="flex items-center gap-2 text-error font-medium">
                  <ThumbsDown className="w-5 h-5" />
                  Against: {proposal.votesAgainst.toLocaleString()} votes
                </span>
              </div>
              <div className="text-text-tertiary">{votePercentage.toFixed(1)}% in favor</div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-surface-sunken rounded-full overflow-hidden">
              <div className="h-full flex">
                <div
                  className="bg-success"
                  style={{
                    width: `${(proposal.votesFor / proposal.totalVotes) * 100}%`,
                  }}
                />
                <div
                  className="bg-error"
                  style={{
                    width: `${(proposal.votesAgainst / proposal.totalVotes) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Quorum Tracking */}
            <div className="mt-6 pt-6 border-t border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Quorum Requirement
                </span>
                <span className={cn(
                  "text-sm font-semibold flex items-center gap-1",
                  quorumReached ? "text-success" : "text-warning"
                )}>
                  {quorumReached ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Reached
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Not Reached
                    </>
                  )}
                </span>
              </div>

              {/* Quorum Progress Bar */}
              <div className="relative h-4 bg-surface-sunken rounded-full overflow-hidden mb-2">
                <div
                  className={cn(
                    "h-full transition-all duration-500 relative",
                    quorumReached
                      ? "bg-gradient-to-r from-success to-green-400"
                      : "bg-gradient-to-r from-warning to-orange-400"
                  )}
                  style={{
                    width: `${Math.min((proposal.totalVotes / proposal.quorum) * 100, 100)}%`,
                  }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>

                {/* Quorum threshold marker (at 100%) */}
                <div className="absolute top-0 right-0 h-full w-0.5 bg-foreground/30" />
              </div>

              {/* Quorum Stats */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-text-tertiary">
                    <strong className="text-foreground font-semibold">
                      {proposal.totalVotes.toLocaleString()}
                    </strong>
                    {" / "}
                    <strong className="text-foreground font-semibold">
                      {proposal.quorum.toLocaleString()}
                    </strong>
                    {" votes"}
                  </span>
                  <span className={cn(
                    "font-medium px-2 py-0.5 rounded-full",
                    quorumReached
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  )}>
                    {((proposal.totalVotes / proposal.quorum) * 100).toFixed(1)}% of quorum
                  </span>
                </div>
                {!quorumReached && (
                  <span className="text-text-tertiary">
                    {(proposal.quorum - proposal.totalVotes).toLocaleString()} votes needed
                  </span>
                )}
              </div>

              {/* Quorum Info Message */}
              {!quorumReached && proposal.status === "active" && (
                <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-xs text-warning flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      This proposal requires <strong>{proposal.quorum.toLocaleString()} total votes</strong> to reach quorum. Even if the majority votes in favor, the proposal will not pass without meeting this threshold.
                    </span>
                  </p>
                </div>
              )}

              {quorumReached && (
                <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg">
                  <p className="text-xs text-success flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Quorum has been reached! The proposal will pass if the majority votes in favor when voting ends.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Your Vote */}
        {proposal.status === "active" && (
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Cast Your Vote</h3>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Users className="w-4 h-4" />
                  Your voting power: {mockVotingPower.toLocaleString()} FBT
                </div>
              </div>
            </div>

            {hasVoted ? (
              <div className="bg-surface-elevated border border-border-subtle rounded-lg p-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    You voted {userVote === "for" ? "FOR" : "AGAINST"} this proposal with{" "}
                    {mockVotingPower.toLocaleString()} FBT
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleVote("for")}
                  disabled={isVoting}
                  className="bg-success hover:bg-success/90 text-white flex items-center justify-center gap-2"
                >
                  {isVoting && userVote === "for" ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <ThumbsUp className="w-5 h-5" />
                      Vote For
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleVote("against")}
                  disabled={isVoting}
                  variant="outline"
                  className="border-error text-error hover:bg-error/10 flex items-center justify-center gap-2"
                >
                  {isVoting && userVote === "against" ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <ThumbsDown className="w-5 h-5" />
                      Vote Against
                    </>
                  )}
                </Button>
              </div>
            )}

            {!hasVoted && (
              <div className="mt-4 flex items-start gap-2 text-xs text-text-tertiary">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Your vote is weighted by your FBT token balance. Once submitted, votes cannot be
                  changed.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Proposal Details */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Proposal Details
          </h3>

          <div className="prose prose-invert max-w-none">
            <div className="text-text-secondary whitespace-pre-line leading-relaxed">
              {proposal.description}
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Technical Details</h3>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-text-tertiary mb-1">Current Value</div>
              <div className="text-foreground font-mono text-sm bg-surface-sunken p-3 rounded-lg">
                {proposal.details.currentValue}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-tertiary mb-1">Proposed Value</div>
              <div className="text-foreground font-mono text-sm bg-surface-sunken p-3 rounded-lg">
                {proposal.details.proposedValue}
              </div>
            </div>
            <div>
              <div className="text-sm text-text-tertiary mb-1">Impact</div>
              <div className="text-foreground text-sm">{proposal.details.impact}</div>
            </div>
            <div>
              <div className="text-sm text-text-tertiary mb-1">Implementation Timeline</div>
              <div className="text-foreground text-sm">{proposal.details.timeline}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
