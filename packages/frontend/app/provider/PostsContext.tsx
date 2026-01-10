"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { MOCK_POSTS } from "@/lib/constants/mock-profile-activity";

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
  addPost: (content: string, imageUrl?: string) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  deletePost: (postId: string) => void;
  // Comment actions
  addComment: (postId: string, content: string) => void;
  likeComment: (postId: string, commentId: string) => void;
  unlikeComment: (postId: string, commentId: string) => void;
  replyToComment: (postId: string, commentId: string, content: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
}

// ============================================
// CONTEXT
// ============================================

const PostsContext = createContext<PostsContextValue | undefined>(undefined);

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateId = () => `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getCurrentUser = (): PostAuthor => ({
  name: "Jane Smith",
  username: "janesmith",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  isVerified: true,
});

// Convert mock posts to our Post type with comments array
const convertMockPosts = (): Post[] => {
  return MOCK_POSTS.map((mockPost) => ({
    id: mockPost.id,
    content: mockPost.content,
    imageUrl: mockPost.imageUrl,
    author: {
      name: mockPost.author.name,
      username: mockPost.author.username,
      avatar: mockPost.author.avatar,
      isVerified: mockPost.author.isVerified,
    },
    likesCount: mockPost.likesCount,
    commentsCount: mockPost.commentsCount,
    sharesCount: mockPost.sharesCount,
    viewsCount: mockPost.viewsCount,
    createdAt: mockPost.createdAt,
    isLiked: false,
    comments: [],
  }));
};

// ============================================
// PROVIDER
// ============================================

interface PostsProviderProps {
  children: ReactNode;
}

export function PostsProvider({ children }: PostsProviderProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize posts from localStorage or mock data
  useEffect(() => {
    const stored = localStorage.getItem("fundbrave_posts");
    if (stored) {
      try {
        setPosts(JSON.parse(stored));
      } catch {
        setPosts(convertMockPosts());
      }
    } else {
      setPosts(convertMockPosts());
    }
    setIsLoading(false);
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      localStorage.setItem("fundbrave_posts", JSON.stringify(posts));
    }
  }, [posts, isLoading]);

  // ============================================
  // POST ACTIONS
  // ============================================

  const addPost = useCallback((content: string, imageUrl?: string) => {
    const newPost: Post = {
      id: generateId(),
      content,
      imageUrl,
      author: getCurrentUser(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      isLiked: false,
      comments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const likePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, isLiked: true, likesCount: post.likesCount + 1 }
          : post
      )
    );
  }, []);

  const unlikePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, isLiked: false, likesCount: Math.max(0, post.likesCount - 1) }
          : post
      )
    );
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  // ============================================
  // COMMENT ACTIONS
  // ============================================

  const addComment = useCallback((postId: string, content: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      author: getCurrentUser(),
      content,
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      isLiked: false,
      replies: [],
    };

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [newComment, ...post.comments],
              commentsCount: post.commentsCount + 1,
            }
          : post
      )
    );
  }, []);

  const likeComment = useCallback((postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        
        const updateComment = (comments: Comment[]): Comment[] =>
          comments.map((comment) => {
            if (comment.id === commentId) {
              return { ...comment, isLiked: true, likesCount: comment.likesCount + 1 };
            }
            if (comment.replies.length > 0) {
              return { ...comment, replies: updateComment(comment.replies) };
            }
            return comment;
          });

        return { ...post, comments: updateComment(post.comments) };
      })
    );
  }, []);

  const unlikeComment = useCallback((postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        
        const updateComment = (comments: Comment[]): Comment[] =>
          comments.map((comment) => {
            if (comment.id === commentId) {
              return { ...comment, isLiked: false, likesCount: Math.max(0, comment.likesCount - 1) };
            }
            if (comment.replies.length > 0) {
              return { ...comment, replies: updateComment(comment.replies) };
            }
            return comment;
          });

        return { ...post, comments: updateComment(post.comments) };
      })
    );
  }, []);

  const replyToComment = useCallback((postId: string, commentId: string, content: string) => {
    const newReply: Comment = {
      id: `reply-${Date.now()}`,
      postId,
      parentId: commentId,
      author: getCurrentUser(),
      content,
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      isLiked: false,
      replies: [],
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        
        const addReply = (comments: Comment[]): Comment[] =>
          comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: [...comment.replies, newReply],
                repliesCount: comment.repliesCount + 1,
              };
            }
            if (comment.replies.length > 0) {
              return { ...comment, replies: addReply(comment.replies) };
            }
            return comment;
          });

        return {
          ...post,
          comments: addReply(post.comments),
          commentsCount: post.commentsCount + 1,
        };
      })
    );
  }, []);

  const deleteComment = useCallback((postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        
        const removeComment = (comments: Comment[]): Comment[] =>
          comments
            .filter((comment) => comment.id !== commentId)
            .map((comment) => ({
              ...comment,
              replies: removeComment(comment.replies),
            }));

        const newComments = removeComment(post.comments);
        return {
          ...post,
          comments: newComments,
          commentsCount: post.commentsCount - 1,
        };
      })
    );
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: PostsContextValue = {
    posts,
    isLoading,
    addPost,
    likePost,
    unlikePost,
    deletePost,
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
