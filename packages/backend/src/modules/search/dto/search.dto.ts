import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Search types supported by the search endpoint
 */
export enum SearchType {
  ALL = 'all',
  CAMPAIGNS = 'campaigns',
  USERS = 'users',
  POSTS = 'posts',
}

/**
 * Minimal campaign result for search
 */
export class SearchCampaignResult {
  @ApiProperty({ description: 'Campaign ID' })
  id: string;

  @ApiProperty({ description: 'Campaign name' })
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  description?: string;

  @ApiProperty({ description: 'Campaign images' })
  images: string[];

  @ApiProperty({ description: 'Goal amount in USD' })
  goalAmount: string;

  @ApiProperty({ description: 'Raised amount in USD' })
  raisedAmount: string;

  @ApiProperty({ description: 'Category' })
  category: string;

  @ApiProperty({ description: 'Creator info' })
  creator: {
    id: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

/**
 * Minimal user result for search
 */
export class SearchUserResult {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Wallet address' })
  walletAddress: string;

  @ApiPropertyOptional({ description: 'Username' })
  username?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Is verified creator' })
  isVerifiedCreator: boolean;

  @ApiProperty({ description: 'Followers count' })
  followersCount: number;
}

/**
 * Minimal post result for search
 */
export class SearchPostResult {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiProperty({ description: 'Post author' })
  author: {
    id: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  };

  @ApiProperty({ description: 'Likes count' })
  likesCount: number;

  @ApiProperty({ description: 'Comments count' })
  commentsCount: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}

/**
 * Combined search results
 */
export class SearchResults {
  @ApiProperty({ description: 'Campaign search results', type: [SearchCampaignResult] })
  campaigns: SearchCampaignResult[];

  @ApiProperty({ description: 'User search results', type: [SearchUserResult] })
  users: SearchUserResult[];

  @ApiProperty({ description: 'Post search results', type: [SearchPostResult] })
  posts: SearchPostResult[];

  @ApiProperty({ description: 'Total campaigns found' })
  totalCampaigns: number;

  @ApiProperty({ description: 'Total users found' })
  totalUsers: number;

  @ApiProperty({ description: 'Total posts found' })
  totalPosts: number;
}

/**
 * Search query parameters
 */
export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Search type filter',
    enum: SearchType,
    default: SearchType.ALL,
  })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType = SearchType.ALL;

  @ApiPropertyOptional({
    description: 'Number of results per type',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
