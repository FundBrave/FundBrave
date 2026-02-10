"use client";

import { Textarea } from "@/app/components/ui/primitives";
import type { PlaygroundConfig } from "../types";

const textareaPlayground: PlaygroundConfig = {
  componentName: "Textarea",
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
      prop: "maxLength",
      label: "Max Length",
      type: "number",
      defaultValue: 0,
      min: 0,
      max: 500,
      step: 50,
    },
  ],
  renderPreview: (props) => {
    const maxLen = props.maxLength as number;
    return (
      <div className="w-full max-w-sm">
        <Textarea
          variant={props.variant as "default" | "filled"}
          size={props.size as "sm" | "md" | "lg"}
          error={props.error as boolean}
          placeholder="Write something..."
          errorMessage={props.error ? "This field has an error" : undefined}
          {...(maxLen > 0 ? { maxLength: maxLen } : {})}
        />
      </div>
    );
  },
};

export default textareaPlayground;
