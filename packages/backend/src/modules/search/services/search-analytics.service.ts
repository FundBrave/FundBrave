import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SearchType } from '../dto';
import { SearchCacheService } from './search-cache.service';

/**
 * Search query log entry for analytics
 */
interface SearchQueryLog {
  query: string;
  normalizedQuery: string;
  userId?: string;
  resultsCount: number;
  searchType: SearchType;
  filters?: Record<string, unknown>;
  executionTimeMs: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Click tracking data
 */
interface SearchClickLog {
  query: string;
  resultId: string;
  resultType: SearchType;
  position?: number;
  userId?: string;
}

/**
 * Service for tracking and analyzing search behavior
 *
 * This service provides:
 * - Search query logging for analytics
 * - Click-through tracking for relevance improvement
 * - Popular search term tracking
 * - Search quality metrics
 */
@Injectable()
export class SearchAnalyticsService {
  private readonly logger = new Logger(SearchAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: SearchCacheService,
  ) {}

  // ==================== QUERY LOGGING ====================

  /**
   * Log a search query for analytics
   *
   * This runs asynchronously to not block the search response
   */
  async logSearchQuery(data: SearchQueryLog): Promise<void> {
    try {
      // Normalize the query for aggregation
      const normalizedQuery = this.normalizeQuery(data.query);

      // Log to database (fire and forget pattern)
      this.logToDatabase({
        ...data,
        normalizedQuery,
      }).catch((error) => {
        this.logger.warn(`Failed to log search query to database: ${error}`);
      });

      // Update popularity in cache
      this.cacheService.incrementSearchCount(normalizedQuery).catch((error) => {
        this.logger.warn(`Failed to increment search count: ${error}`);
      });

      // Update search suggestions
      this.updateSearchSuggestions(normalizedQuery, data.resultsCount).catch((error) => {
        this.logger.warn(`Failed to update search suggestions: ${error}`);
      });
    } catch (error) {
      // Never let analytics errors affect the main search flow
      this.logger.error(`Search analytics error: ${error}`);
    }
  }

  /**
   * Log search query to database
   */
  private async logToDatabase(data: SearchQueryLog): Promise<void> {
    // Using raw SQL for the custom search_queries table
    await this.prisma.$executeRaw`
      INSERT INTO search_queries (
        query,
        normalized_query,
        user_id,
        results_count,
        search_type,
        filters,
        execution_time_ms,
        ip_address,
        user_agent
      ) VALUES (
        ${data.query},
        ${data.normalizedQuery},
        ${data.userId ?? null}::uuid,
        ${data.resultsCount},
        ${data.searchType},
        ${data.filters ? JSON.stringify(data.filters) : null}::jsonb,
        ${data.executionTimeMs},
        ${data.ipAddress ?? null},
        ${data.userAgent ?? null}
      )
    `;
  }

  /**
   * Update search suggestions based on query popularity
   */
  private async updateSearchSuggestions(
    normalizedQuery: string,
    resultsCount: number,
  ): Promise<void> {
    // Only track queries that returned results
    if (resultsCount === 0) return;

    // Only track meaningful queries (min 3 characters)
    if (normalizedQuery.length < 3) return;

    await this.prisma.$executeRaw`
      INSERT INTO search_suggestions (term, search_count, last_searched_at)
      VALUES (${normalizedQuery}, 1, NOW())
      ON CONFLICT (term) DO UPDATE SET
        search_count = search_suggestions.search_count + 1,
        last_searched_at = NOW(),
        updated_at = NOW()
    `;
  }

  // ==================== CLICK TRACKING ====================

  /**
   * Log a click on a search result
   *
   * This helps improve search relevance by tracking which results users find useful
   */
  async logSearchClick(data: SearchClickLog): Promise<void> {
    try {
      const normalizedQuery = this.normalizeQuery(data.query);

      await this.prisma.$executeRaw`
        UPDATE search_queries
        SET clicked_result_id = ${data.resultId},
            clicked_result_type = ${data.resultType}
        WHERE normalized_query = ${normalizedQuery}
          AND (user_id = ${data.userId ?? null}::uuid OR user_id IS NULL)
        ORDER BY created_at DESC
        LIMIT 1
      `;

      this.logger.debug(
        `Logged search click: query="${data.query}" result=${data.resultType}:${data.resultId}`,
      );
    } catch (error) {
      this.logger.warn(`Failed to log search click: ${error}`);
    }
  }

