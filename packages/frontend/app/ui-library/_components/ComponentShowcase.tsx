"use client";

import { useState, useCallback, useRef, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, ShieldCheck, Palette, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { StatusBadge } from "./StatusBadge";
import type { UsageGuideline } from "@/app/ui-library/types";

export interface ComponentShowcaseProps {
  /** Component name displayed as the page heading */
  name: string;
  /** Short description of what the component does */
  description: string;
  /** Whether the component is built or still planned */
  status: "built" | "planned";
  /** The import statement users should copy (e.g. "@/app/components/ui/button") */
  importPath: string;
  /** Page content -- sections, examples, tables, playgrounds, etc. */
  children: ReactNode;
  /** Accessibility notes for this component */
  accessibility?: string[];
  /** Design tokens used by this component */
  designTokens?: string[];
  /** Usage guidelines (do / don't / caution) */
  guidelines?: UsageGuideline[];
  /** Additional className for the outer container */
  className?: string;
}

/**
 * ComponentShowcase -- the standard page wrapper for every component page
 * in the UI Library. Provides a consistent header (name, description, status
 * badge, copyable import path) and optional accessibility / design-token
 * documentation sections at the bottom.
 */
export function ComponentShowcase({
  name,
  description,
  status,
  importPath,
  children,
  accessibility,
  designTokens,
  guidelines,
  className,
}: ComponentShowcaseProps) {
  const a11ySectionId = useId();
  const tokensSectionId = useId();
  const guidelinesSectionId = useId();

  return (
    <article className={cn("mx-auto max-w-5xl space-y-12 py-8", className)}>
      {/* ---------------------------------------------------------------- */}
      {/*  Header                                                          */}
      {/* ---------------------------------------------------------------- */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-text-primary">
            {name}
          </h1>
          <StatusBadge status={status} />
        </div>

        <p className="text-lg leading-relaxed text-text-secondary max-w-2xl">
          {description}
        </p>

        <ImportPath path={importPath} />
      </header>

      {/* ---------------------------------------------------------------- */}
      {/*  Main content                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-12">{children}</div>

      {/* ---------------------------------------------------------------- */}
      {/*  Usage Guidelines                                                 */}
      {/* ---------------------------------------------------------------- */}
      {guidelines && guidelines.length > 0 && (
        <GuidelinesSection
          id={guidelinesSectionId}
          guidelines={guidelines}
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/*  Accessibility notes                                              */}
      {/* ---------------------------------------------------------------- */}
      {accessibility && accessibility.length > 0 && (
        <section aria-labelledby={a11ySectionId} className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="h-5 w-5 text-emerald-400"
              aria-hidden="true"
            />
            <h2
              id={a11ySectionId}
              className="font-display text-xl font-semibold text-text-primary"
            >
              Accessibility
            </h2>
          </div>
          <ul className="space-y-2 pl-4" role="list">
            {accessibility.map((note, i) => (
              <li
                key={i}
                className="relative pl-4 text-sm leading-relaxed text-text-secondary before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-400/60"
              >
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/*  Design tokens                                                    */}
      {/* ---------------------------------------------------------------- */}
      {designTokens && designTokens.length > 0 && (
        <section aria-labelledby={tokensSectionId} className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette
              className="h-5 w-5 text-purple-400"
              aria-hidden="true"
            />
            <h2
              id={tokensSectionId}
              className="font-display text-xl font-semibold text-text-primary"
            >
              Design Tokens
            </h2>
          </div>
          <div className="flex flex-wrap gap-2" role="list">
            {designTokens.map((token) => (
              <span
                key={token}
                role="listitem"
                className="inline-flex items-center rounded-lg border border-border-subtle bg-surface-elevated px-3 py-1.5 font-mono text-xs text-primary-300"
              >
                {token}
              </span>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  ImportPath sub-component                                                   */
/* -------------------------------------------------------------------------- */

function ImportPath({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const importStatement = `import { ... } from "${path}"`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(importStatement);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = importStatement;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [importStatement]);

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-lg border border-border-subtle bg-surface-elevated px-3 py-1.5 font-mono text-sm text-text-secondary">
        {importStatement}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium",
          "text-text-tertiary transition-all duration-[var(--duration-fast)]",
          "hover:bg-white/[0.06] hover:text-text-secondary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        aria-label={copied ? "Copied import path" : "Copy import path"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1 text-emerald-400"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Copied
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  GuidelinesSection sub-component                                            */
/* -------------------------------------------------------------------------- */

const guidelineConfig = {
  do: {
    Icon: CheckCircle2,
    iconColor: "text-emerald-400",
    borderColor: "border-l-emerald-400",
    bgColor: "bg-emerald-400/5",
    label: "Do",
  },
  dont: {
    Icon: XCircle,
    iconColor: "text-red-400",
    borderColor: "border-l-red-400",
    bgColor: "bg-red-400/5",
    label: "Don't",
  },
  caution: {
    Icon: AlertTriangle,
    iconColor: "text-amber-400",
    borderColor: "border-l-amber-400",
    bgColor: "bg-amber-400/5",
    label: "Caution",
  },
} as const;

function GuidelinesSection({
  id,
  guidelines,
}: {
  id: string;
  guidelines: UsageGuideline[];
}) {
  const doItems = guidelines.filter((g) => g.type === "do");
  const dontItems = guidelines.filter((g) => g.type === "dont");
  const cautionItems = guidelines.filter((g) => g.type === "caution");

  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2
        id={id}
        className="font-display text-xl font-semibold text-text-primary"
      >
        Usage Guidelines
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {doItems.map((item, i) => (
          <GuidelineCard key={`do-${i}`} guideline={item} />
        ))}
        {dontItems.map((item, i) => (
          <GuidelineCard key={`dont-${i}`} guideline={item} />
        ))}
        {cautionItems.map((item, i) => (
          <GuidelineCard key={`caution-${i}`} guideline={item} />
        ))}
      </div>
    </section>
  );
}

function GuidelineCard({ guideline }: { guideline: UsageGuideline }) {
  const config = guidelineConfig[guideline.type];
  const { Icon } = config;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-white/10 border-l-[3px] p-3.5",
        config.borderColor,
        config.bgColor
      )}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconColor)}
        aria-hidden="true"
      />
      <div className="space-y-0.5">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            config.iconColor
          )}
        >
          {config.label}
        </span>
        <p className="text-sm leading-relaxed text-text-secondary">
          {guideline.text}
        </p>
      </div>
    </div>
  );
}

export default ComponentShowcase;
