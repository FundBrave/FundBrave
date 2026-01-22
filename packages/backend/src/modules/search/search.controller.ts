import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchResults, SearchQueryDto, SearchType } from './dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search across campaigns, users, and posts',
    description: 'Performs a unified search across all entities or a specific type. Returns matching campaigns, users, and posts with pagination support.',
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
    type: SearchResults,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search query (too short or missing)',
  })
  async search(@Query() query: SearchQueryDto): Promise<SearchResults> {
    return this.searchService.search(
      query.q,
      query.type ?? SearchType.ALL,
      query.limit ?? 10,
      query.offset ?? 0,
    );
  }
}
