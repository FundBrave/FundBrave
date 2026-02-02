import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsArray,
  IsDate,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ==================== ENUMS ====================

/**
 * Search types supported by the search endpoint
 */
export enum SearchType {
  ALL = 'all',
  CAMPAIGNS = 'campaigns',
  USERS = 'users',
  POSTS = 'posts',
  HASHTAGS = 'hashtags',
}

/**
 * Sort options for search results
 */
export enum SearchSortBy {
  RELEVANCE = 'relevance',
  DATE_DESC = 'date_desc',
  DATE_ASC = 'date_asc',
  POPULARITY = 'popularity',
  AMOUNT = 'amount',
}

/**
 * Date range filters for search
 */
export enum DateRangeFilter {
  ALL_TIME = 'all_time',
  TODAY = 'today',
  THIS_WEEK = 'this_week',
  THIS_MONTH = 'this_month',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

// ==================== RESULT TYPES ====================

/**
 * Author/Creator info for search results
 */
export class SearchResultAuthor {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Username' })
  username?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Is verified creator' })
  isVerifiedCreator?: boolean;
}

/**
 * Minimal campaign result for search
 */
export class SearchCampaignResult {
  @ApiProperty({ description: 'Campaign ID' })
  id: string;

  @ApiProperty({ description: 'Campaign name' })
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description (truncated)' })
  description?: string;

  @ApiProperty({ description: 'Campaign images' })
  images: string[];

  @ApiProperty({ description: 'Goal amount in USD' })
  goalAmount: string;

  @ApiProperty({ description: 'Raised amount in USD' })
  raisedAmount: string;

  @ApiProperty({ description: 'Primary category' })
  category: string;

  @ApiProperty({ description: 'All categories', type: [String] })
  categories: string[];

  @ApiProperty({ description: 'Creator info' })
  creator: SearchResultAuthor;

  @ApiProperty({ description: 'Campaign deadline' })
  deadline: Date;

  @ApiPropertyOptional({ description: 'Is featured campaign' })
  isFeatured?: boolean;

  @ApiProperty({ description: 'Number of donors' })
  donorsCount: number;

  @ApiProperty({ description: 'Search relevance score (0-100)' })
  relevanceScore: number;

  @ApiPropertyOptional({ description: 'Matched snippet with highlights' })
  matchedSnippet?: string;
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

  @ApiPropertyOptional({ description: 'Bio (truncated)' })
  bio?: string;

  @ApiProperty({ description: 'Is verified creator' })
  isVerifiedCreator: boolean;

  @ApiProperty({ description: 'Followers count' })
  followersCount: number;

  @ApiProperty({ description: 'Number of fundraisers created' })
  fundraisersCount: number;

  @ApiProperty({ description: 'Search relevance score (0-100)' })
  relevanceScore: number;

  @ApiPropertyOptional({ description: 'Matched snippet with highlights' })
  matchedSnippet?: string;
}

/**
 * Minimal post result for search
 */
export class SearchPostResult {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post content (truncated)' })
  content: string;

  @ApiProperty({ description: 'Post author' })
  author: SearchResultAuthor;

  @ApiProperty({ description: 'Likes count' })
  likesCount: number;

  @ApiProperty({ description: 'Comments count' })
  commentsCount: number;

  @ApiProperty({ description: 'Reposts count' })
  repostsCount: number;

  @ApiPropertyOptional({ description: 'Media URLs', type: [String] })
  mediaUrls?: string[];

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Search relevance score (0-100)' })
  relevanceScore: number;

  @ApiPropertyOptional({ description: 'Matched snippet with highlights' })
  matchedSnippet?: string;

  @ApiPropertyOptional({ description: 'Hashtags in post', type: [String] })
  hashtags?: string[];
}

/**
 * Hashtag search result
 */
export class SearchHashtagResult {
  @ApiProperty({ description: 'Hashtag ID' })
  id: string;

  @ApiProperty({ description: 'Hashtag tag (without #)' })
  tag: string;

  @ApiProperty({ description: 'Number of posts using this hashtag' })
  postsCount: number;

  @ApiProperty({ description: 'Search relevance score (0-100)' })
  relevanceScore: number;

  @ApiPropertyOptional({ description: 'Is trending' })
  isTrending?: boolean;
}

/**
 * Combined search results
 */
export class SearchResults {
  @ApiProperty({
    description: 'Campaign search results',
    type: [SearchCampaignResult],
  })
  campaigns: SearchCampaignResult[];

  @ApiProperty({ description: 'User search results', type: [SearchUserResult] })
  users: SearchUserResult[];

  @ApiProperty({ description: 'Post search results', type: [SearchPostResult] })
  posts: SearchPostResult[];

  @ApiProperty({
    description: 'Hashtag search results',
    type: [SearchHashtagResult],
  })
  hashtags: SearchHashtagResult[];

