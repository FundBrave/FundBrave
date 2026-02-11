"use client";

import { SkipLink } from "@/app/components/ui/SkipLink";
import type { PlaygroundConfig } from "../types";

/**
 * SkipLinkDemo - Wrapper that makes the SkipLink always visible in the
 * playground. The real SkipLink uses sr-only / focus:not-sr-only so it is
 * invisible until the user presses Tab. We override those styles here so
 * reviewers can inspect the component without keyboard navigation.
 */
function SkipLinkDemo(props: { label: string; targetId: string }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Instruction text */}
      <p className="text-sm text-text-secondary">
        Press{" "}
        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs">
          Tab
        </kbd>{" "}
        to reveal the skip link in a real page. Below is the component rendered
        with visibility overrides for demonstration.
      </p>

      {/* Always-visible demo container */}
      <div className="relative rounded-xl border border-white/10 bg-surface-elevated p-6">
        <SkipLink
          label={props.label}
          targetId={props.targetId}
          className="!not-sr-only !static !px-4 !py-3 !bg-primary !text-white !font-semibold !text-sm !rounded-lg !shadow-lg !ring-2 !ring-white !ring-offset-2 !ring-offset-primary !min-h-[44px] !min-w-[44px] !inline-flex !items-center"
        />

        {/* Simulated target for the skip link */}
        <div
          id={props.targetId}
          tabIndex={-1}
          className="mt-4 rounded-lg border border-dashed border-white/20 p-4 text-sm text-text-tertiary outline-none"
        >
          Target element:{" "}
          <code className="font-mono text-primary">#{props.targetId}</code>
        </div>
      </div>

      {/* Accessibility note */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-text-secondary">
        <strong className="text-text-primary">WCAG 2.4.1</strong> &mdash;
        Bypass Blocks. This skip link lets keyboard users jump past navigation
        directly to the main content area.
      </div>
    </div>
  );
}

const skipLinkPlayground: PlaygroundConfig = {
  componentName: "SkipLink",
  importPath: "@/app/components/ui/SkipLink",
  defaultChildren: undefined,
  controls: [
    {
      prop: "label",
      label: "Label",
      type: "text",
      defaultValue: "Skip to main content",
    },
    {
      prop: "targetId",
      label: "Target ID",
      type: "text",
      defaultValue: "main-content",
    },
  ],
  renderPreview: (props) => (
    <SkipLinkDemo
      label={props.label as string}
      targetId={props.targetId as string}
    />
  ),
};

export default skipLinkPlayground;
