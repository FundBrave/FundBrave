"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  Share2,
  Globe,
  Calendar,
  BarChart3,
  PieChart,
  ArrowLeft,
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  views: {
    total: number;
    unique: number;
    trend: number;
  };
  conversions: {
    donations: number;
    conversionRate: number;
    avgDonation: number;
  };
  traffic: {
    direct: number;
    social: number;
    referral: number;
    search: number;
  };
  demographics: {
    topCountries: Array<{ country: string; percentage: number }>;
    ageGroups: Array<{ range: string; percentage: number }>;
  };
  timeline: Array<{
    date: string;
    views: number;
    donations: number;
  }>;
}

// Mock analytics data - Replace with actual GraphQL query
const mockAnalytics: AnalyticsData = {
  views: {
    total: 15420,
    unique: 12340,
    trend: 15.3,
  },
  conversions: {
    donations: 245,
    conversionRate: 1.98,
    avgDonation: 132.65,
  },
  traffic: {
    direct: 35,
    social: 42,
    referral: 18,
    search: 5,
  },
  demographics: {
    topCountries: [
      { country: "United States", percentage: 45 },
      { country: "United Kingdom", percentage: 18 },
      { country: "Canada", percentage: 12 },
      { country: "Germany", percentage: 10 },
      { country: "Other", percentage: 15 },
    ],
    ageGroups: [
      { range: "18-24", percentage: 15 },
      { range: "25-34", percentage: 35 },
      { range: "35-44", percentage: 28 },
      { range: "45-54", percentage: 15 },
      { range: "55+", percentage: 7 },
    ],
  },
  timeline: [
    { date: "Mon", views: 1200, donations: 25 },
    { date: "Tue", views: 1500, donations: 32 },
    { date: "Wed", views: 1800, donations: 40 },
    { date: "Thu", views: 2100, donations: 48 },
    { date: "Fri", views: 2400, donations: 52 },
    { date: "Sat", views: 2800, donations: 38 },
    { date: "Sun", views: 3620, donations: 10 },
  ],
};

export default function CampaignAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const { address, isConnected } = useAccount();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("7d");

  const campaignId = params?.id as string;
  const analytics = mockAnalytics; // In real app, fetch by campaignId

  const maxViews = Math.max(...analytics.timeline.map((d) => d.views));
  const maxDonations = Math.max(...analytics.timeline.map((d) => d.donations));

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to view campaign analytics
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
        <button
          onClick={() => router.push(`/campaigns/${campaignId}`)}
          className="text-text-secondary hover:text-foreground mb-6 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaign
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Campaign Analytics</h1>
            <p className="text-text-secondary">Track your campaign's performance and audience insights</p>
          </div>

          {/* Time Range Selector */}
          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-1 flex gap-1">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
              { id: "all", label: "All Time" },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as typeof timeRange)}
                className={cn(
                  "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                  timeRange === range.id
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-tertiary">Total Views</div>
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {analytics.views.total.toLocaleString()}
            </div>
            <div className="text-xs text-success">
              +{analytics.views.trend}% from last period
            </div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-tertiary">Unique Visitors</div>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {analytics.views.unique.toLocaleString()}
            </div>
            <div className="text-xs text-text-secondary">
              {((analytics.views.unique / analytics.views.total) * 100).toFixed(1)}% of total
            </div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-tertiary">Total Donations</div>
              <MousePointerClick className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {analytics.conversions.donations}
            </div>
            <div className="text-xs text-text-secondary">
              ${analytics.conversions.avgDonation.toFixed(2)} avg
            </div>
          </div>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-tertiary">Conversion Rate</div>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary mb-1">
              {analytics.conversions.conversionRate}%
            </div>
            <div className="text-xs text-text-secondary">Visitors to donors</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeline Chart */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Views & Donations Timeline
            </h3>
            <div className="h-64 flex items-end gap-2">
              {analytics.timeline.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col gap-2 items-center">
                  <div className="w-full flex flex-col items-center justify-end flex-1">
                    {/* Donations bar */}
                    <div className="w-full relative group">
                      <div
                        className="w-full bg-gradient-to-t from-success to-success/60 rounded-t-lg transition-all hover:opacity-80"
                        style={{
                          height: `${(day.donations / maxDonations) * 100}%`,
                          minHeight: "4px",
                        }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-overlay px-2 py-1 rounded text-xs whitespace-nowrap">
                        {day.donations} donations
                      </div>
                    </div>
                    {/* Views bar */}
                    <div className="w-full relative group">
                      <div
                        className="w-full bg-gradient-to-t from-primary to-purple-500 rounded-t-lg transition-all hover:opacity-80"
                        style={{
                          height: `${(day.views / maxViews) * 80}%`,
                          minHeight: "8px",
                        }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-overlay px-2 py-1 rounded text-xs whitespace-nowrap">
                        {day.views} views
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-text-tertiary">{day.date}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-primary to-purple-500 rounded" />
                <span className="text-text-secondary">Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-success to-success/60 rounded" />
                <span className="text-text-secondary">Donations</span>
              </div>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Traffic Sources
            </h3>
            <div className="space-y-4">
              {[
                { name: "Social Media", value: analytics.traffic.social, icon: Share2, color: "bg-blue-500" },
                { name: "Direct Traffic", value: analytics.traffic.direct, icon: Globe, color: "bg-purple-500" },
                { name: "Referral Links", value: analytics.traffic.referral, icon: MousePointerClick, color: "bg-green-500" },
                { name: "Search Engines", value: analytics.traffic.search, icon: Globe, color: "bg-orange-500" },
              ].map((source) => (
                <div key={source.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <source.icon className="w-4 h-4 text-text-tertiary" />
                      <span className="text-foreground">{source.name}</span>
                    </div>
                    <span className="font-semibold text-primary">{source.value}%</span>
                  </div>
                  <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                    <div
                      className={cn(source.color, "h-full transition-all")}
                      style={{ width: `${source.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Countries */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Top Countries
            </h3>
            <div className="space-y-4">
              {analytics.demographics.topCountries.map((country, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{country.country}</span>
                    <span className="font-semibold text-primary">{country.percentage}%</span>
                  </div>
                  <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                      style={{ width: `${country.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Age Groups */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Age Distribution
            </h3>
            <div className="space-y-4">
              {analytics.demographics.ageGroups.map((age, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{age.range} years</span>
                    <span className="font-semibold text-primary">{age.percentage}%</span>
                  </div>
                  <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-success to-green-400 transition-all"
                      style={{ width: `${age.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
