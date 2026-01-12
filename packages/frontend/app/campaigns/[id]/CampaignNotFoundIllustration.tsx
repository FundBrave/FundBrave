"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CampaignNotFoundIllustrationProps {
  className?: string;
}

/**
 * CampaignNotFoundIllustration - Hand-crafted inline SVG illustration
 *
 * Design specs from PHASE3_UX_SPECS.md section 4.6:
 * - ViewBox: 200x200
 * - Theme: Empty donation box with search/question mark
 * - Elements: Open gift box, magnifying glass, question mark, decorative particles, small heart
 * - Uses campaign-gradient (primary-500 to purple-500 to soft-purple-500)
 * - Stroke-based design, currentColor for theming
 * - Has animate-float compatible className
 */
export function CampaignNotFoundIllustration({
  className,
}: CampaignNotFoundIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[180px] w-[180px] md:h-[200px] md:w-[200px]", className)}
      aria-hidden="true"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient
          id="campaign-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="var(--primary-500)" />
          <stop offset="50%" stopColor="var(--purple-500)" />
          <stop offset="100%" stopColor="var(--soft-purple-500)" />
        </linearGradient>
      </defs>

      {/* Empty donation box base */}
      <path
        d="M40 80 L100 50 L160 80 L160 150 L100 180 L40 150 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
        fill="none"
        strokeLinejoin="round"
      />

      {/* Box front face */}
      <path
        d="M40 80 L100 110 L100 180 L40 150 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.4"
        fill="none"
      />

      {/* Box right face */}
      <path
        d="M100 110 L160 80 L160 150 L100 180 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.25"
        fill="none"
      />

      {/* Box top (open) */}
      <path
        d="M40 80 L100 110 L160 80"
        stroke="url(#campaign-gradient)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Box lid (open, tilted back) */}
      <path
        d="M40 80 L55 55 L115 35 L160 65"
        stroke="url(#campaign-gradient)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />

      {/* Magnifying glass */}
      <circle
        cx="135"
        cy="65"
        r="20"
        stroke="url(#campaign-gradient)"
        strokeWidth="2.5"
        fill="none"
      />
      <line
        x1="150"
        y1="80"
        x2="165"
        y2="95"
        stroke="url(#campaign-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Question mark in center of box */}
      <text
        x="100"
        y="145"
        textAnchor="middle"
        fill="url(#campaign-gradient)"
        fontSize="28"
        fontWeight="700"
        fontFamily="var(--font-display)"
        opacity="0.8"
      >
        ?
      </text>

      {/* Decorative particles */}
      <circle
        cx="60"
        cy="45"
        r="3"
        fill="url(#campaign-gradient)"
        fillOpacity="0.5"
      />
      <circle
        cx="85"
        cy="30"
        r="2"
        fill="url(#campaign-gradient)"
        fillOpacity="0.4"
      />
      <circle
        cx="170"
        cy="100"
        r="2.5"
        fill="url(#campaign-gradient)"
        fillOpacity="0.3"
      />

      {/* Small heart outline (donation theme) */}
      <path
        d="M75 58 C75 55, 78 52, 82 52 C86 52, 89 55, 89 58 C89 55, 92 52, 96 52 C100 52, 103 55, 103 58 C103 65, 89 75, 89 75 C89 75, 75 65, 75 58 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        fill="none"
      />
    </svg>
  );
}

export default CampaignNotFoundIllustration;
