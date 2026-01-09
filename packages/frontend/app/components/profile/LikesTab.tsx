"use client";

import { MockLike } from "@/lib/constants/mock-profile-activity";
import { usePosts } from "@/app/provider/PostsContext";
import { PostCard, fromMockLike } from "@/app/components/ui/post";

interface LikesTabProps {
  likes: MockLike[];
}

/**
 * LikesTab - List of posts/tweets the user has liked
 * Uses the unified PostCard component with "liked" variant but full interactivity
 */
export default function LikesTab({ likes }: LikesTabProps) {
  const {
    likePost,
    unlikePost,
    addComment,
    likeComment,
    unlikeComment,
    replyToComment,
    deleteComment,
  } = usePosts();

  if (likes.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>No likes yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {likes.map((like) => (
        <PostCard
          key={like.id}
          post={fromMockLike(like)}
          variant="liked"
          readOnly={false}
          enableComments
          onLike={(postId) => likePost(postId)}
          onUnlike={(postId) => unlikePost(postId)}
          onAddComment={(postId, content) => addComment(postId, content)}
          onLikeComment={(postId, commentId) => likeComment(postId, commentId)}
          onUnlikeComment={(postId, commentId) => unlikeComment(postId, commentId)}
          onReplyToComment={(postId, commentId, content) => replyToComment(postId, commentId, content)}
          onDeleteComment={(postId, commentId) => deleteComment(postId, commentId)}
        />
      ))}
    </div>
  );
}