  @ApiProperty({ description: 'Total campaigns found' })
  totalCampaigns: number;

  @ApiProperty({ description: 'Total users found' })
  totalUsers: number;

  @ApiProperty({ description: 'Total posts found' })
  totalPosts: number;

  @ApiProperty({ description: 'Total hashtags found' })
  totalHashtags: number;

  @ApiProperty({ description: 'Search execution time in milliseconds' })
  executionTimeMs: number;

  @ApiPropertyOptional({ description: 'Search query suggestions', type: [String] })
  suggestions?: string[];

  @ApiPropertyOptional({ description: 'Did you mean alternative query' })
  didYouMean?: string;
}

// ==================== REQUEST DTOs ====================

/**
 * Search query parameters with advanced filtering
 */
export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string (minimum 2 characters)',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  @MaxLength(200, { message: 'Search query cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
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
    description: 'Sort results by',
    enum: SearchSortBy,
    default: SearchSortBy.RELEVANCE,
  })
  @IsOptional()
  @IsEnum(SearchSortBy)
  sortBy?: SearchSortBy = SearchSortBy.RELEVANCE;

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

  @ApiPropertyOptional({
    description: 'Enable fuzzy matching for typos',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  fuzzyMatch?: boolean = true;

  @ApiPropertyOptional({
    description: 'Filter campaigns by categories',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((s) => s.trim()) : value,
  )
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Filter by verified creators only',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  verifiedOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Date range filter',
    enum: DateRangeFilter,
    default: DateRangeFilter.ALL_TIME,
  })
  @IsOptional()
  @IsEnum(DateRangeFilter)
  dateRange?: DateRangeFilter = DateRangeFilter.ALL_TIME;

  @ApiPropertyOptional({
    description: 'Custom date range start (ISO 8601)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Custom date range end (ISO 8601)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({
    description: 'Minimum goal amount for campaigns (USD)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minGoalAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum goal amount for campaigns (USD)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxGoalAmount?: number;

  @ApiPropertyOptional({
    description: 'Include only active campaigns',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean = true;
}

/**
 * DTO for tracking result clicks
 */
export class SearchClickDto {
  @ApiProperty({ description: 'Original search query' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  query: string;

  @ApiProperty({ description: 'ID of the clicked result' })
  @IsString()
  resultId: string;

  @ApiProperty({
    description: 'Type of the clicked result',
    enum: SearchType,
  })
  @IsEnum(SearchType)
  resultType: SearchType;

  @ApiPropertyOptional({ description: 'Position in results (0-indexed)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;
}

// ==================== TRENDING & SUGGESTIONS ====================

/**
 * Trending search item
 */
export class TrendingSearchItem {
  @ApiProperty({ description: 'Trending term or hashtag' })
  term: string;

  @ApiProperty({ description: 'Search count in period' })
  searchCount: number;

  @ApiProperty({ description: 'Type of trending item' })
  type: 'hashtag' | 'query' | 'campaign' | 'user';

  @ApiPropertyOptional({ description: 'Associated entity ID' })
  entityId?: string;

  @ApiPropertyOptional({ description: 'Change in ranking from previous period' })
  rankChange?: number;
}

/**
 * Search suggestion
 */
export class SearchSuggestion {
  @ApiProperty({ description: 'Suggested search term' })
  term: string;

  @ApiProperty({ description: 'Suggestion type' })
  type: 'recent' | 'popular' | 'autocomplete' | 'hashtag';

  @ApiPropertyOptional({ description: 'Icon or visual hint' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Preview count (posts, campaigns, etc.)' })
  count?: number;
}

/**
 * Trending and suggestions response
 */
export class TrendingResponse {
  @ApiProperty({
    description: 'Trending searches',
    type: [TrendingSearchItem],
  })
  trending: TrendingSearchItem[];

  @ApiProperty({
    description: 'Popular hashtags',
    type: [SearchHashtagResult],
  })
  popularHashtags: SearchHashtagResult[];

  @ApiProperty({
    description: 'Popular campaigns',
    type: [SearchCampaignResult],
  })
  popularCampaigns: SearchCampaignResult[];

  @ApiProperty({ description: 'Cache timestamp' })
  cachedAt: Date;
}

/**
 * Suggestions request parameters
 */
export class SuggestionsQueryDto {
  @ApiProperty({
    description: 'Partial query for autocomplete',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  q: string;

  @ApiPropertyOptional({
    description: 'Maximum number of suggestions',
    default: 8,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8;

  @ApiPropertyOptional({
    description: 'Include user recent searches',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeRecent?: boolean = true;
}

/**
 * Suggestions response
 */
export class SuggestionsResponse {
  @ApiProperty({
    description: 'Search suggestions',
    type: [SearchSuggestion],
  })
  suggestions: SearchSuggestion[];

  @ApiPropertyOptional({
    description: 'User recent searches',
    type: [String],
  })
  recentSearches?: string[];
}
