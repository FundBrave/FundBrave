"use client";

import IconButton from "@/app/components/ui/icon-button";
import { X } from "lucide-react";
import type { PlaygroundConfig } from "../types";

const iconButtonPlayground: PlaygroundConfig = {
  componentName: "IconButton",
  importPath: "@/app/components/ui/icon-button",
  controls: [
    {
      prop: "size",
      label: "Size",
      type: "select",
      options: ["sm", "md", "lg", "xl", "icon"],
      defaultValue: "icon",
    },
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "ariaLabel",
      label: "Aria Label",
      type: "text",
      defaultValue: "Close dialog",
    },
  ],
  renderPreview: (props) => (
    <IconButton
      size={props.size as "sm" | "md" | "lg" | "xl" | "icon"}
      disabled={props.disabled as boolean}
      ariaLabel={props.ariaLabel as string}
    >
      <X size={18} />
    </IconButton>
  ),
};

export default iconButtonPlayground;
