"use client";

import { Badge } from "@/app/components/ui/primitives";
import type { PlaygroundConfig } from "../types";

const badgePlayground: PlaygroundConfig = {
  componentName: "Badge",
  importPath: "@/app/components/ui/primitives",
  defaultChildren: "Badge",
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["default", "success", "warning", "destructive", "brand", "outline"],
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
      prop: "children",
      label: "Label",
      type: "text",
      defaultValue: "Badge",
    },
  ],
  renderPreview: (props) => (
    <Badge
      variant={props.variant as "default" | "success" | "warning" | "destructive" | "brand" | "outline"}
      size={props.size as "sm" | "md" | "lg"}
    >
      {props.children as string}
    </Badge>
  ),
};

export default badgePlayground;
