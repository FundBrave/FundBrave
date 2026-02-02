import {
  Controller,
  Get,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SearchServiceBasic } from './search.service.basic';
import { SearchResults, SearchType } from './dto';

/**
 * Simple Search Controller (Temporary)
 *
 * This controller uses the basic search service without pg_trgm extension.
 * Once the extension is enabled, you can switch back to the full search controller.
 */
@ApiTags('Search')
@Controller('search')
export class SearchControllerSimple {
  private readonly logger = new Logger(SearchControllerSimple.name);

  constructor(private readonly searchService: SearchServiceBasic) {}

  @Get()
  @ApiOperation({
    summary: 'Basic search across campaigns, users, and posts',
    description: 'Performs a basic search using LIKE queries. No fuzzy matching or relevance scoring.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query string (minimum 2 characters)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: SearchType,
    description: 'Filter by entity type (all, campaigns, users, posts)',
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
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search query (too short or missing)',
  })
  async search(
    @Query('q') query: string,
    @Query('type') type?: SearchType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<SearchResults> {
    try {
      if (!query || query.trim().length < 2) {
        return {
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
      }

      const parsedLimit = limit ? Math.min(parseInt(limit, 10), 50) : 10;
      const parsedOffset = offset ? parseInt(offset, 10) : 0;
      const searchType = type || SearchType.ALL;

      this.logger.log(`Basic search: "${query}" (type: ${searchType}, limit: ${parsedLimit})`);

      const results = await this.searchService.search(
        query,
        searchType,
        parsedLimit,
        parsedOffset,
      );

      return results;
    } catch (error) {
      this.logger.error(`Search error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
