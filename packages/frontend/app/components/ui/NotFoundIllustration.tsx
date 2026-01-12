import * as React from "react";
import { cn } from "@/lib/utils";

interface NotFoundIllustrationProps {
  className?: string;
}

/**
 * NotFoundIllustration - Compass/Navigation themed SVG for 404 pages
 *
 * Design specs from PHASE1_UX_SPECS.md:
 * - Size: 220x220px desktop, 180x180px mobile
 * - Style: Line art with brand gradient accents
 * - Uses currentColor for main strokes
 * - Uses var(--primary-500) for accent fills
 * - aria-hidden="true" for accessibility (decorative)
 */
export function NotFoundIllustration({ className }: NotFoundIllustrationProps) {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[180px] w-[180px] md:h-[220px] md:w-[220px]", className)}
      aria-hidden="true"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="compass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary-500)" />
          <stop offset="50%" stopColor="var(--purple-500)" />
          <stop offset="100%" stopColor="var(--soft-purple-500)" />
        </linearGradient>
        <linearGradient id="needle-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--primary-400)" />
          <stop offset="100%" stopColor="var(--soft-purple-400)" />
        </linearGradient>
      </defs>

      {/* Outer circle - compass bezel */}
      <circle
        cx="110"
        cy="110"
        r="95"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.2"
        fill="none"
      />

      {/* Inner circle - compass face */}
      <circle
        cx="110"
        cy="110"
        r="80"
        stroke="url(#compass-gradient)"
        strokeWidth="2.5"
        fill="none"
      />

      {/* Decorative inner ring */}
      <circle
        cx="110"
        cy="110"
        r="65"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.15"
        strokeDasharray="4 4"
        fill="none"
      />

      {/* Cardinal direction markers */}
      {/* North */}
      <text
        x="110"
        y="45"
        textAnchor="middle"
        fill="url(#compass-gradient)"
        fontSize="14"
        fontWeight="600"
        fontFamily="var(--font-display)"
      >
        N
      </text>

      {/* South */}
      <text
        x="110"
        y="185"
        textAnchor="middle"
        fill="currentColor"
        fillOpacity="0.4"
        fontSize="12"
        fontWeight="500"
        fontFamily="var(--font-alt)"
      >
        S
      </text>

      {/* East */}
      <text
        x="180"
        y="114"
        textAnchor="middle"
        fill="currentColor"
        fillOpacity="0.4"
        fontSize="12"
        fontWeight="500"
        fontFamily="var(--font-alt)"
      >
        E
      </text>

      {/* West */}
      <text
        x="40"
        y="114"
        textAnchor="middle"
        fill="currentColor"
        fillOpacity="0.4"
        fontSize="12"
        fontWeight="500"
        fontFamily="var(--font-alt)"
      >
        W
      </text>

      {/* Tick marks around the compass */}
      {[...Array(12)].map((_, i) => {
        const angle = i * 30;
        const radian = (angle * Math.PI) / 180;
        const innerRadius = 72;
        const outerRadius = 78;
        const x1 = 110 + innerRadius * Math.sin(radian);
        const y1 = 110 - innerRadius * Math.cos(radian);
        const x2 = 110 + outerRadius * Math.sin(radian);
        const y2 = 110 - outerRadius * Math.cos(radian);

        // Skip cardinal directions (they have letters)
        if (i % 3 === 0) return null;

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Compass needle - North pointing (gradient) */}
      <path
        d="M110 55 L118 110 L110 100 L102 110 Z"
        fill="url(#needle-gradient)"
      />

      {/* Compass needle - South pointing (muted) */}
      <path
        d="M110 165 L118 110 L110 120 L102 110 Z"
        fill="currentColor"
        fillOpacity="0.2"
      />

      {/* Center pivot point */}
      <circle
        cx="110"
        cy="110"
        r="8"
        fill="url(#compass-gradient)"
      />
      <circle
        cx="110"
        cy="110"
        r="4"
        fill="var(--background)"
      />

      {/* Question mark overlay - subtle indication of "lost" */}
      <text
        x="110"
        y="118"
        textAnchor="middle"
        fill="url(#compass-gradient)"
        fontSize="10"
        fontWeight="700"
        fontFamily="var(--font-display)"
      >
        ?
      </text>

      {/* Decorative orbit dots */}
      <circle cx="110" cy="15" r="3" fill="url(#compass-gradient)" fillOpacity="0.6" />
      <circle cx="195" cy="110" r="2.5" fill="url(#compass-gradient)" fillOpacity="0.4" />
      <circle cx="25" cy="110" r="2" fill="url(#compass-gradient)" fillOpacity="0.3" />
    </svg>
  );
}

export default NotFoundIllustration;
