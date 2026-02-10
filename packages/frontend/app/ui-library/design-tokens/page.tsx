"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TokenSwatch } from "../_components/TokenSwatch";
import { motion } from "motion/react";

// =============================================================================
// TOKEN DATA
// =============================================================================

// ---------------------------------------------------------------------------
// A) Colors
// ---------------------------------------------------------------------------

const brandPrimary = [
  { name: "primary-50", value: "#ece7fe", cssVar: "--primary-50" },
  { name: "primary-100", value: "#c5b4fa", cssVar: "--primary-100" },
  { name: "primary-200", value: "#a98ff8", cssVar: "--primary-200" },
  { name: "primary-300", value: "#825cf5", cssVar: "--primary-300" },
  { name: "primary-400", value: "#6a3df3", cssVar: "--primary-400" },
  { name: "primary-500", value: "#450cf0", cssVar: "--primary-500" },
  { name: "primary-600", value: "#3f0bda", cssVar: "--primary-600" },
  { name: "primary-700", value: "#3109aa", cssVar: "--primary-700" },
  { name: "primary-800", value: "#260784", cssVar: "--primary-800" },
  { name: "primary-900", value: "#1d0565", cssVar: "--primary-900" },
];

const brandPurple = [
  { name: "purple-50", value: "#f3efff", cssVar: "--purple-50" },
  { name: "purple-100", value: "#dacefd", cssVar: "--purple-100" },
  { name: "purple-200", value: "#c8b7fd", cssVar: "--purple-200" },
  { name: "purple-300", value: "#ae94fb", cssVar: "--purple-300" },
  { name: "purple-400", value: "#9d7ffb", cssVar: "--purple-400" },
  { name: "purple-500", value: "#8762fa", cssVar: "--purple-500" },
  { name: "purple-600", value: "#7a59e1", cssVar: "--purple-600" },
  { name: "purple-700", value: "#6046b4", cssVar: "--purple-700" },
  { name: "purple-800", value: "#4b3689", cssVar: "--purple-800" },
  { name: "purple-900", value: "#3a2a6a", cssVar: "--purple-900" },
];

const brandSoftPurple = [
  { name: "soft-purple-50", value: "#faf3ff", cssVar: "--soft-purple-50" },
  { name: "soft-purple-100", value: "#f0d8ff", cssVar: "--soft-purple-100" },
  { name: "soft-purple-200", value: "#e8c6ff", cssVar: "--soft-purple-200" },
  { name: "soft-purple-300", value: "#deabff", cssVar: "--soft-purple-300" },
  { name: "soft-purple-400", value: "#d79bff", cssVar: "--soft-purple-400" },
  { name: "soft-purple-500", value: "#cd82ff", cssVar: "--soft-purple-500" },
  { name: "soft-purple-600", value: "#bb76e8", cssVar: "--soft-purple-600" },
  { name: "soft-purple-700", value: "#925cb5", cssVar: "--soft-purple-700" },
  { name: "soft-purple-800", value: "#71488c", cssVar: "--soft-purple-800" },
  { name: "soft-purple-900", value: "#56376b", cssVar: "--soft-purple-900" },
];

const semanticColors = [
  { name: "success", value: "#22c55e", cssVar: "--color-success" },
  { name: "warning", value: "#eab308", cssVar: "--color-warning" },
  { name: "info", value: "#3b82f6", cssVar: "--color-info" },
  { name: "destructive", value: "#ff0000", cssVar: "--destructive" },
];

const surfaceColors = [
  { name: "background", value: "var(--background)", cssVar: "--background" },
  { name: "foreground", value: "var(--foreground)", cssVar: "--foreground" },
  { name: "surface-elevated", value: "var(--surface-elevated)", cssVar: "--surface-elevated" },
  { name: "surface-sunken", value: "var(--surface-sunken)", cssVar: "--surface-sunken" },
  { name: "surface-overlay", value: "var(--surface-overlay)", cssVar: "--surface-overlay" },
];

const textColors = [
  { name: "text-primary", value: "var(--text-primary)", cssVar: "--text-primary" },
  { name: "text-secondary", value: "var(--text-secondary)", cssVar: "--text-secondary" },
  { name: "text-tertiary", value: "var(--text-tertiary)", cssVar: "--text-tertiary" },
];

const borderColors = [
  { name: "border-default", value: "rgba(255,255,255,0.1)", cssVar: "--border-default" },
  { name: "border-subtle", value: "rgba(255,255,255,0.05)", cssVar: "--border-subtle" },
  { name: "border-emphasis", value: "rgba(135,98,250,0.3)", cssVar: "--border-emphasis" },
];

