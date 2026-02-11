"use client";

import { useState } from "react";
import { DatePicker } from "@/app/components/ui/date-picker";
import type { PlaygroundConfig } from "../types";

/* -------------------------------------------------------------------------- */
/*  Wrapper -- manages internal date state so the picker is fully interactive  */
/* -------------------------------------------------------------------------- */

function DatePickerPreview(props: Record<string, unknown>) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  return (
    <div className="min-h-[400px]">
      <DatePicker
        value={selectedDate}
        onChange={setSelectedDate}
        placeholder={props.placeholder as string}
        disabled={props.disabled as boolean}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Playground config                                                          */
/* -------------------------------------------------------------------------- */

const datePickerPlayground: PlaygroundConfig = {
  componentName: "DatePicker",
  importPath: "@/app/components/ui/date-picker",
  controls: [
    {
      prop: "placeholder",
      label: "Placeholder",
      type: "text",
      defaultValue: "Select campaign end date",
    },
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => <DatePickerPreview {...props} />,
};

export default datePickerPlayground;
