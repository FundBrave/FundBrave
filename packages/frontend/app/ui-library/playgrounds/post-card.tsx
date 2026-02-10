"use client";

import { PostCard } from "@/app/components/ui/post/PostCard";
import {
  MOCK_POST,
  MOCK_POST_LIKED,
  MOCK_POST_COMMUNITY,
} from "@/app/ui-library/playgrounds/_mock-data";
import type { PlaygroundConfig } from "../types";
import type { PostCardVariant } from "@/app/types/post";

const noop = () => {};

/**
 * Wrapper that selects the correct mock post based on the variant control.
 * Each variant uses a different mock post to showcase realistic data:
 *   - default:   MOCK_POST (campaign update with full engagement)
 *   - liked:     MOCK_POST_LIKED (read-only with liked indicator)
 *   - community: MOCK_POST_COMMUNITY (community post with follow/role)
 */
function PostCardPreview({ variant }: { variant: PostCardVariant }) {
  const postMap: Record<PostCardVariant, typeof MOCK_POST> = {
    default: MOCK_POST,
    liked: MOCK_POST_LIKED,
    community: MOCK_POST_COMMUNITY,
  };

  const post = postMap[variant];

  return (
    <div className="max-w-xl rounded-2xl border border-white/10 overflow-hidden">
      <PostCard
        post={post}
        variant={variant}
        onLike={noop}
        onUnlike={noop}
        onComment={noop}
        onShare={noop}
        onRepost={noop}
        onBookmark={noop}
        onFollow={noop}
        onMenuClick={noop}
        onAuthorClick={noop}
        onPostClick={noop}
        onAddComment={noop}
        onLikeComment={noop}
        onUnlikeComment={noop}
        onReplyToComment={noop}
        onDeleteComment={noop}
      />
    </div>
  );
}

const postCardPlayground: PlaygroundConfig = {
  componentName: "PostCard",
  importPath: "@/app/components/ui/post/PostCard",
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["default", "liked", "community"],
      defaultValue: "default",
    },
  ],
  renderPreview: (props) => (
    <PostCardPreview variant={props.variant as PostCardVariant} />
  ),
};

export default postCardPlayground;
