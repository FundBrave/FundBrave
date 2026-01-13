import { Test, TestingModule } from '@nestjs/testing';
import { TrendingService } from './trending.service';
import { PrismaService } from '../../prisma/prisma.service';

// Mock data
const mockHashtag = {
  id: 'hashtag-1',
  name: 'fundbrave',
  _count: {
    posts: 150,
  },
};

const mockFundraiser = {
  id: 'fundraiser-1',
  title: 'Test Fundraiser',
  description: 'A test fundraiser for charity',
  goalAmount: '10000',
  currentAmount: '5000',
  creatorId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: {
    donations: 50,
    stakes: 20,
  },
  creator: {
    id: 'user-1',
    username: 'creator',
    displayName: 'Creator User',
    avatarUrl: 'https://example.com/avatar.png',
  },
};

const mockUser = {
  id: 'user-1',
  username: 'popularuser',
  displayName: 'Popular User',
  avatarUrl: 'https://example.com/avatar.png',
  _count: {
    followers: 1000,
    posts: 50,
    fundraisers: 5,
  },
};

const mockTrendingHashtag = {
  id: 'trending-1',
  hashtagId: 'hashtag-1',
  score: 150,
  period: '24h',
  rank: 1,
  updatedAt: new Date(),
  hashtag: {
    id: 'hashtag-1',
    name: 'fundbrave',
  },
};

const mockTrendingFundraiser = {
  id: 'trending-2',
  fundraiserId: 'fundraiser-1',
  score: 200,
  period: '24h',
  rank: 1,
  updatedAt: new Date(),
  fundraiser: mockFundraiser,
};

const mockTrendingUser = {
  id: 'trending-3',
  userId: 'user-1',
  score: 500,
  period: '24h',
  rank: 1,
  updatedAt: new Date(),
  user: mockUser,
};

