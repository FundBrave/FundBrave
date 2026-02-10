"use client";

import { CommentSection } from "@/app/components/ui/comments/CommentSection";
import { MOCK_COMMENTS } from "@/app/ui-library/playgrounds/_mock-data";
import type { PlaygroundConfig } from "../types";

const noop = () => {};

const commentSectionPlayground: PlaygroundConfig = {
  componentName: "CommentSection",
  importPath: "@/app/components/ui/comments/CommentSection",
  controls: [
    {
      prop: "showHeader",
      label: "Show Header",
      type: "toggle",
      defaultValue: true,
    },
  ],
  renderPreview: (props) => (
    <CommentSection
      postId="demo-post"
      comments={MOCK_COMMENTS}
      showHeader={props.showHeader as boolean}
      onAddComment={noop}
      onLikeComment={noop}
      onUnlikeComment={noop}
      onReplyToComment={noop}
      onDeleteComment={noop}
    />
  ),
};

export default commentSectionPlayground;
