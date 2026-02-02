import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SearchController } from './search.controller';
import { SearchControllerSimple } from './search.controller.simple';
import { SearchService } from './search.service';
import { SearchServiceBasic } from './search.service.basic';
import { SearchCacheService } from './services/search-cache.service';
import { SearchAnalyticsService } from './services/search-analytics.service';

/**
 * Search module providing comprehensive search functionality
 *
 * Features:
 * - Full-text search with PostgreSQL tsvector
 * - Fuzzy matching with pg_trgm extension
 * - Relevance scoring based on multiple factors
 * - Advanced filtering (category, date, amount, verification)
 * - Hashtag search support
 * - Redis/memory caching with fallback
 * - Search analytics and tracking
 * - Rate limiting per endpoint
 *
 * Dependencies:
 * - PrismaModule (global)
 * - ConfigModule (for Redis URL)
 * - ThrottlerModule (for rate limiting)
 *
 * Endpoints:
 * - GET /search - Main search across campaigns, users, posts, hashtags
 * - GET /search/trending - Trending searches and content
 * - GET /search/suggestions - Autocomplete suggestions
 * - POST /search/click - Track result clicks
 * - POST /search/history/clear - Clear user's search history
 * - GET /search/analytics - Search metrics (admin)
 * - GET /search/health - Service health status
 */
@Module({
  imports: [
    ConfigModule, // For REDIS_URL environment variable
  ],
  // TEMPORARY: Using simple controller with basic search service
  // To switch back to full search: Replace SearchControllerSimple with SearchController
  controllers: [SearchControllerSimple],
  providers: [
    SearchServiceBasic,
    SearchService,
    SearchCacheService,
    SearchAnalyticsService,
  ],
  exports: [
    SearchService,
    SearchServiceBasic,
    SearchCacheService,
  ],
})
export class SearchModule {}
