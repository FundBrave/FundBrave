"use client";

import { InputField } from "@/app/components/ui/form/FormFields";
import type { PlaygroundConfig } from "../types";

const formFieldsPlayground: PlaygroundConfig = {
  componentName: "InputField",
  importPath: "@/app/components/ui/form/FormFields",
  controls: [
    {
      prop: "label",
      label: "Label",
      type: "text",
      defaultValue: "Campaign Title",
    },
    {
      prop: "placeholder",
      label: "Placeholder",
      type: "text",
      defaultValue: "Enter title...",
    },
    {
      prop: "value",
      label: "Value",
      type: "text",
      defaultValue: "My Campaign",
    },
    {
      prop: "error",
      label: "Error",
      type: "text",
      defaultValue: "",
    },
    {
      prop: "maxLength",
      label: "Max Length",
      type: "number",
      defaultValue: 100,
      min: 10,
      max: 500,
      step: 10,
    },
    {
      prop: "showCharacterCount",
      label: "Show Character Count",
      type: "toggle",
      defaultValue: true,
    },
  ],
  renderPreview: (props) => (
    <InputField
      label={props.label as string}
      placeholder={props.placeholder as string}
      value={props.value as string}
      onChange={() => {}}
      {...((props.error as string) ? { error: props.error as string } : {})}
      {...((props.maxLength as number) > 0 ? { maxLength: props.maxLength as number } : {})}
      showCharacterCount={props.showCharacterCount as boolean}
    />
  ),
};

export default formFieldsPlayground;
