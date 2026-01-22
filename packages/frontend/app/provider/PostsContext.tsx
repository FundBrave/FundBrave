"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import {
  useCreatePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useRepostMutation,
  useDeletePostMutation,
  useCreateCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  useDeleteCommentMutation,
} from "@/app/generated/graphql";

// ============================================
// TYPES
// ============================================

export interface CommentAuthor {
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  parentId?: string;
  author: CommentAuthor;
  content: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  isLiked: boolean;
  replies: Comment[];
}

export interface PostAuthor {
  name: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: string;
  isLiked: boolean;
  comments: Comment[];
}

interface PostsContextValue {
  posts: Post[];
  isLoading: boolean;
  // Post actions
  addPost: (content: string, imageUrl?: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  repost: (postId: string) => Promise<void>;
  // Comment actions
  addComment: (postId: string, content: string) => Promise<void>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  unlikeComment: (postId: string, commentId: string) => Promise<void>;
  replyToComment: (postId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const PostsContext = createContext<PostsContextValue | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface PostsProviderProps {
  children: ReactNode;
}

export function PostsProvider({ children }: PostsProviderProps) {
  // GraphQL Mutations
  const [createPostMutation] = useCreatePostMutation();
  const [likePostMutation] = useLikePostMutation();
  const [unlikePostMutation] = useUnlikePostMutation();
  const [repostMutation] = useRepostMutation();
  const [deletePostMutation] = useDeletePostMutation();
  const [createCommentMutation] = useCreateCommentMutation();
  const [likeCommentMutation] = useLikeCommentMutation();
  const [unlikeCommentMutation] = useUnlikeCommentMutation();
  const [deleteCommentMutation] = useDeleteCommentMutation();

  // ============================================
  // POST ACTIONS
  // ============================================

  const addPost = useCallback(async (content: string, imageUrl?: string) => {
    try {
      await createPostMutation({
        variables: {
          input: {
            content,
            mediaUrls: imageUrl ? [imageUrl] : undefined,
            type: imageUrl ? 'MEDIA' : 'TEXT', // Use valid PostType enum values
          },
        },
        refetchQueries: ['GetFeed', 'GetUserPosts'],
        update: (cache, { data }) => {
          if (!data?.createPost) return;

          // Optimistically update cache
          cache.modify({
            fields: {
              getFeed(existingFeed = { posts: [] }) {
                const newPostRef = cache.writeFragment({
                  data: data.createPost,
                  fragment: gql`
                    fragment NewPost on Post {
                      id
                      content
                      type
                      createdAt
                    }
                  `,
                });
                return {
                  ...existingFeed,
                  posts: [newPostRef, ...existingFeed.posts],
                };
              },
            },
          });
        },
      });
    } catch (err) {
      console.error("Error creating post:", err);
      throw err;
    }
  }, [createPostMutation]);

  const likePost = useCallback(async (postId: string) => {
    try {
      await likePostMutation({
        variables: { postId },
        optimisticResponse: {
          likePost: true,
        },
        update: (cache) => {
          cache.modify({
            id: cache.identify({ __typename: 'Post', id: postId }),
            fields: {
              isLiked: () => true, // GraphQL schema uses isLiked, not isLikedByMe
              likesCount: (prev: number) => prev + 1,
            },
          });
        },
      });
    } catch (err) {
      console.error("Error liking post:", err);
      throw err;
    }
  }, [likePostMutation]);

  const unlikePost = useCallback(async (postId: string) => {
    try {
      await unlikePostMutation({
        variables: { postId },
        optimisticResponse: {
          unlikePost: true,
        },
        update: (cache) => {
          cache.modify({
            id: cache.identify({ __typename: 'Post', id: postId }),
            fields: {
              isLiked: () => false, // GraphQL schema uses isLiked, not isLikedByMe
              likesCount: (prev: number) => Math.max(0, prev - 1),
            },
          });
        },
      });
    } catch (err) {
      console.error("Error unliking post:", err);
      throw err;
    }
  }, [unlikePostMutation]);

  const repost = useCallback(async (postId: string) => {
    try {
      await repostMutation({
        variables: { input: { postId } }, // Repost uses RepostInput, not direct postId
        refetchQueries: ['GetFeed', 'GetUserPosts'],
        update: (cache) => {
          cache.modify({
            id: cache.identify({ __typename: 'Post', id: postId }),
            fields: {
              repostsCount: (prev: number) => prev + 1, // GraphQL schema uses repostsCount
            },
          });
        },
      });
    } catch (err) {
      console.error("Error reposting:", err);
      throw err;
    }
  }, [repostMutation]);

  const deletePost = useCallback(async (postId: string) => {
    try {
      await deletePostMutation({
        variables: { postId },
        update: (cache) => {
          // Remove post from cache
          cache.evict({ id: cache.identify({ __typename: 'Post', id: postId }) });
          cache.gc();
        },
        refetchQueries: ['GetFeed', 'GetUserPosts'],
      });
    } catch (err) {
      console.error("Error deleting post:", err);
      throw err;
    }
  }, [deletePostMutation]);

  // ============================================
  // COMMENT ACTIONS
  // ============================================

  const addComment = useCallback(async (postId: string, content: string) => {
    try {
      await createCommentMutation({
        variables: {
          input: {
            postId,
            content,
          },
        },
        optimisticResponse: {
          createComment: {
            __typename: 'Comment',
            id: `temp-${Date.now()}`,
            postId,
            parentId: null,
            content,
            likesCount: 0,
            isLiked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: {
              __typename: 'PostAuthor',
              id: 'temp-author',
              username: 'you',
              displayName: 'You',
              avatarUrl: '',
              isVerifiedCreator: false,
              walletAddress: '',
            },
            replies: [],
          },
        },
        update: (cache, { data }) => {
          if (!data?.createComment) return;

          cache.modify({
            id: cache.identify({ __typename: 'Post', id: postId }),
            fields: {
              replyCount: (prev: number) => prev + 1, // GraphQL schema uses replyCount for comments
            },
          });
        },
        refetchQueries: ['GetPostComments'],
      });
    } catch (err) {
      console.error("Error adding comment:", err);
      throw err;
    }
  }, [createCommentMutation]);

  const likeComment = useCallback(async (postId: string, commentId: string) => {
    try {
      await likeCommentMutation({
        variables: { commentId },
        optimisticResponse: {
          likeComment: true,
        },
        update: (cache) => {
          cache.modify({
            id: cache.identify({ __typename: 'Comment', id: commentId }),
            fields: {
              isLiked: () => true,
              likesCount: (prev: number) => prev + 1,
            },
          });
        },
      });
    } catch (err) {
      console.error("Error liking comment:", err);
      throw err;
    }
  }, [likeCommentMutation]);

  const unlikeComment = useCallback(async (postId: string, commentId: string) => {
    try {
      await unlikeCommentMutation({
        variables: { commentId },
        optimisticResponse: {
          unlikeComment: true,
        },
        update: (cache) => {
          cache.modify({
            id: cache.identify({ __typename: 'Comment', id: commentId }),
            fields: {
              isLiked: () => false,
              likesCount: (prev: number) => Math.max(0, prev - 1),
            },
          });
        },
      });
    } catch (err) {
      console.error("Error unliking comment:", err);
      throw err;
    }
  }, [unlikeCommentMutation]);

  const replyToComment = useCallback(async (postId: string, commentId: string, content: string) => {
    try {
      await createCommentMutation({
        variables: {
          input: {
            postId,
            content,
            parentId: commentId,
          },
        },
        update: (cache, { data }) => {
          if (!data?.createComment) return;

          cache.modify({
            id: cache.identify({ __typename: 'Post', id: postId }),
            fields: {
              replyCount: (prev: number) => prev + 1, // GraphQL schema uses replyCount
            },
          });

          cache.modify({
            id: cache.identify({ __typename: 'Comment', id: commentId }),
            fields: {
              replies: (existingReplies = []) => [...existingReplies, data.createComment],
            },
          });
        },
        refetchQueries: ['GetPostComments'],
      });
    } catch (err) {
      console.error("Error replying to comment:", err);
      throw err;
    }
  }, [createCommentMutation]);

  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    try {
      await deleteCommentMutation({
        variables: { commentId },
        update: (cache) => {
          cache.modify({
            id: cache.identify({ __typename: 'Post', id: postId }),
            fields: {
              replyCount: (prev: number) => Math.max(0, prev - 1), // GraphQL schema uses replyCount
            },
          });

          cache.evict({ id: cache.identify({ __typename: 'Comment', id: commentId }) });
          cache.gc();
        },
        refetchQueries: ['GetPostComments'],
      });
    } catch (err) {
      console.error("Error deleting comment:", err);
      throw err;
    }
  }, [deleteCommentMutation]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: PostsContextValue = {
    posts: [], // Posts now come from GraphQL queries, not context state
    isLoading: false,
    addPost,
    likePost,
    unlikePost,
    deletePost,
    repost,
    addComment,
    likeComment,
    unlikeComment,
    replyToComment,
    deleteComment,
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error("usePosts must be used within a PostsProvider");
  }
  return context;
}

// ============================================
// HELPER - Import gql for fragments
// ============================================

import { gql } from "@apollo/client";
