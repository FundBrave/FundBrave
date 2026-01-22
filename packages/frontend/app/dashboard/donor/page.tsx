"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import {
  Heart,
  TrendingUp,
  Award,
  FileText,
  Calendar,
  DollarSign,
  ExternalLink,
  Download
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

// Mock donation data - Replace with actual GraphQL query
interface Donation {
  id: string;
  campaign: {
    id: string;
    name: string;
    image: string;
  };
  amount: string; // in wei
  tokenSymbol: string;
  timestamp: string;
  transactionHash: string;
  donationType: "direct" | "wealth-building" | "stake";
  hasReceipt: boolean;
}

const mockDonations: Donation[] = [
  {
    id: "don-1",
    campaign: {
      id: "camp-1",
      name: "Clean Water Initiative",
      image: "https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?w=100&h=100&fit=crop",
    },
    amount: "500000000000000000", // 0.5 ETH
    tokenSymbol: "ETH",
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    transactionHash: "0x1234...5678",
    donationType: "direct",
    hasReceipt: true,
  },
  {
    id: "don-2",
    campaign: {
      id: "camp-2",
      name: "Girls Education Fund",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=100&h=100&fit=crop",
    },
    amount: "1200000000000000000", // 1.2 ETH
    tokenSymbol: "ETH",
    timestamp: new Date(Date.now() - 86400000 * 15).toISOString(),
    transactionHash: "0x2345...6789",
    donationType: "wealth-building",
    hasReceipt: true,
  },
  {
    id: "don-3",
    campaign: {
      id: "camp-3",
      name: "Community Health Clinic",
      image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=100&h=100&fit=crop",
    },
    amount: "2000000000000000000", // 2.0 ETH
    tokenSymbol: "ETH",
    timestamp: new Date(Date.now() - 86400000 * 30).toISOString(),
    transactionHash: "0x3456...7890",
    donationType: "stake",
    hasReceipt: true,
  },
];

export default function DonorDashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [isLoading] = React.useState(false);

  // Calculate stats from donations
  const stats = useMemo(() => {
    const totalDonated = mockDonations.reduce((sum, don) => {
      return sum + parseFloat(formatEther(BigInt(don.amount)));
    }, 0);

    const campaignsSupported = new Set(mockDonations.map((d) => d.campaign.id)).size;

    const recentDonations = mockDonations.filter((don) => {
      const daysSince = (Date.now() - new Date(don.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });

    return {
      totalDonated,
      campaignsSupported,
      totalDonations: mockDonations.length,
      recentDonations: recentDonations.length,
      avgDonation: totalDonated / mockDonations.length || 0,
    };
  }, []);

  // Group donations by month for chart data
  const monthlyData = useMemo(() => {
    const monthlyTotals = new Map<string, number>();

    mockDonations.forEach((don) => {
      const date = new Date(don.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = parseFloat(formatEther(BigInt(don.amount)));
      monthlyTotals.set(key, (monthlyTotals.get(key) || 0) + amount);
    });

    return Array.from(monthlyTotals.entries())
      .sort()
      .slice(-6); // Last 6 months
  }, []);

  const handleViewReceipt = (donationId: string) => {
    // TODO: Implement receipt viewing
    console.log("View receipt for:", donationId);
  };

  const handleDownloadReceipts = () => {
    // TODO: Implement bulk receipt download
    console.log("Download all receipts");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to view your donation history
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Donor Dashboard</h1>
          <p className="text-text-secondary">Track your impact and donation history</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground/80">Total Donated</span>
                </div>
                <div className="text-3xl font-bold text-foreground">{stats.totalDonated.toFixed(2)} ETH</div>
                <div className="text-xs text-success mt-1">All-time giving</div>
              </div>

              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="w-5 h-5 text-primary" />
                  <span className="text-sm text-text-tertiary">Campaigns Supported</span>
                </div>
                <div className="text-3xl font-bold text-foreground">{stats.campaignsSupported}</div>
                <div className="text-xs text-text-secondary mt-1">Unique campaigns</div>
              </div>

              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-sm text-text-tertiary">Total Donations</span>
                </div>
                <div className="text-3xl font-bold text-foreground">{stats.totalDonations}</div>
                <div className="text-xs text-text-secondary mt-1">{stats.recentDonations} this month</div>
              </div>

              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-sm text-text-tertiary">Avg Donation</span>
                </div>
                <div className="text-3xl font-bold text-foreground">{stats.avgDonation.toFixed(3)} ETH</div>
                <div className="text-xs text-text-secondary mt-1">Per campaign</div>
              </div>
            </div>

            {/* Monthly Chart */}
            <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">Donation History (Last 6 Months)</h3>
              <div className="h-48 flex items-end gap-3">
                {monthlyData.map(([month, amount], idx) => {
                  const maxAmount = Math.max(...monthlyData.map(([, a]) => a));
                  const height = (amount / maxAmount) * 100;

                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end flex-1">
                        <div className="text-xs font-medium text-foreground mb-1">
                          {amount.toFixed(2)} ETH
                        </div>
                        <div
                          className="w-full bg-gradient-to-t from-primary to-purple-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                          style={{ height: `${height}%`, minHeight: "20px" }}
                          title={`${month}: ${amount.toFixed(2)} ETH`}
                        />
                      </div>
                      <div className="text-[10px] text-text-tertiary">
                        {new Date(month + "-01").toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tax Receipts Section */}
            <div className="bg-gradient-to-br from-success/10 to-green-500/10 border border-success/20 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-success" />
                    Tax Receipts Available
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Download your donation receipts for tax purposes
                  </p>
                </div>
                <Button onClick={handleDownloadReceipts} variant="secondary" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download All
                </Button>
              </div>
            </div>

            {/* Donation History Table */}
            <div className="bg-surface-elevated border border-border-subtle rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border-subtle">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Donation History
                </h3>
              </div>

              {mockDonations.length === 0 ? (
                <div className="p-12 text-center">
                  <Heart className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">No Donations Yet</h4>
                  <p className="text-sm text-text-secondary mb-6">
                    Start making an impact by supporting campaigns
                  </p>
                  <Button onClick={() => router.push("/campaigns")}>Browse Campaigns</Button>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {mockDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="p-4 hover:bg-surface-overlay transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Campaign Image */}
                        <img
                          src={donation.campaign.image}
                          alt={donation.campaign.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />

                        {/* Campaign Info */}
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => router.push(`/campaigns/${donation.campaign.id}`)}
                            className="font-semibold text-foreground hover:text-primary transition-colors text-left"
                          >
                            {donation.campaign.name}
                          </button>
                          <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                            <span>{new Date(donation.timestamp).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{donation.donationType.replace("-", " ")}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <div className="font-bold text-lg text-success">
                            {formatEther(BigInt(donation.amount))} {donation.tokenSymbol}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            ~$1,234.56
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {donation.hasReceipt && (
                            <Button
                              onClick={() => handleViewReceipt(donation.id)}
                              variant="outline"
                              size="sm"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Receipt
                            </Button>
                          )}
                          <a
                            href={`https://etherscan.io/tx/${donation.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-hover transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
