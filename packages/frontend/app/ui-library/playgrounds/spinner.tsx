"use client";

import { Spinner } from "@/app/components/ui/Spinner";
import type { PlaygroundConfig } from "../types";

const spinnerPlayground: PlaygroundConfig = {
  componentName: "Spinner",
  importPath: "@/app/components/ui/Spinner",
  controls: [
    {
      prop: "size",
      label: "Size",
      type: "select",
      options: ["xs", "sm", "md", "lg"],
      defaultValue: "md",
    },
    {
      prop: "color",
      label: "Color",
      type: "select",
      options: ["current", "primary", "white"],
      defaultValue: "current",
    },
  ],
  renderPreview: (props) => (
    <div className="flex items-center justify-center rounded-lg p-4">
      <Spinner
        size={props.size as "xs" | "sm" | "md" | "lg"}
        color={props.color as "current" | "primary" | "white"}
      />
    </div>
  ),
};

export default spinnerPlayground;
