"use client";

import { Progress } from "@/app/components/ui/primitives";
import type { PlaygroundConfig } from "../types";

const progressPlayground: PlaygroundConfig = {
  componentName: "Progress",
  importPath: "@/app/components/ui/primitives",
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["default", "success", "warning", "info"],
      defaultValue: "default",
    },
    {
      prop: "size",
      label: "Size",
      type: "select",
      options: ["sm", "md", "lg"],
      defaultValue: "md",
    },
    {
      prop: "value",
      label: "Value",
      type: "number",
      defaultValue: 65,
      min: 0,
      max: 100,
      step: 5,
    },
    {
      prop: "showLabel",
      label: "Show Label",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "indeterminate",
      label: "Indeterminate",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <div className="w-full max-w-md">
      <Progress
        variant={props.variant as "default" | "success" | "warning" | "info"}
        size={props.size as "sm" | "md" | "lg"}
        value={props.value as number}
        showLabel={props.showLabel as boolean}
        indeterminate={props.indeterminate as boolean}
      />
    </div>
  ),
};

export default progressPlayground;
