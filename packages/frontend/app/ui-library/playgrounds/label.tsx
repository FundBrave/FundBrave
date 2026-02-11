"use client";

import { Label } from "@/app/components/ui/label";
import type { PlaygroundConfig } from "../types";

const labelPlayground: PlaygroundConfig = {
  componentName: "Label",
  importPath: "@/app/components/ui/label",
  defaultChildren: "Email address",
  controls: [
    {
      prop: "children",
      label: "Label Text",
      type: "text",
      defaultValue: "Email address",
    },
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <div
      className="group flex flex-col gap-2"
      data-disabled={String(props.disabled as boolean)}
    >
      <Label>{props.children as string}</Label>
      <input
        type="text"
        placeholder="you@example.com"
        className="w-full rounded-lg border border-white/10 bg-surface-sunken px-3 py-2 text-sm text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/50"
        disabled={props.disabled as boolean}
      />
    </div>
  ),
};

export default labelPlayground;
