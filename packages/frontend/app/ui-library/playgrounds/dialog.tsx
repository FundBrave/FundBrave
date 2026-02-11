"use client";

import type { PlaygroundConfig } from "../types";

const dialogPlayground: PlaygroundConfig = {
  componentName: "Dialog",
  importPath: "@/app/components/ui/Dialog",
  controls: [],
  renderPreview: () => (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <span className="text-lg text-white/40">DG</span>
      </div>
      <div>
        <p className="text-sm font-medium text-white/60">Dialog</p>
        <p className="text-xs text-white/30 mt-1">Coming Soon</p>
      </div>
      <p className="text-xs text-white/20 max-w-xs">
        Accessible modal dialog with focus trap, scroll lock, backdrop overlay,
        and configurable sizing.
      </p>
    </div>
  ),
};

export default dialogPlayground;
