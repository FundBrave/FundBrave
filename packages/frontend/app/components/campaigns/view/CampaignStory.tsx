"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CampaignStoryProps {
  story: string;
}

export default function CampaignStory({ story }: CampaignStoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = story.length > 500;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-foreground font-[family-name:var(--font-family-gilgan)]">
        Story
      </h3>
      <div
        className={cn(
          "text-foreground/80 whitespace-pre-line leading-relaxed text-base font-[family-name:var(--font-family-montserrat)]",
          !isExpanded && shouldTruncate && "line-clamp-6"
        )}
      >
        {story}
      </div>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-foreground font-semibold text-sm hover:underline self-start font-[family-name:var(--font-family-gilgan)]"
        >
          {isExpanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
