"use client";

import { useState } from "react";
import { ChevronDown } from "@/app/components/ui/icons";
import { CampaignCard, CategorySidebar, MobileCategoryFilter } from "../components/campaigns";
import { Navbar } from "@/app/components/common";

// Sort options for filtering campaigns
type SortOption = "oldest" | "newest" | "most-funded" | "least-funded";

// Mock campaign data for demonstration
// Using Unsplash for themed static images matching reference design
const MOCK_CAMPAIGNS = [
  {
    id: "1",
    title: "Support John's Fight Against Cancer",
    imageUrl:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop",
    donorsCount: 2543,
    amountRaised: 340,
    targetAmount: 1500,
  },
  {
    id: "2",
    title: "Support John's Fight Against Cancer",
    imageUrl:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop",
    donorsCount: 2543,
    amountRaised: 340,
    targetAmount: 1500,
  },
  {
    id: "3",
    title: "Support John's Fight Against Cancer",
    imageUrl:
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=300&fit=crop",
    donorsCount: 2543,
    amountRaised: 340,
    targetAmount: 1500,
  },
  {
    id: "4",
    title: "Support John's Fight Against Cancer",
    imageUrl:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    donorsCount: 2543,
    amountRaised: 340,
    targetAmount: 1500,
  },
  {
    id: "5",
    title: "Support John's Fight Against Cancer",
    imageUrl:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=300&fit=crop",
    donorsCount: 2543,
    amountRaised: 340,
    targetAmount: 1500,
  },
  {
    id: "6",
    title: "Support John's Fight Against Cancer",
    imageUrl:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop",
    donorsCount: 2543,
    amountRaised: 340,
    targetAmount: 1500,
  },
  {
    id: "7",
    title: "Medical Research Support",
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop",
    donorsCount: 6782,
    amountRaised: 8900,
    targetAmount: 10000,
  },
  {
    id: "8",
    title: "Tech Education for Youth",
    imageUrl:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop",
    donorsCount: 2134,
    amountRaised: 1800,
    targetAmount: 2500,
  },
  {
    id: "9",
    title: "Animal Shelter Support",
    imageUrl:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop",
    donorsCount: 892,
    amountRaised: 450,
    targetAmount: 800,
  },
  {
    id: "10",
    title: "Disaster Relief Fund",
    imageUrl:
      "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&h=300&fit=crop",
    donorsCount: 5432,
    amountRaised: 12000,
    targetAmount: 15000,
  },
  {
    id: "11",
    title: "Music Education Program",
    imageUrl:
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop",
    donorsCount: 743,
    amountRaised: 560,
    targetAmount: 1000,
  },
  {
    id: "12",
    title: "Mental Health Awareness",
    imageUrl:
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
    donorsCount: 3211,
    amountRaised: 2800,
    targetAmount: 3500,
  },
];

/**
 * CampaignsPage - Main page component for displaying all campaigns
 * Includes category filtering sidebar and campaign grid with sort functionality
 */
export default function CampaignsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("oldest");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handle category selection from sidebar
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Handle sort option selection
  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setIsSortDropdownOpen(false);
  };

  // Toggle sidebar collapse state
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Get display text for sort option
  const getSortDisplayText = (option: SortOption) => {
    const sortTexts: Record<SortOption, string> = {
      oldest: "Oldest",
      newest: "Newest",
      "most-funded": "Most Funded",
      "least-funded": "Least Funded",
    };
    return sortTexts[option];
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        {/* Main Content Area */}
        <div className="flex gap-4 md:gap-6 lg:gap-8 h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        {/* Category Sidebar - Hidden on mobile, visible on md+ */}
        <CategorySidebar
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Campaigns Grid Section - Scrollable independently */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Mobile Category Filter - Only visible on mobile */}
          <MobileCategoryFilter
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />

          {/* Sort Dropdown */}
          <div className="flex justify-end mb-5">
            <div className="relative">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-1.5 text-white font-[family-name:var(--font-family-gilgan)]"
              >
                <span className="text-sm tracking-[0.56px]">
                  <span className="font-semibold">Sort by:</span>{" "}
                  {getSortDisplayText(sortBy)}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    isSortDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Sort Dropdown Menu */}
              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-surface-elevated rounded-lg shadow-lg border border-border-default z-10">
                  {(
                    ["oldest", "newest", "most-funded", "least-funded"] as const
                  ).map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSortChange(option)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-overlay transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        sortBy === option
                          ? "text-purple-400 font-medium"
                          : "text-text-secondary"
                      }`}
                    >
                      {getSortDisplayText(option)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Campaigns Grid - Scrollable container with responsive columns */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {MOCK_CAMPAIGNS.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  id={campaign.id}
                  title={campaign.title}
                  imageUrl={campaign.imageUrl}
                  donorsCount={campaign.donorsCount}
                  amountRaised={campaign.amountRaised}
                  targetAmount={campaign.targetAmount}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
