"use client";

import { StickyCommentInput } from "@/app/components/ui/comments/StickyCommentInput";
import type { PlaygroundConfig } from "../types";

const noopAsync = async () => {};

/**
 * StickyCommentInputDemo - Wraps the StickyCommentInput in a contained
 * environment. The real component uses `position: fixed` on mobile and
 * `md:relative` on desktop. We override the fixed positioning via the
 * className prop so the component stays inside the playground preview.
 */
function StickyCommentInputDemo(props: {
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-white/10 bg-surface-sunken/30"
      style={{ minHeight: "200px" }}
    >
      {/* Context area above the input */}
      <div className="px-4 pt-4 pb-24 text-sm text-foreground-muted">
        <p className="mb-2 font-medium text-foreground">
          Campaign discussion area
        </p>
        <p>
          This container constrains the StickyCommentInput which normally uses
          <code className="mx-1 px-1.5 py-0.5 rounded bg-surface-overlay text-xs font-mono">
            position: fixed
          </code>
          at the viewport bottom. In production it anchors to the bottom of
          the screen on mobile and renders inline on desktop
          (md: breakpoint).
        </p>
      </div>

      {/* Absolutely-positioned wrapper pins the input to the container bottom.
          The !relative and !bottom-auto overrides (via tailwind-merge in cn())
          neutralize the component's own fixed/bottom-0 classes so it flows
          naturally inside this wrapper instead of escaping to the viewport. */}
      <div className="absolute bottom-0 left-0 right-0">
        <StickyCommentInput
          postId="demo-post"
          placeholder={props.placeholder}
          disabled={props.disabled}
          onSubmit={noopAsync}
          onCancel={() => {}}
          className="!relative !bottom-auto !left-auto !right-auto !shadow-none !z-0"
        />
      </div>
    </div>
  );
}

const stickyCommentInputPlayground: PlaygroundConfig = {
  componentName: "StickyCommentInput",
  importPath: "@/app/components/ui/comments/StickyCommentInput",
  controls: [
    {
      prop: "placeholder",
      label: "Placeholder",
      type: "text",
      defaultValue: "Add a comment about this campaign...",
    },
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <StickyCommentInputDemo
      placeholder={props.placeholder as string}
      disabled={props.disabled as boolean}
    />
  ),
};

export default stickyCommentInputPlayground;
