"use client";

import { Divider } from "@/app/components/ui/primitives";
import type { PlaygroundConfig } from "../types";

const dividerPlayground: PlaygroundConfig = {
  componentName: "Divider",
  importPath: "@/app/components/ui/primitives",
  controls: [
    {
      prop: "orientation",
      label: "Orientation",
      type: "select",
      options: ["horizontal", "vertical"],
      defaultValue: "horizontal",
    },
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["default", "emphasis", "gradient"],
      defaultValue: "default",
    },
    {
      prop: "label",
      label: "Label",
      type: "text",
      defaultValue: "",
    },
  ],
  renderPreview: (props) => {
    const isVertical = props.orientation === "vertical";

    if (isVertical) {
      return (
        <div className="flex h-24 items-center justify-center">
          <Divider
            orientation="vertical"
            variant={props.variant as "default" | "emphasis" | "gradient"}
          />
        </div>
      );
    }

    return (
      <div className="w-full max-w-md">
        <Divider
          orientation="horizontal"
          variant={props.variant as "default" | "emphasis" | "gradient"}
          label={(props.label as string) || undefined}
        />
      </div>
    );
  },
};

export default dividerPlayground;
