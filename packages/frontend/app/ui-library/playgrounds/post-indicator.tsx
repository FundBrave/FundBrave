"use client";

import { PostIndicator } from "@/app/components/ui/post/PostIndicator";
import type { PlaygroundConfig } from "../types";

const postIndicatorPlayground: PlaygroundConfig = {
  componentName: "PostIndicator",
  importPath: "@/app/components/ui/post/PostIndicator",
  controls: [
    {
      prop: "type",
      label: "Type",
      type: "select",
      options: ["liked", "reposted", "pinned"],
      defaultValue: "liked",
    },
    {
      prop: "text",
      label: "Custom Text",
      type: "text",
      defaultValue: "",
    },
  ],
  renderPreview: (props) => (
    <PostIndicator
      type={props.type as "liked" | "reposted" | "pinned"}
      {...((props.text as string) ? { text: props.text as string } : {})}
    />
  ),
};

export default postIndicatorPlayground;
