"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, Clipboard, Check } from "lucide-react";
import {
  CATEGORIES,
  getComponentsByCategory,
} from "../registry";
import type { ComponentRegistryEntry } from "../types";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CATEGORIES.map((category) => {
        const components = getComponentsByCategory(category.id);
        const builtCount = components.filter(
          (c) => c.status === "built"
        ).length;
        const firstBuilt = components.find((c) => c.status === "built");

        return (
          <div
            key={category.id}
            className="p-4 rounded-xl border border-white/10 bg-surface-elevated"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-text-primary">
                {category.label}
              </h3>
              <span className="text-xs text-text-tertiary tabular-nums">
                {builtCount}/{components.length} built
              </span>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed mb-3 line-clamp-2">
              {category.description}
            </p>

            {/* Component list with copy buttons */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {components.map((component) => (
                <ComponentChip
                  key={component.slug}
                  component={component}
                />
              ))}
            </div>

            {firstBuilt ? (
              <Link
                href={`/ui-library/components/${firstBuilt.slug}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View {category.label}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            ) : (
              <span className="text-xs text-text-tertiary italic">
                Coming soon
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComponentChip -- shows component name with copy-to-clipboard for built ones
// ---------------------------------------------------------------------------

function ComponentChip({
  component,
}: {
  component: ComponentRegistryEntry;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    if (component.status !== "built") return;

    const importStatement = `import { ${component.name} } from "${component.importPath}";`;
    try {
      await navigator.clipboard.writeText(importStatement);
    } catch {
      // Fallback for insecure contexts
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
  }, [component]);

  const isBuilt = component.status === "built";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-mono",
        "transition-colors duration-150",
        isBuilt
          ? "text-emerald-400/90 bg-emerald-500/[0.08] border border-emerald-500/15"
          : "text-text-tertiary bg-white/[0.03] border border-white/5"
      )}
    >
      <span className="truncate">{component.name}</span>
      {isBuilt && (
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center justify-center shrink-0 rounded p-0.5",
            "text-current opacity-50 hover:opacity-100",
            "transition-opacity duration-150",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
            copied && "opacity-100"
          )}
          aria-label={
            copied
              ? `Copied import for ${component.name}`
              : `Copy import for ${component.name}`
          }
          title={
            copied
              ? "Copied!"
              : `Copy: import { ${component.name} } from "${component.importPath}"`
          }
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
          ) : (
            <Clipboard className="h-3 w-3" aria-hidden="true" />
          )}
        </button>
      )}
    </span>
  );
}

export default CategoryOverview;
