"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, TrendingUp, Heart, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  raised: number;
  image: string;
  category: string;
  creatorName: string;
  supportersCount: number;
  matchScore: number; // AI confidence score 0-100
  matchReason: string; // Why this was recommended
}

interface RecommendationsProps {
  /** User ID for personalized recommendations */
  userId?: string;
  /** Maximum number of recommendations to show */
  maxItems?: number;
  /** Custom className */
  className?: string;
  /** Show compact view */
  compact?: boolean;
  /** API endpoint for recommendations */
  endpoint?: string;
}

/**
 * AI-Powered Campaign Recommendations Component
 *
 * Displays personalized campaign recommendations based on:
 * - User's donation history
 * - Followed campaigns and creators
 * - Browsing behavior
 * - Similar user preferences
 * - Trending campaigns in preferred categories
 */
export function Recommendations({
  userId,
  maxItems = 6,
  className,
  compact = false,
  endpoint = "/api/ai/recommendations",
}: RecommendationsProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${endpoint}?userId=${userId}&limit=${maxItems}`);
      // const data = await response.json();
      // setCampaigns(data.recommendations);

      // Mock recommendations
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockCampaigns: Campaign[] = [
        {
          id: "rec-1",
          name: "Clean Water Initiative",
          description: "Providing clean drinking water to rural communities in East Africa",
          goal: 50000,
          raised: 32500,
          image: "https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?w=400&h=300&fit=crop",
          category: "Environment",
          creatorName: "WaterAid Foundation",
          supportersCount: 245,
          matchScore: 95,
          matchReason: "Similar to your recent donation to environmental causes",
        },
        {
          id: "rec-2",
          name: "Girls Education Fund",
          description: "Empowering girls through education in underserved communities",
          goal: 75000,
          raised: 48000,
          image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop",
          category: "Education",
          creatorName: "Global Education Alliance",
          supportersCount: 512,
          matchScore: 92,
          matchReason: "Trending in categories you follow",
        },
        {
          id: "rec-3",
          name: "Community Health Clinic",
          description: "Building a healthcare facility for underserved neighborhoods",
          goal: 100000,
          raised: 67000,
          image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=300&fit=crop",
          category: "Healthcare",
          creatorName: "Health For All Initiative",
          supportersCount: 389,
          matchScore: 88,
          matchReason: "Popular with users like you",
        },
        {
          id: "rec-4",
          name: "Urban Reforestation Project",
          description: "Planting 10,000 trees in urban areas to combat climate change",
          goal: 30000,
          raised: 21000,
          image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop",
          category: "Environment",
          creatorName: "Green Cities Coalition",
          supportersCount: 178,
          matchScore: 85,
          matchReason: "Based on your recent activity",
        },
        {
          id: "rec-5",
          name: "Refugee Support Program",
          description: "Providing essential resources and support to displaced families",
          goal: 120000,
          raised: 89000,
          image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop",
          category: "Humanitarian",
          creatorName: "Refugee Relief Network",
          supportersCount: 623,
          matchScore: 82,
          matchReason: "Featured by creators you follow",
        },
        {
          id: "rec-6",
          name: "Tech Skills Training",
          description: "Teaching coding and digital skills to underprivileged youth",
          goal: 45000,
          raised: 28000,
          image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
          category: "Education",
          creatorName: "Code The Future",
          supportersCount: 291,
          matchScore: 79,
          matchReason: "Rising campaign in your network",
        },
      ];

      setCampaigns(mockCampaigns.slice(0, maxItems));
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to load recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, maxItems]);

  const handleRefresh = () => {
    fetchRecommendations();
  };

  const handleCampaignClick = (campaignId: string) => {
    router.push(`/campaigns/${campaignId}`);
  };

  if (error) {
    return (
      <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6", className)}>
        <p className="text-sm text-error">Unable to load recommendations</p>
        <Button onClick={handleRefresh} variant="secondary" size="sm" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {compact ? "For You" : "Recommended Campaigns"}
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={cn(
            "p-2 rounded-lg hover:bg-surface-overlay transition-colors text-text-secondary hover:text-foreground",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Refresh recommendations"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-sm text-text-secondary">No recommendations available</p>
        </div>
      ) : (
        <div className={cn("grid gap-4", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
          {campaigns.map((campaign) => {
            const progress = (campaign.raised / campaign.goal) * 100;

            return (
              <button
                key={campaign.id}
                onClick={() => handleCampaignClick(campaign.id)}
                className="group bg-surface-sunken hover:bg-surface-overlay border border-border-subtle hover:border-primary/30 rounded-xl overflow-hidden transition-all text-left"
              >
                {/* Campaign Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={campaign.image}
                    alt={campaign.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Match Score Badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-primary/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {campaign.matchScore}% match
                  </div>
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white">
                    {campaign.category}
                  </div>
                </div>

                {/* Campaign Details */}
                <div className="p-4">
                  <h4 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {campaign.name}
                  </h4>
                  <p className="text-xs text-text-tertiary mb-3 line-clamp-2">
                    {campaign.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-secondary">
                        ${campaign.raised.toLocaleString()} raised
                      </span>
                      <span className="text-text-tertiary">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-text-tertiary">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{campaign.supportersCount} supporters</span>
                    </div>
                    <span className="text-text-secondary">
                      Goal: ${campaign.goal.toLocaleString()}
                    </span>
                  </div>

                  {/* Match Reason */}
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <p className="text-[10px] text-primary flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{campaign.matchReason}</span>
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {!compact && campaigns.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/campaigns")}
            className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Browse all campaigns →
          </button>
        </div>
      )}
    </div>
  );
}

export default Recommendations;
