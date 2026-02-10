"use client";

import { cn } from "@/lib/utils";

export interface PropDefinition {
  /** The prop name */
  name: string;
  /** TypeScript type signature */
  type: string;
  /** Whether the prop is required */
  required: boolean;
  /** Default value (if any) */
  defaultValue?: string;
  /** Human-readable description */
  description: string;
}

export interface PropsTableProps {
  /** Array of prop definitions to display */
  props: PropDefinition[];
  /** Additional className for the outer container */
  className?: string;
}

/**
 * PropsTable -- renders a responsive table documenting a component's props.
 *
 * On desktop it renders a standard HTML table. On mobile (below md breakpoint)
 * it switches to a stacked card layout for readability on small screens.
 */
export function PropsTable({ props, className }: PropsTableProps) {
  if (props.length === 0) return null;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop table -- hidden on mobile */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full text-left text-sm" role="table">
          <thead>
            <tr className="border-b border-border-subtle bg-white/[0.02]">
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-text-primary"
              >
                Prop
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-text-primary"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-text-primary"
              >
                Required
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-text-primary"
              >
                Default
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-text-primary"
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop, index) => (
              <tr
                key={prop.name}
                className={cn(
                  "border-b border-border-subtle last:border-b-0 transition-colors",
                  index % 2 === 0
                    ? "bg-surface-elevated/50"
                    : "bg-transparent"
                )}
              >
                <td className="px-4 py-3">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-primary">
                    {prop.name}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-primary-300">
                    {prop.type}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <RequiredBadge required={prop.required} />
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {prop.defaultValue ? (
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-white/70">
                      {prop.defaultValue}
                    </code>
                  ) : (
                    <span className="text-text-tertiary">&mdash;</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary max-w-xs">
                  {prop.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout -- hidden on desktop */}
      <div className="flex flex-col gap-3 md:hidden" role="list">
        {props.map((prop) => (
          <div
            key={prop.name}
            className="rounded-xl border border-border-subtle bg-surface-elevated p-4 space-y-2"
            role="listitem"
          >
            <div className="flex items-center justify-between gap-2">
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-sm font-semibold text-primary">
                {prop.name}
              </code>
              <RequiredBadge required={prop.required} />
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 text-text-tertiary text-xs uppercase tracking-wider">
                  Type
                </span>
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-primary-300 break-all">
                  {prop.type}
                </code>
              </div>

              {prop.defaultValue && (
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-text-tertiary text-xs uppercase tracking-wider">
                    Default
                  </span>
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-white/70">
                    {prop.defaultValue}
                  </code>
                </div>
              )}

              <p className="text-text-secondary leading-relaxed pt-1">
                {prop.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Internal sub-component                                                     */
/* -------------------------------------------------------------------------- */

function RequiredBadge({ required }: { required: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        required
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
          : "bg-white/[0.06] text-text-tertiary border border-white/10"
      )}
    >
      {required ? "Required" : "Optional"}
    </span>
  );
}

export default PropsTable;
