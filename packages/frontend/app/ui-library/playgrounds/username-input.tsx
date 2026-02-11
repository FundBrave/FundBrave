"use client";

import { UsernameInput } from "@/app/components/ui/form/UsernameInput";
import type { PlaygroundConfig } from "../types";

const usernameInputPlayground: PlaygroundConfig = {
  componentName: "UsernameInput",
  importPath: "@/app/components/ui/form/UsernameInput",
  controls: [
    {
      prop: "value",
      label: "Value",
      type: "text",
      defaultValue: "johndoe",
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
    {
      prop: "placeholder",
      label: "Placeholder",
      type: "text",
      defaultValue: "username",
    },
  ],
  renderPreview: (props) => (
    <UsernameInput
      value={props.value as string}
      onChange={() => {}}
      {...((props.error as string) ? { error: props.error as string } : {})}
      disabled={props.disabled as boolean}
      placeholder={props.placeholder as string}
    />
  ),
};

export default usernameInputPlayground;
