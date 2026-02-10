"use client";

import { VisuallyHidden } from "@/app/components/ui/VisuallyHidden";
import type { PlaygroundConfig } from "../types";

/**
 * VisuallyHiddenDemo - Shows the invisible component alongside an info box
 * revealing what assistive technology would read.
 */
function VisuallyHiddenDemo(props: {
  as: "span" | "div" | "p" | "label";
  focusable: boolean;
  children: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* The actual VisuallyHidden component (invisible on screen) */}
      <div className="relative rounded-xl border border-dashed border-white/20 bg-surface-elevated p-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Rendered Output (visually empty area)
        </p>
        <div className="flex min-h-[48px] items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <VisuallyHidden as={props.as} focusable={props.focusable}>
            {props.children}
          </VisuallyHidden>
          <span className="text-sm italic text-text-tertiary">
            {props.focusable
              ? "Tab here to reveal focusable hidden content"
              : "Content is invisible but present in the DOM"}
          </span>
        </div>
      </div>

      {/* Info box showing what screen readers see */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
            SR
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Screen Reader Content
          </span>
        </div>
        <p className="text-sm text-text-primary">{props.children}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-tertiary">
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5">
            Element:{" "}
            <code className="font-mono text-primary">
              &lt;{props.as}&gt;
            </code>
          </span>
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5">
            Focusable:{" "}
            <code className="font-mono text-primary">
              {String(props.focusable)}
            </code>
          </span>
        </div>
      </div>
    </div>
  );
}

const visuallyHiddenPlayground: PlaygroundConfig = {
  componentName: "VisuallyHidden",
  importPath: "@/app/components/ui/VisuallyHidden",
  defaultChildren: undefined,
  controls: [
    {
      prop: "as",
      label: "Element",
      type: "select",
      options: ["span", "div", "p", "label"],
      defaultValue: "span",
    },
    {
      prop: "focusable",
      label: "Focusable",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "children",
      label: "Children",
      type: "text",
      defaultValue: "This text is only visible to screen readers",
    },
  ],
  renderPreview: (props) => (
    <VisuallyHiddenDemo
      as={props.as as "span" | "div" | "p" | "label"}
      focusable={props.focusable as boolean}
      children={props.children as string}
    />
  ),
};

export default visuallyHiddenPlayground;
