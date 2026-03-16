import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SocialService } from './social.service';
import {
  Post,
  PaginatedPosts,
  Comment,
  PaginatedComments,
  Feed,
  SocialTrendingHashtag,
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  RepostInput,
  PostFilterInput,
  FeedType,
  PostSortBy,
} from './dto';
import { SortOrder } from '../fundraisers/dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Post)
export class SocialResolver {
  constructor(private readonly socialService: SocialService) {}

  // ==================== Post Queries ====================

  @Query(() => Post, { name: 'post' })
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getPost(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() viewer?: { id: string },
  ): Promise<Post> {
    return this.socialService.getPostById(id, viewer?.id);
  }

  @Query(() => PaginatedPosts, { name: 'posts' })
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getPosts(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('filter', { type: () => PostFilterInput, nullable: true })
    filter?: PostFilterInput,
    @Args('sortBy', {
      type: () => PostSortBy,
      defaultValue: PostSortBy.CREATED_AT,
    })
    sortBy?: PostSortBy,
    @Args('order', { type: () => SortOrder, defaultValue: SortOrder.DESC })
    order?: SortOrder,
    @CurrentUser() viewer?: { id: string },
  ): Promise<PaginatedPosts> {
    return this.socialService.getPosts(
      limit,
      offset,
      filter,
      sortBy,
      order,
      viewer?.id,
    );
  }

  @Query(() => PaginatedPosts, { name: 'userPosts' })
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getUserPosts(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() viewer?: { id: string },
  ): Promise<PaginatedPosts> {
    return this.socialService.getUserPosts(userId, limit, offset, viewer?.id);
  }

  @Query(() => PaginatedPosts, { name: 'postReplies' })
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getPostReplies(
    @Args('postId', { type: () => ID }) postId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() viewer?: { id: string },
  ): Promise<PaginatedPosts> {
    return this.socialService.getPostReplies(postId, limit, offset, viewer?.id);
  }

  @Query(() => PaginatedPosts, { name: 'postsByHashtag' })
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getPostsByHashtag(
    @Args('tag') tag: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() viewer?: { id: string },
  ): Promise<PaginatedPosts> {
    return this.socialService.getPostsByHashtag(tag, limit, offset, viewer?.id);
  }

  @Query(() => Feed, { name: 'feed' })
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @CurrentUser() user: { id: string },
    @Args('feedType', { type: () => FeedType, defaultValue: FeedType.HOME })
    feedType: FeedType,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('cursor', { nullable: true }) cursor?: string,
  ): Promise<Feed> {
    return this.socialService.getFeed(user.id, feedType, limit, cursor);
  }

  @Query(() => PaginatedPosts, { name: 'myBookmarks' })
  @UseGuards(JwtAuthGuard)
  async getMyBookmarks(
    @CurrentUser() user: { id: string },
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<PaginatedPosts> {
    return this.socialService.getUserBookmarks(user.id, limit, offset);
  }

  @Query(() => [SocialTrendingHashtag], { name: 'trendingHashtags' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getTrendingHashtags(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<SocialTrendingHashtag[]> {
    return this.socialService.getTrendingHashtags(limit);
  }

  @Query(() => PaginatedPosts, { name: 'userLikedPosts' })
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getUserLikedPosts(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() viewer?: { id: string },
  ): Promise<PaginatedPosts> {
    return this.socialService.getUserLikedPosts(userId, limit, offset, viewer?.id);
  }

  @Query(() => PaginatedComments, { name: 'userComments' })
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getUserComments(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() viewer?: { id: string },
  ): Promise<PaginatedComments> {
    return this.socialService.getUserComments(userId, limit, offset, viewer?.id);
  }

  // ==================== Comment Queries ====================

  @Query(() => PaginatedComments, { name: 'postComments' })
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getPostComments(
    @Args('postId', { type: () => ID }) postId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() viewer?: { id: string },
  ): Promise<PaginatedComments> {
    return this.socialService.getPostComments(
      postId,
      limit,
      offset,
      viewer?.id,
    );
  }

  @Query(() => PaginatedComments, { name: 'fundraiserComments' })
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getFundraiserComments(
    @Args('fundraiserId', { type: () => ID }) fundraiserId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() viewer?: { id: string },
  ): Promise<PaginatedComments> {
    return this.socialService.getFundraiserComments(
      fundraiserId,
      limit,
      offset,
      viewer?.id,
    );
  }

  // ==================== Post Mutations ====================

  @Mutation(() => Post)
  @UseGuards(JwtAuthGuard)
  async createPost(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreatePostInput,
  ): Promise<Post> {
    return this.socialService.createPost(user.id, input);
  }

  @Mutation(() => Post)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @CurrentUser() user: { id: string },
    @Args('postId', { type: () => ID }) postId: string,
    @Args('input') input: UpdatePostInput,
  ): Promise<Post> {
    return this.socialService.updatePost(postId, user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @CurrentUser() user: { id: string },
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<boolean> {
    return this.socialService.deletePost(postId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async likePost(
    @CurrentUser() user: { id: string },
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<boolean> {
    return this.socialService.likePost(postId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async unlikePost(
    @CurrentUser() user: { id: string },
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<boolean> {
    return this.socialService.unlikePost(postId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async repost(
    @CurrentUser() user: { id: string },
    @Args('input') input: RepostInput,
  ): Promise<boolean> {
    return this.socialService.repost(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removeRepost(
    @CurrentUser() user: { id: string },
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<boolean> {
    return this.socialService.removeRepost(postId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async bookmarkPost(
    @CurrentUser() user: { id: string },
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<boolean> {
    return this.socialService.bookmarkPost(postId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removeBookmark(
    @CurrentUser() user: { id: string },
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<boolean> {
    return this.socialService.removeBookmark(postId, user.id);
  }

  // ==================== Comment Mutations ====================

  @Mutation(() => Comment)
  @UseGuards(JwtAuthGuard)
  async createComment(
    @CurrentUser() user: { id: string },
    @Args('input') input: CreateCommentInput,
  ): Promise<Comment> {
    return this.socialService.createComment(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @CurrentUser() user: { id: string },
    @Args('commentId', { type: () => ID }) commentId: string,
  ): Promise<boolean> {
    return this.socialService.deleteComment(commentId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async likeComment(
    @CurrentUser() user: { id: string },
    @Args('commentId', { type: () => ID }) commentId: string,
  ): Promise<boolean> {
    return this.socialService.likeComment(commentId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async unlikeComment(
    @CurrentUser() user: { id: string },
    @Args('commentId', { type: () => ID }) commentId: string,
  ): Promise<boolean> {
    return this.socialService.unlikeComment(commentId, user.id);
  }
}
