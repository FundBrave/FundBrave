"use client";

import { Toggle } from "@/app/components/ui/Toggle";
import type { PlaygroundConfig } from "../types";

const togglePlayground: PlaygroundConfig = {
  componentName: "Toggle",
  importPath: "@/app/components/ui/Toggle",
  controls: [
    {
      prop: "checked",
      label: "Checked",
      type: "toggle",
      defaultValue: true,
    },
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "showIndicator",
      label: "Show Indicator",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "label",
      label: "Label",
      type: "text",
      defaultValue: "Toggle option",
    },
  ],
  renderPreview: (props) => (
    <div className="w-full max-w-xs">
      <Toggle
        checked={props.checked as boolean}
        onChange={() => {
          /* Controlled by playground controls */
        }}
        disabled={props.disabled as boolean}
        showIndicator={props.showIndicator as boolean}
        label={props.label as string}
      />
    </div>
  ),
};

export default togglePlayground;
