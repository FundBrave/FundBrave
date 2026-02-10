import { useId } from "react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface VariantGalleryProps {
  /** Section title displayed above the grid */
  title: string;
  /** Variant preview cards (each child is rendered inside a card wrapper) */
  children: ReactNode;
  /** Number of grid columns (default 3). Responsive: always 1 col on mobile, 2 on sm. */
  columns?: number;
  /** Additional className for the outer container */
  className?: string;
}

/**
 * VariantGallery -- a titled section that lays its children out in a
 * responsive grid of variant-preview cards.
 *
 * Wrap each variant in `<VariantGalleryItem label="...">` for consistent
 * card styling, or pass plain children for a raw grid layout.
 */
export function VariantGallery({
  title,
  children,
  columns = 3,
  className,
}: VariantGalleryProps) {
  const headingId = useId();

  const colsClass: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  };

  return (
    <section className={cn("space-y-4", className)} aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="font-display text-lg font-semibold text-text-primary"
      >
        {title}
      </h3>
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-4",
          colsClass[columns] ?? "md:grid-cols-3"
        )}
      >
        {children}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  VariantGalleryItem                                                         */
/* -------------------------------------------------------------------------- */

export interface VariantItemProps {
  /** Label shown at the top of the card */
  label: string;
  /** The variant preview to render */
  children: ReactNode;
  /** Additional className for the card */
  className?: string;
}

/**
 * Individual card inside a VariantGallery grid.
 * Shows a label and renders the preview content centered within.
 */
export function VariantGalleryItem({ label, children, className }: VariantItemProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-surface-elevated p-6 space-y-3",
        className
      )}
    >
      <span className="block text-xs font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <div className="flex items-center justify-center min-h-[48px]">
        {children}
      </div>
    </div>
  );
}

export default VariantGallery;
