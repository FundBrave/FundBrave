"use client";

import { Calendar } from "@/app/components/ui/calendar";
import type { PlaygroundConfig } from "../types";

const calendarPlayground: PlaygroundConfig = {
  componentName: "Calendar",
  importPath: "@/app/components/ui/calendar",
  controls: [
    {
      prop: "showOutsideDays",
      label: "Show Outside Days",
      type: "toggle",
      defaultValue: true,
    },
  ],
  renderPreview: (props) => (
    <div className="w-fit rounded-xl border border-white/10 bg-surface-elevated p-2">
      <Calendar
        mode="single"
        selected={new Date()}
        showOutsideDays={props.showOutsideDays as boolean}
      />
    </div>
  ),
};

export default calendarPlayground;
