"use client";

import type { PlaygroundConfig } from "../types";

const sheetPlayground: PlaygroundConfig = {
  componentName: "Sheet",
  importPath: "@/app/components/ui/Sheet",
  controls: [],
  renderPreview: () => (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <span className="text-lg text-white/40">SH</span>
      </div>
      <div>
        <p className="text-sm font-medium text-white/60">Sheet</p>
        <p className="text-xs text-white/30 mt-1">Coming Soon</p>
      </div>
      <p className="text-xs text-white/20 max-w-xs">
        Side-panel overlay that slides from the bottom on mobile and from the
        right on desktop for secondary actions and forms.
      </p>
    </div>
  ),
};

export default sheetPlayground;
