"use client";

import { PasswordStrengthMeter } from "@/app/components/ui/form/PasswordStrengthMeter";
import type { PlaygroundConfig } from "../types";

const passwordStrengthMeterPlayground: PlaygroundConfig = {
  componentName: "PasswordStrengthMeter",
  importPath: "@/app/components/ui/form/PasswordStrengthMeter",
  controls: [
    {
      prop: "password",
      label: "Password",
      type: "text",
      defaultValue: "Hello1",
    },
    {
      prop: "showRequirements",
      label: "Show Requirements",
      type: "toggle",
      defaultValue: true,
    },
  ],
  renderPreview: (props) => (
    <PasswordStrengthMeter
      password={props.password as string}
      showRequirements={props.showRequirements as boolean}
    />
  ),
};

export default passwordStrengthMeterPlayground;
