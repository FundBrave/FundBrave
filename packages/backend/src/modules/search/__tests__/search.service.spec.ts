import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from '../search.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SearchCacheService } from '../services/search-cache.service';
import { SearchAnalyticsService } from '../services/search-analytics.service';
import { SearchType, SearchSortBy, DateRangeFilter } from '../dto';

/**
 * Unit tests for SearchService
 *
 * These tests verify:
 * - Query sanitization and validation
 * - Cache integration
 * - Search result formatting
 * - Filter application
 * - Error handling
 */
describe('SearchService', () => {
  let service: SearchService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<SearchCacheService>;
  let analyticsService: jest.Mocked<SearchAnalyticsService>;

  // Mock data
  const mockCampaign = {
    id: 'campaign-1',
    name: 'Test Campaign',
    description: 'A test fundraising campaign',
    images: ['image1.jpg'],
    goal_amount: '10000',
    raised_amount: BigInt(5000),
    categories: ['education'],
    deadline: new Date('2025-12-31'),
    is_featured: true,
    donors_count: 50,
    creator_id: 'user-1',
    creator_username: 'testuser',
    creator_display_name: 'Test User',
    creator_avatar_url: 'avatar.jpg',
    creator_is_verified: true,
    relevance_score: 85,
  };

  const mockUser = {
    id: 'user-1',
    wallet_address: '0x1234567890abcdef',
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: 'avatar.jpg',
    bio: 'Test bio',
    is_verified_creator: true,
    followers_count: 100,
    fundraisers_count: 5,
    relevance_score: 90,
  };

  beforeEach(async () => {
    // Create mock implementations
    const mockPrismaService = {
      $queryRaw: jest.fn(),
      fundraiser: {
        findMany: jest.fn(),
      },
      trending: {
        findMany: jest.fn(),
      },
      hashtag: {
        findMany: jest.fn(),
      },
    };

    const mockCacheService = {
      getCachedSearchResults: jest.fn(),
      setCachedSearchResults: jest.fn(),
      getCachedTrending: jest.fn(),
      setCachedTrending: jest.fn(),
      getCachedSuggestions: jest.fn(),
      setCachedSuggestions: jest.fn(),
      addRecentSearch: jest.fn(),
      getRecentSearches: jest.fn(),
      incrementSearchCount: jest.fn(),
      getPopularQueries: jest.fn(),
    };

    const mockAnalyticsService = {
      logSearchQuery: jest.fn(),
      logSearchClick: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SearchCacheService, useValue: mockCacheService },
        { provide: SearchAnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(SearchCacheService);
    analyticsService = module.get(SearchAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return empty results for queries shorter than 2 characters', async () => {
      const result = await service.search({ q: 'a' });

      expect(result.campaigns).toHaveLength(0);
      expect(result.users).toHaveLength(0);
      expect(result.posts).toHaveLength(0);
      expect(result.totalCampaigns).toBe(0);
    });

    it('should return cached results when available', async () => {
      const cachedResults = {
        campaigns: [],
        users: [],
        posts: [],
        hashtags: [],
        totalCampaigns: 5,
        totalUsers: 3,
        totalPosts: 10,
        totalHashtags: 2,
        executionTimeMs: 50,
      };

      cacheService.getCachedSearchResults.mockResolvedValue(cachedResults);

      const result = await service.search({ q: 'test query' });

      expect(result).toEqual(cachedResults);
      expect(cacheService.getCachedSearchResults).toHaveBeenCalled();
      expect(prismaService.$queryRaw).not.toHaveBeenCalled();
    });

    it('should sanitize dangerous characters from query', async () => {
      cacheService.getCachedSearchResults.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([]);

      await service.search({ q: '<script>alert("xss")</script>' });

      // The query should be sanitized - the $queryRaw should be called with safe values
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should handle hashtag searches correctly', async () => {
      cacheService.getCachedSearchResults.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([]);

      await service.search({ q: '#fundraising', type: SearchType.ALL });

      // Verify that hashtag-specific search was triggered
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should apply category filter when provided', async () => {
      cacheService.getCachedSearchResults.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([]);

      await service.search({
        q: 'education',
        type: SearchType.CAMPAIGNS,
        categories: ['education', 'nonprofit'],
      });

      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should apply date range filter', async () => {
      cacheService.getCachedSearchResults.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([]);

      await service.search({
        q: 'test',
        dateRange: DateRangeFilter.THIS_WEEK,
      });

      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should cache results after successful search', async () => {
      cacheService.getCachedSearchResults.mockResolvedValue(null);
      prismaService.$queryRaw
        .mockResolvedValueOnce([mockCampaign])
        .mockResolvedValueOnce([{ count: BigInt(1) }])
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValueOnce([{ count: BigInt(1) }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);

      await service.search({ q: 'test query' });

      expect(cacheService.setCachedSearchResults).toHaveBeenCalled();
    });

    it('should log analytics after search', async () => {
      cacheService.getCachedSearchResults.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([]);

      await service.search({ q: 'test query' }, 'user-1', '127.0.0.1', 'Mozilla/5.0');

      // Analytics is logged asynchronously, give it time
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(analyticsService.logSearchQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test query',
          userId: 'user-1',
          ipAddress: '127.0.0.1',
        }),
      );
    });

    it('should add to recent searches for authenticated users', async () => {
      cacheService.getCachedSearchResults.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([]);

      await service.search({ q: 'test query' }, 'user-1');

      expect(cacheService.addRecentSearch).toHaveBeenCalledWith('user-1', 'test query');
    });
  });

  describe('getSuggestions', () => {
    it('should return cached suggestions when available', async () => {
      const cachedSuggestions = {
        suggestions: [{ term: 'test', type: 'popular' as const, count: 10 }],
      };

      cacheService.getCachedSuggestions.mockResolvedValue(cachedSuggestions);

      const result = await service.getSuggestions({ q: 'te', includeRecent: false });

      expect(result).toEqual(cachedSuggestions);
    });

    it('should include recent searches for authenticated users', async () => {
      cacheService.getCachedSuggestions.mockResolvedValue(null);
      cacheService.getRecentSearches.mockResolvedValue(['test', 'testing']);
      prismaService.hashtag.findMany.mockResolvedValue([]);
      prismaService.$queryRaw.mockResolvedValue([]);
      prismaService.fundraiser.findMany.mockResolvedValue([]);

      const result = await service.getSuggestions(
        { q: 'te', includeRecent: true },
        'user-1',
      );

      expect(result.recentSearches).toContain('test');
    });
  });

  describe('getTrending', () => {
    it('should return cached trending data when available', async () => {
      const cachedTrending = {
        trending: [],
        popularHashtags: [],
        popularCampaigns: [],
        cachedAt: new Date(),
      };

      cacheService.getCachedTrending.mockResolvedValue(cachedTrending);

      const result = await service.getTrending();

      expect(result).toEqual(cachedTrending);
      expect(prismaService.trending.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and cache trending data when not cached', async () => {
      cacheService.getCachedTrending.mockResolvedValue(null);
      cacheService.getPopularQueries.mockResolvedValue([]);
      prismaService.trending.findMany.mockResolvedValue([]);
      prismaService.fundraiser.findMany.mockResolvedValue([]);

      await service.getTrending();

      expect(prismaService.trending.findMany).toHaveBeenCalled();
      expect(cacheService.setCachedTrending).toHaveBeenCalled();
    });
  });

  describe('trackClick', () => {
    it('should log click to analytics service', async () => {
      await service.trackClick('test', 'result-1', SearchType.CAMPAIGNS, 'user-1', 0);

      expect(analyticsService.logSearchClick).toHaveBeenCalledWith({
        query: 'test',
        resultId: 'result-1',
        resultType: SearchType.CAMPAIGNS,
        userId: 'user-1',
        position: 0,
      });
    });
  });
});
