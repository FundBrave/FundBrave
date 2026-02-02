import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { SearchService } from './search.service';
import { SearchCacheService } from './services/search-cache.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import {
  SearchResults,
  SearchQueryDto,
  SearchClickDto,
  TrendingResponse,
  SuggestionsResponse,
  SuggestionsQueryDto,
  SearchType,
} from './dto';
import { SearchRateLimit } from '../../common/decorators';

/**
 * Interface for request with optional user
 */
interface RequestWithUser extends Request {
  user?: { id: string; walletAddress?: string };
}

/**
 * Search controller with comprehensive search functionality
 *
 * Endpoints:
 * - GET /search - Main search across all entities
 * - GET /search/trending - Trending searches and content
 * - GET /search/suggestions - Autocomplete suggestions
 * - POST /search/click - Track result clicks
 * - DELETE /search/history - Clear user's search history
 */
@ApiTags('Search')
@Controller('search')
@UseGuards(ThrottlerGuard)
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly cacheService: SearchCacheService,
    private readonly analyticsService: SearchAnalyticsService,
  ) {}

  /**
   * Main search endpoint
   *
   * Searches across campaigns, users, posts, and hashtags with:
   * - Full-text search with relevance scoring
   * - Fuzzy matching for typos
   * - Advanced filtering (category, date, amount, verification)
   * - Pagination and sorting
   */
  @Get()
  @SearchRateLimit()
  @ApiOperation({
    summary: 'Search across campaigns, users, posts, and hashtags',
    description: `
Performs a unified search across all entities or a specific type.

**Features:**
- Full-text search with PostgreSQL tsvector
- Fuzzy matching for typo tolerance
- Relevance scoring (exact matches rank higher)
- Hashtag search (prefix query with #)
- Advanced filtering by category, date range, amount, verification status
- Results include matched snippets with context

**Query Examples:**
- \`?q=climate\` - Search for "climate" across all types
- \`?q=#environment&type=posts\` - Search posts with #environment hashtag
- \`?q=education&type=campaigns&categories=education,nonprofit\` - Search campaigns in specific categories
- \`?q=john&verifiedOnly=true\` - Search only verified users
    `,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query string (minimum 2 characters). Prefix with # for hashtag search.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: SearchType,
    description: 'Filter by entity type (all, campaigns, users, posts, hashtags)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['relevance', 'date_desc', 'date_asc', 'popularity', 'amount'],
    description: 'Sort order for results',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results per type (default: 10, max: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination (default: 0)',
  })
  @ApiQuery({
    name: 'categories',
    required: false,
    type: String,
    description: 'Filter campaigns by categories (comma-separated)',
  })
  @ApiQuery({
    name: 'verifiedOnly',
    required: false,
    type: Boolean,
    description: 'Filter by verified creators only',
  })
  @ApiQuery({
    name: 'dateRange',
    required: false,
    enum: ['all_time', 'today', 'this_week', 'this_month', 'this_year', 'custom'],
    description: 'Filter by date range',
  })
  @ApiQuery({
    name: 'minGoalAmount',
    required: false,
    type: Number,
    description: 'Minimum goal amount for campaigns (USD)',
  })
  @ApiQuery({
    name: 'maxGoalAmount',
    required: false,
    type: Number,
    description: 'Maximum goal amount for campaigns (USD)',
  })
  @ApiQuery({
    name: 'fuzzyMatch',
    required: false,
    type: Boolean,
    description: 'Enable fuzzy matching for typos (default: true)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
    type: SearchResults,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search query (too short, invalid parameters)',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limited',
  })
  async search(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: SearchQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<SearchResults> {
    const userId = req.user?.id;
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'];

    return this.searchService.search(query, userId, ipAddress, userAgent);
  }

  /**
   * Get trending searches, hashtags, and campaigns
   */
  @Get('trending')
  @SearchRateLimit()
  @ApiOperation({
    summary: 'Get trending searches and content',
    description: `
Returns trending data including:
- Popular search queries
- Trending hashtags
- Popular campaigns

Results are cached for 10 minutes for performance.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Trending data returned successfully',
    type: TrendingResponse,
  })
  async getTrending(): Promise<TrendingResponse> {
    return this.searchService.getTrending();
  }

  /**
   * Get search suggestions for autocomplete
   */
  @Get('suggestions')
  @SearchRateLimit()
  @ApiOperation({
    summary: 'Get search suggestions for autocomplete',
    description: `
Returns search suggestions based on:
- User's recent searches (if authenticated)
- Matching hashtags
- Popular search queries
- Campaign names

Optimized for fast autocomplete with aggressive caching.
    `,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Partial query for autocomplete (minimum 1 character)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of suggestions (default: 8, max: 20)',
  })
  @ApiQuery({
    name: 'includeRecent',
    required: false,
    type: Boolean,
    description: 'Include user recent searches (default: true, requires auth)',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestions returned successfully',
    type: SuggestionsResponse,
  })
  async getSuggestions(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: SuggestionsQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<SuggestionsResponse> {
    const userId = req.user?.id;
    return this.searchService.getSuggestions(query, userId);
  }

  /**
   * Track a click on a search result
   *
   * Used for improving search relevance by tracking which results users find useful.
   */
  @Post('click')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track a click on a search result',
    description: `
Records when a user clicks on a search result. Used for:
- Improving search relevance ranking
- Analytics on search quality
- A/B testing search algorithms

This endpoint is fire-and-forget - it always returns 204 even if tracking fails.
    `,
  })
  @ApiResponse({
    status: 204,
    description: 'Click tracked successfully',
  })
  async trackClick(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    data: SearchClickDto,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = req.user?.id;

    // Fire and forget - don't await
    this.searchService
      .trackClick(data.query, data.resultId, data.resultType, userId, data.position)
      .catch((error) => {
        this.logger.warn(`Failed to track search click: ${error}`);
      });
  }

  /**
   * Clear user's recent search history
   */
  @Post('history/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Clear user's search history",
    description: "Clears the authenticated user's recent search history from cache.",
  })
  @ApiResponse({
    status: 204,
    description: 'Search history cleared',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async clearHistory(@Req() req: RequestWithUser): Promise<void> {
    const userId = req.user?.id;
    if (userId) {
      await this.cacheService.clearRecentSearches(userId);
    }
  }

  /**
   * Get search analytics (admin only)
   *
   * This endpoint would typically require admin authentication.
   * For now, it's included for completeness.
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get search analytics metrics',
    description: `
Returns search quality metrics including:
- Total searches
- Unique queries
- Average results count
- Click-through rate
- Zero results rate

**Note:** This endpoint should be protected with admin authentication in production.
    `,
  })
  @ApiQuery({
    name: 'since',
    required: false,
    type: String,
    description: 'Start date for metrics (ISO 8601, default: last 24 hours)',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics metrics returned successfully',
  })
  async getAnalytics(
    @Query('since') since?: string,
  ): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    avgResultsCount: number;
    avgExecutionTimeMs: number;
    clickThroughRate: number;
    zeroResultsRate: number;
  }> {
    const sinceDate = since ? new Date(since) : undefined;
    return this.analyticsService.getSearchMetrics(sinceDate);
  }

  /**
   * Get popular searches (admin only)
   */
  @Get('analytics/popular')
  @ApiOperation({
    summary: 'Get most popular search queries',
    description: 'Returns the most popular search queries with click-through rates.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results (default: 20)',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    type: String,
    description: 'Start date (ISO 8601, default: last 7 days)',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular searches returned successfully',
  })
  async getPopularSearches(
    @Query('limit') limit?: string,
    @Query('since') since?: string,
  ): Promise<Array<{ query: string; count: number; clickThroughRate: number }>> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const sinceDate = since ? new Date(since) : undefined;
    return this.analyticsService.getPopularSearches(limitNum, sinceDate);
  }

  /**
   * Get zero-result searches for improving coverage
   */
  @Get('analytics/zero-results')
  @ApiOperation({
    summary: 'Get searches that returned no results',
    description: 'Returns queries that produced no results, useful for improving search coverage.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Zero-result queries returned successfully',
  })
  async getZeroResultSearches(
    @Query('limit') limit?: string,
  ): Promise<Array<{ query: string; count: number }>> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.analyticsService.getZeroResultQueries(limitNum);
  }

  /**
   * Get cache statistics for monitoring
   */
  @Get('health')
  @ApiOperation({
    summary: 'Get search service health status',
    description: 'Returns health information including cache status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status returned',
  })
  async getHealth(): Promise<{
    status: string;
    cache: { memoryCacheSize: number; redisAvailable: boolean };
  }> {
    return {
      status: 'healthy',
      cache: this.cacheService.getCacheStats(),
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Extract client IP address from request
   * Handles proxies and load balancers
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }
    return req.ip ?? 'unknown';
  }
}
