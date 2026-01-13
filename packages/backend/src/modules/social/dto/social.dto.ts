import {
  Field,
  ObjectType,
  InputType,
  Int,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

// ==================== Enums ====================

export enum PostType {
  TEXT = 'TEXT',
  MEDIA = 'MEDIA',
  POLL = 'POLL',
  DONATION_EVENT = 'DONATION_EVENT',
  FUNDRAISER_NEW = 'FUNDRAISER_NEW',
  FUNDRAISER_UPDATE = 'FUNDRAISER_UPDATE',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
}

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  FOLLOWERS = 'FOLLOWERS',
  PRIVATE = 'PRIVATE',
}

export enum FeedType {
  HOME = 'HOME',
  EXPLORE = 'EXPLORE',
  FOLLOWING = 'FOLLOWING',
}

export enum PostSortBy {
  CREATED_AT = 'createdAt',
  ENGAGEMENT_SCORE = 'engagementScore',
  LIKES_COUNT = 'likesCount',
}

registerEnumType(PostType, { name: 'PostType' });
registerEnumType(PostVisibility, { name: 'PostVisibility' });
registerEnumType(FeedType, { name: 'FeedType' });
registerEnumType(PostSortBy, { name: 'PostSortBy' });

// ==================== Output DTOs ====================

@ObjectType()
export class PostAuthor {
  @Field(() => ID)
  id: string;

  @Field()
  walletAddress: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  isVerifiedCreator: boolean;
}

@ObjectType()
export class PostMedia {
  @Field(() => ID)
  id: string;

  @Field()
  url: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  mimeType?: string;

  @Field(() => Int, { nullable: true })
  width?: number;

  @Field(() => Int, { nullable: true })
  height?: number;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  alt?: string;
}

@ObjectType()
export class PostFundraiserLink {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  onChainId: number;

  @Field()
  name: string;

  @Field(() => [String])
  images: string[];

  @Field()
  goalAmount: string;

  @Field()
  raisedAmount: string;
}

@ObjectType()
export class Post {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => PostType)
  type: PostType;

  @Field(() => PostAuthor)
  author: PostAuthor;

  @Field(() => [PostMedia])
  media: PostMedia[];

  @Field(() => [String])
  tags: string[];

  @Field(() => [String])
  mentions: string[];

  @Field(() => PostFundraiserLink, { nullable: true })
  fundraiser?: PostFundraiserLink;

  @Field(() => ID, { nullable: true })
  parentId?: string;

  @Field(() => Int)
  replyCount: number;

  @Field(() => Int)
  likesCount: number;

  @Field(() => Int)
  repostsCount: number;

  @Field(() => Int)
  bookmarksCount: number;

  @Field(() => Int)
  viewsCount: number;

  @Field(() => PostVisibility)
  visibility: PostVisibility;

  @Field()
  isPinned: boolean;

  @Field()
  isEdited: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Contextual fields (set based on viewer)
  @Field({ nullable: true })
  isLiked?: boolean;

  @Field({ nullable: true })
  isReposted?: boolean;

  @Field({ nullable: true })
  isBookmarked?: boolean;
}

@ObjectType()
export class PaginatedPosts {
  @Field(() => [Post])
  items: Post[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => PostAuthor)
  author: PostAuthor;

  @Field(() => ID)
  postId: string;

  @Field(() => ID, { nullable: true })
  parentId?: string;

  @Field(() => Int)
  likesCount: number;

  @Field(() => [Comment])
  replies: Comment[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  isLiked?: boolean;
}

@ObjectType()
export class PaginatedComments {
  @Field(() => [Comment])
  items: Comment[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class Feed {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;

  @Field({ nullable: true })
  nextCursor?: string;
}

// Simpler trending hashtag type for social feed queries
// For full trending data with scores and periods, use TrendingHashtag from trending module
@ObjectType()
export class SocialTrendingHashtag {
  @Field()
  tag: string;

  @Field(() => Int)
  postsCount: number;
}

@ObjectType()
export class EngagementStats {
  @Field(() => Int)
  totalLikes: number;

  @Field(() => Int)
  totalComments: number;

  @Field(() => Int)
  totalReposts: number;

  @Field(() => Int)
  totalViews: number;
}

// ==================== Input DTOs ====================

@InputType()
export class CreatePostInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @Field(() => PostType, { defaultValue: PostType.TEXT })
  @IsOptional()
  type?: PostType;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  mediaUrls?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fundraiserId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string;

  @Field(() => PostVisibility, { defaultValue: PostVisibility.PUBLIC })
  @IsOptional()
  visibility?: PostVisibility;
}

@InputType()
export class UpdatePostInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => PostVisibility, { nullable: true })
  @IsOptional()
  visibility?: PostVisibility;
}

@InputType()
export class CreateCommentInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @Field()
  @IsString()
  postId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string;
}

@InputType()
export class UpdateCommentInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

@InputType()
export class RepostInput {
  @Field()
  @IsString()
  postId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

@InputType()
export class PostFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  authorId?: string;

  @Field(() => PostType, { nullable: true })
  @IsOptional()
  type?: PostType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tag?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fundraiserId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasMedia?: boolean;

  @Field(() => PostVisibility, { nullable: true })
  @IsOptional()
  visibility?: PostVisibility;
}
