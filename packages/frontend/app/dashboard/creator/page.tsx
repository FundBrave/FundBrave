"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Edit,
  BarChart3,
  Heart
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

// Mock campaign data - Replace with actual GraphQL query
interface Campaign {
  id: string;
  name: string;
  image: string;
  goal: number;
  raised: number;
  supporters: number;
  views: number;
  status: "active" | "completed" | "draft";
  createdAt: string;
  category: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Clean Water Initiative",
    image: "https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?w=300&h=200&fit=crop",
    goal: 50000,
    raised: 32500,
    supporters: 245,
    views: 3421,
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    category: "Environment",
  },
  {
    id: "camp-2",
    name: "Girls Education Fund",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&h=200&fit=crop",
    goal: 75000,
    raised: 48000,
    supporters: 512,
    views: 5234,
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    category: "Education",
  },
  {
    id: "camp-3",
    name: "Community Health Clinic",
    image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=300&h=200&fit=crop",
    goal: 100000,
    raised: 100000,
    supporters: 623,
    views: 7892,
    status: "completed",
    createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
    category: "Healthcare",
  },
];

export default function CreatorDashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [isLoading] = React.useState(false);

  // Calculate aggregate stats
  const stats = useMemo(() => {
    const totalRaised = mockCampaigns.reduce((sum, c) => sum + c.raised, 0);
    const totalGoal = mockCampaigns.reduce((sum, c) => sum + c.goal, 0);
    const totalSupporters = mockCampaigns.reduce((sum, c) => sum + c.supporters, 0);
    const totalViews = mockCampaigns.reduce((sum, c) => sum + c.views, 0);
    const activeCampaigns = mockCampaigns.filter((c) => c.status === "active").length;
    const completedCampaigns = mockCampaigns.filter((c) => c.status === "completed").length;

    return {
      totalRaised,
      totalGoal,
      totalSupporters,
      totalViews,
      activeCampaigns,
      completedCampaigns,
      avgConversion: totalViews > 0 ? ((totalSupporters / totalViews) * 100).toFixed(2) : "0",
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to view your creator dashboard
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Creator Dashboard</h1>
            <p className="text-text-secondary">Manage your campaigns and track performance</p>
          </div>
          <Button
            onClick={() => router.push("/campaigns/create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </Button>
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
                  <span className="text-sm text-foreground/80">Total Raised</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  ${stats.totalRaised.toLocaleString()}
                </div>
                <div className="text-xs text-success mt-1">
                  {((stats.totalRaised / stats.totalGoal) * 100).toFixed(1)}% of goal
                </div>
              </div>

              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm text-text-tertiary">Total Supporters</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {stats.totalSupporters.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary mt-1">Across all campaigns</div>
              </div>

              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span className="text-sm text-text-tertiary">Total Views</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {stats.totalViews.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary mt-1">{stats.avgConversion}% conversion</div>
              </div>

              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-sm text-text-tertiary">Active Campaigns</span>
                </div>
                <div className="text-3xl font-bold text-foreground">{stats.activeCampaigns}</div>
                <div className="text-xs text-text-secondary mt-1">
                  {stats.completedCampaigns} completed
                </div>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Campaign Performance (Last 30 Days)
              </h3>
              <div className="h-48 flex items-end gap-4">
                {[12, 18, 15, 24, 32, 28, 35].map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end flex-1">
                      <div className="text-xs font-medium text-foreground mb-1">${value}k</div>
                      <div
                        className="w-full bg-gradient-to-t from-primary to-purple-500 rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${(value / 35) * 100}%`, minHeight: "20px" }}
                      />
                    </div>
                    <div className="text-[10px] text-text-tertiary">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaigns List */}
            <div className="bg-surface-elevated border border-border-subtle rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border-subtle">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Your Campaigns
                </h3>
              </div>

              {mockCampaigns.length === 0 ? (
                <div className="p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">No Campaigns Yet</h4>
                  <p className="text-sm text-text-secondary mb-6">
                    Start your first campaign and make an impact
                  </p>
                  <Button onClick={() => router.push("/campaigns/create")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {mockCampaigns.map((campaign) => {
                    const progress = (campaign.raised / campaign.goal) * 100;
                    const daysActive = Math.floor(
                      (Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={campaign.id}
                        className="p-4 hover:bg-surface-overlay transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Campaign Image */}
                          <img
                            src={campaign.image}
                            alt={campaign.name}
                            className="w-32 h-24 rounded-lg object-cover flex-shrink-0"
                          />

                          {/* Campaign Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">
                                  {campaign.name}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full capitalize",
                                    campaign.status === "active"
                                      ? "bg-success/10 text-success"
                                      : campaign.status === "completed"
                                      ? "bg-blue-500/10 text-blue-500"
                                      : "bg-gray-500/10 text-gray-500"
                                  )}>
                                    {campaign.status}
                                  </span>
                                  <span>{campaign.category}</span>
                                  <span>•</span>
                                  <span>{daysActive} days active</span>
                                </div>
                              </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="font-semibold text-foreground">
                                  ${campaign.raised.toLocaleString()} raised
                                </span>
                                <span className="text-text-tertiary">
                                  {progress.toFixed(1)}% of ${campaign.goal.toLocaleString()}
                                </span>
                              </div>
                              <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary to-purple-500"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-text-tertiary">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{campaign.supporters} supporters</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{campaign.views.toLocaleString()} views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>
                                  {((campaign.supporters / campaign.views) * 100).toFixed(1)}% conversion
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => router.push(`/campaigns/${campaign.id}`)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => router.push(`/campaigns/${campaign.id}/analytics`)}
                              variant="secondary"
                              size="sm"
                            >
                              <BarChart3 className="w-4 h-4 mr-1" />
                              Analytics
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
