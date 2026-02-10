"use client";

import { PostHeader } from "@/app/components/ui/post/PostHeader";
import { MOCK_AUTHOR } from "@/app/ui-library/playgrounds/_mock-data";
import type { PlaygroundConfig } from "../types";

const postHeaderPlayground: PlaygroundConfig = {
  componentName: "PostHeader",
  importPath: "@/app/components/ui/post/PostHeader",
  controls: [
    {
      prop: "showFollowButton",
      label: "Show Follow Button",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "isFollowing",
      label: "Is Following",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "showAvatarBorder",
      label: "Show Avatar Border",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <PostHeader
      author={MOCK_AUTHOR}
      timestamp="2 hours ago"
      rawTimestamp
      showFollowButton={props.showFollowButton as boolean}
      isFollowing={props.isFollowing as boolean}
      showAvatarBorder={props.showAvatarBorder as boolean}
      onFollow={() => {}}
      onMenuClick={() => {}}
      onAuthorClick={() => {}}
    />
  ),
};

export default postHeaderPlayground;
