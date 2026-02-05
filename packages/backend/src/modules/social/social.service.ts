import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  Post as PrismaPost,
  Comment as PrismaComment,
  MediaType,
} from '@prisma/client';
import {
  Post,
  PostAuthor,
  PostMedia,
  PostFundraiserLink,
  PaginatedPosts,
  Comment,
  PaginatedComments,
  Feed,
  SocialTrendingHashtag,
  EngagementStats,
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  UpdateCommentInput,
  RepostInput,
  PostFilterInput,
  PostType,
  PostVisibility,
  FeedType,
  PostSortBy,
} from './dto';
import {
  PostNotFoundException,
  CommentNotFoundException,
  UnauthorizedException,
  InvalidInputException,
} from '../../common/exceptions';
import { SortOrder } from '../fundraisers/dto';

type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        walletAddress: true;
        username: true;
        displayName: true;
        avatarUrl: true;
        isVerifiedCreator: true;
      };
    };
    media: true;
    tags: {
      include: {
        hashtag: true;
      };
    };
    fundraiser: {
      select: {
        id: true;
        onChainId: true;
        name: true;
        images: true;
        goalAmount: true;
        raisedAmount: true;
      };
    };
  };
}>;

type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        walletAddress: true;
        username: true;
        displayName: true;
        avatarUrl: true;
        isVerifiedCreator: true;
      };
    };
    replies: {
      include: {
        author: {
          select: {
            id: true;
            walletAddress: true;
            username: true;
            displayName: true;
            avatarUrl: true;
            isVerifiedCreator: true;
          };
        };
      };
    };
  };
}>;

/**
 * Service for managing Social features
 * Handles posts, comments, likes, reposts, bookmarks, and feeds
 */
