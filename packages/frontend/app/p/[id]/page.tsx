import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PostDetailClient } from "./PostDetailClient";
import { PostDetailSkeleton } from "./loading";
import type { Metadata } from "next";

interface PageProps {
  params: { id: string };
  searchParams: { comment?: string; reply?: string };
}

// Mock function - replace with actual API call
async function getPost(id: string) {
  // TODO: Implement actual API call
  // const response = await fetch(`/api/posts/${id}`);
  // if (!response.ok) return null;
  // return response.json();

  // Mock data for now
  if (id === "404") return null;

  return {
    id,
    content: "This is a sample post content. It can span multiple lines and include rich text, links, and more.",
    author: {
      id: "1",
      name: "John Doe",
      username: "johndoe",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      isVerified: true,
      isFollowing: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: null,
    likesCount: 234,
    commentsCount: 45,
    sharesCount: 12,
    isLiked: false,
    isBookmarked: false,
    canEdit: false,
    canDelete: false,
    type: "community" as const,
  };
}

// Generate metadata for SEO and Open Graph
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.id);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  // Truncate content for description
  const description = post.content.length > 160
    ? `${post.content.slice(0, 157)}...`
    : post.content;

  return {
    title: `${post.author.name} on FundBrave`,
    description,
    openGraph: {
      title: `${post.author.name} on FundBrave`,
      description,
      type: "article",
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.author.name} on FundBrave`,
      description,
    },
  };
}

export default async function PostDetailPage({ params, searchParams }: PageProps) {
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailClient
        post={post}
        highlightCommentId={searchParams.comment}
        autoFocusReply={searchParams.reply === "true"}
      />
    </Suspense>
  );
}
