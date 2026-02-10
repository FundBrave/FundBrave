"use client";

import { CommentCard } from "@/app/components/ui/comments/CommentCard";
import { MOCK_COMMENTS } from "@/app/ui-library/playgrounds/_mock-data";
import type { PlaygroundConfig } from "../types";

const noop = () => {};

const commentCardPlayground: PlaygroundConfig = {
  componentName: "CommentCard",
  importPath: "@/app/components/ui/comments/CommentCard",
  controls: [
    {
      prop: "isReply",
      label: "Is Reply",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "isCreator",
      label: "Is Creator",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "isPinned",
      label: "Is Pinned",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "isHighlighted",
      label: "Is Highlighted",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <CommentCard
      comment={MOCK_COMMENTS[0]}
      isReply={props.isReply as boolean}
      isCreator={props.isCreator as boolean}
      isPinned={props.isPinned as boolean}
      isHighlighted={props.isHighlighted as boolean}
      onLike={noop}
      onUnlike={noop}
      onReply={noop}
      onDelete={noop}
    />
  ),
};

export default commentCardPlayground;
