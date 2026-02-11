"use client";

import { PostActions } from "@/app/components/ui/post/PostActions";
import type { PlaygroundConfig } from "../types";

const postActionsPlayground: PlaygroundConfig = {
  componentName: "PostActions",
  importPath: "@/app/components/ui/post/PostActions",
  controls: [
    {
      prop: "likesCount",
      label: "Likes Count",
      type: "number",
      defaultValue: 142,
      min: 0,
      max: 10000,
      step: 1,
    },
    {
      prop: "commentsCount",
      label: "Comments Count",
      type: "number",
      defaultValue: 23,
      min: 0,
      max: 10000,
      step: 1,
    },
    {
      prop: "sharesCount",
      label: "Shares Count",
      type: "number",
      defaultValue: 38,
      min: 0,
      max: 10000,
      step: 1,
    },
    {
      prop: "viewsCount",
      label: "Views Count",
      type: "number",
      defaultValue: 1847,
      min: 0,
      max: 100000,
      step: 100,
    },
    {
      prop: "isLiked",
      label: "Is Liked",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "isBookmarked",
      label: "Is Bookmarked",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "readOnly",
      label: "Read Only",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <PostActions
      likesCount={props.likesCount as number}
      commentsCount={props.commentsCount as number}
      sharesCount={props.sharesCount as number}
      viewsCount={props.viewsCount as number}
      isLiked={props.isLiked as boolean}
      isBookmarked={props.isBookmarked as boolean}
      readOnly={props.readOnly as boolean}
      onLike={() => {}}
      onComment={() => {}}
      onRepost={() => {}}
      onBookmark={() => {}}
      onShare={() => {}}
    />
  ),
};

export default postActionsPlayground;