  // ==================== ANALYTICS QUERIES ====================

  /**
   * Get popular search queries for a time period
   */
  async getPopularSearches(
    limit: number = 20,
    since?: Date,
  ): Promise<Array<{ query: string; count: number; clickThroughRate: number }>> {
    const sinceDate = since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

    const results = await this.prisma.$queryRaw<
      Array<{ normalized_query: string; search_count: number; ctr: number }>
    >`
      SELECT
        normalized_query,
        COUNT(*) as search_count,
        COUNT(clicked_result_id)::float / NULLIF(COUNT(*), 0) as ctr
      FROM search_queries
      WHERE created_at >= ${sinceDate}
      GROUP BY normalized_query
      ORDER BY search_count DESC
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      query: r.normalized_query,
      count: Number(r.search_count),
      clickThroughRate: Number(r.ctr) || 0,
    }));
  }

  /**
   * Get search quality metrics
   */
  async getSearchMetrics(since?: Date): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    avgResultsCount: number;
    avgExecutionTimeMs: number;
    clickThroughRate: number;
    zeroResultsRate: number;
  }> {
    const sinceDate = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    const metrics = await this.prisma.$queryRaw<
      Array<{
        total_searches: number;
        unique_queries: number;
        avg_results: number;
        avg_time: number;
        ctr: number;
        zero_results_rate: number;
      }>
    >`
      SELECT
        COUNT(*) as total_searches,
        COUNT(DISTINCT normalized_query) as unique_queries,
        AVG(results_count) as avg_results,
        AVG(execution_time_ms) as avg_time,
        COUNT(clicked_result_id)::float / NULLIF(COUNT(*), 0) as ctr,
        COUNT(*) FILTER (WHERE results_count = 0)::float / NULLIF(COUNT(*), 0) as zero_results_rate
      FROM search_queries
      WHERE created_at >= ${sinceDate}
    `;

    const m = metrics[0] || {
      total_searches: 0,
      unique_queries: 0,
      avg_results: 0,
      avg_time: 0,
      ctr: 0,
      zero_results_rate: 0,
    };

    return {
      totalSearches: Number(m.total_searches),
      uniqueQueries: Number(m.unique_queries),
      avgResultsCount: Number(m.avg_results) || 0,
      avgExecutionTimeMs: Number(m.avg_time) || 0,
      clickThroughRate: Number(m.ctr) || 0,
      zeroResultsRate: Number(m.zero_results_rate) || 0,
    };
  }

  /**
   * Get queries with zero results (for improving search coverage)
   */
  async getZeroResultQueries(
    limit: number = 50,
    since?: Date,
  ): Promise<Array<{ query: string; count: number }>> {
    const sinceDate = since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await this.prisma.$queryRaw<
      Array<{ normalized_query: string; query_count: number }>
    >`
      SELECT
        normalized_query,
        COUNT(*) as query_count
      FROM search_queries
      WHERE created_at >= ${sinceDate}
        AND results_count = 0
      GROUP BY normalized_query
      ORDER BY query_count DESC
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      query: r.normalized_query,
      count: Number(r.query_count),
    }));
  }

  /**
   * Get search trends over time
   */
  async getSearchTrends(
    days: number = 7,
  ): Promise<Array<{ date: string; searches: number; uniqueQueries: number }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const results = await this.prisma.$queryRaw<
      Array<{ search_date: Date; search_count: number; unique_count: number }>
    >`
      SELECT
        DATE(created_at) as search_date,
        COUNT(*) as search_count,
        COUNT(DISTINCT normalized_query) as unique_count
      FROM search_queries
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY search_date ASC
    `;

    return results.map((r) => ({
      date: r.search_date.toISOString().split('T')[0],
      searches: Number(r.search_count),
      uniqueQueries: Number(r.unique_count),
    }));
  }

  // ==================== CLEANUP ====================

  /**
   * Clean up old search logs (for scheduled job)
   */
  async cleanupOldLogs(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$executeRaw`
      DELETE FROM search_queries
      WHERE created_at < ${cutoffDate}
    `;

    this.logger.log(`Cleaned up ${result} old search query logs`);
    return Number(result);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Normalize a search query for consistent analytics
   *
   * - Lowercase
   * - Trim whitespace
   * - Remove extra spaces
   * - Remove special characters (except hashtags)
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s#-]/g, '')
      .substring(0, 100); // Limit length
  }
}
