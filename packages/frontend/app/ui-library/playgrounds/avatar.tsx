"use client";

import { Avatar } from "@/app/components/ui/Avatar";
import type { PlaygroundConfig } from "../types";

const avatarPlayground: PlaygroundConfig = {
  componentName: "Avatar",
  importPath: "@/app/components/ui/Avatar",
  controls: [
    {
      prop: "size",
      label: "Size",
      type: "select",
      options: ["sm", "md", "lg", "xl"],
      defaultValue: "md",
    },
    {
      prop: "showGradientBorder",
      label: "Gradient Border",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "fallback",
      label: "Fallback",
      type: "text",
      defaultValue: "JD",
    },
  ],
  renderPreview: (props) => (
    <Avatar
      alt="User avatar"
      size={props.size as "sm" | "md" | "lg" | "xl"}
      showGradientBorder={props.showGradientBorder as boolean}
      fallback={props.fallback as string}
    />
  ),
};

export default avatarPlayground;
