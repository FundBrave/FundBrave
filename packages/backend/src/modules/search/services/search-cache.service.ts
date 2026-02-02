import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SearchResults, TrendingResponse, SuggestionsResponse } from '../dto';

/**
 * Cache key prefixes for different search data types
 */
const CACHE_KEYS = {
  SEARCH_RESULTS: 'search:results:',
  TRENDING: 'search:trending',
  SUGGESTIONS: 'search:suggestions:',
  RECENT_SEARCHES: 'search:recent:',
  POPULAR_QUERIES: 'search:popular',
} as const;

/**
 * Cache TTL values in seconds
 */
const CACHE_TTL = {
  SEARCH_RESULTS: 300, // 5 minutes
  TRENDING: 600, // 10 minutes
  SUGGESTIONS: 60, // 1 minute
  RECENT_SEARCHES: 86400, // 24 hours
  POPULAR_QUERIES: 3600, // 1 hour
} as const;

/**
 * In-memory cache entry with expiration
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Search caching service with Redis support and in-memory fallback
 *
 * This service provides a two-tier caching strategy:
 * 1. Redis for distributed caching (production)
 * 2. In-memory LRU cache as fallback (development or when Redis unavailable)
 */
@Injectable()
export class SearchCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SearchCacheService.name);
  private redis: Redis | null = null;
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly maxMemoryCacheSize = 1000;
  private isRedisAvailable = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.initializeRedis();
    this.startCacheCleanupInterval();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Initialize Redis connection with error handling
   */
  private async initializeRedis(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured. Using in-memory cache only.');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 5000,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 100, 2000);
        },
      });

      await this.redis.connect();
      await this.redis.ping();
      this.isRedisAvailable = true;
      this.logger.log('Redis connection established for search caching');
    } catch (error) {
      this.logger.warn(`Redis connection failed: ${error}. Falling back to in-memory cache.`);
      this.redis = null;
      this.isRedisAvailable = false;
    }
  }

  /**
   * Periodic cleanup of expired in-memory cache entries
   */
  private startCacheCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt < now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  // ==================== SEARCH RESULTS CACHING ====================

  /**
   * Generate cache key for search results
   */
  private generateSearchCacheKey(
    query: string,
    type: string,
    sortBy: string,
    limit: number,
    offset: number,
    filters: Record<string, unknown>,
  ): string {
    const filterHash = Buffer.from(JSON.stringify(filters)).toString('base64');
    return `${CACHE_KEYS.SEARCH_RESULTS}${query}:${type}:${sortBy}:${limit}:${offset}:${filterHash}`;
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(
    query: string,
    type: string,
    sortBy: string,
    limit: number,
    offset: number,
    filters: Record<string, unknown>,
  ): Promise<SearchResults | null> {
    const key = this.generateSearchCacheKey(query, type, sortBy, limit, offset, filters);
    return this.get<SearchResults>(key);
  }

  /**
   * Cache search results
   */
  async setCachedSearchResults(
    query: string,
    type: string,
    sortBy: string,
    limit: number,
    offset: number,
    filters: Record<string, unknown>,
    results: SearchResults,
  ): Promise<void> {
    const key = this.generateSearchCacheKey(query, type, sortBy, limit, offset, filters);
    await this.set(key, results, CACHE_TTL.SEARCH_RESULTS);
  }

  // ==================== TRENDING CACHING ====================

  /**
   * Get cached trending data
   */
  async getCachedTrending(): Promise<TrendingResponse | null> {
    return this.get<TrendingResponse>(CACHE_KEYS.TRENDING);
  }

  /**
   * Cache trending data
   */
  async setCachedTrending(trending: TrendingResponse): Promise<void> {
    await this.set(CACHE_KEYS.TRENDING, trending, CACHE_TTL.TRENDING);
  }

  // ==================== SUGGESTIONS CACHING ====================

  /**
   * Get cached suggestions for a query prefix
   */
  async getCachedSuggestions(prefix: string): Promise<SuggestionsResponse | null> {
    const key = `${CACHE_KEYS.SUGGESTIONS}${prefix.toLowerCase()}`;
    return this.get<SuggestionsResponse>(key);
  }

  /**
   * Cache suggestions for a query prefix
   */
  async setCachedSuggestions(prefix: string, suggestions: SuggestionsResponse): Promise<void> {
    const key = `${CACHE_KEYS.SUGGESTIONS}${prefix.toLowerCase()}`;
    await this.set(key, suggestions, CACHE_TTL.SUGGESTIONS);
  }

  // ==================== RECENT SEARCHES ====================

  /**
   * Add a search query to user's recent searches
   */
  async addRecentSearch(userId: string, query: string): Promise<void> {
    const key = `${CACHE_KEYS.RECENT_SEARCHES}${userId}`;
    const normalizedQuery = query.trim().toLowerCase();

    if (this.isRedisAvailable && this.redis) {
      try {
        // Use sorted set with timestamp as score for ordering
        await this.redis
          .multi()
          .zrem(key, normalizedQuery)
          .zadd(key, Date.now(), normalizedQuery)
          .zremrangebyrank(key, 0, -11) // Keep only last 10
          .expire(key, CACHE_TTL.RECENT_SEARCHES)
          .exec();
      } catch (error) {
        this.logger.warn(`Failed to add recent search to Redis: ${error}`);
      }
    } else {
      // In-memory fallback
      const existing = this.memoryCache.get(key) as CacheEntry<string[]> | undefined;
      const searches = existing?.data ?? [];
      const filtered = searches.filter((s) => s !== normalizedQuery);
      filtered.unshift(normalizedQuery);
      const trimmed = filtered.slice(0, 10);
      this.setMemory(key, trimmed, CACHE_TTL.RECENT_SEARCHES);
    }
  }

  /**
   * Get user's recent searches
   */
  async getRecentSearches(userId: string, limit: number = 10): Promise<string[]> {
    const key = `${CACHE_KEYS.RECENT_SEARCHES}${userId}`;

    if (this.isRedisAvailable && this.redis) {
      try {
        return await this.redis.zrevrange(key, 0, limit - 1);
      } catch (error) {
        this.logger.warn(`Failed to get recent searches from Redis: ${error}`);
        return [];
      }
    } else {
      const entry = this.memoryCache.get(key) as CacheEntry<string[]> | undefined;
      return entry?.data?.slice(0, limit) ?? [];
    }
  }

  /**
   * Clear user's recent searches
   */
  async clearRecentSearches(userId: string): Promise<void> {
    const key = `${CACHE_KEYS.RECENT_SEARCHES}${userId}`;
    await this.delete(key);
  }

  // ==================== POPULAR QUERIES ====================

  /**
   * Increment search count for a query (for popularity tracking)
   */
  async incrementSearchCount(query: string): Promise<void> {
    const normalizedQuery = query.trim().toLowerCase();

    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.zincrby(CACHE_KEYS.POPULAR_QUERIES, 1, normalizedQuery);
        await this.redis.expire(CACHE_KEYS.POPULAR_QUERIES, CACHE_TTL.POPULAR_QUERIES);
      } catch (error) {
        this.logger.warn(`Failed to increment search count: ${error}`);
      }
    }
  }

  /**
   * Get most popular search queries
   */
  async getPopularQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    if (this.isRedisAvailable && this.redis) {
      try {
        const results = await this.redis.zrevrange(
          CACHE_KEYS.POPULAR_QUERIES,
          0,
          limit - 1,
          'WITHSCORES',
        );

        const queries: Array<{ query: string; count: number }> = [];
        for (let i = 0; i < results.length; i += 2) {
          queries.push({
            query: results[i],
            count: parseInt(results[i + 1], 10),
          });
        }
        return queries;
      } catch (error) {
        this.logger.warn(`Failed to get popular queries: ${error}`);
        return [];
      }
    }
    return [];
  }

  // ==================== GENERIC CACHE OPERATIONS ====================

  /**
   * Get value from cache (Redis with memory fallback)
   */
  private async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.isRedisAvailable && this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data) as T;
        }
      } catch (error) {
        this.logger.warn(`Redis get failed for key ${key}: ${error}`);
      }
    }

    // Fallback to memory cache
    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }

    // Expired or not found
    if (entry) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  /**
   * Set value in cache (Redis with memory fallback)
   */
  private async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Try Redis first
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
        return;
      } catch (error) {
        this.logger.warn(`Redis set failed for key ${key}: ${error}`);
      }
    }

    // Fallback to memory cache
    this.setMemory(key, value, ttlSeconds);
  }

  /**
   * Set value in memory cache with LRU eviction
   */
  private setMemory<T>(key: string, value: T, ttlSeconds: number): void {
    // Evict oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const entriesToDelete = Math.floor(this.maxMemoryCacheSize * 0.1);
      const keys = Array.from(this.memoryCache.keys()).slice(0, entriesToDelete);
      keys.forEach((k) => this.memoryCache.delete(k));
    }

    this.memoryCache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete value from cache
   */
  private async delete(key: string): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        this.logger.warn(`Redis delete failed for key ${key}: ${error}`);
      }
    }
    this.memoryCache.delete(key);
  }

  /**
   * Invalidate all search-related caches
   */
  async invalidateSearchCaches(): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        const keys = await this.redis.keys(`${CACHE_KEYS.SEARCH_RESULTS}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        await this.redis.del(CACHE_KEYS.TRENDING);
      } catch (error) {
        this.logger.warn(`Failed to invalidate search caches: ${error}`);
      }
    }

    // Clear memory cache entries with search prefix
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith('search:')) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Check if Redis is available
   */
  isRedisConnected(): boolean {
    return this.isRedisAvailable;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { memoryCacheSize: number; redisAvailable: boolean } {
    return {
      memoryCacheSize: this.memoryCache.size,
      redisAvailable: this.isRedisAvailable,
    };
  }
}
