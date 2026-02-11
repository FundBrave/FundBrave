"use client";

import { LiveRegion } from "@/app/components/ui/VisuallyHidden";
import type { PlaygroundConfig } from "../types";

/**
 * LiveRegionDemo - Shows the ARIA live region alongside an explainer box
 * that describes how screen readers will announce the content.
 */
function LiveRegionDemo(props: {
  priority: "polite" | "assertive";
  visuallyHidden: boolean;
  children: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Rendered live region */}
      <div className="rounded-xl border border-white/10 bg-surface-elevated p-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Live Region Output
        </p>
        <div className="min-h-[48px] rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <LiveRegion
            priority={props.priority}
            visuallyHidden={props.visuallyHidden}
          >
            {props.children}
          </LiveRegion>
          {props.visuallyHidden && (
            <span className="text-sm italic text-text-tertiary">
              Content is announced to screen readers but visually hidden
            </span>
          )}
        </div>
      </div>

      {/* Info box explaining ARIA live region behavior */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
            A11y
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            ARIA Live Region Behavior
          </span>
        </div>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <strong className="text-text-primary">Role:</strong>{" "}
              {props.priority === "assertive" ? (
                <code className="font-mono text-xs text-primary">alert</code>
              ) : (
                <code className="font-mono text-xs text-primary">status</code>
              )}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <strong className="text-text-primary">aria-live:</strong>{" "}
              <code className="font-mono text-xs text-primary">
                {props.priority}
              </code>
              {props.priority === "polite"
                ? " \u2014 waits for the user to finish their current task"
                : " \u2014 interrupts the user immediately (use sparingly)"}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <strong className="text-text-primary">Announces:</strong>{" "}
              &ldquo;{props.children}&rdquo;
            </span>
          </li>
        </ul>
      </div>

      {/* Contextual example */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-text-tertiary">
        <strong className="text-text-secondary">FundBrave use case:</strong>{" "}
        Announce donation updates, campaign goal milestones, and staking reward
        notifications to screen reader users in real time.
      </div>
    </div>
  );
}

const liveRegionPlayground: PlaygroundConfig = {
  componentName: "LiveRegion",
  importPath: "@/app/components/ui/VisuallyHidden",
  defaultChildren: undefined,
  controls: [
    {
      prop: "priority",
      label: "Priority",
      type: "select",
      options: ["polite", "assertive"],
      defaultValue: "polite",
    },
    {
      prop: "visuallyHidden",
      label: "Visually Hidden",
      type: "toggle",
      defaultValue: true,
    },
    {
      prop: "children",
      label: "Children",
      type: "text",
      defaultValue: "5 new donations received",
    },
  ],
  renderPreview: (props) => (
    <LiveRegionDemo
      priority={props.priority as "polite" | "assertive"}
      visuallyHidden={props.visuallyHidden as boolean}
      children={props.children as string}
    />
  ),
};

export default liveRegionPlayground;
