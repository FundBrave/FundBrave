"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProfileNotFoundIllustrationProps {
  className?: string;
}

/**
 * ProfileNotFoundIllustration - Hand-crafted inline SVG illustration
 *
 * Design specs from PHASE3_UX_SPECS.md section 5.5:
 * - ViewBox: 180x180
 * - Theme: Avatar silhouette with question mark
 * - Elements: Outer decorative circle, avatar circle, head silhouette, shoulders, question mark, orbit dots
 * - Uses profile-gradient (primary-500 to purple-500 to soft-purple-500)
 * - Stroke-based design, currentColor for theming
 */
export function ProfileNotFoundIllustration({
  className,
}: ProfileNotFoundIllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[160px] w-[160px] md:h-[180px] md:w-[180px]", className)}
      aria-hidden="true"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient
          id="profile-gradient"
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

      {/* Outer decorative circle */}
      <circle
        cx="90"
        cy="90"
        r="85"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.15"
        strokeDasharray="6 4"
        fill="none"
      />

      {/* Avatar circle background */}
      <circle
        cx="90"
        cy="90"
        r="65"
        stroke="url(#profile-gradient)"
        strokeWidth="2.5"
        fill="none"
      />

      {/* Avatar silhouette - head */}
      <circle
        cx="90"
        cy="70"
        r="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
        fill="none"
      />

      {/* Avatar silhouette - body/shoulders */}
      <path
        d="M50 140 C50 115, 65 105, 90 105 C115 105, 130 115, 130 140"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Clip path for body to stay within circle */}
      <clipPath id="avatar-clip">
        <circle cx="90" cy="90" r="64" />
      </clipPath>

      {/* Question mark - prominent */}
      <text
        x="90"
        y="98"
        textAnchor="middle"
        fill="url(#profile-gradient)"
        fontSize="36"
        fontWeight="700"
        fontFamily="var(--font-display)"
      >
        ?
      </text>

      {/* Decorative orbit dots */}
      <circle
        cx="90"
        cy="5"
        r="3"
        fill="url(#profile-gradient)"
        fillOpacity="0.6"
      />
      <circle
        cx="175"
        cy="90"
        r="2.5"
        fill="url(#profile-gradient)"
        fillOpacity="0.4"
      />
      <circle
        cx="5"
        cy="90"
        r="2"
        fill="url(#profile-gradient)"
        fillOpacity="0.3"
      />
      <circle
        cx="150"
        cy="35"
        r="2"
        fill="url(#profile-gradient)"
        fillOpacity="0.35"
      />
      <circle
        cx="30"
        cy="145"
        r="2.5"
        fill="url(#profile-gradient)"
        fillOpacity="0.4"
      />
    </svg>
  );
}

export default ProfileNotFoundIllustration;
