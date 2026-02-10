"use client";

import { Button } from "@/app/components/ui/button";
import type { PlaygroundConfig } from "../types";

const buttonPlayground: PlaygroundConfig = {
  componentName: "Button",
  importPath: "@/app/components/ui/button",
  defaultChildren: "Click me",
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["primary", "secondary", "tertiary", "destructive", "outline", "ghost", "link"],
      defaultValue: "primary",
    },
    {
      prop: "size",
      label: "Size",
      type: "select",
      options: ["sm", "md", "lg", "xl", "icon"],
      defaultValue: "md",
    },
    {
      prop: "loading",
      label: "Loading",
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
      prop: "fullWidth",
      label: "Full Width",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "children",
      label: "Label",
      type: "text",
      defaultValue: "Click me",
    },
  ],
  renderPreview: (props) => (
    <Button
      variant={props.variant as "primary" | "secondary" | "tertiary" | "destructive" | "outline" | "ghost" | "link"}
      size={props.size as "sm" | "md" | "lg" | "xl" | "icon"}
      loading={props.loading as boolean}
      disabled={props.disabled as boolean}
      fullWidth={props.fullWidth as boolean}
    >
      {props.children as string}
    </Button>
  ),
};

export default buttonPlayground;
