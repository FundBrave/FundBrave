"use client";

import { Select } from "@/app/components/ui/primitives";
import type { PlaygroundConfig } from "../types";

const selectPlayground: PlaygroundConfig = {
  componentName: "Select",
  importPath: "@/app/components/ui/primitives",
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["default", "filled"],
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
      prop: "error",
      label: "Error",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <div className="w-full max-w-sm">
      <Select
        variant={props.variant as "default" | "filled"}
        size={props.size as "sm" | "md" | "lg"}
        error={props.error as boolean}
        disabled={props.disabled as boolean}
        placeholder="Choose a category"
        errorMessage={props.error ? "Selection is required" : undefined}
      >
        <option value="education">Education</option>
        <option value="health">Health</option>
        <option value="environment">Environment</option>
        <option value="technology">Technology</option>
      </Select>
    </div>
  ),
};

export default selectPlayground;
