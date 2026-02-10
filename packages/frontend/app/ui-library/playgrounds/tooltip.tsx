"use client";

import { Tooltip } from "@/app/components/ui/primitives";
import { Button } from "@/app/components/ui/button";
import type { PlaygroundConfig } from "../types";

const tooltipPlayground: PlaygroundConfig = {
  componentName: "Tooltip",
  importPath: "@/app/components/ui/primitives",
  controls: [
    {
      prop: "side",
      label: "Side",
      type: "select",
      options: ["top", "right", "bottom", "left"],
      defaultValue: "top",
    },
    {
      prop: "content",
      label: "Content",
      type: "text",
      defaultValue: "Tooltip content",
    },
  ],
  renderPreview: (props) => (
    <div className="flex items-center justify-center p-8">
      <Tooltip
        side={props.side as "top" | "right" | "bottom" | "left"}
        content={props.content as string}
      >
        <Button variant="outline" size="sm">
          Hover me
        </Button>
      </Tooltip>
    </div>
  ),
};

export default tooltipPlayground;