// ---------------------------------------------------------------------------
// B) Typography
// ---------------------------------------------------------------------------

const fontFamilies = [
  { name: "sans", value: "Inter, system-ui, sans-serif", cssVar: "--font-sans" },
  { name: "display", value: '"Gilgan", var(--font-sans)', cssVar: "--font-display" },
  { name: "alt", value: '"Montserrat", var(--font-sans)', cssVar: "--font-alt" },
];

const fontSizes = [
  { name: "xs", value: "0.75rem", cssVar: "--text-xs", px: "12px" },
  { name: "sm", value: "0.875rem", cssVar: "--text-sm", px: "14px" },
  { name: "base", value: "1rem", cssVar: "--text-base", px: "16px" },
  { name: "lg", value: "1.125rem", cssVar: "--text-lg", px: "18px" },
  { name: "xl", value: "1.25rem", cssVar: "--text-xl", px: "20px" },
  { name: "2xl", value: "clamp(1.35rem, ...)", cssVar: "--text-2xl", px: "~22-28px" },
  { name: "3xl", value: "clamp(1.75rem, ...)", cssVar: "--text-3xl", px: "~28-36px" },
  { name: "4xl", value: "clamp(2.1rem, ...)", cssVar: "--text-4xl", px: "~34-48px" },
  { name: "5xl", value: "clamp(2.6rem, ...)", cssVar: "--text-5xl", px: "~42-60px" },
];

const lineHeights = [
  { name: "tight", value: "1.15", cssVar: "--leading-tight" },
  { name: "snug", value: "1.25", cssVar: "--leading-snug" },
  { name: "normal", value: "1.5", cssVar: "--leading-normal" },
];

// ---------------------------------------------------------------------------
// C) Spacing
// ---------------------------------------------------------------------------

const spacingScale = [
  { name: "0", value: "0rem", px: "0px" },
  { name: "0.5", value: "0.125rem", px: "2px" },
  { name: "1", value: "0.25rem", px: "4px" },
  { name: "1.5", value: "0.375rem", px: "6px" },
  { name: "2", value: "0.5rem", px: "8px" },
  { name: "2.5", value: "0.625rem", px: "10px" },
  { name: "3", value: "0.75rem", px: "12px" },
  { name: "4", value: "1rem", px: "16px" },
  { name: "5", value: "1.25rem", px: "20px" },
  { name: "6", value: "1.5rem", px: "24px" },
  { name: "8", value: "2rem", px: "32px" },
  { name: "10", value: "2.5rem", px: "40px" },
  { name: "12", value: "3rem", px: "48px" },
  { name: "16", value: "4rem", px: "64px" },
  { name: "20", value: "5rem", px: "80px" },
  { name: "24", value: "6rem", px: "96px" },
  { name: "32", value: "8rem", px: "128px" },
  { name: "40", value: "10rem", px: "160px" },
  { name: "48", value: "12rem", px: "192px" },
  { name: "56", value: "14rem", px: "224px" },
  { name: "64", value: "16rem", px: "256px" },
];

// ---------------------------------------------------------------------------
// D) Shadows
// ---------------------------------------------------------------------------

const shadows = [
  { name: "xs", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)", cssVar: "--shadow-xs" },
  { name: "sm", value: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)", cssVar: "--shadow-sm" },
  { name: "md", value: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.06)", cssVar: "--shadow-md" },
  { name: "lg", value: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)", cssVar: "--shadow-lg" },
  { name: "xl", value: "0 20px 25px -5px rgb(0 0 0 / 0.12), 0 10px 10px -5px rgb(0 0 0 / 0.04)", cssVar: "--shadow-xl" },
  { name: "glow-primary", value: "0 0 0 3px rgb(69 12 240 / 0.35)", cssVar: "--shadow-glow-primary" },
];

// ---------------------------------------------------------------------------
// E) Border Radius
// ---------------------------------------------------------------------------

const radii = [
  { name: "none", value: "0px", cssVar: "--radius-none" },
  { name: "xs", value: "2px", cssVar: "--radius-xs" },
  { name: "sm", value: "4px", cssVar: "--radius-sm" },
  { name: "default", value: "8px", cssVar: "--radius" },
  { name: "md", value: "10px", cssVar: "--radius-md" },
  { name: "lg", value: "12px", cssVar: "--radius-lg" },
  { name: "xl", value: "16px", cssVar: "--radius-xl" },
  { name: "2xl", value: "24px", cssVar: "--radius-2xl" },
  { name: "full", value: "9999px", cssVar: "--radius-full" },
];

