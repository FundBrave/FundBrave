"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Users,
  TrendingUp,
  Vote,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Plus,
  Coins,
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface RecentProposal {
  id: string;
  title: string;
  status: "active" | "passed" | "rejected";
  votesFor: number;
  votesAgainst: number;
  category: string;
}

// Mock data - Replace with GraphQL queries
const mockStats = {
  totalProposals: 24,
  activeProposals: 2,
  passedProposals: 18,
  rejectedProposals: 4,
  totalVotes: 1250000,
  uniqueVoters: 3456,
  participationRate: 78,
  treasuryValue: 2500000,
  fbtStaked: 15000000,
};

const mockRecentProposals: RecentProposal[] = [
  {
    id: "prop-1",
    title: "Increase Staker Yield Allocation to 35%",
    status: "active",
    votesFor: 125000,
    votesAgainst: 45000,
    category: "Yield Allocation",
  },
  {
    id: "prop-2",
    title: "Fund Green Energy Campaign Initiative",
    status: "active",
    votesFor: 89000,
    votesAgainst: 67000,
    category: "Treasury",
  },
  {
    id: "prop-3",
    title: "Reduce Minimum Staking Period to 7 Days",
    status: "passed",
    votesFor: 234000,
    votesAgainst: 78000,
    category: "Parameter Change",
  },
];

export default function GovernanceDashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const getStatusBadge = (status: "active" | "passed" | "rejected") => {
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
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Vote className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to participate in governance
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Governance Dashboard</h1>
            <p className="text-text-secondary">
              Participate in FundBrave DAO governance and shape the platform's future
            </p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-tertiary">Total Proposals</div>
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {mockStats.totalProposals}
            </div>
            <div className="text-xs text-text-secondary">
              {mockStats.activeProposals} active
            </div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-tertiary">Participation Rate</div>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary mb-1">
              {mockStats.participationRate}%
            </div>
            <div className="text-xs text-text-secondary">
              {mockStats.uniqueVoters.toLocaleString()} voters
            </div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-tertiary">Treasury Value</div>
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              ${(mockStats.treasuryValue / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-success">+12.3% this month</div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-tertiary">FBT Staked</div>
              <Vote className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {(mockStats.fbtStaked / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-text-secondary">Voting power</div>
          </div>
        </div>

        {/* Proposal Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-success/20 to-success/5 border border-success/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {mockStats.passedProposals}
                </div>
                <div className="text-sm text-text-secondary">Passed Proposals</div>
              </div>
            </div>
            <div className="text-xs text-text-tertiary">
              {((mockStats.passedProposals / mockStats.totalProposals) * 100).toFixed(0)}% success
              rate
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {mockStats.activeProposals}
                </div>
                <div className="text-sm text-text-secondary">Active Proposals</div>
              </div>
            </div>
            <div className="text-xs text-text-tertiary">Vote now to participate</div>
          </div>

          <div className="bg-gradient-to-br from-error/20 to-error/5 border border-error/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {mockStats.rejectedProposals}
                </div>
                <div className="text-sm text-text-secondary">Rejected Proposals</div>
              </div>
            </div>
            <div className="text-xs text-text-tertiary">Did not meet quorum or votes</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push("/dao/proposals")}
            className="bg-surface-elevated border border-border-subtle hover:border-primary/30 rounded-xl p-6 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <Vote className="w-8 h-8 text-primary" />
              <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">View All Proposals</h3>
            <p className="text-sm text-text-secondary">
              Browse and vote on active governance proposals
            </p>
          </button>

          <button
            onClick={() => router.push("/staking/dao")}
            className="bg-surface-elevated border border-border-subtle hover:border-primary/30 rounded-xl p-6 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <Coins className="w-8 h-8 text-primary" />
              <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Stake to Impact DAO</h3>
            <p className="text-sm text-text-secondary">
              Stake tokens to earn yield and gain voting power
            </p>
          </button>

          <button
            onClick={() => router.push("/dao/proposals/create")}
            className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 hover:border-primary/50 rounded-xl p-6 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <Plus className="w-8 h-8 text-primary" />
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Create Proposal</h3>
            <p className="text-sm text-text-secondary">
              Submit a new proposal for community voting
            </p>
          </button>
        </div>

        {/* Recent Proposals */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Proposals
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dao/proposals")}
              >
                View All
              </Button>
            </div>
          </div>

          <div className="divide-y divide-border-subtle">
            {mockRecentProposals.map((proposal) => {
              const totalVotes = proposal.votesFor + proposal.votesAgainst;
              const votePercentage = (proposal.votesFor / totalVotes) * 100;

              return (
                <button
                  key={proposal.id}
                  onClick={() => router.push(`/dao/proposals/${proposal.id}`)}
                  className="w-full p-6 hover:bg-surface-overlay transition-colors text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(proposal.status)}
                        <span className="text-xs text-text-tertiary px-2 py-0.5 rounded-full bg-surface-sunken">
                          {proposal.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {proposal.title}
                      </h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                  </div>

                  {/* Voting Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span>
                        {proposal.votesFor.toLocaleString()} for ·{" "}
                        {proposal.votesAgainst.toLocaleString()} against
                      </span>
                      <span>{votePercentage.toFixed(1)}% in favor</span>
                    </div>
                    <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div
                          className="bg-success"
                          style={{ width: `${votePercentage}%` }}
                        />
                        <div
                          className="bg-error"
                          style={{ width: `${100 - votePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
