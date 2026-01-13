import {
  Controller,
  Get,
  Post,
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
import { DonationsService } from './donations.service';
import {
  Donation,
  PaginatedDonations,
  DonationStats,
  UserDonationStats,
  DonationLeaderboard,
  DonationLeaderboardEntry,
  RecentDonationActivity,
  RecordDonationInput,
  DonationSortBy,
} from './dto';
import { SortOrder } from '../fundraisers/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  // ==================== GET Endpoints ====================

  @Get()
  @ApiOperation({ summary: 'Get paginated list of donations' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'fundraiserId', required: false, type: String })
  @ApiQuery({ name: 'donorId', required: false, type: String })
  @ApiQuery({ name: 'token', required: false, type: String })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: DonationSortBy })
  @ApiQuery({ name: 'order', required: false, enum: SortOrder })
  @ApiResponse({ status: 200, description: 'Returns paginated donations' })
  async getDonations(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('fundraiserId') fundraiserId?: string,
    @Query('donorId') donorId?: string,
    @Query('token') token?: string,
    @Query('chainId') chainId?: string,
    @Query('sortBy') sortBy: DonationSortBy = DonationSortBy.CREATED_AT,
    @Query('order') order: SortOrder = SortOrder.DESC,
  ): Promise<PaginatedDonations> {
    const filter = {
      fundraiserId,
      donorId,
      token,
      chainId: chainId ? parseInt(chainId) : undefined,
    };

    return this.donationsService.getDonations(
      limit,
      offset,
      filter,
      sortBy,
      order,
    );
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent donation activity' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns recent donations' })
  async getRecentDonations(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<RecentDonationActivity[]> {
    return this.donationsService.getRecentDonationActivity(limit);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get donation leaderboard' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['all', '7d', '30d', '90d'],
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns donation leaderboard' })
  async getLeaderboard(
    @Query('period') period: 'all' | '7d' | '30d' | '90d' = 'all',
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<DonationLeaderboard> {
    return this.donationsService.getDonationLeaderboard(period, limit);
  }

  @Get('stats/platform')
  @ApiOperation({ summary: 'Get platform-wide donation statistics' })
  @ApiResponse({ status: 200, description: 'Returns platform donation stats' })
  async getPlatformStats(): Promise<DonationStats> {
    return this.donationsService.getPlatformDonationStats();
  }

  @Get('fundraiser/:fundraiserId')
  @ApiOperation({ summary: 'Get donations for a fundraiser' })
  @ApiParam({ name: 'fundraiserId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns fundraiser donations' })
  async getFundraiserDonations(
    @Param('fundraiserId') fundraiserId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedDonations> {
    return this.donationsService.getFundraiserDonations(
      fundraiserId,
      limit,
      offset,
    );
  }

  @Get('fundraiser/:fundraiserId/stats')
  @ApiOperation({ summary: 'Get donation stats for a fundraiser' })
  @ApiParam({ name: 'fundraiserId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns fundraiser donation stats',
  })
  async getFundraiserDonationStats(
    @Param('fundraiserId') fundraiserId: string,
  ): Promise<DonationStats> {
    return this.donationsService.getFundraiserDonationStats(fundraiserId);
  }

  @Get('fundraiser/:fundraiserId/top-donors')
  @ApiOperation({ summary: 'Get top donors for a fundraiser' })
  @ApiParam({ name: 'fundraiserId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns top donors' })
  async getTopDonors(
    @Param('fundraiserId') fundraiserId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<DonationLeaderboardEntry[]> {
    return this.donationsService.getTopDonors(fundraiserId, limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get donations by user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns user donations' })
  async getUserDonations(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedDonations> {
    return this.donationsService.getUserDonations(userId, limit, offset);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get donation stats for a user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Returns user donation stats' })
  async getUserDonationStats(
    @Param('userId') userId: string,
  ): Promise<UserDonationStats> {
    return this.donationsService.getUserDonationStats(userId);
  }

  @Get('address/:address')
  @ApiOperation({ summary: 'Get donations by wallet address' })
  @ApiParam({ name: 'address', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns donations by address' })
  async getDonationsByAddress(
    @Param('address') address: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedDonations> {
    return this.donationsService.getDonationsByAddress(address, limit, offset);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user donations' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns user donations' })
  async getMyDonations(
    @CurrentUser() user: { id: string },
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<PaginatedDonations> {
    return this.donationsService.getUserDonations(user.id, limit, offset);
  }

  @Get('my/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user donation stats' })
  @ApiResponse({ status: 200, description: 'Returns user donation stats' })
  async getMyDonationStats(
    @CurrentUser() user: { id: string },
  ): Promise<UserDonationStats> {
    return this.donationsService.getUserDonationStats(user.id);
  }

  @Get('tx/:txHash')
  @ApiOperation({ summary: 'Get donation by transaction hash' })
  @ApiParam({ name: 'txHash', type: String })
  @ApiResponse({ status: 200, description: 'Returns donation details' })
  @ApiResponse({ status: 404, description: 'Donation not found' })
  async getDonationByTxHash(
    @Param('txHash') txHash: string,
  ): Promise<Donation> {
    return this.donationsService.getDonationByTxHash(txHash);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get donation by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Returns donation details' })
  @ApiResponse({ status: 404, description: 'Donation not found' })
  async getDonationById(@Param('id') id: string): Promise<Donation> {
    return this.donationsService.getDonationById(id);
  }

  // ==================== POST Endpoints ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a new donation' })
  @ApiResponse({ status: 201, description: 'Donation recorded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Duplicate transaction' })
  async recordDonation(
    @CurrentUser() user: { id: string; walletAddress: string },
    @Body() input: RecordDonationInput,
  ): Promise<Donation> {
    return this.donationsService.recordDonation(
      user.id,
      user.walletAddress,
      input,
    );
  }
}
