"use client";

import { Alert } from "@/app/components/ui/primitives";
import type { PlaygroundConfig } from "../types";

const alertPlayground: PlaygroundConfig = {
  componentName: "Alert",
  importPath: "@/app/components/ui/primitives",
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["info", "success", "warning", "destructive"],
      defaultValue: "info",
    },
    {
      prop: "title",
      label: "Title",
      type: "text",
      defaultValue: "Alert title",
    },
    {
      prop: "children",
      label: "Message",
      type: "text",
      defaultValue: "This is an alert message.",
    },
  ],
  renderPreview: (props) => (
    <div className="w-full max-w-md">
      <Alert
        variant={props.variant as "info" | "success" | "warning" | "destructive"}
        title={props.title as string}
      >
        {props.children as string}
      </Alert>
    </div>
  ),
};

export default alertPlayground;