// ---------------------------------------------------------------------------
// F) Z-Index
// ---------------------------------------------------------------------------

const zIndices = [
  { name: "base", value: "1", cssVar: "--z-base" },
  { name: "sticky", value: "100", cssVar: "--z-sticky" },
  { name: "dropdown", value: "1000", cssVar: "--z-dropdown" },
  { name: "modal", value: "1100", cssVar: "--z-modal" },
  { name: "popover", value: "1200", cssVar: "--z-popover" },
  { name: "toast", value: "1300", cssVar: "--z-toast" },
  { name: "tooltip", value: "1400", cssVar: "--z-tooltip" },
];

// ---------------------------------------------------------------------------
// G) Motion
// ---------------------------------------------------------------------------

const easingCurves = [
  { name: "standard", value: "cubic-bezier(0.4, 0, 0.2, 1)", cssVar: "--ease-standard" },
  { name: "snappy", value: "cubic-bezier(0.2, 0, 0, 1)", cssVar: "--ease-snappy" },
  { name: "fluid", value: "cubic-bezier(0.3, 0, 0, 1)", cssVar: "--ease-fluid" },
];

const durations = [
  { name: "quick", value: "120ms", cssVar: "--duration-quick" },
  { name: "fast", value: "180ms", cssVar: "--duration-fast" },
  { name: "base", value: "240ms", cssVar: "--duration-base" },
  { name: "slow", value: "360ms", cssVar: "--duration-slow" },
];

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function DesignTokensPage() {
  return (
    <div className="space-y-14">
      {/* Header */}
      <section>
        <h1 className="text-3xl lg:text-4xl font-bold text-text-primary font-display">
          Design Tokens
        </h1>
        <p className="mt-3 text-base text-text-secondary max-w-2xl leading-relaxed">
          Design tokens are the atomic values that power the FundBrave design
          system. They ensure consistency across the platform by providing a
          single source of truth for colors, typography, spacing, shadows, and
          motion. Click any token to copy its CSS variable to the clipboard.
        </p>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* A) COLORS */}
      {/* ----------------------------------------------------------------- */}
      <TokenSection title="Colors" id="colors">
        <TokenSubsection title="Primary Blue">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {brandPrimary.map((token) => (
              <TokenSwatch
                key={token.name}
                variant="color"
                name={token.name}
                value={token.value}
                cssVar={token.cssVar}
              />
            ))}
          </div>
        </TokenSubsection>

        <TokenSubsection title="Purple">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {brandPurple.map((token) => (
              <TokenSwatch
                key={token.name}
                variant="color"
                name={token.name}
                value={token.value}
                cssVar={token.cssVar}
              />
            ))}
          </div>
        </TokenSubsection>

        <TokenSubsection title="Soft Purple">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {brandSoftPurple.map((token) => (
              <TokenSwatch
                key={token.name}
                variant="color"
                name={token.name}
                value={token.value}
                cssVar={token.cssVar}
              />
            ))}
          </div>
        </TokenSubsection>

        <TokenSubsection title="Semantic">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {semanticColors.map((token) => (
              <TokenSwatch
                key={token.name}
                variant="color"
                name={token.name}
                value={token.value}
                cssVar={token.cssVar}
              />
            ))}
          </div>
        </TokenSubsection>

        <TokenSubsection title="Surfaces">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {surfaceColors.map((token) => (
              <SurfaceTokenCard
                key={token.name}
                name={token.name}
                cssVar={token.cssVar}
              />
            ))}
          </div>
        </TokenSubsection>

        <TokenSubsection title="Text">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {textColors.map((token) => (
              <TextTokenCard
                key={token.name}
                name={token.name}
                cssVar={token.cssVar}
              />
            ))}
          </div>
        </TokenSubsection>

        <TokenSubsection title="Borders">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {borderColors.map((token) => (
              <BorderTokenCard
                key={token.name}
                name={token.name}
                value={token.value}
                cssVar={token.cssVar}
              />
            ))}
          </div>
        </TokenSubsection>
      </TokenSection>

      {/* ----------------------------------------------------------------- */}
      {/* B) TYPOGRAPHY */}
      {/* ----------------------------------------------------------------- */}
      <TokenSection title="Typography" id="typography">
        <TokenSubsection title="Font Families">
          <div className="space-y-3">
            {fontFamilies.map((ff) => (
              <div
                key={ff.name}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-xl border border-white/10 bg-surface-elevated"
              >
                <div className="sm:w-24 shrink-0">
                  <span className="text-xs text-text-tertiary font-mono">
                    {ff.cssVar}
                  </span>
                </div>
                <p
                  className="text-xl text-text-primary"
                  style={{
                    fontFamily:
                      ff.name === "display"
                        ? '"Gilgan", sans-serif'
                        : ff.name === "alt"
                          ? '"Montserrat", sans-serif'
                          : 'Inter, sans-serif',
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </p>
                <span className="text-xs text-text-tertiary ml-auto shrink-0">
                  {ff.name}
                </span>
              </div>
            ))}
          </div>
        </TokenSubsection>

        <TokenSubsection title="Font Sizes">
          <div className="space-y-2">
            {fontSizes.map((fs) => (
              <div
                key={fs.name}
                className="flex items-center gap-4 p-3 rounded-lg border border-white/10 bg-surface-elevated"
              >
                <span className="w-14 text-xs text-text-tertiary font-mono shrink-0">
                  {fs.name}
                </span>
                <span
                  className="text-text-primary flex-1 truncate"
                  style={{ fontSize: fs.name.includes("clamp") ? undefined : fs.value }}
                >
                  Design System
                </span>
                <span className="text-xs text-text-tertiary tabular-nums shrink-0">
                  {fs.px}
                </span>
              </div>
            ))}
          </div>
        </TokenSubsection>

        <TokenSubsection title="Line Heights">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {lineHeights.map((lh) => (
              <div
                key={lh.name}
                className="p-4 rounded-xl border border-white/10 bg-surface-elevated"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">
                    {lh.name}
                  </span>
                  <span className="text-xs text-text-tertiary font-mono">
                    {lh.value}
                  </span>
                </div>
                <p
                  className="text-sm text-text-secondary"
                  style={{ lineHeight: lh.value }}
                >
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            ))}
          </div>
        </TokenSubsection>
      </TokenSection>

      {/* ----------------------------------------------------------------- */}
      {/* C) SPACING */}
      {/* ----------------------------------------------------------------- */}
      <TokenSection title="Spacing" id="spacing">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {spacingScale.map((sp) => (
            <TokenSwatch
              key={sp.name}
              variant="spacing"
              name={`spacing-${sp.name}`}
              value={sp.value}
              cssVar={`--spacing-${sp.name.replace(".", "_")}`}
            />
          ))}
        </div>
      </TokenSection>

      {/* ----------------------------------------------------------------- */}
      {/* D) SHADOWS */}
      {/* ----------------------------------------------------------------- */}
      <TokenSection title="Shadows" id="shadows">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {shadows.map((sh) => (
            <TokenSwatch
              key={sh.name}
              variant="shadow"
              name={`shadow-${sh.name}`}
              value={sh.value}
              cssVar={sh.cssVar}
            />
          ))}
        </div>
      </TokenSection>

      {/* ----------------------------------------------------------------- */}
      {/* E) BORDER RADIUS */}
      {/* ----------------------------------------------------------------- */}
      <TokenSection title="Border Radius" id="border-radius">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {radii.map((r) => (
            <TokenSwatch
              key={r.name}
              variant="radius"
              name={`radius-${r.name}`}
              value={r.value}
              cssVar={r.cssVar}
            />
          ))}
        </div>
      </TokenSection>

      {/* ----------------------------------------------------------------- */}
      {/* F) Z-INDEX */}
      {/* ----------------------------------------------------------------- */}
      <TokenSection title="Z-Index" id="z-index">
        <div className="relative flex items-end gap-2 h-64 p-4 rounded-xl border border-white/10 bg-surface-elevated overflow-hidden">
          {zIndices.map((z, idx) => {
            const height = 30 + idx * 30;
            return (
              <div
                key={z.name}
                className="relative flex flex-col items-center justify-end"
                style={{ zIndex: Number(z.value), height: `${height}px` }}
              >
                <div
                  className={cn(
                    "w-14 sm:w-20 rounded-t-lg border border-white/10",
                    "flex items-center justify-center text-[10px] font-mono text-text-secondary",
                    idx % 2 === 0
                      ? "bg-primary/20"
                      : "bg-purple/20"
                  )}
                  style={{ height: `${height}px` }}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-text-primary font-medium text-xs">
                      {z.value}
                    </span>
                    <span className="text-[9px] text-text-tertiary truncate max-w-full px-1">
                      {z.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* List for copy access */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
          {zIndices.map((z) => (
            <TokenSwatch
              key={z.name}
              variant="spacing"
              name={`z-${z.name}`}
              value={z.value}
              cssVar={z.cssVar}
            />
          ))}
        </div>
      </TokenSection>

      {/* ----------------------------------------------------------------- */}
      {/* G) MOTION */}
      {/* ----------------------------------------------------------------- */}
      <TokenSection title="Motion" id="motion">
        <TokenSubsection title="Easing Curves">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {easingCurves.map((ec) => (
              <EasingCard key={ec.name} name={ec.name} value={ec.value} cssVar={ec.cssVar} />
            ))}
          </div>
        </TokenSubsection>

        <TokenSubsection title="Durations">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {durations.map((dur) => (
              <DurationCard key={dur.name} name={dur.name} value={dur.value} cssVar={dur.cssVar} />
            ))}
          </div>
        </TokenSubsection>
      </TokenSection>
    </div>
  );
}

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

function TokenSection({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <h2
        id={`${id}-heading`}
        className="text-xl font-bold text-text-primary font-display mb-6"
      >
        {title}
      </h2>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

function TokenSubsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

// =============================================================================
// CUSTOM TOKEN CARDS (for tokens that need special rendering)
// =============================================================================

/** Surface color card -- shows a live preview using the CSS variable */
function SurfaceTokenCard({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-surface-elevated">
      <span
        className="h-10 w-10 shrink-0 rounded-lg border border-white/10"
        style={{ backgroundColor: `var(${cssVar})` }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
        <p className="text-xs text-primary/70 font-mono truncate">{cssVar}</p>
      </div>
    </div>
  );
}

/** Text color card -- shows the text rendered in its own color */
function TextTokenCard({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-surface-elevated">
      <span
        className="text-lg font-bold shrink-0 w-10 text-center"
        style={{ color: `var(${cssVar})` }}
        aria-hidden="true"
      >
        Aa
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
        <p className="text-xs text-primary/70 font-mono truncate">{cssVar}</p>
      </div>
    </div>
  );
}

/** Border color card -- shows a bordered box */
function BorderTokenCard({
  name,
  value,
  cssVar,
}: {
  name: string;
  value: string;
  cssVar: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-surface-elevated">
      <span
        className="h-10 w-10 shrink-0 rounded-lg"
        style={{ border: `2px solid var(${cssVar})` }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
        <p className="text-xs text-text-tertiary truncate">{value}</p>
        <p className="text-xs text-primary/70 font-mono truncate mt-0.5">
          {cssVar}
        </p>
      </div>
    </div>
  );
}

/** Easing curve card -- animates a ball on hover/click */
function EasingCard({
  name,
  value,
  cssVar,
}: {
  name: string;
  value: string;
  cssVar: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 800);
      }}
      className={cn(
        "p-4 rounded-xl border border-white/10 bg-surface-elevated text-left",
        "hover:border-primary/30 transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-primary">{name}</span>
        <span className="text-[10px] text-text-tertiary font-mono">{cssVar}</span>
      </div>

      {/* Animation track */}
      <div className="relative h-8 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="absolute top-1 left-1 h-6 w-6 rounded-full bg-primary"
          animate={{
            x: isAnimating ? "calc(100% - 1.5rem)" : 0,
          }}
          transition={{
            duration: 0.6,
            ease:
              name === "standard"
                ? [0.4, 0, 0.2, 1]
                : name === "snappy"
                  ? [0.2, 0, 0, 1]
                  : [0.3, 0, 0, 1],
          }}
          style={{ maxWidth: "100%" }}
        />
      </div>

      <p className="text-[10px] text-text-tertiary font-mono mt-2 truncate">
        {value}
      </p>
      <p className="text-[10px] text-text-tertiary mt-1">Click to preview</p>
    </button>
  );
}

/** Duration card -- animates a bar for the given duration */
function DurationCard({
  name,
  value,
  cssVar,
}: {
  name: string;
  value: string;
  cssVar: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const ms = parseInt(value, 10);

  return (
    <button
      type="button"
      onClick={() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), ms + 200);
      }}
      className={cn(
        "p-4 rounded-xl border border-white/10 bg-surface-elevated text-left",
        "hover:border-primary/30 transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">{name}</span>
        <span className="text-xs text-text-tertiary tabular-nums">{value}</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-soft-purple"
          animate={{
            width: isAnimating ? "100%" : "0%",
          }}
          transition={{
            duration: ms / 1000,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </div>

      <p className="text-[10px] text-text-tertiary font-mono mt-2">{cssVar}</p>
      <p className="text-[10px] text-text-tertiary mt-0.5">Click to preview</p>
    </button>
  );
}
