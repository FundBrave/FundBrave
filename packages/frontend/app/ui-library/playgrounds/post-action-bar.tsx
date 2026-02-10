"use client";

import { PostActionBar } from "@/app/components/ui/post/PostActionBar";
import { MOCK_POST, MOCK_CAMPAIGN } from "@/app/ui-library/playgrounds/_mock-data";
import type { PlaygroundConfig } from "../types";

const noop = () => {};

const postActionBarPlayground: PlaygroundConfig = {
  componentName: "PostActionBar",
  importPath: "@/app/components/ui/post/PostActionBar",
  controls: [
    {
      prop: "context",
      label: "Context",
      type: "select",
      options: ["feed", "detail"],
      defaultValue: "feed",
    },
    {
      prop: "showLabels",
      label: "Show Labels",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "size",
      label: "Size",
      type: "select",
      options: ["sm", "md", "lg"],
      defaultValue: "md",
    },
  ],
  renderPreview: (props) => (
    <PostActionBar
      post={{
        id: MOCK_POST.id,
        likesCount: MOCK_POST.likesCount,
        commentsCount: MOCK_POST.commentsCount,
        isLiked: MOCK_POST.isLiked,
        isBookmarked: MOCK_POST.isBookmarked ?? false,
      }}
      campaign={MOCK_CAMPAIGN}
      context={props.context as "feed" | "detail"}
      showLabels={props.showLabels as boolean}
      size={props.size as "sm" | "md" | "lg"}
      onLike={noop}
      onComment={noop}
      onShare={noop}
      onBookmark={noop}
      onDonate={noop}
    />
  ),
};

export default postActionBarPlayground;
