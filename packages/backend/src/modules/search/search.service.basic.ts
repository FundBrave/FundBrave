import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SearchType,
  SearchResults,
  SearchCampaignResult,
  SearchUserResult,
  SearchPostResult,
} from './dto';

/**
 * Basic Search Service (Fallback without pg_trgm extension)
 *
 * This service provides basic search functionality using standard SQL LIKE queries.
 * Use this if pg_trgm extension is not available in your PostgreSQL database.
 *
 * Limitations compared to full search service:
 * - No fuzzy matching (typo tolerance)
 * - No relevance scoring
 * - Slower on large datasets
 * - No "Did You Mean" suggestions
 *
 * Advantages:
 * - Works immediately without database setup
 * - No extension dependencies
 * - Simple and reliable
 */
@Injectable()
export class SearchServiceBasic {
  private readonly logger = new Logger(SearchServiceBasic.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Perform a basic search across all entities or a specific type
   */
  async search(
    query: string,
    type: SearchType = SearchType.ALL,
    limit: number = 10,
    offset: number = 0,
  ): Promise<SearchResults> {
    const results: SearchResults = {
      campaigns: [],
      users: [],
      posts: [],
      hashtags: [],
      totalCampaigns: 0,
      totalUsers: 0,
      totalPosts: 0,
      totalHashtags: 0,
      executionTimeMs: 0,
    };

    // Trim and validate query
    const searchQuery = query.trim();
    if (!searchQuery || searchQuery.length < 2) {
      return results;
    }

    // Execute searches in parallel based on type
    const searchPromises: Promise<void>[] = [];

    if (type === SearchType.ALL || type === SearchType.CAMPAIGNS) {
      searchPromises.push(
        this.searchCampaigns(searchQuery, limit, offset).then((result) => {
          results.campaigns = result.campaigns;
          results.totalCampaigns = result.total;
        }),
      );
    }

    if (type === SearchType.ALL || type === SearchType.USERS) {
      searchPromises.push(
        this.searchUsers(searchQuery, limit, offset).then((result) => {
          results.users = result.users;
          results.totalUsers = result.total;
        }),
      );
    }

    if (type === SearchType.ALL || type === SearchType.POSTS) {
      searchPromises.push(
        this.searchPosts(searchQuery, limit, offset).then((result) => {
          results.posts = result.posts;
          results.totalPosts = result.total;
        }),
      );
    }

    await Promise.all(searchPromises);

    this.logger.debug(
      `Basic search for "${searchQuery}" returned ${results.totalCampaigns} campaigns, ${results.totalUsers} users, ${results.totalPosts} posts`,
    );

    return results;
  }

  /**
   * Search campaigns using basic LIKE queries
   */
  private async searchCampaigns(
    query: string,
    limit: number,
    offset: number,
  ): Promise<{ campaigns: SearchCampaignResult[]; total: number }> {
    const searchPattern = `%${query}%`;

    const where = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    try {
      const [campaigns, total] = await Promise.all([
        this.prisma.fundraiser.findMany({
          where,
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
          orderBy: [
            { isFeatured: 'desc' },
            { raisedAmount: 'desc' },
            { createdAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        }),
        this.prisma.fundraiser.count({ where }),
      ]);

      return {
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? undefined,
          images: c.images,
          categories: c.categories,
          goalAmount: c.goalAmount,
          raisedAmount: c.raisedAmount.toString(),
          category: c.categories[0] ?? 'general',
          deadline: c.deadline,
          donorsCount: c.donorsCount,
          relevanceScore: 0,
          creator: {
            id: c.creator.id,
            username: c.creator.username ?? undefined,
            displayName: c.creator.displayName ?? undefined,
            avatarUrl: c.creator.avatarUrl ?? undefined,
          },
        })),
        total,
      };
    } catch (error) {
      this.logger.error(`Campaign search failed: ${error.message}`, error.stack);
      return { campaigns: [], total: 0 };
    }
  }

  /**
   * Search users using basic LIKE queries
   */
  private async searchUsers(
    query: string,
    limit: number,
    offset: number,
  ): Promise<{ users: SearchUserResult[]; total: number }> {
    const where = {
      isActive: true,
      isSuspended: false,
      OR: [
        { username: { contains: query, mode: 'insensitive' as const } },
        { displayName: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: {
            id: true,
            walletAddress: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedCreator: true,
            followersCount: true,
          },
          orderBy: [
            { isVerifiedCreator: 'desc' },
            { followersCount: 'desc' },
            { createdAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users: users.map((u) => ({
          id: u.id,
          walletAddress: u.walletAddress,
          username: u.username ?? undefined,
          displayName: u.displayName ?? undefined,
          avatarUrl: u.avatarUrl ?? undefined,
          isVerifiedCreator: u.isVerifiedCreator,
          followersCount: u.followersCount,
          fundraisersCount: 0,
          relevanceScore: 0,
        })),
        total,
      };
    } catch (error) {
      this.logger.error(`User search failed: ${error.message}`, error.stack);
      return { users: [], total: 0 };
    }
  }

  /**
   * Search posts using basic LIKE queries
   */
  private async searchPosts(
    query: string,
    limit: number,
    offset: number,
  ): Promise<{ posts: SearchPostResult[]; total: number }> {
    const where = {
      content: { contains: query, mode: 'insensitive' as const },
    };

    try {
      const [posts, total] = await Promise.all([
        this.prisma.post.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
          orderBy: [
            { likesCount: 'desc' },
            { createdAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        }),
        this.prisma.post.count({ where }),
      ]);

      return {
        posts: posts.map((p) => ({
          id: p.id,
          content: p.content ?? '',
          author: {
            id: p.author.id,
            username: p.author.username ?? undefined,
            displayName: p.author.displayName ?? undefined,
            avatarUrl: p.author.avatarUrl ?? undefined,
          },
          likesCount: p.likesCount,
          commentsCount: p._count.comments,
          repostsCount: p.repostsCount,
          createdAt: p.createdAt,
          relevanceScore: 0,
        })),
        total,
      };
    } catch (error) {
      this.logger.error(`Post search failed: ${error.message}`, error.stack);
      return { posts: [], total: 0 };
    }
  }
}
