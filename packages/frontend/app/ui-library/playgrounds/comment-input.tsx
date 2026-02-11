"use client";

import { CommentInput } from "@/app/components/ui/comments/CommentInput";
import { MOCK_AUTHOR } from "@/app/ui-library/playgrounds/_mock-data";
import type { PlaygroundConfig } from "../types";

const commentInputPlayground: PlaygroundConfig = {
  componentName: "CommentInput",
  importPath: "@/app/components/ui/comments/CommentInput",
  controls: [
    {
      prop: "placeholder",
      label: "Placeholder",
      type: "text",
      defaultValue: "Share your thoughts on this campaign...",
    },
    {
      prop: "isReply",
      label: "Is Reply",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <CommentInput
      placeholder={props.placeholder as string}
      isReply={props.isReply as boolean}
      onSubmit={() => {}}
      onCancel={props.isReply ? () => {} : undefined}
      userAvatar={MOCK_AUTHOR.avatar}
    />
  ),
};

export default commentInputPlayground;
