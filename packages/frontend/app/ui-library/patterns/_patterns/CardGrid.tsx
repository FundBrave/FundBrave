"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/app/components/ui/primitives/card";
import { Badge } from "@/app/components/ui/primitives/badge";
import { Progress } from "@/app/components/ui/primitives/progress";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { CodeBlock } from "@/app/ui-library/_components/CodeBlock";
import { Rocket } from "lucide-react";

// ---------------------------------------------------------------------------
// View state type
// ---------------------------------------------------------------------------
type ViewState = "loaded" | "skeleton" | "empty";

// ---------------------------------------------------------------------------
// Sample campaign data
// ---------------------------------------------------------------------------
const CAMPAIGNS = [
  {
    id: 1,
    title: "Clean Water for Rural Communities",
    description:
      "Providing sustainable water filtration systems to underserved villages across Sub-Saharan Africa.",
    raised: 12.5,
    goal: 20,
    backers: 142,
    daysLeft: 18,
    category: "Environment",
    status: "Active" as const,
  },
  {
    id: 2,
    title: "DeFi Education Platform",
    description:
      "Building an open-source curriculum to teach decentralized finance concepts to students worldwide.",
    raised: 8.2,
    goal: 15,
    backers: 89,
    daysLeft: 24,
    category: "Education",
    status: "Active" as const,
  },
  {
    id: 3,
    title: "Community Health Clinic",
    description:
      "Funding a blockchain-verified medical supply chain for a new health clinic in Southeast Asia.",
    raised: 30,
    goal: 30,
    backers: 256,
    daysLeft: 0,
    category: "Health",
    status: "Funded" as const,
  },
];

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------
const LOADED_CODE = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {campaigns.map((campaign) => (
    <Card key={campaign.id} variant="default" padding="none">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="brand" size="sm">{campaign.category}</Badge>
          <Badge
            variant={campaign.status === "Funded" ? "success" : "outline"}
            size="sm"
          >
            {campaign.status}
          </Badge>
        </div>
        <h3 className="text-base font-semibold text-text-primary mt-2">
          {campaign.title}
        </h3>
      </CardHeader>

      <CardContent className="px-4 pb-3">
        <p className="text-sm text-text-secondary line-clamp-2">
          {campaign.description}
        </p>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-text-tertiary">
            <span>{campaign.raised} / {campaign.goal} ETH</span>
            <span>{Math.round((campaign.raised / campaign.goal) * 100)}%</span>
          </div>
          <Progress
            value={campaign.raised}
            max={campaign.goal}
            size="sm"
          />
        </div>
      </CardContent>

      <CardFooter className="px-4 py-3 flex justify-between">
        <span className="text-xs text-text-tertiary">
          {campaign.backers} backers
        </span>
        <Button variant="primary" size="sm">Donate</Button>
      </CardFooter>
    </Card>
  ))}
</div>`;

const SKELETON_CODE = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {Array.from({ length: 3 }).map((_, i) => (
    <div
      key={i}
      className="rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden"
    >
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton variant="rounded" className="w-20 h-5" />
          <Skeleton variant="rounded" className="w-16 h-5" />
        </div>
        <Skeleton variant="text" className="w-full h-5" />
        <Skeleton variant="text" className="w-3/4 h-4" />
        <Skeleton variant="text" className="w-full h-4" />
      </div>
      <div className="px-4 pb-4 space-y-2">
        <Skeleton variant="rounded" className="w-full h-2" />
        <div className="flex justify-between pt-2">
          <Skeleton variant="text" className="w-20 h-4" />
          <Skeleton variant="rounded" className="w-20 h-8" />
        </div>
      </div>
    </div>
  ))}
</div>`;

const EMPTY_CODE = `<EmptyState
  icon={Rocket}
  title="No campaigns found"
  description="There are no campaigns matching your criteria. Try adjusting your filters or create a new campaign."
  action={{
    label: "Create Campaign",
    onClick: () => {},
  }}
/>`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CardGrid() {
  const [viewState, setViewState] = useState<ViewState>("loaded");

  const codeMap: Record<ViewState, string> = {
    loaded: LOADED_CODE,
    skeleton: SKELETON_CODE,
    empty: EMPTY_CODE,
  };

  const codeTitleMap: Record<ViewState, string> = {
    loaded: "Loaded campaign card grid",
    skeleton: "Skeleton loading state",
    empty: "Empty state with action",
  };

  return (
    <div className="space-y-8">
      {/* View state toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary mr-1">State:</span>
        {(["loaded", "skeleton", "empty"] as ViewState[]).map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => setViewState(state)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-150",
              viewState === state
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-white/[0.04] text-text-tertiary border border-white/10 hover:text-text-secondary hover:bg-white/[0.06]"
            )}
          >
            {state}
          </button>
        ))}
      </div>

      {/* Live demo */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        {viewState === "loaded" && <LoadedGrid />}
        {viewState === "skeleton" && <SkeletonGrid />}
        {viewState === "empty" && <EmptyGrid />}
      </div>

      {/* Code snippet */}
      <CodeBlock
        code={codeMap[viewState]}
        language="tsx"
        title={codeTitleMap[viewState]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loaded grid
// ---------------------------------------------------------------------------
function LoadedGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CAMPAIGNS.map((campaign) => (
        <Card key={campaign.id} variant="default" padding="none">
          <CardHeader className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="brand" size="sm">
                {campaign.category}
              </Badge>
              <Badge
                variant={campaign.status === "Funded" ? "success" : "outline"}
                size="sm"
              >
                {campaign.status}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-text-primary mt-2">
              {campaign.title}
            </h3>
          </CardHeader>

          <CardContent className="px-4 pb-3">
            <p className="text-sm text-text-secondary line-clamp-2">
              {campaign.description}
            </p>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>
                  {campaign.raised} / {campaign.goal} ETH
                </span>
                <span>
                  {Math.round((campaign.raised / campaign.goal) * 100)}%
                </span>
              </div>
              <Progress
                value={campaign.raised}
                max={campaign.goal}
                size="sm"
              />
            </div>
          </CardContent>

          <CardFooter className="px-4 py-3 flex justify-between">
            <span className="text-xs text-text-tertiary">
              {campaign.backers} backers
              {campaign.daysLeft > 0 && ` \u00B7 ${campaign.daysLeft}d left`}
            </span>
            <Button variant="primary" size="sm">
              Donate
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton grid
// ---------------------------------------------------------------------------
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden"
        >
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton variant="rounded" className="w-20 h-5" />
              <Skeleton variant="rounded" className="w-16 h-5" />
            </div>
            <Skeleton variant="text" className="w-full h-5" />
            <Skeleton variant="text" className="w-3/4 h-4" />
            <Skeleton variant="text" className="w-full h-4" />
          </div>
          <div className="px-4 pb-4 space-y-2">
            <Skeleton variant="rounded" className="w-full h-2" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton variant="text" className="w-20 h-4" />
              <Skeleton variant="rounded" className="w-20 h-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty grid
// ---------------------------------------------------------------------------
function EmptyGrid() {
  return (
    <EmptyState
      icon={Rocket}
      title="No campaigns found"
      description="There are no campaigns matching your criteria. Try adjusting your filters or create a new campaign."
      action={{
        label: "Create Campaign",
        onClick: () => {},
      }}
    />
  );
}
