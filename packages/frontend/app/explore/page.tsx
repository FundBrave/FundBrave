"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  TrendingUp,
  Heart,
  Users,
  Filter,
  Search
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  description: string;
  image: string;
  goal: number;
  raised: number;
  supporters: number;
  category: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  creatorName: string;
  creatorImage: string;
}

const CATEGORIES = [
  "All",
  "Environment",
  "Education",
  "Healthcare",
  "Humanitarian",
  "Technology",
  "Arts & Culture",
  "Animal Welfare",
];

const mockCampaigns: Campaign[] = [
  {
    id: "explore-1",
    name: "Clean Water Initiative",
    description: "Providing clean drinking water to rural communities in East Africa",
    image: "https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?w=400&h=300&fit=crop",
    goal: 50000,
    raised: 32500,
    supporters: 245,
    category: "Environment",
    isFeatured: true,
    isTrending: true,
    creatorName: "WaterAid Foundation",
    creatorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  },
  {
    id: "explore-2",
    name: "Girls Education Fund",
    description: "Empowering girls through education in underserved communities",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop",
    goal: 75000,
    raised: 48000,
    supporters: 512,
    category: "Education",
    isFeatured: true,
    creatorName: "Global Education Alliance",
    creatorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    id: "explore-3",
    name: "Community Health Clinic",
    description: "Building a healthcare facility for underserved neighborhoods",
    image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=300&fit=crop",
    goal: 100000,
    raised: 67000,
    supporters: 389,
    category: "Healthcare",
    isTrending: true,
    creatorName: "Health For All Initiative",
    creatorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  },
  {
    id: "explore-4",
    name: "Urban Reforestation Project",
    description: "Planting 10,000 trees in urban areas to combat climate change",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop",
    goal: 30000,
    raised: 21000,
    supporters: 178,
    category: "Environment",
    creatorName: "Green Cities Coalition",
    creatorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: "explore-5",
    name: "Refugee Support Program",
    description: "Providing essential resources and support to displaced families",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop",
    goal: 120000,
    raised: 89000,
    supporters: 623,
    category: "Humanitarian",
    isTrending: true,
    creatorName: "Refugee Relief Network",
    creatorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "explore-6",
    name: "Tech Skills Training",
    description: "Teaching coding and digital skills to underprivileged youth",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
    goal: 45000,
    raised: 28000,
    supporters: 291,
    category: "Technology",
    creatorName: "Code The Future",
    creatorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  },
  {
    id: "explore-7",
    name: "Wildlife Conservation",
    description: "Protecting endangered species and their natural habitats",
    image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=400&h=300&fit=crop",
    goal: 85000,
    raised: 54000,
    supporters: 412,
    category: "Animal Welfare",
    creatorName: "Wildlife Foundation",
    creatorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    id: "explore-8",
    name: "Local Arts Initiative",
    description: "Supporting local artists and cultural programs",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
    goal: 25000,
    raised: 18000,
    supporters: 156,
    category: "Arts & Culture",
    creatorName: "Arts Collective",
    creatorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
];

export default function ExplorePage() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"trending" | "newest" | "funded">("trending");
  const [isLoading] = useState(false);

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = mockCampaigns.filter((campaign) => {
      const matchesCategory = selectedCategory === "All" || campaign.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    // Sort
    if (sortBy === "trending") {
      filtered = [...filtered].sort((a, b) => {
        if (a.isTrending && !b.isTrending) return -1;
        if (!a.isTrending && b.isTrending) return 1;
        return b.supporters - a.supporters;
      });
    } else if (sortBy === "newest") {
      filtered = [...filtered].reverse();
    } else if (sortBy === "funded") {
      filtered = [...filtered].sort((a, b) => (b.raised / b.goal) - (a.raised / a.goal));
    }

    return filtered;
  }, [selectedCategory, searchQuery, sortBy]);

  const featuredCampaigns = mockCampaigns.filter((c) => c.isFeatured);
  const trendingCampaigns = mockCampaigns.filter((c) => c.isTrending);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Explore Campaigns</h1>
          <p className="text-text-secondary">Discover impactful causes to support</p>
        </div>

        {/* Featured Section */}
        {featuredCampaigns.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Featured Campaigns</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredCampaigns.slice(0, 2).map((campaign) => {
                const progress = (campaign.raised / campaign.goal) * 100;
                return (
                  <button
                    key={campaign.id}
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    className="group bg-surface-elevated border border-border-subtle hover:border-primary/30 rounded-xl overflow-hidden transition-all text-left"
                  >
                    <div className="relative h-56">
                      <img
                        src={campaign.image}
                        alt={campaign.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white">
                        {campaign.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-semibold text-foreground">
                            ${campaign.raised.toLocaleString()} raised
                          </span>
                          <span className="text-text-tertiary">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-purple-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{campaign.supporters} supporters</span>
                        </div>
                        <span>Goal: ${campaign.goal.toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Trending Section */}
        {trendingCampaigns.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-success" />
              <h2 className="text-xl font-semibold text-foreground">Trending Now</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {trendingCampaigns.slice(0, 3).map((campaign) => {
                const progress = (campaign.raised / campaign.goal) * 100;
                return (
                  <button
                    key={campaign.id}
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    className="group bg-surface-elevated border border-border-subtle hover:border-success/30 rounded-xl overflow-hidden transition-all text-left"
                  >
                    <div className="relative h-40">
                      <img
                        src={campaign.image}
                        alt={campaign.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-success/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Trending
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-success transition-colors">
                        {campaign.name}
                      </h4>
                      <div className="text-xs text-text-tertiary mb-3">{campaign.category}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          ${campaign.raised.toLocaleString()}
                        </span>
                        <span className="text-text-tertiary">{progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-10 pr-4 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="funded">Most Funded</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedCategory === category
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-surface-elevated text-text-secondary hover:bg-surface-overlay border border-border-subtle"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* All Campaigns Grid */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            All Campaigns {selectedCategory !== "All" && `in ${selectedCategory}`}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-12 text-center">
            <Heart className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Campaigns Found</h3>
            <p className="text-text-secondary">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => {
              const progress = (campaign.raised / campaign.goal) * 100;
              return (
                <button
                  key={campaign.id}
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  className="group bg-surface-elevated border border-border-subtle hover:border-primary/30 rounded-xl overflow-hidden transition-all text-left"
                >
                  <div className="relative h-48">
                    <img
                      src={campaign.image}
                      alt={campaign.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white">
                      {campaign.category}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-semibold text-foreground">
                          ${campaign.raised.toLocaleString()}
                        </span>
                        <span className="text-text-tertiary">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-purple-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={campaign.creatorImage}
                        alt={campaign.creatorName}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs text-text-tertiary flex-1 truncate">
                        by {campaign.creatorName}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-text-tertiary">
                        <Users className="w-3 h-3" />
                        {campaign.supporters}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && filteredCampaigns.length > 0 && (
          <div className="mt-8 text-center text-sm text-text-tertiary">
            Showing {filteredCampaigns.length} of {mockCampaigns.length} campaigns
          </div>
        )}
      </div>
    </div>
  );
}
