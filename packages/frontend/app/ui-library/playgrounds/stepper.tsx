"use client";

import type { PlaygroundConfig } from "../types";

const stepperPlayground: PlaygroundConfig = {
  componentName: "Stepper",
  importPath: "@/app/components/ui/Stepper",
  controls: [],
  renderPreview: () => (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <span className="text-lg text-white/40">ST</span>
      </div>
      <div>
        <p className="text-sm font-medium text-white/60">Stepper</p>
        <p className="text-xs text-white/30 mt-1">Coming Soon</p>
      </div>
      <p className="text-xs text-white/20 max-w-xs">
        Multi-step progress indicator for wizards and onboarding flows with
        completed, active, and upcoming step states.
      </p>
    </div>
  ),
};

export default stepperPlayground;
