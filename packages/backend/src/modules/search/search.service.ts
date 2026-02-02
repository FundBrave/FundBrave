import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  SearchType,
  SearchSortBy,
  DateRangeFilter,
  SearchResults,
  SearchCampaignResult,
  SearchUserResult,
  SearchPostResult,
  SearchHashtagResult,
  SearchQueryDto,
  TrendingResponse,
  TrendingSearchItem,
  SuggestionsResponse,
  SearchSuggestion,
  SuggestionsQueryDto,
} from './dto';
import { SearchCacheService } from './services/search-cache.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import {
  InvalidSearchQueryException,
  SearchDatabaseException,
} from './exceptions';

/**
 * Maximum content length for search result snippets
 */
const SNIPPET_MAX_LENGTH = 200;

/**
 * Characters to strip from search queries for safety
 */
const UNSAFE_CHARS_REGEX = /[<>{}[\]\\\/;`'"]/g;

/**
 * Service for unified search across campaigns, users, posts, and hashtags
 *
 * Features:
 * - Full-text search with PostgreSQL tsvector
 * - Fuzzy matching with trigram similarity
 * - Relevance scoring based on multiple factors
 * - Advanced filtering by category, date, amount, verification status
 * - Hashtag extraction and search
 * - Caching with Redis/memory fallback
 * - Analytics tracking
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: SearchCacheService,
    private readonly analyticsService: SearchAnalyticsService,
  ) {}

  // ==================== MAIN SEARCH ====================

  /**
   * Perform a comprehensive search across all entities or a specific type
   *
   * @param query - Search query DTO with all parameters
   * @param userId - Optional user ID for personalization and analytics
   * @param ipAddress - Optional IP for rate limiting and analytics
   * @param userAgent - Optional user agent for analytics
   */
  async search(
    query: SearchQueryDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SearchResults> {
    const startTime = Date.now();

    // Validate and sanitize query
    const sanitizedQuery = this.sanitizeQuery(query.q);
    if (!sanitizedQuery || sanitizedQuery.length < 2) {
      return this.emptyResults(0);
    }

    // Build filters object for cache key
    const filters = this.buildFiltersObject(query);

    // Check cache first
    const cachedResults = await this.cacheService.getCachedSearchResults(
      sanitizedQuery,
      query.type ?? SearchType.ALL,
      query.sortBy ?? SearchSortBy.RELEVANCE,
      query.limit ?? 10,
      query.offset ?? 0,
      filters,
    );

    if (cachedResults) {
      this.logger.debug(`Cache hit for search: "${sanitizedQuery}"`);
      // Still log analytics for cache hits
      this.logSearchAsync(
        sanitizedQuery,
        query.type ?? SearchType.ALL,
        this.getTotalResults(cachedResults),
        filters,
        Date.now() - startTime,
        userId,
        ipAddress,
        userAgent,
      );
      return cachedResults;
    }

    // Perform search
    try {
      const results = await this.performSearch(sanitizedQuery, query);
      const executionTime = Date.now() - startTime;
      results.executionTimeMs = executionTime;

      // Add suggestions if no results
      if (this.getTotalResults(results) === 0) {
        results.didYouMean = await this.findSimilarQuery(sanitizedQuery);
      }

      // Cache results
      await this.cacheService.setCachedSearchResults(
        sanitizedQuery,
        query.type ?? SearchType.ALL,
        query.sortBy ?? SearchSortBy.RELEVANCE,
        query.limit ?? 10,
        query.offset ?? 0,
        filters,
        results,
      );

      // Log analytics
      this.logSearchAsync(
        sanitizedQuery,
        query.type ?? SearchType.ALL,
        this.getTotalResults(results),
        filters,
        executionTime,
        userId,
        ipAddress,
        userAgent,
      );

      // Add to user's recent searches
      if (userId) {
        this.cacheService.addRecentSearch(userId, sanitizedQuery).catch(() => {});
      }

      this.logger.debug(
        `Search for "${sanitizedQuery}" completed in ${executionTime}ms with ${this.getTotalResults(results)} results`,
      );

      return results;
    } catch (error) {
      this.logger.error(`Search failed: ${error}`);
      throw new SearchDatabaseException('search', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Perform the actual search across entities
   */
  private async performSearch(
    query: string,
    params: SearchQueryDto,
  ): Promise<SearchResults> {
    const results = this.emptyResults(0);
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;
    const type = params.type ?? SearchType.ALL;

    // Detect if query is a hashtag search
    const isHashtagSearch = query.startsWith('#');
    const hashtagQuery = isHashtagSearch ? query.substring(1) : null;

    // Execute searches in parallel based on type
    const searchPromises: Promise<void>[] = [];

    if (type === SearchType.ALL || type === SearchType.CAMPAIGNS) {
      searchPromises.push(
        this.searchCampaigns(query, params, limit, offset).then((result) => {
          results.campaigns = result.campaigns;
          results.totalCampaigns = result.total;
        }),
      );
    }

    if (type === SearchType.ALL || type === SearchType.USERS) {
      searchPromises.push(
        this.searchUsers(query, params, limit, offset).then((result) => {
          results.users = result.users;
          results.totalUsers = result.total;
        }),
      );
    }

    if (type === SearchType.ALL || type === SearchType.POSTS) {
      searchPromises.push(
        this.searchPosts(query, params, limit, offset).then((result) => {
          results.posts = result.posts;
          results.totalPosts = result.total;
        }),
      );
    }

    if (type === SearchType.ALL || type === SearchType.HASHTAGS || isHashtagSearch) {
      searchPromises.push(
        this.searchHashtags(hashtagQuery ?? query, limit, offset).then((result) => {
          results.hashtags = result.hashtags;
          results.totalHashtags = result.total;
        }),
      );
    }

    await Promise.all(searchPromises);

    return results;
  }

  // ==================== ENTITY SEARCHES ====================

  /**
   * Search campaigns with full-text search and advanced filtering
   */
  private async searchCampaigns(
    query: string,
    params: SearchQueryDto,
    limit: number,
    offset: number,
  ): Promise<{ campaigns: SearchCampaignResult[]; total: number }> {
    const dateFilter = this.getDateFilter(params.dateRange, params.dateFrom, params.dateTo);
    const searchTerms = this.buildSearchTerms(query);

    // Build where clause
    const whereConditions: Prisma.Sql[] = [
      params.activeOnly !== false ? Prisma.sql`f."isActive" = true` : Prisma.sql`true`,
    ];

    // Category filter
    if (params.categories && params.categories.length > 0) {
      whereConditions.push(
        Prisma.sql`f."categories" && ${params.categories}::text[]`,
      );
    }

    // Date filter
    if (dateFilter) {
      whereConditions.push(Prisma.sql`f."createdAt" >= ${dateFilter}`);
    }

    // Amount filters
    if (params.minGoalAmount !== undefined) {
      whereConditions.push(
        Prisma.sql`CAST(f."goalAmount" AS NUMERIC) >= ${params.minGoalAmount}`,
      );
    }
    if (params.maxGoalAmount !== undefined) {
      whereConditions.push(
        Prisma.sql`CAST(f."goalAmount" AS NUMERIC) <= ${params.maxGoalAmount}`,
      );
    }

    // Verified creator filter
    if (params.verifiedOnly) {
      whereConditions.push(Prisma.sql`u."isVerifiedCreator" = true`);
    }

    const whereClause = Prisma.sql`${Prisma.join(whereConditions, ' AND ')}`;

    // Build order by based on sort option
    const orderBy = this.getCampaignOrderBy(params.sortBy ?? SearchSortBy.RELEVANCE);

    // Execute search with full-text and trigram matching
    const campaigns = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        images: string[];
        goal_amount: string;
        raised_amount: bigint;
        categories: string[];
        deadline: Date;
        is_featured: boolean;
        donors_count: number;
        creator_id: string;
        creator_username: string | null;
        creator_display_name: string | null;
        creator_avatar_url: string | null;
        creator_is_verified: boolean;
        relevance_score: number;
      }>
    >`
      SELECT
        f."id",
        f."name",
        f."description",
        f."images",
        f."goalAmount" as goal_amount,
        f."raisedAmount" as raised_amount,
        f."categories",
        f."deadline",
        f."isFeatured" as is_featured,
        f."donorsCount" as donors_count,
        u."id" as creator_id,
        u."username" as creator_username,
        u."displayName" as creator_display_name,
        u."avatarUrl" as creator_avatar_url,
        u."isVerifiedCreator" as creator_is_verified,
        (
          COALESCE(ts_rank(to_tsvector('english', f."name" || ' ' || COALESCE(f."description", '')), plainto_tsquery('english', ${query})), 0) * 100 +
          COALESCE(similarity(f."name", ${query}), 0) * 50 +
          CASE WHEN lower(f."name") = lower(${query}) THEN 100 ELSE 0 END +
          CASE WHEN lower(f."name") LIKE lower(${query + '%'}) THEN 50 ELSE 0 END +
          CASE WHEN f."isFeatured" THEN 10 ELSE 0 END +
          LEAST(f."donorsCount", 100) * 0.1
        ) as relevance_score
      FROM "fundraisers" f
      JOIN "users" u ON f."creatorId" = u."id"
      WHERE ${whereClause}
        AND (
          to_tsvector('english', f."name" || ' ' || COALESCE(f."description", '')) @@ plainto_tsquery('english', ${query})
          OR similarity(f."name", ${query}) > 0.1
          OR lower(f."name") LIKE lower(${'%' + query + '%'})
          OR f."categories" && ARRAY[lower(${query})]::text[]
        )
      ORDER BY ${orderBy}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "fundraisers" f
      JOIN "users" u ON f."creatorId" = u."id"
      WHERE ${whereClause}
        AND (
          to_tsvector('english', f."name" || ' ' || COALESCE(f."description", '')) @@ plainto_tsquery('english', ${query})
          OR similarity(f."name", ${query}) > 0.1
          OR lower(f."name") LIKE lower(${'%' + query + '%'})
          OR f."categories" && ARRAY[lower(${query})]::text[]
        )
    `;

    return {
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        description: this.truncateText(c.description, SNIPPET_MAX_LENGTH),
        images: c.images,
        goalAmount: c.goal_amount,
        raisedAmount: c.raised_amount.toString(),
        category: c.categories[0] ?? 'general',
        categories: c.categories,
        creator: {
          id: c.creator_id,
          username: c.creator_username ?? undefined,
          displayName: c.creator_display_name ?? undefined,
          avatarUrl: c.creator_avatar_url ?? undefined,
          isVerifiedCreator: c.creator_is_verified,
        },
        deadline: c.deadline,
        isFeatured: c.is_featured,
        donorsCount: c.donors_count,
        relevanceScore: Math.min(Math.round(c.relevance_score), 100),
        matchedSnippet: this.highlightMatch(c.description ?? '', query),
      })),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  /**
   * Search users with full-text search
   */
  private async searchUsers(
    query: string,
    params: SearchQueryDto,
    limit: number,
    offset: number,
  ): Promise<{ users: SearchUserResult[]; total: number }> {
    const whereConditions: Prisma.Sql[] = [
      Prisma.sql`u."isActive" = true`,
      Prisma.sql`u."isSuspended" = false`,
    ];

    // Verified only filter
    if (params.verifiedOnly) {
      whereConditions.push(Prisma.sql`u."isVerifiedCreator" = true`);
    }

    const whereClause = Prisma.sql`${Prisma.join(whereConditions, ' AND ')}`;

    // Check if query looks like a wallet address
    const isWalletSearch = query.startsWith('0x') && query.length >= 10;

    const users = await this.prisma.$queryRaw<
      Array<{
        id: string;
        wallet_address: string;
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
        bio: string | null;
        is_verified_creator: boolean;
        followers_count: number;
        fundraisers_count: number;
        relevance_score: number;
      }>
    >`
      SELECT
        u."id",
        u."walletAddress" as wallet_address,
        u."username",
        u."displayName" as display_name,
        u."avatarUrl" as avatar_url,
        u."bio",
        u."isVerifiedCreator" as is_verified_creator,
        u."followersCount" as followers_count,
        u."fundraisersCount" as fundraisers_count,
        (
          CASE WHEN lower(u."username") = lower(${query}) THEN 100 ELSE 0 END +
          CASE WHEN lower(u."displayName") = lower(${query}) THEN 100 ELSE 0 END +
          COALESCE(similarity(COALESCE(u."username", ''), ${query}), 0) * 50 +
          COALESCE(similarity(COALESCE(u."displayName", ''), ${query}), 0) * 50 +
          CASE WHEN u."isVerifiedCreator" THEN 20 ELSE 0 END +
          LEAST(u."followersCount", 10000) * 0.001
        ) as relevance_score
      FROM "users" u
      WHERE ${whereClause}
        AND (
          ${isWalletSearch
            ? Prisma.sql`lower(u."walletAddress") LIKE lower(${query + '%'})`
            : Prisma.sql`
              similarity(COALESCE(u."username", ''), ${query}) > 0.1
              OR similarity(COALESCE(u."displayName", ''), ${query}) > 0.1
              OR lower(u."username") LIKE lower(${'%' + query + '%'})
              OR lower(u."displayName") LIKE lower(${'%' + query + '%'})
            `
          }
        )
      ORDER BY relevance_score DESC, u."followersCount" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "users" u
      WHERE ${whereClause}
        AND (
          ${isWalletSearch
            ? Prisma.sql`lower(u."walletAddress") LIKE lower(${query + '%'})`
            : Prisma.sql`
              similarity(COALESCE(u."username", ''), ${query}) > 0.1
              OR similarity(COALESCE(u."displayName", ''), ${query}) > 0.1
              OR lower(u."username") LIKE lower(${'%' + query + '%'})
              OR lower(u."displayName") LIKE lower(${'%' + query + '%'})
            `
          }
        )
    `;

    return {
      users: users.map((u) => ({
        id: u.id,
        walletAddress: u.wallet_address,
        username: u.username ?? undefined,
        displayName: u.display_name ?? undefined,
        avatarUrl: u.avatar_url ?? undefined,
        bio: this.truncateText(u.bio, SNIPPET_MAX_LENGTH),
        isVerifiedCreator: u.is_verified_creator,
        followersCount: u.followers_count,
        fundraisersCount: u.fundraisers_count,
        relevanceScore: Math.min(Math.round(u.relevance_score), 100),
        matchedSnippet: this.highlightMatch(u.bio ?? '', query),
      })),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  /**
   * Search posts with full-text search and hashtag support
   */
  private async searchPosts(
    query: string,
    params: SearchQueryDto,
    limit: number,
    offset: number,
  ): Promise<{ posts: SearchPostResult[]; total: number }> {
    const dateFilter = this.getDateFilter(params.dateRange, params.dateFrom, params.dateTo);

    // Check if searching for hashtag
    const isHashtagSearch = query.startsWith('#');
    const hashtagQuery = isHashtagSearch ? query.substring(1).toLowerCase() : null;

    const whereConditions: Prisma.Sql[] = [Prisma.sql`p."visibility" = 'PUBLIC'`];

    if (dateFilter) {
      whereConditions.push(Prisma.sql`p."createdAt" >= ${dateFilter}`);
    }

    if (params.verifiedOnly) {
      whereConditions.push(Prisma.sql`u."isVerifiedCreator" = true`);
    }

    const whereClause = Prisma.sql`${Prisma.join(whereConditions, ' AND ')}`;

    const posts = await this.prisma.$queryRaw<
      Array<{
        id: string;
        content: string | null;
        media_urls: string[];
        likes_count: number;
        reposts_count: number;
        comments_count: number;
        created_at: Date;
        author_id: string;
        author_username: string | null;
        author_display_name: string | null;
        author_avatar_url: string | null;
        author_is_verified: boolean;
        relevance_score: number;
        hashtags: string[];
      }>
    >`
      SELECT
        p."id",
        p."content",
        p."mediaUrls" as media_urls,
        p."likesCount" as likes_count,
        p."repostsCount" as reposts_count,
        p."replyCount" as comments_count,
        p."createdAt" as created_at,
        u."id" as author_id,
        u."username" as author_username,
        u."displayName" as author_display_name,
        u."avatarUrl" as author_avatar_url,
        u."isVerifiedCreator" as author_is_verified,
        (
          COALESCE(ts_rank(to_tsvector('english', COALESCE(p."content", '')), plainto_tsquery('english', ${isHashtagSearch ? hashtagQuery : query})), 0) * 100 +
          p."likesCount" * 0.1 +
          p."engagementScore" * 10
        ) as relevance_score,
        COALESCE(
          (SELECT array_agg(h."tag") FROM "post_hashtags" ph JOIN "hashtags" h ON ph."hashtagId" = h."id" WHERE ph."postId" = p."id"),
          ARRAY[]::text[]
        ) as hashtags
      FROM "posts" p
      JOIN "users" u ON p."authorId" = u."id"
      WHERE ${whereClause}
        AND (
          ${isHashtagSearch
            ? Prisma.sql`
              EXISTS (
                SELECT 1 FROM "post_hashtags" ph
                JOIN "hashtags" h ON ph."hashtagId" = h."id"
                WHERE ph."postId" = p."id"
                AND lower(h."tag") LIKE lower(${hashtagQuery + '%'})
              )
            `
            : Prisma.sql`
              to_tsvector('english', COALESCE(p."content", '')) @@ plainto_tsquery('english', ${query})
              OR lower(p."content") LIKE lower(${'%' + query + '%'})
            `
          }
        )
      ORDER BY ${this.getPostOrderBy(params.sortBy ?? SearchSortBy.RELEVANCE)}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "posts" p
      JOIN "users" u ON p."authorId" = u."id"
      WHERE ${whereClause}
        AND (
          ${isHashtagSearch
            ? Prisma.sql`
              EXISTS (
                SELECT 1 FROM "post_hashtags" ph
                JOIN "hashtags" h ON ph."hashtagId" = h."id"
                WHERE ph."postId" = p."id"
                AND lower(h."tag") LIKE lower(${hashtagQuery + '%'})
              )
            `
            : Prisma.sql`
              to_tsvector('english', COALESCE(p."content", '')) @@ plainto_tsquery('english', ${query})
              OR lower(p."content") LIKE lower(${'%' + query + '%'})
            `
          }
        )
    `;

    return {
      posts: posts.map((p) => ({
        id: p.id,
        content: this.truncateText(p.content, SNIPPET_MAX_LENGTH) ?? '',
        author: {
          id: p.author_id,
          username: p.author_username ?? undefined,
          displayName: p.author_display_name ?? undefined,
          avatarUrl: p.author_avatar_url ?? undefined,
          isVerifiedCreator: p.author_is_verified,
        },
        likesCount: p.likes_count,
        commentsCount: p.comments_count,
        repostsCount: p.reposts_count,
        mediaUrls: p.media_urls,
        createdAt: p.created_at,
        relevanceScore: Math.min(Math.round(p.relevance_score), 100),
        matchedSnippet: this.highlightMatch(p.content ?? '', query),
        hashtags: p.hashtags,
      })),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  /**
   * Search hashtags with fuzzy matching
   */
  private async searchHashtags(
    query: string,
    limit: number,
    offset: number,
  ): Promise<{ hashtags: SearchHashtagResult[]; total: number }> {
    // Remove # if present
    const cleanQuery = query.startsWith('#') ? query.substring(1) : query;

    const hashtags = await this.prisma.$queryRaw<
      Array<{
        id: string;
        tag: string;
        usage_count: number;
        relevance_score: number;
        is_trending: boolean;
      }>
    >`
      SELECT
        h."id",
        h."tag",
        h."usageCount" as usage_count,
        (
          CASE WHEN lower(h."tag") = lower(${cleanQuery}) THEN 100 ELSE 0 END +
          COALESCE(similarity(h."tag", ${cleanQuery}), 0) * 50 +
          CASE WHEN lower(h."tag") LIKE lower(${cleanQuery + '%'}) THEN 30 ELSE 0 END +
          LEAST(h."usageCount", 1000) * 0.01
        ) as relevance_score,
        EXISTS (
          SELECT 1 FROM "trending" t
          WHERE t."type" = 'hashtag' AND t."value" = h."tag"
        ) as is_trending
      FROM "hashtags" h
      WHERE
        similarity(h."tag", ${cleanQuery}) > 0.1
        OR lower(h."tag") LIKE lower(${'%' + cleanQuery + '%'})
      ORDER BY relevance_score DESC, h."usageCount" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "hashtags" h
      WHERE
        similarity(h."tag", ${cleanQuery}) > 0.1
        OR lower(h."tag") LIKE lower(${'%' + cleanQuery + '%'})
    `;

    return {
      hashtags: hashtags.map((h) => ({
        id: h.id,
        tag: h.tag,
        postsCount: h.usage_count,
        relevanceScore: Math.min(Math.round(h.relevance_score), 100),
        isTrending: h.is_trending,
      })),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  // ==================== TRENDING ====================

  /**
   * Get trending searches, hashtags, and campaigns
   */
  async getTrending(): Promise<TrendingResponse> {
    // Check cache first
    const cached = await this.cacheService.getCachedTrending();
    if (cached) {
      return cached;
    }

    try {
      // Get trending hashtags
      const trendingHashtags = await this.prisma.trending.findMany({
        where: { type: 'hashtag', period: '24h' },
        orderBy: { score: 'desc' },
        take: 10,
      });

      // Get popular campaigns
      const popularCampaigns = await this.prisma.fundraiser.findMany({
        where: { isActive: true },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedCreator: true,
            },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { donorsCount: 'desc' }],
        take: 5,
      });

      // Get popular search queries from cache
      const popularQueries = await this.cacheService.getPopularQueries(10);

      const response: TrendingResponse = {
        trending: popularQueries.map((q, index) => ({
          term: q.query,
          searchCount: q.count,
          type: 'query' as const,
          rankChange: 0, // Could calculate from historical data
        })),
        popularHashtags: trendingHashtags.map((h) => ({
          id: h.id,
          tag: h.value,
          postsCount: h.postsCount,
          relevanceScore: Math.round(h.score),
          isTrending: true,
        })),
        popularCampaigns: popularCampaigns.map((c) => ({
          id: c.id,
          name: c.name,
          description: this.truncateText(c.description, 100),
          images: c.images,
          goalAmount: c.goalAmount,
          raisedAmount: c.raisedAmount.toString(),
          category: c.categories[0] ?? 'general',
          categories: c.categories,
          creator: {
            id: c.creator.id,
            username: c.creator.username ?? undefined,
            displayName: c.creator.displayName ?? undefined,
            avatarUrl: c.creator.avatarUrl ?? undefined,
            isVerifiedCreator: c.creator.isVerifiedCreator,
          },
          deadline: c.deadline,
          isFeatured: c.isFeatured,
          donorsCount: c.donorsCount,
          relevanceScore: 100,
        })),
        cachedAt: new Date(),
      };

      // Cache the response
      await this.cacheService.setCachedTrending(response);

      return response;
    } catch (error) {
      this.logger.error(`Failed to get trending: ${error}`);
      throw new SearchDatabaseException('trending', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // ==================== SUGGESTIONS ====================

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(
    query: SuggestionsQueryDto,
    userId?: string,
  ): Promise<SuggestionsResponse> {
    const prefix = query.q.toLowerCase().trim();
    const limit = query.limit ?? 8;

    // Check cache
    const cached = await this.cacheService.getCachedSuggestions(prefix);
    if (cached && !query.includeRecent) {
      return cached;
    }

    const suggestions: SearchSuggestion[] = [];

    try {
      // Add user's recent searches if requested
      if (query.includeRecent && userId) {
        const recentSearches = await this.cacheService.getRecentSearches(userId, 3);
        for (const recent of recentSearches) {
          if (recent.startsWith(prefix)) {
            suggestions.push({
              term: recent,
              type: 'recent',
              icon: 'clock',
            });
          }
        }
      }

      // Get matching hashtags
      if (prefix.startsWith('#') || prefix.length >= 2) {
        const hashtagPrefix = prefix.startsWith('#') ? prefix.substring(1) : prefix;
        const hashtags = await this.prisma.hashtag.findMany({
          where: {
            tag: { startsWith: hashtagPrefix, mode: 'insensitive' },
          },
          orderBy: { usageCount: 'desc' },
          take: 3,
        });

        for (const hashtag of hashtags) {
          suggestions.push({
            term: `#${hashtag.tag}`,
            type: 'hashtag',
            icon: 'hash',
            count: hashtag.usageCount,
          });
        }
      }

      // Get popular matching queries from suggestions table
      const popularSuggestions = await this.prisma.$queryRaw<
        Array<{ term: string; search_count: number }>
      >`
        SELECT term, search_count
        FROM search_suggestions
        WHERE term LIKE ${prefix + '%'}
        ORDER BY search_count DESC
        LIMIT ${limit - suggestions.length}
      `;

      for (const popular of popularSuggestions) {
        if (!suggestions.some((s) => s.term === popular.term)) {
          suggestions.push({
            term: popular.term,
            type: 'popular',
            icon: 'trending',
            count: popular.search_count,
          });
        }
      }

      // Get autocomplete from campaign names if we need more
      if (suggestions.length < limit) {
        const campaigns = await this.prisma.fundraiser.findMany({
          where: {
            isActive: true,
            name: { startsWith: prefix, mode: 'insensitive' },
          },
          select: { name: true },
          take: limit - suggestions.length,
        });

        for (const campaign of campaigns) {
          if (!suggestions.some((s) => s.term.toLowerCase() === campaign.name.toLowerCase())) {
            suggestions.push({
              term: campaign.name,
              type: 'autocomplete',
              icon: 'campaign',
            });
          }
        }
      }

      const response: SuggestionsResponse = {
        suggestions: suggestions.slice(0, limit),
        recentSearches: userId
          ? await this.cacheService.getRecentSearches(userId, 5)
          : undefined,
      };

      // Cache suggestions (without recent searches)
      if (!query.includeRecent) {
        await this.cacheService.setCachedSuggestions(prefix, response);
      }

      return response;
    } catch (error) {
      this.logger.error(`Failed to get suggestions: ${error}`);
      return { suggestions: [] };
    }
  }

  // ==================== CLICK TRACKING ====================

  /**
   * Track a click on a search result
   */
  async trackClick(
    query: string,
    resultId: string,
    resultType: SearchType,
    userId?: string,
    position?: number,
  ): Promise<void> {
    await this.analyticsService.logSearchClick({
      query,
      resultId,
      resultType,
      userId,
      position,
    });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Sanitize search query to prevent injection
   */
  private sanitizeQuery(query: string): string {
    if (!query) return '';

    return query
      .trim()
      .replace(UNSAFE_CHARS_REGEX, '')
      .replace(/\s+/g, ' ')
      .substring(0, 200);
  }

  /**
   * Build search terms for full-text search
   */
  private buildSearchTerms(query: string): string {
    return query
      .split(/\s+/)
      .filter((term) => term.length >= 2)
      .map((term) => term.replace(/[^\w]/g, ''))
      .join(' & ');
  }

  /**
   * Build filters object for cache key
   */
  private buildFiltersObject(params: SearchQueryDto): Record<string, unknown> {
    return {
      categories: params.categories,
      verifiedOnly: params.verifiedOnly,
      dateRange: params.dateRange,
      dateFrom: params.dateFrom?.toISOString(),
      dateTo: params.dateTo?.toISOString(),
      minGoalAmount: params.minGoalAmount,
      maxGoalAmount: params.maxGoalAmount,
      activeOnly: params.activeOnly,
      fuzzyMatch: params.fuzzyMatch,
    };
  }

  /**
   * Get date filter based on date range
   */
  private getDateFilter(
    range?: DateRangeFilter,
    from?: Date,
    to?: Date,
  ): Date | null {
    const now = new Date();

    switch (range) {
      case DateRangeFilter.TODAY:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case DateRangeFilter.THIS_WEEK:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case DateRangeFilter.THIS_MONTH:
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case DateRangeFilter.THIS_YEAR:
        return new Date(now.getFullYear(), 0, 1);
      case DateRangeFilter.CUSTOM:
        return from ?? null;
      default:
        return null;
    }
  }

  /**
   * Get order by clause for campaigns
   */
  private getCampaignOrderBy(sortBy: SearchSortBy): Prisma.Sql {
    switch (sortBy) {
      case SearchSortBy.DATE_DESC:
        return Prisma.sql`f."createdAt" DESC`;
      case SearchSortBy.DATE_ASC:
        return Prisma.sql`f."createdAt" ASC`;
      case SearchSortBy.POPULARITY:
        return Prisma.sql`f."donorsCount" DESC, f."raisedAmount" DESC`;
      case SearchSortBy.AMOUNT:
        return Prisma.sql`f."raisedAmount" DESC`;
      case SearchSortBy.RELEVANCE:
      default:
        return Prisma.sql`relevance_score DESC, f."isFeatured" DESC, f."donorsCount" DESC`;
    }
  }

  /**
   * Get order by clause for posts
   */
  private getPostOrderBy(sortBy: SearchSortBy): Prisma.Sql {
    switch (sortBy) {
      case SearchSortBy.DATE_DESC:
        return Prisma.sql`p."createdAt" DESC`;
      case SearchSortBy.DATE_ASC:
        return Prisma.sql`p."createdAt" ASC`;
      case SearchSortBy.POPULARITY:
        return Prisma.sql`p."likesCount" DESC, p."repostsCount" DESC`;
      case SearchSortBy.RELEVANCE:
      default:
        return Prisma.sql`relevance_score DESC, p."createdAt" DESC`;
    }
  }

  /**
   * Truncate text with ellipsis
   */
  private truncateText(text: string | null, maxLength: number): string | undefined {
    if (!text) return undefined;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Highlight search term in text
   */
  private highlightMatch(text: string, query: string): string | undefined {
    if (!text || !query) return undefined;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return undefined;

    // Extract context around the match
    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + query.length + 40);

    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Find similar query for "did you mean" feature
   */
  private async findSimilarQuery(query: string): Promise<string | undefined> {
    try {
      // Search in popular suggestions
      const similar = await this.prisma.$queryRaw<Array<{ term: string; sim: number }>>`
        SELECT term, similarity(term, ${query}) as sim
        FROM search_suggestions
        WHERE similarity(term, ${query}) > 0.3
        ORDER BY sim DESC
        LIMIT 1
      `;

      if (similar.length > 0 && similar[0].term !== query.toLowerCase()) {
        return similar[0].term;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Create empty results object
   */
  private emptyResults(executionTimeMs: number): SearchResults {
    return {
      campaigns: [],
      users: [],
      posts: [],
      hashtags: [],
      totalCampaigns: 0,
      totalUsers: 0,
      totalPosts: 0,
      totalHashtags: 0,
      executionTimeMs,
    };
  }

  /**
   * Get total results count
   */
  private getTotalResults(results: SearchResults): number {
    return (
      results.totalCampaigns +
      results.totalUsers +
      results.totalPosts +
      results.totalHashtags
    );
  }

  /**
   * Log search asynchronously (fire and forget)
   */
  private logSearchAsync(
    query: string,
    type: SearchType,
    resultsCount: number,
    filters: Record<string, unknown>,
    executionTimeMs: number,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): void {
    this.analyticsService
      .logSearchQuery({
        query,
        normalizedQuery: query.toLowerCase().trim(),
        userId,
        resultsCount,
        searchType: type,
        filters,
        executionTimeMs,
        ipAddress,
        userAgent,
      })
      .catch((error) => {
        this.logger.warn(`Failed to log search analytics: ${error}`);
      });
  }
}
