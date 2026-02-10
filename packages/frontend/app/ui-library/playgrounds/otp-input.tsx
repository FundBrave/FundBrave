"use client";

import { OTPInput } from "@/app/components/ui/form/OTPInput";
import type { PlaygroundConfig } from "../types";

const otpInputPlayground: PlaygroundConfig = {
  componentName: "OTPInput",
  importPath: "@/app/components/ui/form/OTPInput",
  controls: [
    {
      prop: "length",
      label: "Length",
      type: "number",
      defaultValue: 6,
      min: 4,
      max: 8,
      step: 1,
    },
    {
      prop: "value",
      label: "Value",
      type: "text",
      defaultValue: "123",
    },
    {
      prop: "error",
      label: "Error",
      type: "text",
      defaultValue: "",
    },
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <OTPInput
      length={props.length as number}
      value={props.value as string}
      onChange={() => {}}
      {...((props.error as string) ? { error: props.error as string } : {})}
      disabled={props.disabled as boolean}
    />
  ),
};

export default otpInputPlayground;
