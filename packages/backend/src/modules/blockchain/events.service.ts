import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../../prisma/prisma.service';

// Import service for event processing
import { FundraisersService } from '../fundraisers/fundraisers.service';
import { DonationsService } from '../donations/donations.service';
import { StakingService } from '../staking/staking.service';
import { ImpactDAOService } from '../impact-dao/impact-dao.service';
import { WealthBuildingService } from '../wealth-building/wealth-building.service';
import { TreasuryService } from '../treasury/treasury.service';
import { FBTVestingService } from '../fbt-vesting/fbt-vesting.service';

// Import types
import {
  ChainId,
  ContractName,
  ImpactDAOPoolEvent,
  WealthBuildingDonationEvent,
  PlatformTreasuryEvent,
  FundBraveTokenEvent,
  StakingPoolEvent,
  StakedEventArgs as ImpactDAOStakedEventArgs,
  YieldHarvestedEventArgs,
  DonationMadeEventArgs,
  StockPurchasedEventArgs,
  FBTStakedEventArgs,
  VestingScheduleCreatedEventArgs,
  TokensBurnedEventArgs,
} from '../../common/types';
import {
  StakedEventArgs as StakingPoolStakedEventArgs,
  UnstakedEventArgs,
} from '../staking/dto';
import { FeeSourceType } from '../treasury/dto';

/**
 * Get chain name from chain ID
 */
function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    [ChainId.ETHEREUM]: 'Ethereum',
    [ChainId.SEPOLIA]: 'Sepolia',
    [ChainId.POLYGON]: 'Polygon',
    [ChainId.MUMBAI]: 'Mumbai',
    [ChainId.AVALANCHE]: 'Avalanche',
    [ChainId.FUJI]: 'Fuji',
    [ChainId.ARBITRUM]: 'Arbitrum',
    [ChainId.ARBITRUM_SEPOLIA]: 'Arbitrum Sepolia',
    [ChainId.OPTIMISM]: 'Optimism',
    [ChainId.OPTIMISM_SEPOLIA]: 'Optimism Sepolia',
  };
  return chainNames[chainId] || 'Unknown';
}