@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Post Methods ====================

  /**
   * Get a post by ID
   */
  async getPostById(id: string, viewerId?: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.getPostIncludes(),
    });

    if (!post) {
      throw new PostNotFoundException(id);
    }

    // Increment view count
    await this.prisma.post.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    return this.mapToPostDto(post, viewerId);
  }

  /**
   * Get paginated posts with filtering
   */
  async getPosts(
    limit: number,
    offset: number,
    filter?: PostFilterInput,
    sortBy: PostSortBy = PostSortBy.CREATED_AT,
    order: SortOrder = SortOrder.DESC,
    viewerId?: string,
  ): Promise<PaginatedPosts> {
    const where = this.buildPostWhereClause(filter);

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: this.getPostIncludes(),
        orderBy: { [sortBy]: order },
        take: limit,
        skip: offset,
      }),
      this.prisma.post.count({ where }),
    ]);

    const items = await Promise.all(
      posts.map((p) => this.mapToPostDto(p, viewerId)),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get user's posts
   */
  async getUserPosts(
    userId: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ): Promise<PaginatedPosts> {
    return this.getPosts(
      limit,
      offset,
      { authorId: userId },
      PostSortBy.CREATED_AT,
      SortOrder.DESC,
      viewerId,
    );
  }

  /**
   * Get posts by fundraiser
   */
  async getFundraiserPosts(
    fundraiserId: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ): Promise<PaginatedPosts> {
    return this.getPosts(
      limit,
      offset,
      { fundraiserId },
      PostSortBy.CREATED_AT,
      SortOrder.DESC,
      viewerId,
    );
  }

  /**
   * Get posts by hashtag
   */
  async getPostsByHashtag(
    tag: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ): Promise<PaginatedPosts> {
    return this.getPosts(
      limit,
      offset,
      { tag },
      PostSortBy.CREATED_AT,
      SortOrder.DESC,
      viewerId,
    );
  }

  /**
   * Get replies to a post
   */
  async getPostReplies(
    postId: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ): Promise<PaginatedPosts> {
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { parentId: postId },
        include: this.getPostIncludes(),
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.post.count({
        where: { parentId: postId },
      }),
    ]);

    const items = await Promise.all(
      posts.map((p) => this.mapToPostDto(p, viewerId)),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Create a new post
   */
  async createPost(userId: string, input: CreatePostInput): Promise<Post> {
    if (!input.content && (!input.mediaUrls || input.mediaUrls.length === 0)) {
      throw new InvalidInputException('Post must have content or media');
    }

    // Validate fundraiser if provided
    if (input.fundraiserId) {
      const fundraiser = await this.prisma.fundraiser.findUnique({
        where: { id: input.fundraiserId },
      });
      if (!fundraiser) {
        throw new InvalidInputException('Fundraiser not found');
      }
    }

    // Validate parent post if this is a reply
    if (input.parentId) {
      const parentPost = await this.prisma.post.findUnique({
        where: { id: input.parentId },
      });
      if (!parentPost) {
        throw new InvalidInputException('Parent post not found');
      }
    }

    const post = await this.prisma.$transaction(async (tx) => {
      // Create the post
      const newPost = await tx.post.create({
        data: {
          content: input.content,
          type: input.type || PostType.TEXT,
          authorId: userId,
          mediaUrls: input.mediaUrls || [],
          mentions: input.mentions || [],
          fundraiserId: input.fundraiserId,
          parentId: input.parentId,
          visibility: input.visibility || PostVisibility.PUBLIC,
        },
        include: this.getPostIncludes(),
      });

      // Handle hashtags
      if (input.tags && input.tags.length > 0) {
        for (const tag of input.tags) {
          const hashtag = await tx.hashtag.upsert({
            where: { tag: tag.toLowerCase() },
            create: { tag: tag.toLowerCase() },
            update: {
              usageCount: { increment: 1 },
              lastUsedAt: new Date(),
            },
          });

          await tx.postHashtag.create({
            data: {
              postId: newPost.id,
              hashtagId: hashtag.id,
            },
          });
        }
      }

      // Create media entries if provided
      if (input.mediaUrls && input.mediaUrls.length > 0) {
        await tx.media.createMany({
          data: input.mediaUrls.map((url) => ({
            postId: newPost.id,
            url,
            type: this.detectMediaType(url),
            status: 'COMPLETED',
          })),
        });
      }

      // Update user post count
      await tx.user.update({
        where: { id: userId },
        data: { postsCount: { increment: 1 } },
      });

      // Update parent post reply count if this is a reply
      if (input.parentId) {
        await tx.post.update({
          where: { id: input.parentId },
          data: { replyCount: { increment: 1 } },
        });
      }

      return newPost;
    });

    // Fetch full post with all relations
    const fullPost = await this.prisma.post.findUnique({
      where: { id: post.id },
      include: this.getPostIncludes(),
    });

    return this.mapToPostDto(fullPost!, userId);
  }

  /**
   * Update a post
   */
  async updatePost(
    postId: string,
    userId: string,
    input: UpdatePostInput,
  ): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new PostNotFoundException(postId);
    }

    if (post.authorId !== userId) {
      throw new UnauthorizedException('Only the author can edit this post');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        content: input.content,
        visibility: input.visibility,
        isEdited: true,
        editHistory: {
          push: {
            content: post.content,
            editedAt: new Date().toISOString(),
          },
        },
      },
      include: this.getPostIncludes(),
    });

    return this.mapToPostDto(updated, userId);
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new PostNotFoundException(postId);
    }

    if (post.authorId !== userId) {
      throw new UnauthorizedException('Only the author can delete this post');
    }

    await this.prisma.$transaction([
      this.prisma.post.delete({ where: { id: postId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { postsCount: { decrement: 1 } },
      }),
    ]);

    return true;
  }

  // ==================== Like Methods ====================

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new PostNotFoundException(postId);
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      return true; // Already liked
    }

    await this.prisma.$transaction([
      this.prisma.like.create({
        data: { userId, postId },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: { increment: 1 },
          engagementScore: { increment: 1 },
        },
      }),
    ]);

    return true;
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string): Promise<boolean> {
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!existingLike) {
      return true; // Not liked
    }

    await this.prisma.$transaction([
      this.prisma.like.delete({
        where: { id: existingLike.id },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: { decrement: 1 },
          engagementScore: { decrement: 1 },
        },
      }),
    ]);

    return true;
  }

  // ==================== Repost Methods ====================

  /**
   * Repost a post
   */
  async repost(userId: string, input: RepostInput): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: input.postId },
    });

    if (!post) {
      throw new PostNotFoundException(input.postId);
    }

    const existingRepost = await this.prisma.repost.findUnique({
      where: {
        userId_postId: { userId, postId: input.postId },
      },
    });

    if (existingRepost) {
      return true; // Already reposted
    }

    await this.prisma.$transaction([
      this.prisma.repost.create({
        data: {
          userId,
          postId: input.postId,
          comment: input.comment,
        },
      }),
      this.prisma.post.update({
        where: { id: input.postId },
        data: {
          repostsCount: { increment: 1 },
          engagementScore: { increment: 2 },
        },
      }),
    ]);

    return true;
  }

  /**
   * Remove repost
   */
  async removeRepost(postId: string, userId: string): Promise<boolean> {
    const existingRepost = await this.prisma.repost.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!existingRepost) {
      return true; // Not reposted
    }

    await this.prisma.$transaction([
      this.prisma.repost.delete({
        where: { id: existingRepost.id },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: {
          repostsCount: { decrement: 1 },
          engagementScore: { decrement: 2 },
        },
      }),
    ]);

    return true;
  }

  // ==================== Bookmark Methods ====================

  /**
   * Bookmark a post
   */
  async bookmarkPost(postId: string, userId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new PostNotFoundException(postId);
    }

    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingBookmark) {
      return true; // Already bookmarked
    }

    await this.prisma.$transaction([
      this.prisma.bookmark.create({
        data: { userId, postId },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { bookmarksCount: { increment: 1 } },
      }),
    ]);

    return true;
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(postId: string, userId: string): Promise<boolean> {
    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!existingBookmark) {
      return true; // Not bookmarked
    }

    await this.prisma.$transaction([
      this.prisma.bookmark.delete({
        where: { id: existingBookmark.id },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { bookmarksCount: { decrement: 1 } },
      }),
    ]);

    return true;
  }

  /**
   * Get user's bookmarks
   */
  async getUserBookmarks(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<PaginatedPosts> {
    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId },
        include: {
          post: {
            include: this.getPostIncludes(),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.bookmark.count({ where: { userId } }),
    ]);

    const items = await Promise.all(
      bookmarks.map((b) =>
        this.mapToPostDto(b.post as PostWithRelations, userId),
      ),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  // ==================== Comment Methods ====================

  /**
   * Get comments for a post
   */
  async getPostComments(
    postId: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ): Promise<PaginatedComments> {
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId, parentId: null },
        include: {
          author: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedCreator: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  walletAddress: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  isVerifiedCreator: true,
                },
              },
            },
            take: 3,
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    const items = await Promise.all(
      comments.map((c) =>
        this.mapToCommentDto(c as CommentWithRelations, viewerId),
      ),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get comments for a fundraiser
   */
  async getFundraiserComments(
    fundraiserId: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ): Promise<PaginatedComments> {
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { fundraiserId, parentId: null },
        include: {
          author: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedCreator: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  walletAddress: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  isVerifiedCreator: true,
                },
              },
            },
            take: 3,
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.comment.count({ where: { fundraiserId, parentId: null } }),
    ]);

    const items = await Promise.all(
      comments.map((c) =>
        this.mapToCommentDto(c as CommentWithRelations, viewerId),
      ),
    );

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Create a comment
   */
  async createComment(
    userId: string,
    input: CreateCommentInput,
  ): Promise<Comment> {
    // Validate that either postId or fundraiserId is provided
    if (!input.postId && !input.fundraiserId) {
      throw new InvalidInputException(
        'Either postId or fundraiserId must be provided',
      );
    }

    if (input.postId && input.fundraiserId) {
      throw new InvalidInputException(
        'Cannot provide both postId and fundraiserId',
      );
    }

    // Validate post if provided
    if (input.postId) {
      const post = await this.prisma.post.findUnique({
        where: { id: input.postId },
      });
      if (!post) {
        throw new PostNotFoundException(input.postId);
      }
    }

    // Validate fundraiser if provided
    if (input.fundraiserId) {
      const fundraiser = await this.prisma.fundraiser.findUnique({
        where: { id: input.fundraiserId },
      });
      if (!fundraiser) {
        throw new InvalidInputException('Fundraiser not found');
      }
    }

    // Validate parent comment if replying to a comment
    if (input.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: input.parentId },
      });
      if (
        !parentComment ||
        (input.postId && parentComment.postId !== input.postId) ||
        (input.fundraiserId &&
          parentComment.fundraiserId !== input.fundraiserId)
      ) {
        throw new InvalidInputException('Invalid parent comment');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: input.content,
        authorId: userId,
        postId: input.postId,
        fundraiserId: input.fundraiserId,
        parentId: input.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedCreator: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                walletAddress: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isVerifiedCreator: true,
              },
            },
          },
        },
      },
    });

    // Update post comment count if this is a post comment
    if (input.postId) {
      await this.prisma.post.update({
        where: { id: input.postId },
        data: {
          replyCount: { increment: 1 },
          engagementScore: { increment: 1.5 },
        },
      });
    }

    return this.mapToCommentDto(comment as CommentWithRelations, userId);
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new CommentNotFoundException(commentId);
    }

    if (comment.authorId !== userId) {
      throw new UnauthorizedException(
        'Only the author can delete this comment',
      );
    }

    const operations = [
      this.prisma.comment.delete({ where: { id: commentId } }),
    ];

    // Update post reply count if this is a post comment
    if (comment.postId) {
      operations.push(
        this.prisma.post.update({
          where: { id: comment.postId },
          data: {
            replyCount: { decrement: 1 },
            engagementScore: { decrement: 1.5 },
          },
        }) as any,
      );
    }

    await this.prisma.$transaction(operations);

    return true;
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<boolean> {
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (existingLike) {
      return true;
    }

    await this.prisma.$transaction([
      this.prisma.commentLike.create({
        data: { userId, commentId },
      }),
      this.prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    return true;
  }

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string, userId: string): Promise<boolean> {
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (!existingLike) {
      return true;
    }

    await this.prisma.$transaction([
      this.prisma.commentLike.delete({
        where: { id: existingLike.id },
      }),
      this.prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    return true;
  }

  // ==================== Feed Methods ====================

  /**
   * Get personalized feed for user
   */
  async getFeed(
    userId: string,
    feedType: FeedType,
    limit: number,
    cursor?: string,
  ): Promise<Feed> {
    const where: Prisma.PostWhereInput = {
      visibility: PostVisibility.PUBLIC,
      parentId: null,
    };

    if (feedType === FeedType.FOLLOWING) {
      // Get posts from users the current user follows
      const following = await this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);
      where.authorId = { in: followingIds };
    }

    // Apply cursor for pagination
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const orderBy: Prisma.PostOrderByWithRelationInput =
      feedType === FeedType.EXPLORE
        ? { engagementScore: 'desc' }
        : { createdAt: 'desc' };

    const posts = await this.prisma.post.findMany({
      where,
      include: this.getPostIncludes(),
      orderBy,
      take: limit + 1, // Fetch one extra to check if there's more
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, -1) : posts;
    const mappedPosts = await Promise.all(
      items.map((p) => this.mapToPostDto(p, userId)),
    );

    const nextCursor =
      items.length > 0
        ? items[items.length - 1].createdAt.toISOString()
        : undefined;

    return {
      posts: mappedPosts,
      hasMore,
      nextCursor,
    };
  }

  // ==================== Trending Methods ====================

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(
    limit: number = 10,
  ): Promise<SocialTrendingHashtag[]> {
    const hashtags = await this.prisma.hashtag.findMany({
      orderBy: [{ usageCount: 'desc' }, { lastUsedAt: 'desc' }],
      take: limit,
    });

    return hashtags.map((h) => ({
      tag: h.tag,
      postsCount: h.usageCount,
    }));
  }

  // ==================== Helper Methods ====================

  /**
   * Get common post includes
   */
  private getPostIncludes() {
    return {
      author: {
        select: {
          id: true,
          walletAddress: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerifiedCreator: true,
        },
      },
      media: true,
      tags: {
        include: {
          hashtag: true,
        },
      },
      fundraiser: {
        select: {
          id: true,
          onChainId: true,
          name: true,
          images: true,
          goalAmount: true,
          raisedAmount: true,
        },
      },
    };
  }

  /**
   * Build where clause for posts
   */
  private buildPostWhereClause(
    filter?: PostFilterInput,
  ): Prisma.PostWhereInput {
    if (!filter) return {};

    const where: Prisma.PostWhereInput = {};

    if (filter.authorId) {
      where.authorId = filter.authorId;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.tag) {
      where.tags = {
        some: {
          hashtag: {
            tag: filter.tag.toLowerCase(),
          },
        },
      };
    }

    if (filter.fundraiserId) {
      where.fundraiserId = filter.fundraiserId;
    }

    if (filter.hasMedia !== undefined) {
      if (filter.hasMedia) {
        where.media = { some: {} };
      } else {
        where.media = { none: {} };
      }
    }

    if (filter.visibility) {
      where.visibility = filter.visibility;
    }

    return where;
  }

  /**
   * Detect media type from URL
   */
  private detectMediaType(url: string): MediaType {
    const extension = url.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return MediaType.IMAGE;
    }
    if (['mp4', 'webm', 'mov'].includes(extension || '')) {
      return MediaType.VIDEO;
    }
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
      return MediaType.AUDIO;
    }

    return MediaType.IMAGE; // Default
  }

  /**
   * Map Prisma post to DTO
   */
  private async mapToPostDto(
    post: PostWithRelations,
    viewerId?: string,
  ): Promise<Post> {
    const author: PostAuthor = {
      id: post.author.id,
      walletAddress: post.author.walletAddress,
      username: post.author.username ?? undefined,
      displayName: post.author.displayName ?? undefined,
      avatarUrl: post.author.avatarUrl ?? undefined,
      isVerifiedCreator: post.author.isVerifiedCreator,
    };

    const media: PostMedia[] = post.media.map((m) => ({
      id: m.id,
      url: m.url,
      type: m.type,
      mimeType: m.mimeType ?? undefined,
      width: m.width ?? undefined,
      height: m.height ?? undefined,
      thumbnail: m.thumbnail ?? undefined,
      alt: m.alt ?? undefined,
    }));

    const tags = post.tags.map((t) => t.hashtag.tag);

    const fundraiser: PostFundraiserLink | undefined = post.fundraiser
      ? {
          id: post.fundraiser.id,
          onChainId: post.fundraiser.onChainId,
          name: post.fundraiser.name,
          images: post.fundraiser.images,
          goalAmount: post.fundraiser.goalAmount,
          raisedAmount: post.fundraiser.raisedAmount.toString(),
        }
      : undefined;

    let isLiked: boolean | undefined;
    let isReposted: boolean | undefined;
    let isBookmarked: boolean | undefined;

    if (viewerId) {
      const [like, repost, bookmark] = await Promise.all([
        this.prisma.like.findUnique({
          where: { userId_postId: { userId: viewerId, postId: post.id } },
        }),
        this.prisma.repost.findUnique({
          where: { userId_postId: { userId: viewerId, postId: post.id } },
        }),
        this.prisma.bookmark.findUnique({
          where: { userId_postId: { userId: viewerId, postId: post.id } },
        }),
      ]);

      isLiked = !!like;
      isReposted = !!repost;
      isBookmarked = !!bookmark;
    }

    return {
      id: post.id,
      content: post.content ?? undefined,
      type: post.type as PostType,
      author,
      media,
      tags,
      mentions: post.mentions,
      fundraiser,
      parentId: post.parentId ?? undefined,
      replyCount: post.replyCount,
      likesCount: post.likesCount,
      repostsCount: post.repostsCount,
      bookmarksCount: post.bookmarksCount,
      viewsCount: post.viewsCount,
      visibility: post.visibility as PostVisibility,
      isPinned: post.isPinned,
      isEdited: post.isEdited,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked,
      isReposted,
      isBookmarked,
    };
  }

  /**
   * Map Prisma comment to DTO
   */
  private async mapToCommentDto(
    comment: CommentWithRelations,
    viewerId?: string,
  ): Promise<Comment> {
    const author: PostAuthor = {
      id: comment.author.id,
      walletAddress: comment.author.walletAddress,
      username: comment.author.username ?? undefined,
      displayName: comment.author.displayName ?? undefined,
      avatarUrl: comment.author.avatarUrl ?? undefined,
      isVerifiedCreator: comment.author.isVerifiedCreator,
    };

    let isLiked: boolean | undefined;
    if (viewerId) {
      const like = await this.prisma.commentLike.findUnique({
        where: {
          userId_commentId: { userId: viewerId, commentId: comment.id },
        },
      });
      isLiked = !!like;
    }

    const replies: Comment[] = await Promise.all(
      (comment.replies || []).map(async (reply) => ({
        id: reply.id,
        content: reply.content,
        author: {
          id: reply.author.id,
          walletAddress: reply.author.walletAddress,
          username: reply.author.username ?? undefined,
          displayName: reply.author.displayName ?? undefined,
          avatarUrl: reply.author.avatarUrl ?? undefined,
          isVerifiedCreator: reply.author.isVerifiedCreator,
        },
        postId: reply.postId ?? undefined,
        parentId: reply.parentId ?? undefined,
        likesCount: reply.likesCount,
        replies: [],
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        isLiked: undefined,
      })),
    );

    return {
      id: comment.id,
      content: comment.content,
      author,
      postId: comment.postId ?? undefined,
      parentId: comment.parentId ?? undefined,
      likesCount: comment.likesCount,
      replies,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isLiked,
    };
  }
}
