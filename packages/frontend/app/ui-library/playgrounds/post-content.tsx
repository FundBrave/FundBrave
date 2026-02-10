"use client";

import { PostContent } from "@/app/components/ui/post/PostContent";
import type { PlaygroundConfig } from "../types";

const postContentPlayground: PlaygroundConfig = {
  componentName: "PostContent",
  importPath: "@/app/components/ui/post/PostContent",
  controls: [
    {
      prop: "content",
      label: "Content",
      type: "text",
      defaultValue:
        "Our solar panel campaign just reached 75% of its funding goal! Thank you to all 342 donors who have contributed so far.",
    },
    {
      prop: "truncateAt",
      label: "Truncate At",
      type: "number",
      defaultValue: 100,
      min: 0,
      max: 500,
      step: 10,
    },
  ],
  renderPreview: (props) => (
    <PostContent
      content={props.content as string}
      truncateAt={props.truncateAt as number}
    />
  ),
};

export default postContentPlayground;
