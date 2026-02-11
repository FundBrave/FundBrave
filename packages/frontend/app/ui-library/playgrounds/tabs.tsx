"use client";

import type { PlaygroundConfig } from "../types";

const tabsPlayground: PlaygroundConfig = {
  componentName: "Tabs",
  importPath: "@/app/components/ui/Tabs",
  controls: [],
  renderPreview: () => (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <span className="text-lg text-white/40">TB</span>
      </div>
      <div>
        <p className="text-sm font-medium text-white/60">Tabs</p>
        <p className="text-xs text-white/30 mt-1">Coming Soon</p>
      </div>
      <p className="text-xs text-white/20 max-w-xs">
        Accessible tab component with keyboard navigation, ARIA panel
        association, and customizable active-tab styling.
      </p>
    </div>
  ),
};

export default tabsPlayground;