// Create mock Prisma service
const createMockPrismaService = () => ({
  hashtag: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  fundraiser: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  trendingHashtag: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  trendingFundraiser: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  trendingUser: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  post: {
    count: jest.fn(),
  },
  donation: {
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  stake: {
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  like: {
    count: jest.fn(),
  },
  follow: {
    count: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(createMockPrismaService())),
});

describe('TrendingService', () => {
  let service: TrendingService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrendingService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<TrendingService>(TrendingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTrendingHashtags', () => {
    it('should return trending hashtags for 24h period', async () => {
      prismaService.trendingHashtag.findMany.mockResolvedValue([
        mockTrendingHashtag,
      ]);

      const result = await service.getTrendingHashtags({
        limit: 10,
        period: '24h',
      });

      expect(result).toHaveLength(1);
      expect(result[0].hashtag.name).toBe('fundbrave');
      expect(prismaService.trendingHashtag.findMany).toHaveBeenCalledWith({
        where: { period: '24h' },
        include: {
          hashtag: true,
        },
        orderBy: { rank: 'asc' },
        take: 10,
      });
    });

    it('should return trending hashtags for 7d period', async () => {
      prismaService.trendingHashtag.findMany.mockResolvedValue([
        mockTrendingHashtag,
      ]);

      await service.getTrendingHashtags({
        limit: 10,
        period: '7d',
      });

      expect(prismaService.trendingHashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { period: '7d' },
        }),
      );
    });

    it('should default to 10 items and 24h period', async () => {
      prismaService.trendingHashtag.findMany.mockResolvedValue([]);

      await service.getTrendingHashtags({});

      expect(prismaService.trendingHashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { period: '24h' },
          take: 10,
        }),
      );
    });
  });

  describe('getTrendingFundraisers', () => {
    it('should return trending fundraisers', async () => {
      prismaService.trendingFundraiser.findMany.mockResolvedValue([
        mockTrendingFundraiser,
      ]);

      const result = await service.getTrendingFundraisers({
        limit: 10,
        period: '24h',
      });

      expect(result).toHaveLength(1);
      expect(result[0].fundraiser.title).toBe('Test Fundraiser');
      expect(prismaService.trendingFundraiser.findMany).toHaveBeenCalledWith({
        where: { period: '24h' },
        include: {
          fundraiser: {
            include: {
              creator: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { rank: 'asc' },
        take: 10,
      });
    });
  });

  describe('getTrendingUsers', () => {
    it('should return trending users', async () => {
      prismaService.trendingUser.findMany.mockResolvedValue([mockTrendingUser]);

      const result = await service.getTrendingUsers({
        limit: 10,
        period: '24h',
      });

      expect(result).toHaveLength(1);
      expect(result[0].user.username).toBe('popularuser');
      expect(prismaService.trendingUser.findMany).toHaveBeenCalledWith({
        where: { period: '24h' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerifiedCreator: true,
              verificationBadge: true,
            },
          },
        },
        orderBy: { rank: 'asc' },
        take: 10,
      });
    });
  });

  describe('calculateTrendingHashtags', () => {
    it('should calculate and update trending hashtags', async () => {
      const hashtags = [
        { id: 'h1', name: 'trending1', _count: { posts: 100 } },
        { id: 'h2', name: 'trending2', _count: { posts: 50 } },
      ];
      prismaService.hashtag.findMany.mockResolvedValue(hashtags);
      prismaService.post.count.mockResolvedValue(100);
      prismaService.trendingHashtag.upsert.mockResolvedValue({});
      prismaService.trendingHashtag.deleteMany.mockResolvedValue({ count: 0 });

      await service.calculateTrendingHashtags('24h');

      expect(prismaService.hashtag.findMany).toHaveBeenCalled();
      expect(prismaService.trendingHashtag.upsert).toHaveBeenCalled();
    });
  });

  describe('calculateTrendingFundraisers', () => {
    it('should calculate and update trending fundraisers', async () => {
      const fundraisers = [
        {
          id: 'f1',
          title: 'Fundraiser 1',
          _count: { donations: 100, stakes: 50 },
        },
        {
          id: 'f2',
          title: 'Fundraiser 2',
          _count: { donations: 50, stakes: 25 },
        },
      ];
      prismaService.fundraiser.findMany.mockResolvedValue(fundraisers);
      prismaService.donation.aggregate.mockResolvedValue({
        _sum: { amount: '5000' },
      });
      prismaService.stake.aggregate.mockResolvedValue({
        _sum: { amount: '2000' },
      });
      prismaService.trendingFundraiser.upsert.mockResolvedValue({});
      prismaService.trendingFundraiser.deleteMany.mockResolvedValue({
        count: 0,
      });

      await service.calculateTrendingFundraisers('24h');

      expect(prismaService.fundraiser.findMany).toHaveBeenCalled();
      expect(prismaService.trendingFundraiser.upsert).toHaveBeenCalled();
    });
  });

  describe('calculateTrendingUsers', () => {
    it('should calculate and update trending users', async () => {
      const users = [
        {
          id: 'u1',
          username: 'user1',
          _count: { followers: 1000, posts: 100, fundraisers: 5 },
        },
        {
          id: 'u2',
          username: 'user2',
          _count: { followers: 500, posts: 50, fundraisers: 2 },
        },
      ];
      prismaService.user.findMany.mockResolvedValue(users);
      prismaService.follow.count.mockResolvedValue(100);
      prismaService.like.count.mockResolvedValue(500);
      prismaService.donation.count.mockResolvedValue(50);
      prismaService.trendingUser.upsert.mockResolvedValue({});
      prismaService.trendingUser.deleteMany.mockResolvedValue({ count: 0 });

      await service.calculateTrendingUsers('24h');

      expect(prismaService.user.findMany).toHaveBeenCalled();
      expect(prismaService.trendingUser.upsert).toHaveBeenCalled();
    });
  });

  describe('updateTrendingScores', () => {
    it('should update all trending scores for all periods', async () => {
      // Mock all the required methods
      prismaService.hashtag.findMany.mockResolvedValue([]);
      prismaService.fundraiser.findMany.mockResolvedValue([]);
      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.trendingHashtag.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.trendingFundraiser.deleteMany.mockResolvedValue({
        count: 0,
      });
      prismaService.trendingUser.deleteMany.mockResolvedValue({ count: 0 });

      // This is a cron job that runs hourly
      await service.updateTrendingScores();

      // Should be called for each period (1h, 24h, 7d)
      expect(prismaService.hashtag.findMany).toHaveBeenCalled();
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions based on query', async () => {
      const hashtags = [{ id: 'h1', name: 'fundbrave' }];
      const users = [mockUser];
      const fundraisers = [mockFundraiser];

      prismaService.hashtag.findMany.mockResolvedValue(hashtags);
      prismaService.user.findMany.mockResolvedValue(users);
      prismaService.fundraiser.findMany.mockResolvedValue(fundraisers);

      const result = await service.getSearchSuggestions('fund', 5);

      expect(result.hashtags).toHaveLength(1);
      expect(result.users).toHaveLength(1);
      expect(result.fundraisers).toHaveLength(1);
    });

    it('should return empty results for empty query', async () => {
      const result = await service.getSearchSuggestions('', 5);

      expect(result.hashtags).toHaveLength(0);
      expect(result.users).toHaveLength(0);
      expect(result.fundraisers).toHaveLength(0);
    });
  });

  describe('getAllTrending', () => {
    it('should return combined trending data', async () => {
      prismaService.trendingHashtag.findMany.mockResolvedValue([
        mockTrendingHashtag,
      ]);
      prismaService.trendingFundraiser.findMany.mockResolvedValue([
        mockTrendingFundraiser,
      ]);
      prismaService.trendingUser.findMany.mockResolvedValue([mockTrendingUser]);

      const result = await service.getAllTrending({
        limit: 5,
        period: '24h',
      });

      expect(result.hashtags).toHaveLength(1);
      expect(result.fundraisers).toHaveLength(1);
      expect(result.users).toHaveLength(1);
    });
  });
});
