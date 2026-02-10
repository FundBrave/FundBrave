"use client";

import { Input } from "@/app/components/ui/primitives";
import type { PlaygroundConfig } from "../types";

const inputPlayground: PlaygroundConfig = {
  componentName: "Input",
  importPath: "@/app/components/ui/primitives",
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["default", "filled", "ghost"],
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
    {
      prop: "placeholder",
      label: "Placeholder",
      type: "text",
      defaultValue: "Enter text...",
    },
  ],
  renderPreview: (props) => (
    <div className="w-full max-w-sm">
      <Input
        variant={props.variant as "default" | "filled" | "ghost"}
        size={props.size as "sm" | "md" | "lg"}
        error={props.error as boolean}
        disabled={props.disabled as boolean}
        placeholder={props.placeholder as string}
        errorMessage={props.error ? "This field has an error" : undefined}
      />
    </div>
  ),
};

export default inputPlayground;
