"use client";

import { useState } from "react";
import type { PlaygroundConfig } from "../types";

/**
 * Self-contained backdrop preview.
 * Renders sample content with the backdrop overlay toggled on/off,
 * demonstrating the shared pattern used across FundBrave modals.
 */
function BackdropPreview({
  blur,
  opacity,
}: {
  blur: boolean;
  opacity: string;
}) {
  const [visible, setVisible] = useState(true);

  const opacityClass =
    opacity === "light"
      ? "bg-black/25"
      : opacity === "dark"
        ? "bg-black/75"
        : "bg-black/50";

  const blurClass = blur ? "backdrop-blur-sm" : "";

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="relative z-10 rounded-lg border border-white/10 bg-surface-overlay px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-overlay/80"
      >
        {visible ? "Hide Backdrop" : "Show Backdrop"}
      </button>

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10">
        {/* Sample content behind the backdrop */}
        <div className="flex flex-col gap-3 p-6">
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-4 w-1/2 rounded bg-white/10" />
          <div className="h-20 w-full rounded-lg bg-white/5" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-lg bg-primary-500/20" />
            <div className="h-8 w-24 rounded-lg bg-white/10" />
          </div>
        </div>

        {/* Backdrop overlay */}
        {visible && (
          <div
            className={`absolute inset-0 ${opacityClass} ${blurClass} transition-all duration-200`}
            onClick={() => setVisible(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setVisible(false);
            }}
            aria-label="Close backdrop"
          />
        )}
      </div>

      <p className="text-xs text-text-secondary">
        {visible
          ? "Click the backdrop or the button above to dismiss"
          : "Backdrop hidden -- click the button to show it"}
      </p>
    </div>
  );
}

const modalBackdropPlayground: PlaygroundConfig = {
  componentName: "ModalBackdrop",
  importPath: "@/app/components/common/ModalBackdrop",
  controls: [
    {
      prop: "blur",
      label: "Blur",
      type: "toggle",
      defaultValue: true,
    },
    {
      prop: "opacity",
      label: "Opacity",
      type: "select",
      options: ["light", "medium", "dark"],
      defaultValue: "medium",
    },
  ],
  renderPreview: (props) => (
    <BackdropPreview
      blur={props.blur as boolean}
      opacity={props.opacity as string}
    />
  ),
};

export default modalBackdropPlayground;
