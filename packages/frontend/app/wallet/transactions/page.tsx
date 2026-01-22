"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

// Mock transaction data - Replace with actual blockchain query
interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: "success" | "pending" | "failed";
  type: "sent" | "received" | "contract" | "swap" | "stake" | "unstake" | "donate";
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  campaignName?: string;
}

const mockTransactions: Transaction[] = [
  {
    hash: "0x1234...5678",
    from: "0xabcd...ef01",
    to: "0x9876...5432",
    value: "0.5",
    timestamp: Date.now() - 3600000,
    status: "success",
    type: "donate",
    gasUsed: "21000",
    gasPrice: "50",
    blockNumber: 18500000,
    campaignName: "Clean Water Initiative",
  },
  {
    hash: "0x2345...6789",
    from: "0x9876...5432",
    to: "0xabcd...ef01",
    value: "1.2",
    timestamp: Date.now() - 7200000,
    status: "success",
    type: "received",
    gasUsed: "21000",
    gasPrice: "45",
    blockNumber: 18499500,
  },
  {
    hash: "0x3456...7890",
    from: "0xabcd...ef01",
    to: "0xdef0...1234",
    value: "2.0",
    timestamp: Date.now() - 86400000,
    status: "success",
    type: "stake",
    gasUsed: "65000",
    gasPrice: "42",
    blockNumber: 18490000,
  },
  {
    hash: "0x4567...8901",
    from: "0xabcd...ef01",
    to: "0x1111...2222",
    value: "0.1",
    timestamp: Date.now() - 172800000,
    status: "pending",
    type: "sent",
    gasUsed: "21000",
    gasPrice: "55",
  },
  {
    hash: "0x5678...9012",
    from: "0xabcd...ef01",
    to: "0x3333...4444",
    value: "0.05",
    timestamp: Date.now() - 259200000,
    status: "failed",
    type: "contract",
    gasUsed: "50000",
    gasPrice: "60",
    blockNumber: 18450000,
  },
];

export default function TransactionsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((tx) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.campaignName?.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = filterType === "all" || tx.type === filterType;

      // Status filter
      const matchesStatus = filterStatus === "all" || tx.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, filterType, filterStatus]);

  // Get transaction icon and color
  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "sent":
      case "donate":
      case "stake":
        return <ArrowUpRight className="w-4 h-4" />;
      case "received":
      case "unstake":
        return <ArrowDownLeft className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: Transaction["type"]) => {
    switch (type) {
      case "sent":
      case "donate":
      case "stake":
        return "text-orange-500 bg-orange-500/10";
      case "received":
      case "unstake":
        return "text-green-500 bg-green-500/10";
      default:
        return "text-blue-500 bg-blue-500/10";
    }
  };

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-error" />;
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
              Connect your wallet to view your transaction history
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Transaction History</h1>
          <p className="text-text-secondary">View all your blockchain transactions</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by hash or campaign..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-sunken border border-border-default rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-sunken border border-border-default rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="donate">Donations</option>
                <option value="stake">Staking</option>
                <option value="unstake">Unstaking</option>
                <option value="contract">Contract</option>
                <option value="swap">Swap</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-sunken border border-border-default rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-xl font-semibold mb-2">No Transactions Found</h3>
            <p className="text-text-secondary">
              {searchQuery || filterType !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Your transaction history will appear here"}
            </p>
          </div>
        ) : (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl overflow-hidden">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken border-b border-border-subtle text-xs font-medium text-text-tertiary">
              <div className="col-span-1">Type</div>
              <div className="col-span-3">Transaction Hash</div>
              <div className="col-span-2">To/From</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Time</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Link</div>
            </div>

            {/* Transaction Rows */}
            <div className="divide-y divide-border-subtle">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.hash}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-surface-overlay transition-colors"
                >
                  {/* Type Icon */}
                  <div className="col-span-1 flex items-center">
                    <div className={cn("p-2 rounded-full", getTransactionColor(tx.type))}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <span className="ml-2 text-sm font-medium capitalize md:hidden">
                      {tx.type}
                    </span>
                  </div>

                  {/* Transaction Hash */}
                  <div className="col-span-1 md:col-span-3 flex flex-col justify-center">
                    <span className="font-mono text-sm text-foreground break-all">
                      {tx.hash}
                    </span>
                    {tx.campaignName && (
                      <span className="text-xs text-text-tertiary mt-1">
                        {tx.campaignName}
                      </span>
                    )}
                  </div>

                  {/* To/From */}
                  <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                    <span className="text-xs text-text-tertiary mb-0.5">
                      {tx.type === "received" ? "From" : "To"}
                    </span>
                    <span className="font-mono text-xs text-foreground">
                      {tx.type === "received" ? tx.from : tx.to}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                    <span className={cn(
                      "text-sm font-semibold",
                      tx.type === "received" ? "text-success" : "text-foreground"
                    )}>
                      {tx.type === "received" ? "+" : "-"}{tx.value} ETH
                    </span>
                    {tx.gasUsed && (
                      <span className="text-xs text-text-tertiary">
                        Gas: {(parseInt(tx.gasUsed) * parseInt(tx.gasPrice || "0") / 1e9).toFixed(5)} ETH
                      </span>
                    )}
                  </div>

                  {/* Time */}
                  <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                    <span className="text-sm text-foreground">
                      {format(new Date(tx.timestamp), "MMM d, yyyy")}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {format(new Date(tx.timestamp), "h:mm a")}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(tx.status)}
                      <span className="text-xs capitalize md:hidden">{tx.status}</span>
                    </div>
                  </div>

                  {/* Explorer Link */}
                  <div className="col-span-1 flex items-center">
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-hover transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && filteredTransactions.length > 0 && (
          <div className="mt-4 text-center text-sm text-text-tertiary">
            Showing {filteredTransactions.length} of {mockTransactions.length} transactions
          </div>
        )}
      </div>
    </div>
  );
}
