"use client";

import { useState, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eye, Code2 } from "lucide-react";
import { CodeBlock } from "./CodeBlock";

export interface InteractivePlaygroundProps {
  /** The live component preview */
  children: ReactNode;
  /** Form controls for adjusting the component props */
  controls: ReactNode;
  /** Code string reflecting the current prop state */
  code: string;
  /** Optional title for the playground section */
  title?: string;
  /** Additional className for the outer container */
  className?: string;
}

/**
 * InteractivePlayground -- split layout with a live preview, a controls
 * panel, and a code view that reflects the current configuration.
 *
 * On desktop: 2/3 preview + 1/3 controls side by side, code below.
 * On mobile: toggle between "Preview" and "Code" tabs; controls appear below preview.
 */
export function InteractivePlayground({
  children,
  controls,
  code,
  title,
  className,
}: InteractivePlaygroundProps) {
  const [mobileView, setMobileView] = useState<"preview" | "code">("preview");
  const titleId = useId();

  return (
    <section
      className={cn(
        "rounded-xl border border-border-subtle overflow-hidden",
        className
      )}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "Interactive playground"}
    >
      {/* Header with title + mobile view toggle */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-white/[0.02] px-4 py-3">
        {title ? (
          <h3
            id={titleId}
            className="font-display text-sm font-semibold text-text-primary"
          >
            {title}
          </h3>
        ) : (
          <span className="text-sm font-medium text-text-secondary">
            Playground
          </span>
        )}

        {/* Mobile toggle */}
        <div
          className="flex items-center gap-1 rounded-lg bg-surface-sunken p-0.5 md:hidden"
          role="tablist"
          aria-label="Playground view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "preview"}
            aria-controls="playground-preview"
            onClick={() => setMobileView("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              mobileView === "preview"
                ? "bg-primary text-white shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "code"}
            aria-controls="playground-code"
            onClick={() => setMobileView("code")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              mobileView === "code"
                ? "bg-primary text-white shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
            Code
          </button>
        </div>
      </div>

      {/* Desktop layout: preview (2/3) + controls (1/3) */}
      <div
        className={cn(
          "md:grid md:grid-cols-3",
          mobileView === "code" && "hidden md:grid"
        )}
        id="playground-preview"
        role="tabpanel"
        aria-label="Preview panel"
      >
        {/* Preview area */}
        <div className="col-span-2 flex items-center justify-center bg-surface-sunken p-8 min-h-[200px]">
          {children}
        </div>

        {/* Controls area */}
        <div className="border-t border-border-subtle md:border-t-0 md:border-l md:border-border-subtle bg-white/[0.01] p-4 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Controls
          </h4>
          {controls}
        </div>
      </div>

      {/* Code section */}
      <div
        className={cn(
          "border-t border-border-subtle",
          mobileView === "preview" && "hidden md:block"
        )}
        id="playground-code"
        role="tabpanel"
        aria-label="Code panel"
      >
        <CodeBlock code={code} language="tsx" />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Playground Control Helpers                                                  */
/* -------------------------------------------------------------------------- */

export interface PlaygroundSelectProps {
  /** Label for the control */
  label: string;
  /** Currently selected value */
  value: string;
  /** List of options */
  options: string[];
  /** Change callback */
  onChange: (value: string) => void;
}

/**
 * A select input designed to be used inside the InteractivePlayground controls
 * panel. Provides consistent styling.
 */
export function PlaygroundSelect({
  label,
  value,
  options,
  onChange,
}: PlaygroundSelectProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-text-secondary"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border border-border-subtle bg-surface-sunken",
          "px-3 py-2 text-sm text-text-primary",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background",
          "appearance-none cursor-pointer"
        )}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface PlaygroundToggleProps {
  /** Label for the toggle */
  label: string;
  /** Current checked state */
  checked: boolean;
  /** Change callback */
  onChange: (checked: boolean) => void;
}

/**
 * A toggle switch for the InteractivePlayground controls panel.
 */
export function PlaygroundToggle({
  label,
  checked,
  onChange,
}: PlaygroundToggleProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-xs font-medium text-text-secondary">
        {label}
      </label>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          checked ? "bg-primary" : "bg-surface-sunken border border-border-subtle"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
            checked ? "left-[18px]" : "left-0.5"
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export interface PlaygroundTextInputProps {
  /** Label for the input */
  label: string;
  /** Current value */
  value: string;
  /** Change callback */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * A text input for the InteractivePlayground controls panel.
 */
export function PlaygroundTextInput({
  label,
  value,
  onChange,
  placeholder,
}: PlaygroundTextInputProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-text-secondary"
      >
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-border-subtle bg-surface-sunken",
          "px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
        )}
      />
    </div>
  );
}

export default InteractivePlayground;
