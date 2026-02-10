import Link from "next/link";
import {
  Palette,
  Shapes,
  Sparkles,
  Layers,
  ArrowRight,
  Package,
  CheckCircle2,
  Clock,
  FolderOpen,
} from "lucide-react";
import {
  CATEGORIES,
  COMPONENT_REGISTRY,
  getBuiltComponents,
  getPlannedComponents,
} from "./registry";
import { CategoryOverview } from "./_components/CategoryOverview";

// ---------------------------------------------------------------------------
// Stat card data
// ---------------------------------------------------------------------------
const stats = [
  {
    label: "Total Components",
    value: COMPONENT_REGISTRY.length,
    icon: Package,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Built",
    value: getBuiltComponents().length,
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    label: "Planned",
    value: getPlannedComponents().length,
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    label: "Categories",
    value: CATEGORIES.length,
    icon: FolderOpen,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
];

// ---------------------------------------------------------------------------
// Quick-links
// ---------------------------------------------------------------------------
const quickLinks = [
  {
    href: "/ui-library/design-tokens",
    label: "Design Tokens",
    description: "Colors, typography, spacing, shadows, and more.",
    icon: Palette,
    gradient: "from-primary-500/20 to-purple-500/20",
  },
  {
    href: "/ui-library/icons",
    label: "Icons",
    description: "50+ custom SVG icons organized by category.",
    icon: Shapes,
    gradient: "from-purple-500/20 to-soft-purple-500/20",
  },
  {
    href: "/ui-library/animations",
    label: "Animations",
    description: "GSAP and motion/react animation patterns.",
    icon: Sparkles,
    gradient: "from-soft-purple-500/20 to-primary-500/20",
  },
  {
    href: "/ui-library/patterns",
    label: "Patterns",
    description: "Reusable composition and layout patterns.",
    icon: Layers,
    gradient: "from-emerald-500/20 to-primary-500/20",
  },
];

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------
export default function UILibraryOverviewPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section>
        <h1 className="text-3xl lg:text-4xl font-bold text-text-primary font-display">
          FundBrave Design System
        </h1>
        <p className="mt-3 text-base lg:text-lg text-text-secondary max-w-2xl leading-relaxed">
          A comprehensive component library powering FundBrave's decentralized
          fundraising platform. Browse, preview, and integrate production-ready
          React components built with accessibility and performance in mind.
        </p>
      </section>

      {/* Stats grid */}
      <section aria-label="Component statistics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-2 p-4 rounded-xl border border-white/10 bg-surface-elevated"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-md ${stat.bgColor}`}
                >
                  <stat.icon
                    className={`h-4 w-4 ${stat.color}`}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xs text-text-tertiary font-medium">
                  {stat.label}
                </span>
              </div>
              <span className="text-2xl lg:text-3xl font-bold text-text-primary tabular-nums">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick links grid */}
      <section aria-label="Quick links">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Explore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-surface-elevated hover:border-primary/30 hover:bg-white/[0.04] transition-all duration-[var(--duration-fast)]"
            >
              <div className={`p-2.5 rounded-lg bg-gradient-to-br ${link.gradient}`}>
                <link.icon
                  className="h-5 w-5 text-text-primary"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-text-primary">
                    {link.label}
                  </span>
                  <ArrowRight
                    className="h-3.5 w-3.5 text-text-tertiary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  {link.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Category overview */}
      <section aria-label="Component categories">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Categories
        </h2>
        <CategoryOverview />
      </section>

      {/* Getting started */}
      <section aria-label="Getting started">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Getting Started
        </h2>
        <div className="p-5 rounded-xl border border-white/10 bg-surface-elevated space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Import a component
            </h3>
            <div className="rounded-lg bg-black/30 border border-white/5 p-4 overflow-x-auto">
              <pre className="text-sm text-text-secondary font-mono">
                <code>{`import { Button } from "@/app/components/ui/button";

export function MyPage() {
  return (
    <Button variant="primary" size="md">
      Donate Now
    </Button>
  );
}`}</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Use design tokens
            </h3>
            <div className="rounded-lg bg-black/30 border border-white/5 p-4 overflow-x-auto">
              <pre className="text-sm text-text-secondary font-mono">
                <code>{`/* Use CSS variables from globals.css */
.my-component {
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

/* Or use Tailwind utility classes */
<div className="text-text-primary bg-surface-elevated border border-border-subtle rounded-lg shadow-card">
  ...
</div>`}</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Combine with cn() utility
            </h3>
            <div className="rounded-lg bg-black/30 border border-white/5 p-4 overflow-x-auto">
              <pre className="text-sm text-text-secondary font-mono">
                <code>{`import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-surface-elevated p-4",
        className
      )}
      {...props}
    />
  );
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