/**
 * Service for processing blockchain events
 * Routes events to appropriate domain services
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fundraisersService: FundraisersService,
    private readonly donationsService: DonationsService,
    private readonly stakingService: StakingService,
    private readonly impactDAOService: ImpactDAOService,
    private readonly wealthBuildingService: WealthBuildingService,
    private readonly treasuryService: TreasuryService,
    private readonly fbtVestingService: FBTVestingService,
  ) {}

  /**
   * Process a blockchain event based on contract and event type
   */
  async processEvent(
    contractName: ContractName,
    eventName: string,
    eventData: ethers.Log,
    chainId: number,
  ): Promise<void> {
    try {
      const txHash = eventData.transactionHash;
      const blockNumber = eventData.blockNumber;

      this.logger.log(
        `Processing ${contractName}.${eventName} from block ${blockNumber} on chain ${chainId}`,
      );

      switch (contractName) {
        case ContractName.IMPACT_DAO_POOL:
          await this.processImpactDAOEvent(
            eventName,
            eventData,
            txHash,
            blockNumber,
            chainId,
          );
          break;

        case ContractName.WEALTH_BUILDING_DONATION:
          await this.processWealthBuildingEvent(
            eventName,
            eventData,
            txHash,
            blockNumber,
            chainId,
          );
          break;

        case ContractName.PLATFORM_TREASURY:
          await this.processTreasuryEvent(
            eventName,
            eventData,
            txHash,
            blockNumber,
            chainId,
          );
          break;

        case ContractName.FUND_BRAVE_TOKEN:
          await this.processFBTEvent(
            eventName,
            eventData,
            txHash,
            blockNumber,
            chainId,
          );
          break;

        case ContractName.STAKING_POOL:
          await this.processStakingPoolEvent(
            eventName,
            eventData,
            txHash,
            blockNumber,
            chainId,
          );
          break;

        case ContractName.FUNDRAISER_FACTORY:
          await this.processFundraiserFactoryEvent(
            eventName,
            eventData,
            txHash,
            blockNumber,
            chainId,
          );
          break;

        default:
          this.logger.warn(`Unknown contract: ${contractName}`);
      }

      // Update blockchain sync record
      await this.updateSyncRecord(contractName, chainId, blockNumber);
    } catch (error) {
      this.logger.error(
        `Failed to process ${contractName}.${eventName}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ==================== ImpactDAOPool Event Processing ====================

  private async processImpactDAOEvent(
    eventName: string,
    eventData: ethers.Log,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    const iface = new ethers.Interface(IMPACT_DAO_POOL_ABI);
    const parsedLog = iface.parseLog(eventData);

    if (!parsedLog) {
      throw new Error(`Failed to parse ${eventName} event`);
    }

    switch (eventName) {
      case ImpactDAOPoolEvent.STAKED:
        const stakedArgs: ImpactDAOStakedEventArgs = {
          staker: parsedLog.args.staker,
          amount: parsedLog.args.amount,
          split: {
            daoShare: Number(parsedLog.args.daoShare),
            stakerShare: Number(parsedLog.args.stakerShare),
            platformShare: Number(parsedLog.args.platformShare),
          },
        };
        await this.impactDAOService.processStakedEvent(
          stakedArgs,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case ImpactDAOPoolEvent.UNSTAKED:
        await this.impactDAOService.processUnstakedEvent(
          parsedLog.args.staker,
          parsedLog.args.amount,
          txHash,
        );
        break;

      case ImpactDAOPoolEvent.YIELD_HARVESTED:
        const yieldArgs: YieldHarvestedEventArgs = {
          totalYield: parsedLog.args.totalYield,
          daoShare: parsedLog.args.daoShare,
          totalStakerShare: parsedLog.args.stakerShare,
          platformShare: parsedLog.args.platformShare,
        };
        await this.impactDAOService.processYieldHarvestedEvent(
          yieldArgs,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case ImpactDAOPoolEvent.YIELD_SPLIT_SET:
        await this.impactDAOService.processYieldSplitSetEvent(
          parsedLog.args.staker,
          parsedLog.args.daoShare,
          parsedLog.args.stakerShare,
          parsedLog.args.platformShare,
        );
        break;

      case ImpactDAOPoolEvent.FBT_REWARD_PAID:
        await this.impactDAOService.processFBTRewardClaimedEvent(
          parsedLog.args.staker,
          parsedLog.args.amount,
          txHash,
        );
        break;

      default:
        this.logger.warn(`Unknown ImpactDAOPool event: ${eventName}`);
    }
  }

  // ==================== WealthBuildingDonation Event Processing ====================

  private async processWealthBuildingEvent(
    eventName: string,
    eventData: ethers.Log,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    const iface = new ethers.Interface(WEALTH_BUILDING_ABI);
    const parsedLog = iface.parseLog(eventData);

    if (!parsedLog) {
      throw new Error(`Failed to parse ${eventName} event`);
    }

    switch (eventName) {
      case WealthBuildingDonationEvent.DONATION_MADE:
        const donationArgs: DonationMadeEventArgs = {
          donor: parsedLog.args.donor,
          fundraiserId: parsedLog.args.fundraiserId,
          totalAmount: parsedLog.args.totalAmount,
          directAmount: parsedLog.args.directAmount,
          endowmentAmount: parsedLog.args.endowmentAmount,
          platformFee: parsedLog.args.platformFee,
        };
        await this.wealthBuildingService.processDonationMadeEvent(
          donationArgs,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case WealthBuildingDonationEvent.YIELD_HARVESTED:
        await this.wealthBuildingService.processYieldHarvestedEvent(
          parsedLog.args.donor,
          parsedLog.args.fundraiserId,
          parsedLog.args.totalYield,
          parsedLog.args.causeAmount,
          parsedLog.args.donorAmount,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case WealthBuildingDonationEvent.STOCK_PURCHASED:
        const stockArgs: StockPurchasedEventArgs = {
          donor: parsedLog.args.donor,
          stockToken: parsedLog.args.stockToken,
          usdcAmount: parsedLog.args.usdcAmount,
          stockAmount: parsedLog.args.stockAmount,
        };
        await this.wealthBuildingService.processStockPurchasedEvent(
          stockArgs,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      default:
        this.logger.warn(`Unknown WealthBuildingDonation event: ${eventName}`);
    }
  }

  // ==================== PlatformTreasury Event Processing ====================

  private async processTreasuryEvent(
    eventName: string,
    eventData: ethers.Log,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    const iface = new ethers.Interface(PLATFORM_TREASURY_ABI);
    const parsedLog = iface.parseLog(eventData);

    if (!parsedLog) {
      throw new Error(`Failed to parse ${eventName} event`);
    }

    switch (eventName) {
      case PlatformTreasuryEvent.FEE_RECEIVED:
        // Map source string to FeeSourceType enum
        const sourceTypeMap: Record<string, FeeSourceType> = {
          STAKING_POOL: FeeSourceType.STAKING_POOL,
          IMPACT_DAO_POOL: FeeSourceType.IMPACT_DAO_POOL,
          WEALTH_BUILDING: FeeSourceType.WEALTH_BUILDING,
          FUNDRAISER: FeeSourceType.FUNDRAISER,
        };
        const feeSourceType =
          sourceTypeMap[parsedLog.args.source] || FeeSourceType.OTHER;
        await this.treasuryService.processFeeReceivedEvent(
          parsedLog.args.from,
          parsedLog.args.amount,
          feeSourceType,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case PlatformTreasuryEvent.FEES_STAKED:
        await this.treasuryService.processFeesStakedEvent(
          parsedLog.args.amount,
          parsedLog.args.endowmentAmount || BigInt(0),
          txHash,
        );
        break;

      case PlatformTreasuryEvent.FBT_STAKED:
        const fbtStakedArgs: FBTStakedEventArgs = {
          staker: parsedLog.args.staker,
          amount: parsedLog.args.amount,
        };
        await this.treasuryService.processFBTStakedEvent(
          fbtStakedArgs,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case PlatformTreasuryEvent.FBT_UNSTAKED:
        await this.treasuryService.processFBTUnstakedEvent(
          parsedLog.args.staker,
          parsedLog.args.amount,
          txHash,
        );
        break;

      case PlatformTreasuryEvent.YIELD_CLAIMED:
        await this.treasuryService.processYieldClaimedEvent(
          parsedLog.args.staker,
          parsedLog.args.amount,
          txHash,
        );
        break;

      default:
        this.logger.warn(`Unknown PlatformTreasury event: ${eventName}`);
    }
  }

  // ==================== FundBraveToken Event Processing ====================

  private async processFBTEvent(
    eventName: string,
    eventData: ethers.Log,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    const iface = new ethers.Interface(FUND_BRAVE_TOKEN_ABI);
    const parsedLog = iface.parseLog(eventData);

    if (!parsedLog) {
      throw new Error(`Failed to parse ${eventName} event`);
    }

    switch (eventName) {
      case FundBraveTokenEvent.VESTING_SCHEDULE_CREATED:
        const vestingArgs: VestingScheduleCreatedEventArgs = {
          recipient: parsedLog.args.recipient,
          scheduleId: parsedLog.args.scheduleId,
          amount: parsedLog.args.amount,
          duration: parsedLog.args.duration,
          startTime: parsedLog.args.startTime,
        };
        await this.fbtVestingService.processVestingScheduleCreatedEvent(
          vestingArgs,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case FundBraveTokenEvent.VESTED_TOKENS_CLAIMED:
        await this.fbtVestingService.processVestedTokensClaimedEvent(
          parsedLog.args.recipient,
          parsedLog.args.amount,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case FundBraveTokenEvent.TOKENS_BURNED:
        const burnArgs: TokensBurnedEventArgs = {
          account: parsedLog.args.account,
          amount: parsedLog.args.amount,
        };
        await this.fbtVestingService.processTokensBurnedEvent(
          burnArgs,
          txHash,
          blockNumber,
          chainId,
        );
        break;

      default:
        this.logger.warn(`Unknown FundBraveToken event: ${eventName}`);
    }
  }

  // ==================== StakingPool Event Processing ====================

  private async processStakingPoolEvent(
    eventName: string,
    eventData: ethers.Log,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    const iface = new ethers.Interface(STAKING_POOL_ABI);
    const parsedLog = iface.parseLog(eventData);

    if (!parsedLog) {
      throw new Error(`Failed to parse ${eventName} event`);
    }

    switch (eventName) {
      case StakingPoolEvent.STAKED:
        // Get poolAddress from event data
        const poolAddress = eventData.address;
        const stakingStakedArgs: StakingPoolStakedEventArgs = {
          staker: parsedLog.args.staker,
          amount: parsedLog.args.amount,
          shares: parsedLog.args.shares || parsedLog.args.amount, // fallback if shares not in event
          poolAddress,
        };
        // Look up fundraiser by pool address or onChainId
        const fundraiserIdFromEvent = parsedLog.args.fundraiserId
          ? String(parsedLog.args.fundraiserId)
          : undefined;
        await this.stakingService.processStakedEvent(
          stakingStakedArgs,
          txHash,
          blockNumber,
          chainId,
          fundraiserIdFromEvent,
        );
        break;

      case StakingPoolEvent.UNSTAKED:
        const unstakedPoolAddress = eventData.address;
        const unstakedArgs: UnstakedEventArgs = {
          staker: parsedLog.args.staker,
          amount: parsedLog.args.amount,
          shares: parsedLog.args.shares || parsedLog.args.amount,
          poolAddress: unstakedPoolAddress,
        };
        await this.stakingService.processUnstakedEvent(unstakedArgs, txHash);
        break;

      case StakingPoolEvent.YIELD_SPLIT_SET:
        // YieldSplitSet event - this method may need to be added to StakingService
        // For now, log and skip
        this.logger.log(
          `YieldSplitSet event for staker ${parsedLog.args.staker}: ${parsedLog.args.causeShare}/${parsedLog.args.stakerShare}/${parsedLog.args.platformShare}`,
        );
        break;

      case StakingPoolEvent.YIELD_HARVESTED:
        // YieldHarvested event - this method may need to be added to StakingService
        // For now, log and skip
        this.logger.log(
          `YieldHarvested event: totalYield=${parsedLog.args.totalYield}, cause=${parsedLog.args.causeAmount}, staker=${parsedLog.args.stakerAmount}`,
        );
        break;

      default:
        this.logger.warn(`Unknown StakingPool event: ${eventName}`);
    }
  }

  // ==================== FundraiserFactory Event Processing ====================

  private async processFundraiserFactoryEvent(
    eventName: string,
    eventData: ethers.Log,
    txHash: string,
    blockNumber: number,
    chainId: number,
  ): Promise<void> {
    const iface = new ethers.Interface(FUNDRAISER_FACTORY_ABI);
    const parsedLog = iface.parseLog(eventData);

    if (!parsedLog) {
      this.logger.warn(`Failed to parse FundraiserFactory.${eventName} event`);
      return;
    }

    switch (eventName) {
      case 'FundraiserCreated':
        // Process new fundraiser creation
        this.logger.log(
          `FundraiserCreated: ID ${parsedLog.args.fundraiserId}, creator ${parsedLog.args.creator}`,
        );
        // Convert to FundraiserCreatedEventArgs format expected by the service
        await this.fundraisersService.processFundraiserCreatedEvent(
          {
            fundraiserId: parsedLog.args.fundraiserId,
            fundraiserAddress: eventData.address, // Contract address that emitted the event
            owner: parsedLog.args.creator,
            beneficiary: parsedLog.args.beneficiary,
            name: '', // Name not available in this event, will be updated later
            goalAmount: parsedLog.args.goalAmount,
            deadline: parsedLog.args.deadline,
          },
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case 'DonationReceived':
        // Process donation event from FundraiserFactory
        this.logger.log(
          `DonationReceived: Fundraiser ${parsedLog.args.fundraiserId}, donor ${parsedLog.args.donor}, amount ${parsedLog.args.amount}`,
        );
        await this.donationsService.processDonationReceivedEvent(
          {
            fundraiserId: parsedLog.args.fundraiserId,
            donor: parsedLog.args.donor,
            amount: parsedLog.args.amount,
            token: parsedLog.args.token || 'USDC',
            message: parsedLog.args.message,
          },
          txHash,
          blockNumber,
          chainId,
        );
        break;

      case 'FundsWithdrawn':
        // Process funds withdrawal - just log for now
        // The fundraiser service doesn't track withdrawals separately
        this.logger.log(
          `FundsWithdrawn: Fundraiser ${parsedLog.args.fundraiserId}, amount ${parsedLog.args.amount}, recipient ${parsedLog.args.recipient}`,
        );
        // Note: Withdrawals don't affect the donation records
        // They are a separate operation between beneficiary and raised funds
        break;

      default:
        this.logger.warn(`Unknown FundraiserFactory event: ${eventName}`);
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Update blockchain sync record
   */
  private async updateSyncRecord(
    contractName: ContractName,
    chainId: number,
    blockNumber: number,
  ): Promise<void> {
    const contractAddress = this.getContractAddress(contractName, chainId);
    const chainName = getChainName(chainId);

    await this.prisma.blockchainSync.upsert({
      where: {
        chainId_contractAddress: {
          chainId,
          contractAddress,
        },
      },
      update: {
        lastBlock: blockNumber,
        lastSyncAt: new Date(),
      },
      create: {
        chainId,
        chainName,
        contractAddress,
        contractName,
        lastBlock: blockNumber,
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Get contract address for a given chain
   * TODO: Load from contract registry or environment variables
   */
  private getContractAddress(
    contractName: ContractName,
    chainId: number,
  ): string {
    // This should be loaded from a contract registry or config
    // For now, return placeholder
    return `0x${contractName}_${chainId}`;
  }
}

// ==================== Contract ABIs ====================
// These should be imported from contract artifacts or stored in a separate file

const IMPACT_DAO_POOL_ABI = [
  'event Staked(address indexed staker, uint256 amount, uint16 daoShare, uint16 stakerShare, uint16 platformShare)',
  'event Unstaked(address indexed staker, uint256 amount)',
  'event YieldHarvested(uint256 totalYield, uint256 daoShare, uint256 stakerShare, uint256 platformShare)',
  'event YieldSplitSet(address indexed staker, uint16 daoShare, uint16 stakerShare, uint16 platformShare)',
  'event FBTRewardPaid(address indexed staker, uint256 amount)',
];

const WEALTH_BUILDING_ABI = [
  'event DonationMade(address indexed donor, uint256 indexed fundraiserId, uint256 totalAmount, uint256 directAmount, uint256 endowmentAmount, uint256 platformFee)',
  'event YieldHarvested(uint256 totalYield, uint256 causeAmount, uint256 donorAmount)',
  'event StockPurchased(address indexed donor, address indexed stockToken, uint256 usdcAmount, uint256 stockAmount)',
];

const PLATFORM_TREASURY_ABI = [
  'event FeeReceived(address indexed from, uint256 amount, string source)',
  'event FeesStaked(uint256 amount)',
  'event FBTStaked(address indexed staker, uint256 amount)',
  'event FBTUnstaked(address indexed staker, uint256 amount)',
  'event YieldClaimed(address indexed staker, uint256 amount)',
];

const FUND_BRAVE_TOKEN_ABI = [
  'event VestingScheduleCreated(address indexed recipient, uint256 indexed scheduleId, uint256 amount, uint256 duration, uint256 startTime)',
  'event VestedTokensClaimed(address indexed recipient, uint256 indexed scheduleId, uint256 amount)',
  'event TokensBurned(address indexed account, uint256 amount)',
];

const STAKING_POOL_ABI = [
  'event Staked(uint256 indexed fundraiserId, address indexed staker, uint256 amount)',
  'event Unstaked(uint256 indexed fundraiserId, address indexed staker, uint256 amount)',
  'event YieldSplitSet(uint256 indexed fundraiserId, address indexed staker, uint16 causeShare, uint16 stakerShare, uint16 platformShare)',
  'event YieldHarvested(uint256 indexed fundraiserId, uint256 totalYield, uint256 causeAmount, uint256 stakerAmount, uint256 platformAmount)',
];

const FUNDRAISER_FACTORY_ABI = [
  'event FundraiserCreated(uint256 indexed fundraiserId, address indexed creator, address beneficiary, uint256 goalAmount, uint256 deadline)',
  'event DonationReceived(uint256 indexed fundraiserId, address indexed donor, uint256 amount, address token, string message)',
  'event FundsWithdrawn(uint256 indexed fundraiserId, address indexed recipient, uint256 amount)',
];
