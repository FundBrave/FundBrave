"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Plus,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ThumbsUp,
  ThumbsDown,
  ArrowRight
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

type ProposalStatus = "active" | "passed" | "rejected" | "pending" | "executed";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  startTime: string;
  endTime: string;
  executionTime?: string;
  category: "yield-allocation" | "parameter-change" | "treasury" | "general";
}

const mockProposals: Proposal[] = [
  {
    id: "prop-1",
    title: "Increase Staker Yield Allocation to 35%",
    description: "Proposal to increase the yield allocation to stakers from 30% to 35%, decreasing platform share from 20% to 15%.",
    proposer: "0x1234...5678",
    status: "active",
    votesFor: 125000,
    votesAgainst: 45000,
    totalVotes: 170000,
    quorum: 100000,
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 5).toISOString(),
    category: "yield-allocation",
  },
  {
    id: "prop-2",
    title: "Fund Green Energy Campaign Initiative",
    description: "Allocate 50,000 USDC from treasury to promote verified green energy campaigns with matching donations.",
    proposer: "0x2345...6789",
    status: "active",
    votesFor: 89000,
    votesAgainst: 67000,
    totalVotes: 156000,
    quorum: 100000,
    startTime: new Date(Date.now() - 86400000 * 1).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 6).toISOString(),
    category: "treasury",
  },
  {
    id: "prop-3",
    title: "Reduce Minimum Staking Period to 7 Days",
    description: "Lower the minimum staking lock period from 14 days to 7 days to improve liquidity for stakers.",
    proposer: "0x3456...7890",
    status: "passed",
    votesFor: 234000,
    votesAgainst: 78000,
    totalVotes: 312000,
    quorum: 100000,
    startTime: new Date(Date.now() - 86400000 * 10).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 3).toISOString(),
    executionTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    category: "parameter-change",
  },
  {
    id: "prop-4",
    title: "Implement Quadratic Voting for Governance",
    description: "Switch from linear FBT-weighted voting to quadratic voting to reduce whale influence and improve decentralization.",
    proposer: "0x4567...8901",
    status: "rejected",
    votesFor: 67000,
    votesAgainst: 189000,
    totalVotes: 256000,
    quorum: 100000,
    startTime: new Date(Date.now() - 86400000 * 20).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 13).toISOString(),
    category: "general",
  },
];

export default function ProposalsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading] = useState(false);

  // Filter proposals
  const filteredProposals = mockProposals.filter((proposal) => {
    if (filterStatus === "all") return true;
    return proposal.status === filterStatus;
  });

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Clock className="w-3 h-3" />
            Active
          </span>
        );
      case "passed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Passed
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-error/10 text-error text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case "executed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            Executed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/10 text-gray-500 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const getCategoryColor = (category: Proposal["category"]) => {
    switch (category) {
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

  const getTimeRemaining = (endTime: string) => {
    const now = Date.now();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">DAO Proposals</h1>
            <p className="text-text-secondary">Vote on proposals to shape the future of FundBrave</p>
          </div>
          <Button
            onClick={() => router.push("/dao/proposals/create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Proposal
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4">
            <div className="text-sm text-text-tertiary mb-1">Active Proposals</div>
            <div className="text-2xl font-bold text-foreground">
              {mockProposals.filter((p) => p.status === "active").length}
            </div>
          </div>
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4">
            <div className="text-sm text-text-tertiary mb-1">Total Proposals</div>
            <div className="text-2xl font-bold text-foreground">{mockProposals.length}</div>
          </div>
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4">
            <div className="text-sm text-text-tertiary mb-1">Passed</div>
            <div className="text-2xl font-bold text-success">
              {mockProposals.filter((p) => p.status === "passed").length}
            </div>
          </div>
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4">
            <div className="text-sm text-text-tertiary mb-1">Participation Rate</div>
            <div className="text-2xl font-bold text-primary">78%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-text-secondary mr-2">Filter:</span>
            {["all", "active", "passed", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                  filterStatus === status
                    ? "bg-primary text-white"
                    : "bg-surface-sunken text-text-secondary hover:bg-surface-overlay"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Proposals List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-12 text-center">
            <Users className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Proposals Found</h3>
            <p className="text-text-secondary mb-6">
              {filterStatus === "all"
                ? "Be the first to create a proposal"
                : `No ${filterStatus} proposals at this time`}
            </p>
            {filterStatus === "all" && (
              <Button onClick={() => router.push("/dao/proposals/create")}>
                Create Proposal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => {
              const quorumReached = proposal.totalVotes >= proposal.quorum;
              const votePercentage =
                proposal.totalVotes > 0
                  ? (proposal.votesFor / proposal.totalVotes) * 100
                  : 0;

              return (
                <button
                  key={proposal.id}
                  onClick={() => router.push(`/dao/proposals/${proposal.id}`)}
                  className="w-full bg-surface-elevated border border-border-subtle hover:border-primary/30 rounded-xl p-6 transition-all text-left group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {proposal.title}
                        </h3>
                        <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {proposal.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusBadge(proposal.status)}
                    </div>
                  </div>

                  {/* Category and Time */}
                  <div className="flex items-center gap-3 mb-4 text-xs">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full capitalize",
                        getCategoryColor(proposal.category)
                      )}
                    >
                      {proposal.category.replace("-", " ")}
                    </span>
                    <span className="text-text-tertiary">
                      Proposed by {proposal.proposer}
                    </span>
                    {proposal.status === "active" && (
                      <span className="text-warning flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(proposal.endTime)}
                      </span>
                    )}
                  </div>

                  {/* Voting Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-success">
                          <ThumbsUp className="w-4 h-4" />
                          {proposal.votesFor.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-error">
                          <ThumbsDown className="w-4 h-4" />
                          {proposal.votesAgainst.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-text-tertiary">
                        {votePercentage.toFixed(1)}% in favor
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
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

                    {/* Quorum Status */}
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span>
                        {proposal.totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()}{" "}
                        votes (Quorum)
                      </span>
                      {quorumReached && (
                        <span className="text-success flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Quorum reached
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
