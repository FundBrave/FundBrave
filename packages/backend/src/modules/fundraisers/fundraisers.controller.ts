import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FundraisersService } from './fundraisers.service';
import {
  Fundraiser,
  PaginatedFundraisers,
  CreateFundraiserInput,
  UpdateFundraiserInput,
  CreateFundraiserUpdateInput,
  CreateMilestoneInput,
  FundraiserFilterInput,
  FundraiserSortBy,
  SortOrder,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Fundraisers')
@Controller('fundraisers')
export class FundraisersController {
  constructor(private readonly fundraisersService: FundraisersService) {}

  // ==================== GET Endpoints ====================

  @Get()
  @ApiOperation({ summary: 'Get paginated list of fundraisers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'categories', required: false, type: [String] })
  @ApiQuery({ name: 'regions', required: false, type: [String] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'goalReached', required: false, type: Boolean })
  @ApiQuery({ name: 'searchQuery', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: FundraiserSortBy })
  @ApiQuery({ name: 'order', required: false, enum: SortOrder })
  @ApiResponse({ status: 200, description: 'Returns paginated fundraisers' })
  async getFundraisers(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('categories') categories?: string | string[],
    @Query('regions') regions?: string | string[],
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('goalReached') goalReached?: string,
    @Query('searchQuery') searchQuery?: string,
    @Query('sortBy') sortBy?: FundraiserSortBy,
    @Query('order') order?: SortOrder,
  ): Promise<PaginatedFundraisers> {
    const filter: FundraiserFilterInput = {
      categories: this.parseArrayParam(categories),
      regions: this.parseArrayParam(regions),
      isActive: this.parseBooleanParam(isActive),
      isFeatured: this.parseBooleanParam(isFeatured),
      goalReached: this.parseBooleanParam(goalReached),
      searchQuery,
    };

    const sort = { sortBy, order };

    return this.fundraisersService.getFundraisers(limit, offset, filter, sort);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured fundraisers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns featured fundraisers' })
  async getFeaturedFundraisers(
    @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
  ): Promise<Fundraiser[]> {
    return this.fundraisersService.getFeaturedFundraisers(limit);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending fundraisers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns trending fundraisers' })
  async getTrendingFundraisers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Fundraiser[]> {
    return this.fundraisersService.getTrendingFundraisers(limit);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get fundraiser categories with counts' })
  @ApiResponse({ status: 200, description: 'Returns categories with counts' })
  async getCategoriesWithCounts(): Promise<{ category: string; count: number }[]> {
    return this.fundraisersService.getCategoriesWithCounts();
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get fundraiser regions with counts' })
  @ApiResponse({ status: 200, description: 'Returns regions with counts' })
  async getRegionsWithCounts(): Promise<{ region: string; count: number }[]> {
    return this.fundraisersService.getRegionsWithCounts();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search fundraisers' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns search results' })
  async searchFundraisers(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.searchFundraisers(query, limit, offset);
  }

  @Get('creator/:creatorId')
  @ApiOperation({ summary: 'Get fundraisers by creator' })
  @ApiParam({ name: 'creatorId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns creator fundraisers' })
  async getFundraisersByCreator(
    @Param('creatorId') creatorId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.getFundraisersByCreator(creatorId, limit, offset);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user fundraisers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns user fundraisers' })
  async getMyFundraisers(
    @CurrentUser() user: { id: string },
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedFundraisers> {
    return this.fundraisersService.getFundraisersByCreator(user.id, limit, offset);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fundraiser by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Returns fundraiser details' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async getFundraiserById(@Param('id') id: string): Promise<Fundraiser> {
    return this.fundraisersService.getFundraiserById(id);
  }

  @Get('on-chain/:onChainId')
  @ApiOperation({ summary: 'Get fundraiser by on-chain ID' })
  @ApiParam({ name: 'onChainId', type: Number })
  @ApiResponse({ status: 200, description: 'Returns fundraiser details' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async getFundraiserByOnChainId(
    @Param('onChainId', ParseIntPipe) onChainId: number,
  ): Promise<Fundraiser> {
    return this.fundraisersService.getFundraiserByOnChainId(onChainId);
  }

  // ==================== POST Endpoints ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new fundraiser' })
  @ApiResponse({ status: 201, description: 'Fundraiser created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createFundraiser(
    @CurrentUser() user: { id: string },
    @Body() body: { input: CreateFundraiserInput; txHash: string; onChainId: number },
  ): Promise<Fundraiser> {
    return this.fundraisersService.createFundraiser(
      user.id,
      body.input,
      body.txHash,
      body.onChainId,
    );
  }

  @Post(':id/updates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an update to a fundraiser' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Update added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async addFundraiserUpdate(
    @CurrentUser() user: { id: string },
    @Param('id') fundraiserId: string,
    @Body() input: CreateFundraiserUpdateInput,
  ) {
    return this.fundraisersService.addFundraiserUpdate(fundraiserId, user.id, input);
  }

  @Post(':id/milestones')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a milestone to a fundraiser' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Milestone added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async addMilestone(
    @CurrentUser() user: { id: string },
    @Param('id') fundraiserId: string,
    @Body() input: CreateMilestoneInput,
  ) {
    return this.fundraisersService.addMilestone(fundraiserId, user.id, input);
  }

  // ==================== PUT Endpoints ====================

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a fundraiser' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Fundraiser updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async updateFundraiser(
    @CurrentUser() user: { id: string },
    @Param('id') fundraiserId: string,
    @Body() input: UpdateFundraiserInput,
  ): Promise<Fundraiser> {
    return this.fundraisersService.updateFundraiser(fundraiserId, user.id, input);
  }

  // ==================== Helper Methods ====================

  private parseArrayParam(param?: string | string[]): string[] | undefined {
    if (!param) return undefined;
    if (Array.isArray(param)) return param;
    return param.split(',').map((s) => s.trim());
  }

  private parseBooleanParam(param?: string): boolean | undefined {
    if (param === undefined || param === '') return undefined;
    return param === 'true';
  }
}
