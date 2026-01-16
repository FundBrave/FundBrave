import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
}

export interface CategoryCount {
  __typename?: 'CategoryCount';
  category: Scalars['String']['output'];
  count: Scalars['Int']['output'];
}

export interface Comment {
  __typename?: 'Comment';
  author: PostAuthor;
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isLiked?: Maybe<Scalars['Boolean']['output']>;
  likesCount: Scalars['Int']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  postId: Scalars['ID']['output'];
  replies: Array<Comment>;
  updatedAt: Scalars['DateTime']['output'];
}

export interface Conversation {
  __typename?: 'Conversation';
  /** Timestamp when the conversation was created */
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** The most recent message in the conversation */
  lastMessage?: Maybe<Message>;
  /** Timestamp of the last message in the conversation */
  lastMessageAt?: Maybe<Scalars['DateTime']['output']>;
  /** Participants in this conversation */
  participants: Array<ConversationParticipant>;
  /** Total number of unread messages for the current user */
  unreadCount: Scalars['Int']['output'];
  /** Timestamp when the conversation was last updated */
  updatedAt: Scalars['DateTime']['output'];
}

export interface ConversationParticipant {
  __typename?: 'ConversationParticipant';
  id: Scalars['ID']['output'];
  /** Timestamp when the user joined the conversation */
  joinedAt: Scalars['DateTime']['output'];
  /** Timestamp when the user last read messages */
  lastReadAt?: Maybe<Scalars['DateTime']['output']>;
  /** Count of unread messages for this participant */
  unreadCount: Scalars['Int']['output'];
  /** The participant user */
  user: UserMinimal;
}

export interface ConversationUnreadCount {
  __typename?: 'ConversationUnreadCount';
  conversationId: Scalars['ID']['output'];
  /** Preview of the last unread message */
  lastMessagePreview?: Maybe<Scalars['String']['output']>;
  /** Sender of the last unread message */
  lastMessageSender?: Maybe<UserMinimal>;
  unreadCount: Scalars['Int']['output'];
}

export interface CreateCommentInput {
  content: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
}

export interface CreateDaoProposalInput {
  category: ProposalCategory;
  description: Scalars['String']['input'];
  quorumRequired: Scalars['String']['input'];
  targetFundraisers?: InputMaybe<Array<FundraiserAllocationInput>>;
  title: Scalars['String']['input'];
  votingDurationHours: Scalars['Int']['input'];
}

export interface CreateFundraiserInput {
  beneficiary: Scalars['String']['input'];
  categories: Array<Scalars['String']['input']>;
  currency?: Scalars['String']['input'];
  deadline: Scalars['String']['input'];
  description: Scalars['String']['input'];
  goalAmount: Scalars['String']['input'];
  images: Array<Scalars['String']['input']>;
  milestones?: InputMaybe<Array<CreateMilestoneInput>>;
  name: Scalars['String']['input'];
  region?: InputMaybe<Scalars['String']['input']>;
}

export interface CreateFundraiserUpdateInput {
  content: Scalars['String']['input'];
  mediaUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
}

export interface CreateMilestoneInput {
  description?: InputMaybe<Scalars['String']['input']>;
  targetAmount: Scalars['String']['input'];
  title: Scalars['String']['input'];
}

export interface CreatePostInput {
  content?: InputMaybe<Scalars['String']['input']>;
  fundraiserId?: InputMaybe<Scalars['String']['input']>;
  mediaUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  mentions?: InputMaybe<Array<Scalars['String']['input']>>;
  parentId?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  type?: PostType;
  visibility?: PostVisibility;
}

export interface CreateReportInput {
  description?: InputMaybe<Scalars['String']['input']>;
  entityId?: InputMaybe<Scalars['String']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  postId?: InputMaybe<Scalars['String']['input']>;
  reason: ReportReason;
  reportedId: Scalars['String']['input'];
}

export interface DaoProposal {
  __typename?: 'DAOProposal';
  category: ProposalCategory;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  executedAt?: Maybe<Scalars['DateTime']['output']>;
  executionTxHash?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isPassing: Scalars['Boolean']['output'];
  isQuorumReached: Scalars['Boolean']['output'];
  proposerAddress: Scalars['String']['output'];
  proposerUsername?: Maybe<Scalars['String']['output']>;
  quorumRequired: Scalars['String']['output'];
  status: ProposalStatus;
  targetFundraisers?: Maybe<Array<FundraiserAllocation>>;
  timeRemaining: Scalars['String']['output'];
  title: Scalars['String']['output'];
  totalVotesAbstain: Scalars['String']['output'];
  totalVotesAgainst: Scalars['String']['output'];
  totalVotesFor: Scalars['String']['output'];
  totalVotingPower: Scalars['String']['output'];
  votersCount: Scalars['Int']['output'];
  votingEndTime: Scalars['DateTime']['output'];
  votingStartTime: Scalars['DateTime']['output'];
}

export interface DaoProposalCreatedPayload {
  __typename?: 'DAOProposalCreatedPayload';
  proposal: DaoProposal;
}

export interface DaoProposalStatusChangedPayload {
  __typename?: 'DAOProposalStatusChangedPayload';
  newStatus: ProposalStatus;
  previousStatus: ProposalStatus;
  proposalId: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
}

export interface DaoVote {
  __typename?: 'DAOVote';
  choice: VoteChoice;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  proposalId: Scalars['String']['output'];
  signature?: Maybe<Scalars['String']['output']>;
  voterAddress: Scalars['String']['output'];
  voterUsername?: Maybe<Scalars['String']['output']>;
  votingPower: Scalars['String']['output'];
  votingPowerPercent: Scalars['String']['output'];
}

export interface DaoVoteCastPayload {
  __typename?: 'DAOVoteCastPayload';
  choice: VoteChoice;
  proposalId: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  voterAddress: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
}

export interface DaoVotingStats {
  __typename?: 'DAOVotingStats';
  activeProposals: Scalars['Int']['output'];
  averageParticipationRate: Scalars['String']['output'];
  executedProposals: Scalars['Int']['output'];
  passedProposals: Scalars['Int']['output'];
  rejectedProposals: Scalars['Int']['output'];
  totalProposals: Scalars['Int']['output'];
  totalVotingPowerUsed: Scalars['String']['output'];
  uniqueVoters: Scalars['Int']['output'];
}

export interface Donation {
  __typename?: 'Donation';
  amount: Scalars['String']['output'];
  amountUSD: Scalars['String']['output'];
  blockNumber?: Maybe<Scalars['Float']['output']>;
  chainId: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  donor: DonorInfo;
  fundraiser: FundraiserBasicInfo;
  id: Scalars['ID']['output'];
  indexedAt: Scalars['DateTime']['output'];
  isAnonymous: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  sourceChain: Scalars['String']['output'];
  token: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
}

export interface DonationFilterInput {
  chainId?: InputMaybe<Scalars['Int']['input']>;
  donorAddress?: InputMaybe<Scalars['String']['input']>;
  donorId?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  fundraiserId?: InputMaybe<Scalars['String']['input']>;
  maxAmount?: InputMaybe<Scalars['String']['input']>;
  minAmount?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
}

export interface DonationLeaderboard {
  __typename?: 'DonationLeaderboard';
  entries: Array<DonationLeaderboardEntry>;
  period: Scalars['String']['output'];
  total: Scalars['Int']['output'];
}

export interface DonationLeaderboardEntry {
  __typename?: 'DonationLeaderboardEntry';
  donationsCount: Scalars['Int']['output'];
  donor: DonorInfo;
  rank: Scalars['Int']['output'];
  totalDonated: Scalars['String']['output'];
}

export type DonationSortBy =
  | 'AMOUNT'
  | 'CREATED_AT';

export interface DonationStats {
  __typename?: 'DonationStats';
  averageDonation: Scalars['String']['output'];
  donationsCount: Scalars['Int']['output'];
  largestDonation: Scalars['String']['output'];
  lastDonationAt?: Maybe<Scalars['DateTime']['output']>;
  totalDonated: Scalars['String']['output'];
  uniqueDonorsCount: Scalars['Int']['output'];
}

export interface DonorInfo {
  __typename?: 'DonorInfo';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isAnonymous: Scalars['Boolean']['output'];
  username?: Maybe<Scalars['String']['output']>;
  walletAddress: Scalars['String']['output'];
}

export interface EndowmentInfo {
  __typename?: 'EndowmentInfo';
  causeYieldPaid: Scalars['String']['output'];
  donationId: Scalars['String']['output'];
  donorAddress: Scalars['String']['output'];
  donorStockValue: Scalars['String']['output'];
  fundraiserId: Scalars['Int']['output'];
  lastHarvestTime?: Maybe<Scalars['DateTime']['output']>;
  lifetimeYield: Scalars['String']['output'];
  pendingCauseYield: Scalars['String']['output'];
  pendingDonorYield: Scalars['String']['output'];
  principal: Scalars['String']['output'];
}

export interface EndowmentYieldHarvestedPayload {
  __typename?: 'EndowmentYieldHarvestedPayload';
  causeShare: Scalars['String']['output'];
  donationId: Scalars['String']['output'];
  donorShare: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  txHash: Scalars['String']['output'];
  yieldAmount: Scalars['String']['output'];
}

export interface FbtBurnEvent {
  __typename?: 'FBTBurnEvent';
  amount: Scalars['String']['output'];
  burnedAt: Scalars['DateTime']['output'];
  burnerAddress: Scalars['String']['output'];
  id: Scalars['String']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  txHash: Scalars['String']['output'];
}

export interface FbtBurnedPayload {
  __typename?: 'FBTBurnedPayload';
  amount: Scalars['String']['output'];
  burnerAddress: Scalars['String']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  txHash: Scalars['String']['output'];
}

export interface FbtStake {
  __typename?: 'FBTStake';
  amount: Scalars['String']['output'];
  claimedYield: Scalars['String']['output'];
  id: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  pendingYield: Scalars['String']['output'];
  shareOfTreasury: Scalars['String']['output'];
  stakedAt: Scalars['DateTime']['output'];
  stakerAddress: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
  unstakedAt?: Maybe<Scalars['DateTime']['output']>;
}

export interface FbtStakeUpdatedPayload {
  __typename?: 'FBTStakeUpdatedPayload';
  eventType: Scalars['String']['output'];
  stake: FbtStake;
}

export interface FbtStaker {
  __typename?: 'FBTStaker';
  address: Scalars['String']['output'];
  amount: Scalars['String']['output'];
  avatarUrl?: Maybe<Scalars['String']['output']>;
  pendingYield: Scalars['String']['output'];
  shareOfTreasury: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
}

export interface FeeReceivedPayload {
  __typename?: 'FeeReceivedPayload';
  amount: Scalars['String']['output'];
  sourceContract: Scalars['String']['output'];
  sourceType: FeeSourceType;
  timestamp: Scalars['DateTime']['output'];
  txHash: Scalars['String']['output'];
}

/** Source of platform fees */
export type FeeSourceType =
  | 'FUNDRAISER'
  | 'IMPACT_DAO_POOL'
  | 'OTHER'
  | 'STAKING_POOL'
  | 'WEALTH_BUILDING';

export interface Feed {
  __typename?: 'Feed';
  hasMore: Scalars['Boolean']['output'];
  nextCursor?: Maybe<Scalars['String']['output']>;
  posts: Array<Post>;
}

export type FeedType =
  | 'EXPLORE'
  | 'FOLLOWING'
  | 'HOME';

export interface FollowRelation {
  __typename?: 'FollowRelation';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  user: UserMinimal;
}

export interface Fundraiser {
  __typename?: 'Fundraiser';
  beneficiary: Scalars['String']['output'];
  categories: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  creator: FundraiserCreator;
  currency: Scalars['String']['output'];
  deadline: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  endowmentEnabled: Scalars['Boolean']['output'];
  goalAmount: Scalars['String']['output'];
  goalReached: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  images: Array<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isFeatured: Scalars['Boolean']['output'];
  milestones?: Maybe<Array<FundraiserMilestone>>;
  name: Scalars['String']['output'];
  onChainId: Scalars['Int']['output'];
  raisedAmount: Scalars['String']['output'];
  region?: Maybe<Scalars['String']['output']>;
  stakingPoolAddr?: Maybe<Scalars['String']['output']>;
  stats: FundraiserStats;
  txHash: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updates?: Maybe<Array<FundraiserUpdate>>;
}

export interface FundraiserAllocation {
  __typename?: 'FundraiserAllocation';
  allocationBps: Scalars['Int']['output'];
  allocationPercent: Scalars['String']['output'];
  fundraiserId: Scalars['Int']['output'];
  fundraiserName: Scalars['String']['output'];
}

export interface FundraiserAllocationInput {
  allocationBps: Scalars['Int']['input'];
  fundraiserId: Scalars['Int']['input'];
}

export interface FundraiserBasicInfo {
  __typename?: 'FundraiserBasicInfo';
  id: Scalars['ID']['output'];
  images: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  onChainId: Scalars['Int']['output'];
}

export interface FundraiserCreator {
  __typename?: 'FundraiserCreator';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isVerifiedCreator: Scalars['Boolean']['output'];
  username?: Maybe<Scalars['String']['output']>;
  walletAddress: Scalars['String']['output'];
}

export interface FundraiserFilterInput {
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  creatorId?: InputMaybe<Scalars['String']['input']>;
  endowmentEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  goalReached?: InputMaybe<Scalars['Boolean']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isFeatured?: InputMaybe<Scalars['Boolean']['input']>;
  maxGoalAmount?: InputMaybe<Scalars['String']['input']>;
  minGoalAmount?: InputMaybe<Scalars['String']['input']>;
  regions?: InputMaybe<Array<Scalars['String']['input']>>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
}

export interface FundraiserMilestone {
  __typename?: 'FundraiserMilestone';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isReached: Scalars['Boolean']['output'];
  reachedAt?: Maybe<Scalars['DateTime']['output']>;
  targetAmount: Scalars['String']['output'];
  title: Scalars['String']['output'];
}

export interface FundraiserMinimal {
  __typename?: 'FundraiserMinimal';
  deadline: Scalars['DateTime']['output'];
  donorsCount: Scalars['Int']['output'];
  goalAmount: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  images: Array<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  onChainId: Scalars['Int']['output'];
  raisedAmount: Scalars['String']['output'];
}

export type FundraiserSortBy =
  | 'CREATED_AT'
  | 'DEADLINE'
  | 'DONORS_COUNT'
  | 'GOAL_AMOUNT'
  | 'RAISED_AMOUNT';

export interface FundraiserSortInput {
  order?: SortOrder;
  sortBy?: FundraiserSortBy;
}

export interface FundraiserStakingInfo {
  __typename?: 'FundraiserStakingInfo';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  onChainId: Scalars['Int']['output'];
  stakingPoolAddr?: Maybe<Scalars['String']['output']>;
}

export interface FundraiserStats {
  __typename?: 'FundraiserStats';
  avgDonation: Scalars['String']['output'];
  daysLeft: Scalars['Int']['output'];
  donorsCount: Scalars['Int']['output'];
  endowmentPrincipal?: Maybe<Scalars['String']['output']>;
  endowmentYield?: Maybe<Scalars['String']['output']>;
  percentageRaised: Scalars['Float']['output'];
  stakersCount: Scalars['Int']['output'];
  totalDonations: Scalars['String']['output'];
  totalStaked: Scalars['String']['output'];
  updatesCount: Scalars['Int']['output'];
}

export interface FundraiserUpdate {
  __typename?: 'FundraiserUpdate';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  mediaUrls: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
}

export interface FundraisersMinimalResponse {
  __typename?: 'FundraisersMinimalResponse';
  hasMore: Scalars['Boolean']['output'];
  items: Array<FundraiserMinimal>;
  total: Scalars['Int']['output'];
}

export interface GetMessagesInput {
  /** Cursor-based pagination: get messages after this message ID */
  afterMessageId?: InputMaybe<Scalars['ID']['input']>;
  /** Cursor-based pagination: get messages before this message ID */
  beforeMessageId?: InputMaybe<Scalars['ID']['input']>;
  /** The ID of the conversation to retrieve messages from */
  conversationId: Scalars['ID']['input'];
  /** Maximum number of messages to retrieve (default: 50) */
  limit?: Scalars['Int']['input'];
  /** Number of messages to skip for pagination (default: 0) */
  offset?: Scalars['Int']['input'];
}

export interface GetNotificationsInput {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  types?: InputMaybe<Array<NotificationType>>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
}

export interface GetReportsInput {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  reason?: InputMaybe<ReportReason>;
  reportedId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ReportStatus>;
}

export interface GlobalPoolEpoch {
  __typename?: 'GlobalPoolEpoch';
  distributionTx?: Maybe<Scalars['String']['output']>;
  endDate: Scalars['DateTime']['output'];
  epochNumber: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  isCalculated: Scalars['Boolean']['output'];
  isDistributed: Scalars['Boolean']['output'];
  startDate: Scalars['DateTime']['output'];
  totalYield: Scalars['String']['output'];
}

export interface GlobalPoolStats {
  __typename?: 'GlobalPoolStats';
  apy: Scalars['String']['output'];
  currentEpoch: Scalars['Float']['output'];
  nextEpochStartDate?: Maybe<Scalars['DateTime']['output']>;
  pendingYield: Scalars['String']['output'];
  stakersCount: Scalars['Int']['output'];
  totalStaked: Scalars['String']['output'];
  totalYieldDistributed: Scalars['String']['output'];
}

export interface GlobalPoolVoteAllocation {
  __typename?: 'GlobalPoolVoteAllocation';
  fundraiserId: Scalars['ID']['output'];
  fundraiserName: Scalars['String']['output'];
  percentage: Scalars['Float']['output'];
  weight: Scalars['String']['output'];
}

export interface GlobalPoolVoteInput {
  allocations: Array<VoteAllocationInput>;
  epochNumber: Scalars['Int']['input'];
}

export interface ImpactDaoRecordStakeInput {
  txHash: Scalars['String']['input'];
}

export interface ImpactDaoStake {
  __typename?: 'ImpactDAOStake';
  claimedFBTReward: Scalars['String']['output'];
  claimedUSDCYield: Scalars['String']['output'];
  id: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  pendingFBTReward: Scalars['String']['output'];
  pendingUSDCYield: Scalars['String']['output'];
  principal: Scalars['String']['output'];
  stakedAt: Scalars['DateTime']['output'];
  stakerAddress: Scalars['String']['output'];
  unstakedAt?: Maybe<Scalars['DateTime']['output']>;
  yieldSplit: YieldSplit;
}

export interface ImpactDaoStakeUpdatedPayload {
  __typename?: 'ImpactDAOStakeUpdatedPayload';
  eventType: Scalars['String']['output'];
  stake: ImpactDaoStake;
}

export interface ImpactDaoStaker {
  __typename?: 'ImpactDAOStaker';
  address: Scalars['String']['output'];
  avatarUrl?: Maybe<Scalars['String']['output']>;
  pendingFBTReward: Scalars['String']['output'];
  pendingYield: Scalars['String']['output'];
  principal: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
  yieldSplit: YieldSplit;
}

export interface ImpactDaoStats {
  __typename?: 'ImpactDAOStats';
  defaultYieldSplit: YieldSplit;
  lastHarvestAt?: Maybe<Scalars['DateTime']['output']>;
  pendingYield: Scalars['String']['output'];
  periodFinish?: Maybe<Scalars['DateTime']['output']>;
  rewardRate: Scalars['String']['output'];
  rewardsDuration: Scalars['Int']['output'];
  stakersCount: Scalars['Int']['output'];
  totalFBTDistributed: Scalars['String']['output'];
  totalStakedPrincipal: Scalars['String']['output'];
  totalYieldHarvested: Scalars['String']['output'];
}

export interface ImpactDaoYieldHarvest {
  __typename?: 'ImpactDAOYieldHarvest';
  blockNumber?: Maybe<Scalars['Int']['output']>;
  daoAmount: Scalars['String']['output'];
  harvestedAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  platformAmount: Scalars['String']['output'];
  stakeId: Scalars['String']['output'];
  stakerAmount: Scalars['String']['output'];
  totalYield: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
}

export interface ImpactDaoYieldHarvestedPayload {
  __typename?: 'ImpactDAOYieldHarvestedPayload';
  daoAmount: Scalars['String']['output'];
  platformAmount: Scalars['String']['output'];
  stakerAmount: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  totalYield: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
}

export type LeaderboardPeriod =
  | 'ALL'
  | 'NINETY_DAYS'
  | 'SEVEN_DAYS'
  | 'THIRTY_DAYS';

export interface MarkMessagesReadInput {
  /** The ID of the conversation to mark messages as read */
  conversationId: Scalars['ID']['input'];
  /** Optional: mark messages up to this specific message ID as read */
  upToMessageId?: InputMaybe<Scalars['ID']['input']>;
}

export interface MarkNotificationsReadInput {
  notificationIds: Array<Scalars['ID']['input']>;
}

export interface MarkReadResult {
  __typename?: 'MarkReadResult';
  /** The conversation ID */
  conversationId: Scalars['ID']['output'];
  /** Number of messages marked as read */
  messagesMarkedRead: Scalars['Int']['output'];
  /** Whether the operation was successful */
  success: Scalars['Boolean']['output'];
}

export interface Message {
  __typename?: 'Message';
  /** The text content of the message */
  content: Scalars['String']['output'];
  /** The ID of the conversation this message belongs to */
  conversationId: Scalars['ID']['output'];
  /** Timestamp when the message was created */
  createdAt: Scalars['DateTime']['output'];
  /** Current delivery status of the message */
  deliveryStatus: MessageDeliveryStatus;
  id: Scalars['ID']['output'];
  /** Optional media URL attached to the message */
  mediaUrl?: Maybe<Scalars['String']['output']>;
  /** Whether the message has been read by the recipient */
  read: Scalars['Boolean']['output'];
  /** Timestamp when the message was read */
  readAt?: Maybe<Scalars['DateTime']['output']>;
  /** The user who received the message */
  receiver: UserMinimal;
  /** The user who sent the message */
  sender: UserMinimal;
}

/** The delivery status of a message */
export type MessageDeliveryStatus =
  | 'DELIVERED'
  | 'READ'
  | 'SENT';

export type ModerationAction =
  | 'BAN_USER'
  | 'HIDE_CONTENT'
  | 'NONE'
  | 'REMOVE_CONTENT'
  | 'SUSPEND_USER'
  | 'WARNING';

export interface ModerationStats {
  __typename?: 'ModerationStats';
  pendingReports: Scalars['Int']['output'];
  resolvedThisWeek: Scalars['Int']['output'];
  reviewedToday: Scalars['Int']['output'];
  totalReports: Scalars['Int']['output'];
}

export interface Mutation {
  __typename?: 'Mutation';
  addFundraiserUpdate: FundraiserUpdate;
  addMilestone: FundraiserMilestone;
  blockUser: Scalars['Boolean']['output'];
  bookmarkPost: Scalars['Boolean']['output'];
  /** Close a DAO proposal and determine outcome (admin only) */
  closeDAOProposal: DaoProposal;
  createComment: Comment;
  /** Create a new DAO proposal */
  createDAOProposal: DaoProposal;
  createFundraiser: Fundraiser;
  createPost: Post;
  createReport: ReportOperationResult;
  deleteAllNotifications: NotificationOperationResult;
  deleteComment: Scalars['Boolean']['output'];
  deleteNotification: NotificationOperationResult;
  deletePost: Scalars['Boolean']['output'];
  dismissReport: ReportOperationResult;
  /** Execute a passed yield distribution proposal (admin only) */
  executeYieldDistribution: DaoProposal;
  followUser: Scalars['Boolean']['output'];
  forceRecalculateTrending: Scalars['Boolean']['output'];
  likeComment: Scalars['Boolean']['output'];
  likePost: Scalars['Boolean']['output'];
  markAllNotificationsAsRead: NotificationOperationResult;
  /** Mark messages as read in a conversation */
  markMessagesAsRead: MarkReadResult;
  markNotificationAsRead: NotificationOperationResult;
  markNotificationsAsRead: NotificationOperationResult;
  processUnstake: Scalars['Boolean']['output'];
  recordDonation: Donation;
  /** Record a stake transaction hash for tracking */
  recordImpactDAOStake: Scalars['Boolean']['output'];
  recordStake: Stake;
  removeBookmark: Scalars['Boolean']['output'];
  removeRepost: Scalars['Boolean']['output'];
  repost: Scalars['Boolean']['output'];
  reviewReport: ReportOperationResult;
  /** Send a direct message to a user (creates conversation if needed) */
  sendDirectMessage: Message;
  /** Send a message in a conversation */
  sendMessage: Message;
  /** Send typing indicator to a conversation */
  sendTypingIndicator: Scalars['Boolean']['output'];
  /** Start a new conversation with a user (or get existing one) */
  startConversation: Conversation;
  submitGlobalPoolVotes: UserGlobalPoolVotes;
  unblockUser: Scalars['Boolean']['output'];
  unfollowUser: Scalars['Boolean']['output'];
  unlikeComment: Scalars['Boolean']['output'];
  unlikePost: Scalars['Boolean']['output'];
  updateFundraiser: Fundraiser;
  updateNotificationSettings: NotificationSettings;
  updatePost: Post;
  updateProfile: User;
  /** Vote on a DAO proposal */
  voteOnProposal: DaoVote;
}


export interface MutationAddFundraiserUpdateArgs {
  fundraiserId: Scalars['ID']['input'];
  input: CreateFundraiserUpdateInput;
}


export interface MutationAddMilestoneArgs {
  fundraiserId: Scalars['ID']['input'];
  input: CreateMilestoneInput;
}


export interface MutationBlockUserArgs {
  reason?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
}


export interface MutationBookmarkPostArgs {
  postId: Scalars['ID']['input'];
}


export interface MutationCloseDaoProposalArgs {
  proposalId: Scalars['String']['input'];
}


export interface MutationCreateCommentArgs {
  input: CreateCommentInput;
}


export interface MutationCreateDaoProposalArgs {
  input: CreateDaoProposalInput;
}


export interface MutationCreateFundraiserArgs {
  input: CreateFundraiserInput;
  onChainId: Scalars['Int']['input'];
  txHash: Scalars['String']['input'];
}


export interface MutationCreatePostArgs {
  input: CreatePostInput;
}


export interface MutationCreateReportArgs {
  input: CreateReportInput;
}


export interface MutationDeleteCommentArgs {
  commentId: Scalars['ID']['input'];
}


export interface MutationDeleteNotificationArgs {
  notificationId: Scalars['ID']['input'];
}


export interface MutationDeletePostArgs {
  postId: Scalars['ID']['input'];
}


export interface MutationDismissReportArgs {
  reportId: Scalars['ID']['input'];
}


export interface MutationExecuteYieldDistributionArgs {
  executionTxHash: Scalars['String']['input'];
  proposalId: Scalars['String']['input'];
}


export interface MutationFollowUserArgs {
  userId: Scalars['ID']['input'];
}


export interface MutationLikeCommentArgs {
  commentId: Scalars['ID']['input'];
}


export interface MutationLikePostArgs {
  postId: Scalars['ID']['input'];
}


export interface MutationMarkMessagesAsReadArgs {
  input: MarkMessagesReadInput;
}


export interface MutationMarkNotificationAsReadArgs {
  notificationId: Scalars['ID']['input'];
}


export interface MutationMarkNotificationsAsReadArgs {
  input: MarkNotificationsReadInput;
}


export interface MutationProcessUnstakeArgs {
  input: UnstakeInput;
}


export interface MutationRecordDonationArgs {
  input: RecordDonationInput;
}


export interface MutationRecordImpactDaoStakeArgs {
  input: ImpactDaoRecordStakeInput;
}


export interface MutationRecordStakeArgs {
  input: RecordStakeInput;
}


export interface MutationRemoveBookmarkArgs {
  postId: Scalars['ID']['input'];
}


export interface MutationRemoveRepostArgs {
  postId: Scalars['ID']['input'];
}


export interface MutationRepostArgs {
  input: RepostInput;
}


export interface MutationReviewReportArgs {
  input: ReviewReportInput;
}


export interface MutationSendDirectMessageArgs {
  input: SendDirectMessageInput;
}


export interface MutationSendMessageArgs {
  input: SendMessageInput;
}


export interface MutationSendTypingIndicatorArgs {
  conversationId: Scalars['ID']['input'];
  isTyping: Scalars['Boolean']['input'];
}


export interface MutationStartConversationArgs {
  input: StartConversationInput;
}


export interface MutationSubmitGlobalPoolVotesArgs {
  input: GlobalPoolVoteInput;
}


export interface MutationUnblockUserArgs {
  userId: Scalars['ID']['input'];
}


export interface MutationUnfollowUserArgs {
  userId: Scalars['ID']['input'];
}


export interface MutationUnlikeCommentArgs {
  commentId: Scalars['ID']['input'];
}


export interface MutationUnlikePostArgs {
  postId: Scalars['ID']['input'];
}


export interface MutationUpdateFundraiserArgs {
  fundraiserId: Scalars['ID']['input'];
  input: UpdateFundraiserInput;
}


export interface MutationUpdateNotificationSettingsArgs {
  input: UpdateNotificationSettingsInput;
}


export interface MutationUpdatePostArgs {
  input: UpdatePostInput;
  postId: Scalars['ID']['input'];
}


export interface MutationUpdateProfileArgs {
  input: UpdateProfileInput;
}


export interface MutationVoteOnProposalArgs {
  input: VoteOnProposalInput;
}

export interface Notification {
  __typename?: 'Notification';
  actor?: Maybe<NotificationActor>;
  createdAt: Scalars['DateTime']['output'];
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  read: Scalars['Boolean']['output'];
  readAt?: Maybe<Scalars['DateTime']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  type: NotificationType;
}

export interface NotificationActor {
  __typename?: 'NotificationActor';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  username?: Maybe<Scalars['String']['output']>;
  walletAddress: Scalars['String']['output'];
}

export interface NotificationCount {
  __typename?: 'NotificationCount';
  total: Scalars['Int']['output'];
  unread: Scalars['Int']['output'];
}

export interface NotificationOperationResult {
  __typename?: 'NotificationOperationResult';
  affectedCount?: Maybe<Scalars['Int']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
}

export interface NotificationSettings {
  __typename?: 'NotificationSettings';
  emailEnabled: Scalars['Boolean']['output'];
  notifyOnComment: Scalars['Boolean']['output'];
  notifyOnDAOProposal: Scalars['Boolean']['output'];
  notifyOnDonation: Scalars['Boolean']['output'];
  notifyOnFBTVesting: Scalars['Boolean']['output'];
  notifyOnFollow: Scalars['Boolean']['output'];
  notifyOnLike: Scalars['Boolean']['output'];
  notifyOnMention: Scalars['Boolean']['output'];
  notifyOnStake: Scalars['Boolean']['output'];
  notifyOnStockPurchase: Scalars['Boolean']['output'];
  notifyOnYieldHarvest: Scalars['Boolean']['output'];
  pushEnabled: Scalars['Boolean']['output'];
}

export type NotificationType =
  | 'COMMENT'
  | 'DAO_VOTE_ENDED'
  | 'DAO_VOTE_STARTED'
  | 'DONATION_RECEIVED'
  | 'FBT_REWARD'
  | 'FBT_VESTED'
  | 'FOLLOW'
  | 'GOAL_REACHED'
  | 'LIKE'
  | 'MENTION'
  | 'MESSAGE'
  | 'MILESTONE_REACHED'
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_EXECUTED'
  | 'REPOST'
  | 'STAKE_RECEIVED'
  | 'STOCK_PURCHASED'
  | 'SYSTEM'
  | 'YIELD_HARVESTED';

export interface PaginatedComments {
  __typename?: 'PaginatedComments';
  hasMore: Scalars['Boolean']['output'];
  items: Array<Comment>;
  total: Scalars['Int']['output'];
}

export interface PaginatedConversations {
  __typename?: 'PaginatedConversations';
  /** Whether there are more conversations to load */
  hasMore: Scalars['Boolean']['output'];
  /** List of conversations */
  items: Array<Conversation>;
  /** Total number of conversations */
  total: Scalars['Int']['output'];
}

export interface PaginatedDaoProposals {
  __typename?: 'PaginatedDAOProposals';
  hasMore: Scalars['Boolean']['output'];
  items: Array<DaoProposal>;
  total: Scalars['Int']['output'];
}

export interface PaginatedDaoVotes {
  __typename?: 'PaginatedDAOVotes';
  hasMore: Scalars['Boolean']['output'];
  items: Array<DaoVote>;
  total: Scalars['Int']['output'];
}

export interface PaginatedDonations {
  __typename?: 'PaginatedDonations';
  hasMore: Scalars['Boolean']['output'];
  items: Array<Donation>;
  total: Scalars['Int']['output'];
}

export interface PaginatedFbtBurns {
  __typename?: 'PaginatedFBTBurns';
  hasMore: Scalars['Boolean']['output'];
  items: Array<FbtBurnEvent>;
  total: Scalars['Int']['output'];
}

export interface PaginatedFbtStakers {
  __typename?: 'PaginatedFBTStakers';
  hasMore: Scalars['Boolean']['output'];
  items: Array<FbtStaker>;
  total: Scalars['Int']['output'];
}

export interface PaginatedFollows {
  __typename?: 'PaginatedFollows';
  hasMore: Scalars['Boolean']['output'];
  items: Array<FollowRelation>;
  total: Scalars['Int']['output'];
}

export interface PaginatedFundraisers {
  __typename?: 'PaginatedFundraisers';
  hasMore: Scalars['Boolean']['output'];
  items: Array<Fundraiser>;
  total: Scalars['Int']['output'];
}

export interface PaginatedImpactDaoStakers {
  __typename?: 'PaginatedImpactDAOStakers';
  hasMore: Scalars['Boolean']['output'];
  items: Array<ImpactDaoStaker>;
  total: Scalars['Int']['output'];
}

export interface PaginatedMessages {
  __typename?: 'PaginatedMessages';
  /** Whether there are more messages to load */
  hasMore: Scalars['Boolean']['output'];
  /** List of messages */
  items: Array<Message>;
  /** ID of the newest message in this batch (for cursor pagination) */
  newestMessageId?: Maybe<Scalars['ID']['output']>;
  /** ID of the oldest message in this batch (for cursor pagination) */
  oldestMessageId?: Maybe<Scalars['ID']['output']>;
  /** Total number of messages in the conversation */
  total: Scalars['Int']['output'];
}

export interface PaginatedNotifications {
  __typename?: 'PaginatedNotifications';
  hasMore: Scalars['Boolean']['output'];
  items: Array<Notification>;
  total: Scalars['Int']['output'];
  unreadCount: Scalars['Int']['output'];
}

export interface PaginatedPlatformFees {
  __typename?: 'PaginatedPlatformFees';
  hasMore: Scalars['Boolean']['output'];
  items: Array<PlatformFee>;
  total: Scalars['Int']['output'];
}

export interface PaginatedPosts {
  __typename?: 'PaginatedPosts';
  hasMore: Scalars['Boolean']['output'];
  items: Array<Post>;
  total: Scalars['Int']['output'];
}

export interface PaginatedReports {
  __typename?: 'PaginatedReports';
  hasMore: Scalars['Boolean']['output'];
  items: Array<Report>;
  total: Scalars['Int']['output'];
}

export interface PaginatedStakes {
  __typename?: 'PaginatedStakes';
  hasMore: Scalars['Boolean']['output'];
  items: Array<Stake>;
  total: Scalars['Int']['output'];
}

export interface PaginatedStockPurchases {
  __typename?: 'PaginatedStockPurchases';
  hasMore: Scalars['Boolean']['output'];
  items: Array<StockPurchaseEvent>;
  total: Scalars['Int']['output'];
}

export interface PaginatedUsers {
  __typename?: 'PaginatedUsers';
  hasMore: Scalars['Boolean']['output'];
  items: Array<User>;
  total: Scalars['Int']['output'];
}

export interface PaginatedVestingClaims {
  __typename?: 'PaginatedVestingClaims';
  hasMore: Scalars['Boolean']['output'];
  items: Array<VestingClaimEvent>;
  total: Scalars['Int']['output'];
}

export interface PaginatedVestingSchedules {
  __typename?: 'PaginatedVestingSchedules';
  hasMore: Scalars['Boolean']['output'];
  items: Array<VestingSchedule>;
  total: Scalars['Int']['output'];
}

export interface PaginatedWealthBuildingDonations {
  __typename?: 'PaginatedWealthBuildingDonations';
  hasMore: Scalars['Boolean']['output'];
  items: Array<WealthBuildingDonation>;
  total: Scalars['Int']['output'];
}

export interface PaginatedYieldHarvests {
  __typename?: 'PaginatedYieldHarvests';
  hasMore: Scalars['Boolean']['output'];
  items: Array<ImpactDaoYieldHarvest>;
  total: Scalars['Int']['output'];
}

export interface PendingEndowmentYield {
  __typename?: 'PendingEndowmentYield';
  causeYield: Scalars['String']['output'];
  donationId: Scalars['String']['output'];
  donorYield: Scalars['String']['output'];
  fundraiserId: Scalars['Int']['output'];
  totalYield: Scalars['String']['output'];
}

export interface PendingStakingRewards {
  __typename?: 'PendingStakingRewards';
  fbtRewards: Scalars['String']['output'];
  totalValueUSD: Scalars['String']['output'];
  usdcYield: Scalars['String']['output'];
}

export interface PendingYield {
  __typename?: 'PendingYield';
  daoShare: Scalars['String']['output'];
  platformShare: Scalars['String']['output'];
  stakerShare: Scalars['String']['output'];
  totalYield: Scalars['String']['output'];
}

export interface PlatformFee {
  __typename?: 'PlatformFee';
  amount: Scalars['String']['output'];
  blockNumber?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  isStaked: Scalars['Boolean']['output'];
  receivedAt: Scalars['DateTime']['output'];
  sourceContract: Scalars['String']['output'];
  sourceType: FeeSourceType;
  stakedAt?: Maybe<Scalars['DateTime']['output']>;
  stakedTxHash?: Maybe<Scalars['String']['output']>;
  txHash: Scalars['String']['output'];
}

export interface Post {
  __typename?: 'Post';
  author: PostAuthor;
  bookmarksCount: Scalars['Int']['output'];
  content?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  fundraiser?: Maybe<PostFundraiserLink>;
  id: Scalars['ID']['output'];
  isBookmarked?: Maybe<Scalars['Boolean']['output']>;
  isEdited: Scalars['Boolean']['output'];
  isLiked?: Maybe<Scalars['Boolean']['output']>;
  isPinned: Scalars['Boolean']['output'];
  isReposted?: Maybe<Scalars['Boolean']['output']>;
  likesCount: Scalars['Int']['output'];
  media: Array<PostMedia>;
  mentions: Array<Scalars['String']['output']>;
  parentId?: Maybe<Scalars['ID']['output']>;
  replyCount: Scalars['Int']['output'];
  repostsCount: Scalars['Int']['output'];
  tags: Array<Scalars['String']['output']>;
  type: PostType;
  updatedAt: Scalars['DateTime']['output'];
  viewsCount: Scalars['Int']['output'];
  visibility: PostVisibility;
}

export interface PostAuthor {
  __typename?: 'PostAuthor';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isVerifiedCreator: Scalars['Boolean']['output'];
  username?: Maybe<Scalars['String']['output']>;
  walletAddress: Scalars['String']['output'];
}

export interface PostFilterInput {
  authorId?: InputMaybe<Scalars['String']['input']>;
  fundraiserId?: InputMaybe<Scalars['String']['input']>;
  hasMedia?: InputMaybe<Scalars['Boolean']['input']>;
  tag?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<PostType>;
  visibility?: InputMaybe<PostVisibility>;
}

export interface PostFundraiserLink {
  __typename?: 'PostFundraiserLink';
  goalAmount: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  images: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  onChainId: Scalars['Int']['output'];
  raisedAmount: Scalars['String']['output'];
}

export interface PostMedia {
  __typename?: 'PostMedia';
  alt?: Maybe<Scalars['String']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  mimeType?: Maybe<Scalars['String']['output']>;
  thumbnail?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  url: Scalars['String']['output'];
  width?: Maybe<Scalars['Int']['output']>;
}

export type PostSortBy =
  | 'CREATED_AT'
  | 'ENGAGEMENT_SCORE'
  | 'LIKES_COUNT';

export type PostType =
  | 'DONATION_EVENT'
  | 'FUNDRAISER_NEW'
  | 'FUNDRAISER_UPDATE'
  | 'MEDIA'
  | 'MILESTONE_REACHED'
  | 'POLL'
  | 'TEXT';

export type PostVisibility =
  | 'FOLLOWERS'
  | 'PRIVATE'
  | 'PUBLIC';

/** Category of DAO proposal */
export type ProposalCategory =
  | 'EMERGENCY'
  | 'FEATURE_REQUEST'
  | 'OTHER'
  | 'PARAMETER_CHANGE'
  | 'YIELD_DISTRIBUTION';

export interface ProposalResults {
  __typename?: 'ProposalResults';
  abstainPercent: Scalars['String']['output'];
  againstPercent: Scalars['String']['output'];
  finalStatus: ProposalStatus;
  forPercent: Scalars['String']['output'];
  isPassing: Scalars['Boolean']['output'];
  proposalId: Scalars['String']['output'];
  quorumReached: Scalars['Boolean']['output'];
  quorumRequired: Scalars['String']['output'];
  totalVotesAbstain: Scalars['String']['output'];
  totalVotesAgainst: Scalars['String']['output'];
  totalVotesFor: Scalars['String']['output'];
  totalVotingPower: Scalars['String']['output'];
  votersCount: Scalars['Int']['output'];
}

/** Status of DAO proposal */
export type ProposalStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'DRAFT'
  | 'EXECUTED'
  | 'PASSED'
  | 'REJECTED';

export interface Query {
  __typename?: 'Query';
  /** Get active DAO proposals */
  activeDAOProposals: PaginatedDaoProposals;
  /** Get a specific conversation by ID */
  conversation: Conversation;
  /** Get all conversations for the current user sorted by last message time */
  conversations: PaginatedConversations;
  currentEpoch?: Maybe<GlobalPoolEpoch>;
  /** Get a specific DAO proposal */
  daoProposal: DaoProposal;
  /** Get votes for a DAO proposal */
  daoProposalVotes: PaginatedDaoVotes;
  /** Get all DAO proposals with optional filters */
  daoProposals: PaginatedDaoProposals;
  /** Get DAO voting statistics */
  daoVotingStats: DaoVotingStats;
  donation: Donation;
  donationByTxHash: Donation;
  donationLeaderboard: DonationLeaderboard;
  donations: PaginatedDonations;
  donationsByAddress: PaginatedDonations;
  /** Get detailed endowment information for a donation */
  endowmentInfo: EndowmentInfo;
  epoch?: Maybe<GlobalPoolEpoch>;
  /** Get FBT burn history */
  fbtBurnHistory: PaginatedFbtBurns;
  /** Get FBT burn history for a specific address */
  fbtBurnsByAddress: PaginatedFbtBurns;
  /** Get FBT stake by wallet address */
  fbtStakeByAddress?: Maybe<FbtStake>;
  /** Get all FBT stakers in treasury */
  fbtStakers: PaginatedFbtStakers;
  featuredFundraisers: Array<Fundraiser>;
  feed: Feed;
  followers: PaginatedFollows;
  following: PaginatedFollows;
  fundraiser: Fundraiser;
  fundraiserByOnChainId: Fundraiser;
  fundraiserCategories: Array<CategoryCount>;
  fundraiserDonationStats: DonationStats;
  fundraiserDonations: PaginatedDonations;
  /** Get all wealth building donations for a fundraiser */
  fundraiserEndowments: PaginatedWealthBuildingDonations;
  fundraiserRegions: Array<RegionCount>;
  fundraiserStakes: PaginatedStakes;
  fundraisers: PaginatedFundraisers;
  fundraisersByCreator: PaginatedFundraisers;
  fundraisersMinimal: FundraisersMinimalResponse;
  globalPoolStakes: PaginatedStakes;
  globalPoolStats: GlobalPoolStats;
  hasReported: Scalars['Boolean']['output'];
  /** Get Impact DAO stake by wallet address */
  impactDAOStakeByAddress?: Maybe<ImpactDaoStake>;
  /** Get all Impact DAO stakers with pagination */
  impactDAOStakers: PaginatedImpactDaoStakers;
  /** Get Impact DAO pool statistics */
  impactDAOStats: ImpactDaoStats;
  /** Get yield harvest history for a stake */
  impactDAOYieldHarvests: PaginatedYieldHarvests;
  isFollowing: Scalars['Boolean']['output'];
  isUsernameAvailable: Scalars['Boolean']['output'];
  me: User;
  /** Get messages for a conversation with pagination */
  messages: PaginatedMessages;
  moderationStats: ModerationStats;
  myActivity: UserActivitySummary;
  myBookmarks: PaginatedPosts;
  /** Get claimable USDC yield from FBT staking */
  myClaimableTreasuryYield: Scalars['String']['output'];
  /** Get total claimable vested FBT */
  myClaimableVestedFBT: Scalars['String']['output'];
  /** Get pending FBT rewards for current user */
  myDAOFBTRewards: Scalars['String']['output'];
  /** Get current user's DAO votes */
  myDAOVotes: PaginatedDaoVotes;
  /** Get current user's custom yield split configuration */
  myDAOYieldSplit?: Maybe<YieldSplit>;
  myDonationStats: UserDonationStats;
  myDonations: PaginatedDonations;
  myEpochVotes?: Maybe<UserGlobalPoolVotes>;
  /** Get current user's FBT stake in treasury */
  myFBTStake?: Maybe<FbtStake>;
  myFollowers: PaginatedFollows;
  myFollowing: PaginatedFollows;
  myFundraisers: PaginatedFundraisers;
  /** Get the current user's Impact DAO stake */
  myImpactDAOStake?: Maybe<ImpactDaoStake>;
  myNotificationSettings: NotificationSettings;
  /** Get pending yield breakdown for current user */
  myPendingDAOYield: PendingYield;
  /** Get pending yield for all user's endowments */
  myPendingEndowmentYield: Array<PendingEndowmentYield>;
  myPendingRewards: PendingStakingRewards;
  myReports: PaginatedReports;
  myStakes: PaginatedStakes;
  myStakingStats: UserStakingStats;
  /** Get current user's stock portfolio from donations */
  myStockPortfolio: StockPortfolio;
  /** Get total vested FBT not yet claimed */
  myTotalVested: Scalars['String']['output'];
  /** Get current user's vesting schedules */
  myVestingSchedules: PaginatedVestingSchedules;
  /** Get vesting summary for current user */
  myVestingSummary: VestingSummary;
  /** Get current user's voting power */
  myVotingPower: VotingPowerInfo;
  /** Get current user's wealth building donations */
  myWealthBuildingDonations: PaginatedWealthBuildingDonations;
  notification?: Maybe<Notification>;
  notificationCounts: NotificationCount;
  notifications: PaginatedNotifications;
  notificationsByType: PaginatedNotifications;
  /** Get operational funds balance */
  operationalFunds: Scalars['String']['output'];
  pendingReports: PaginatedReports;
  platformDonationStats: DonationStats;
  /** Get platform fee collection history */
  platformFees: PaginatedPlatformFees;
  /** Get platform fees filtered by source type */
  platformFeesBySource: PaginatedPlatformFees;
  poolStats: StakingPoolStats;
  post: Post;
  postComments: PaginatedComments;
  postReplies: PaginatedPosts;
  posts: PaginatedPosts;
  postsByHashtag: PaginatedPosts;
  /** Get proposal results breakdown */
  proposalResults: ProposalResults;
  recentDonations: Array<RecentDonationActivity>;
  report?: Maybe<Report>;
  reportedContent: PaginatedReports;
  reports: PaginatedReports;
  reportsByReason: PaginatedReports;
  searchFundraisers: PaginatedFundraisers;
  searchUsers: UserSearchResult;
  stake: Stake;
  stakes: PaginatedStakes;
  stakingLeaderboard: Array<StakingLeaderboardEntry>;
  /** Get stock purchase history for an address */
  stockPurchaseHistory: PaginatedStockPurchases;
  /** Get personalized user suggestions for "Who to Follow" section */
  suggestedUsers: Array<User>;
  /** Get list of supported stock tokens */
  supportedStocks: Array<SupportedStockInfo>;
  topDonors: Array<DonationLeaderboardEntry>;
  /** Get total number of unread messages */
  totalUnreadMessages: Scalars['Int']['output'];
  /** Get treasury's endowment information */
  treasuryEndowmentInfo: TreasuryEndowmentInfo;
  /** Get platform treasury statistics */
  treasuryStats: TreasuryStats;
  trendingFundraisers: Array<TrendingFundraiser>;
  trendingHashtags: Array<TrendingHashtag>;
  trendingUsers: Array<TrendingUser>;
  /** Get unread message counts across all conversations */
  unreadMessages: UnreadMessagesSummary;
  unreadNotificationCount: Scalars['Int']['output'];
  unreadNotifications: PaginatedNotifications;
  user: User;
  userActivity: UserActivitySummary;
  userByUsername: User;
  userByWallet: User;
  userDonationStats: UserDonationStats;
  userDonations: PaginatedDonations;
  userPosts: PaginatedPosts;
  userStakes: PaginatedStakes;
  userStakingStats: UserStakingStats;
  users: PaginatedUsers;
  /** Get a specific vesting schedule */
  vestingSchedule: VestingSchedule;
  /** Get claim history for a vesting schedule */
  vestingScheduleClaims: PaginatedVestingClaims;
  /** Get vesting schedules by wallet address */
  vestingSchedulesByAddress: PaginatedVestingSchedules;
  /** Get platform-wide vesting statistics */
  vestingStats: VestingStats;
  /** Get platform-wide wealth building statistics */
  wealthBuildingStats: WealthBuildingStats;
}


export interface QueryActiveDaoProposalsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryConversationArgs {
  conversationId: Scalars['ID']['input'];
}


export interface QueryConversationsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryDaoProposalArgs {
  proposalId: Scalars['String']['input'];
}


export interface QueryDaoProposalVotesArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  proposalId: Scalars['String']['input'];
}


export interface QueryDaoProposalsArgs {
  category?: InputMaybe<ProposalCategory>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  status?: InputMaybe<ProposalStatus>;
}


export interface QueryDonationArgs {
  id: Scalars['ID']['input'];
}


export interface QueryDonationByTxHashArgs {
  txHash: Scalars['String']['input'];
}


export interface QueryDonationLeaderboardArgs {
  limit?: Scalars['Int']['input'];
  period?: LeaderboardPeriod;
}


export interface QueryDonationsArgs {
  filter?: InputMaybe<DonationFilterInput>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  order?: SortOrder;
  sortBy?: DonationSortBy;
}


export interface QueryDonationsByAddressArgs {
  address: Scalars['String']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryEndowmentInfoArgs {
  donationId: Scalars['String']['input'];
}


export interface QueryEpochArgs {
  epochNumber: Scalars['Int']['input'];
}


export interface QueryFbtBurnHistoryArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryFbtBurnsByAddressArgs {
  address: Scalars['String']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryFbtStakeByAddressArgs {
  address: Scalars['String']['input'];
}


export interface QueryFbtStakersArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryFeaturedFundraisersArgs {
  limit?: Scalars['Int']['input'];
}


export interface QueryFeedArgs {
  cursor?: InputMaybe<Scalars['String']['input']>;
  feedType?: FeedType;
  limit?: Scalars['Int']['input'];
}


export interface QueryFollowersArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
}


export interface QueryFollowingArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
}


export interface QueryFundraiserArgs {
  id: Scalars['ID']['input'];
}


export interface QueryFundraiserByOnChainIdArgs {
  onChainId: Scalars['Int']['input'];
}


export interface QueryFundraiserDonationStatsArgs {
  fundraiserId: Scalars['ID']['input'];
}


export interface QueryFundraiserDonationsArgs {
  fundraiserId: Scalars['ID']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryFundraiserEndowmentsArgs {
  fundraiserId: Scalars['String']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryFundraiserStakesArgs {
  fundraiserId: Scalars['ID']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryFundraisersArgs {
  filter?: InputMaybe<FundraiserFilterInput>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  sort?: InputMaybe<FundraiserSortInput>;
}


export interface QueryFundraisersByCreatorArgs {
  creatorId: Scalars['ID']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryFundraisersMinimalArgs {
  filter?: InputMaybe<FundraiserFilterInput>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryGlobalPoolStakesArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryHasReportedArgs {
  entityId?: InputMaybe<Scalars['String']['input']>;
  reportedId: Scalars['ID']['input'];
}


export interface QueryImpactDaoStakeByAddressArgs {
  address: Scalars['String']['input'];
}


export interface QueryImpactDaoStakersArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryImpactDaoYieldHarvestsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  stakeId: Scalars['String']['input'];
}


export interface QueryIsFollowingArgs {
  userId: Scalars['ID']['input'];
}


export interface QueryIsUsernameAvailableArgs {
  username: Scalars['String']['input'];
}


export interface QueryMessagesArgs {
  input: GetMessagesInput;
}


export interface QueryMyBookmarksArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryMyDaoVotesArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryMyDonationsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryMyEpochVotesArgs {
  epochNumber: Scalars['Int']['input'];
}


export interface QueryMyFollowersArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryMyFollowingArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryMyFundraisersArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryMyReportsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryMyStakesArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryMyVestingSchedulesArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryMyWealthBuildingDonationsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryNotificationArgs {
  id: Scalars['ID']['input'];
}


export interface QueryNotificationsArgs {
  input?: InputMaybe<GetNotificationsInput>;
}


export interface QueryNotificationsByTypeArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  types: Array<NotificationType>;
}


export interface QueryPendingReportsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryPlatformFeesArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryPlatformFeesBySourceArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  sourceType: FeeSourceType;
}


export interface QueryPoolStatsArgs {
  poolAddress: Scalars['String']['input'];
}


export interface QueryPostArgs {
  id: Scalars['ID']['input'];
}


export interface QueryPostCommentsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  postId: Scalars['ID']['input'];
}


export interface QueryPostRepliesArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  postId: Scalars['ID']['input'];
}


export interface QueryPostsArgs {
  filter?: InputMaybe<PostFilterInput>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  order?: SortOrder;
  sortBy?: PostSortBy;
}


export interface QueryPostsByHashtagArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  tag: Scalars['String']['input'];
}


export interface QueryProposalResultsArgs {
  proposalId: Scalars['String']['input'];
}


export interface QueryRecentDonationsArgs {
  limit?: Scalars['Int']['input'];
}


export interface QueryReportArgs {
  id: Scalars['ID']['input'];
}


export interface QueryReportedContentArgs {
  entityId: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
}


export interface QueryReportsArgs {
  input?: InputMaybe<GetReportsInput>;
}


export interface QueryReportsByReasonArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  reason: ReportReason;
}


export interface QuerySearchFundraisersArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  query: Scalars['String']['input'];
}


export interface QuerySearchUsersArgs {
  limit?: Scalars['Int']['input'];
  query: Scalars['String']['input'];
}


export interface QueryStakeArgs {
  id: Scalars['ID']['input'];
}


export interface QueryStakesArgs {
  filter?: InputMaybe<StakeFilterInput>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  order?: SortOrder;
  sortBy?: StakeSortBy;
}


export interface QueryStakingLeaderboardArgs {
  limit?: Scalars['Int']['input'];
}


export interface QueryStockPurchaseHistoryArgs {
  address: Scalars['String']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QuerySuggestedUsersArgs {
  limit?: Scalars['Int']['input'];
}


export interface QueryTopDonorsArgs {
  fundraiserId: Scalars['ID']['input'];
  limit?: Scalars['Int']['input'];
}


export interface QueryTrendingFundraisersArgs {
  limit?: Scalars['Int']['input'];
  period?: TrendingPeriod;
}


export interface QueryTrendingHashtagsArgs {
  limit?: Scalars['Int']['input'];
  period?: TrendingPeriod;
}


export interface QueryTrendingUsersArgs {
  limit?: Scalars['Int']['input'];
  period?: TrendingPeriod;
}


export interface QueryUnreadNotificationsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryUserArgs {
  id: Scalars['ID']['input'];
}


export interface QueryUserActivityArgs {
  userId: Scalars['ID']['input'];
}


export interface QueryUserByUsernameArgs {
  username: Scalars['String']['input'];
}


export interface QueryUserByWalletArgs {
  walletAddress: Scalars['String']['input'];
}


export interface QueryUserDonationStatsArgs {
  userId: Scalars['ID']['input'];
}


export interface QueryUserDonationsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
}


export interface QueryUserPostsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
}


export interface QueryUserStakesArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
}


export interface QueryUserStakingStatsArgs {
  userId: Scalars['ID']['input'];
}


export interface QueryUsersArgs {
  filter?: InputMaybe<UserFilterInput>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}


export interface QueryVestingScheduleArgs {
  scheduleId: Scalars['String']['input'];
}


export interface QueryVestingScheduleClaimsArgs {
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  scheduleId: Scalars['String']['input'];
}


export interface QueryVestingSchedulesByAddressArgs {
  address: Scalars['String']['input'];
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
}

export interface RecentDonationActivity {
  __typename?: 'RecentDonationActivity';
  amountUSD: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  donorAddress: Scalars['String']['output'];
  donorUsername?: Maybe<Scalars['String']['output']>;
  fundraiserId: Scalars['String']['output'];
  fundraiserName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
}

export interface RecordDonationInput {
  amount: Scalars['String']['input'];
  chainId: Scalars['Int']['input'];
  fundraiserId: Scalars['String']['input'];
  isAnonymous?: InputMaybe<Scalars['Boolean']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  token: Scalars['String']['input'];
  txHash: Scalars['String']['input'];
}

export interface RecordStakeInput {
  amount: Scalars['String']['input'];
  chainId: Scalars['Int']['input'];
  fundraiserId?: InputMaybe<Scalars['String']['input']>;
  isGlobal?: InputMaybe<Scalars['Boolean']['input']>;
  poolAddress: Scalars['String']['input'];
  shares: Scalars['String']['input'];
  txHash: Scalars['String']['input'];
  yieldSplit?: InputMaybe<YieldSplitInput>;
}

export interface RegionCount {
  __typename?: 'RegionCount';
  count: Scalars['Int']['output'];
  region: Scalars['String']['output'];
}

export interface Report {
  __typename?: 'Report';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  post?: Maybe<ReportedPost>;
  reason: ReportReason;
  reported: ReportUser;
  reporter: ReportUser;
  resolvedAt?: Maybe<Scalars['DateTime']['output']>;
  resolvedBy?: Maybe<Scalars['String']['output']>;
  status: ReportStatus;
}

export interface ReportOperationResult {
  __typename?: 'ReportOperationResult';
  message?: Maybe<Scalars['String']['output']>;
  reportId?: Maybe<Scalars['ID']['output']>;
  success: Scalars['Boolean']['output'];
}

export type ReportReason =
  | 'FAKE_FUNDRAISER'
  | 'HARASSMENT'
  | 'HATE_SPEECH'
  | 'INAPPROPRIATE_CONTENT'
  | 'OTHER'
  | 'SCAM'
  | 'SPAM'
  | 'VIOLENCE';

export type ReportStatus =
  | 'DISMISSED'
  | 'PENDING'
  | 'RESOLVED'
  | 'REVIEWED';

export interface ReportUser {
  __typename?: 'ReportUser';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  username?: Maybe<Scalars['String']['output']>;
  walletAddress: Scalars['String']['output'];
}

export interface ReportedPost {
  __typename?: 'ReportedPost';
  content?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  mediaUrls: Array<Scalars['String']['output']>;
}

export interface RepostInput {
  comment?: InputMaybe<Scalars['String']['input']>;
  postId: Scalars['String']['input'];
}

export interface ReviewReportInput {
  action: ModerationAction;
  notes?: InputMaybe<Scalars['String']['input']>;
  reportId: Scalars['ID']['input'];
  status: ReportStatus;
  suspensionDays?: InputMaybe<Scalars['Int']['input']>;
  suspensionReason?: InputMaybe<Scalars['String']['input']>;
}

export interface SendDirectMessageInput {
  /** The text content of the message */
  content: Scalars['String']['input'];
  /** Optional media URL attached to the message */
  mediaUrl?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the user to send the message to */
  receiverId: Scalars['ID']['input'];
}

export interface SendMessageInput {
  /** The text content of the message */
  content: Scalars['String']['input'];
  /** The ID of the conversation to send the message to */
  conversationId: Scalars['ID']['input'];
  /** Optional media URL attached to the message */
  mediaUrl?: InputMaybe<Scalars['String']['input']>;
}

export interface SocialTrendingHashtag {
  __typename?: 'SocialTrendingHashtag';
  postsCount: Scalars['Int']['output'];
  tag: Scalars['String']['output'];
}

export type SortOrder =
  | 'ASC'
  | 'DESC';

export interface Stake {
  __typename?: 'Stake';
  amount: Scalars['String']['output'];
  blockNumber?: Maybe<Scalars['Float']['output']>;
  chainId: Scalars['Int']['output'];
  fundraiser?: Maybe<FundraiserStakingInfo>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isGlobal: Scalars['Boolean']['output'];
  poolAddress: Scalars['String']['output'];
  shares: Scalars['String']['output'];
  stakedAt: Scalars['DateTime']['output'];
  staker: StakerInfo;
  txHash: Scalars['String']['output'];
  unstakedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  yieldSplit?: Maybe<YieldSplitConfig>;
}

export interface StakeFilterInput {
  chainId?: InputMaybe<Scalars['Int']['input']>;
  fundraiserId?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isGlobal?: InputMaybe<Scalars['Boolean']['input']>;
  poolAddress?: InputMaybe<Scalars['String']['input']>;
  stakerAddress?: InputMaybe<Scalars['String']['input']>;
  stakerId?: InputMaybe<Scalars['String']['input']>;
}

export type StakeSortBy =
  | 'AMOUNT'
  | 'STAKED_AT';

export interface StakerInfo {
  __typename?: 'StakerInfo';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  walletAddress: Scalars['String']['output'];
}

export interface StakingLeaderboardEntry {
  __typename?: 'StakingLeaderboardEntry';
  rank: Scalars['Int']['output'];
  staker: StakerInfo;
  stakesCount: Scalars['Int']['output'];
  totalStaked: Scalars['String']['output'];
}

export interface StakingPoolStats {
  __typename?: 'StakingPoolStats';
  apy: Scalars['String']['output'];
  fundraiserName?: Maybe<Scalars['String']['output']>;
  poolAddress: Scalars['String']['output'];
  stakersCount: Scalars['Int']['output'];
  totalStaked: Scalars['String']['output'];
  totalYieldGenerated: Scalars['String']['output'];
}

export interface StartConversationInput {
  /** The ID of the user to start a conversation with */
  participantId: Scalars['ID']['input'];
}

export interface StockHolding {
  __typename?: 'StockHolding';
  balance: Scalars['String']['output'];
  currentValueUSD: Scalars['String']['output'];
  gainLossPercent: Scalars['String']['output'];
  stockSymbol: Scalars['String']['output'];
  stockToken: Scalars['String']['output'];
  totalUSDCInvested: Scalars['String']['output'];
}

export interface StockPortfolio {
  __typename?: 'StockPortfolio';
  holdings: Array<StockHolding>;
  holdingsCount: Scalars['Int']['output'];
  totalGainLossPercent: Scalars['String']['output'];
  totalInvestedUSD: Scalars['String']['output'];
  totalValueUSD: Scalars['String']['output'];
}

export interface StockPurchaseEvent {
  __typename?: 'StockPurchaseEvent';
  donorAddress: Scalars['String']['output'];
  purchasedAt: Scalars['DateTime']['output'];
  stockAmount: Scalars['String']['output'];
  stockSymbol: Scalars['String']['output'];
  stockToken: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
  usdcAmount: Scalars['String']['output'];
}

export interface StockPurchasedPayload {
  __typename?: 'StockPurchasedPayload';
  donorAddress: Scalars['String']['output'];
  stockAmount: Scalars['String']['output'];
  stockSymbol: Scalars['String']['output'];
  stockToken: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  txHash: Scalars['String']['output'];
  usdcAmount: Scalars['String']['output'];
}

export interface Subscription {
  __typename?: 'Subscription';
  /** Subscribe to new DAO proposals */
  daoProposalCreated: DaoProposalCreatedPayload;
  /** Subscribe to proposal status changes */
  daoProposalStatusChanged: DaoProposalStatusChangedPayload;
  /** Subscribe to votes cast on proposals */
  daoVoteCast: DaoVoteCastPayload;
  /** Subscribe to yield harvest events for a user */
  endowmentYieldHarvested: EndowmentYieldHarvestedPayload;
  /** Subscribe to FBT burned events */
  fbtBurned: FbtBurnedPayload;
  /** Subscribe to FBT stake updates */
  fbtStakeUpdated: FbtStakeUpdatedPayload;
  /** Subscribe to platform fee received events */
  feeReceived: FeeReceivedPayload;
  /** Subscribe to Impact DAO stake updates */
  impactDAOStakeUpdated: ImpactDaoStakeUpdatedPayload;
  /** Subscribe to Impact DAO yield harvest events */
  impactDAOYieldHarvested: ImpactDaoYieldHarvestedPayload;
  /** Subscribe to stock purchase events for a user */
  stockPurchased: StockPurchasedPayload;
  /** Subscribe to treasury stats updates */
  treasuryStatsUpdated: TreasuryStatsUpdatedPayload;
  /** Subscribe to vested tokens claimed events */
  vestedTokensClaimed: VestedTokensClaimedPayload;
  /** Subscribe to new vesting schedules */
  vestingScheduleCreated: VestingScheduleCreatedPayload;
  /** Subscribe to new wealth building donations */
  wealthBuildingDonationCreated: WealthBuildingDonationCreatedPayload;
}


export interface SubscriptionDaoProposalStatusChangedArgs {
  proposalId?: InputMaybe<Scalars['String']['input']>;
}


export interface SubscriptionDaoVoteCastArgs {
  proposalId?: InputMaybe<Scalars['String']['input']>;
}


export interface SubscriptionEndowmentYieldHarvestedArgs {
  userId?: InputMaybe<Scalars['String']['input']>;
}


export interface SubscriptionFbtStakeUpdatedArgs {
  address?: InputMaybe<Scalars['String']['input']>;
}


export interface SubscriptionImpactDaoStakeUpdatedArgs {
  address?: InputMaybe<Scalars['String']['input']>;
}


export interface SubscriptionStockPurchasedArgs {
  address?: InputMaybe<Scalars['String']['input']>;
}


export interface SubscriptionVestedTokensClaimedArgs {
  address?: InputMaybe<Scalars['String']['input']>;
}


export interface SubscriptionVestingScheduleCreatedArgs {
  address?: InputMaybe<Scalars['String']['input']>;
}


export interface SubscriptionWealthBuildingDonationCreatedArgs {
  fundraiserId?: InputMaybe<Scalars['Int']['input']>;
}

export interface SupportedStockInfo {
  __typename?: 'SupportedStockInfo';
  decimals: Scalars['Int']['output'];
  isDefault: Scalars['Boolean']['output'];
  lastPrice?: Maybe<Scalars['String']['output']>;
  lastPriceAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
  tokenAddress: Scalars['String']['output'];
  underlyingAsset?: Maybe<Scalars['String']['output']>;
}

export interface TreasuryEndowmentInfo {
  __typename?: 'TreasuryEndowmentInfo';
  causeYieldPaid: Scalars['String']['output'];
  lifetimeYield: Scalars['String']['output'];
  pendingYield: Scalars['String']['output'];
  principal: Scalars['String']['output'];
}

export interface TreasuryStats {
  __typename?: 'TreasuryStats';
  endowmentLifetimeYield: Scalars['String']['output'];
  endowmentPrincipal: Scalars['String']['output'];
  lastFeeStakedAt?: Maybe<Scalars['DateTime']['output']>;
  lastYieldHarvestedAt?: Maybe<Scalars['DateTime']['output']>;
  minStakeThreshold: Scalars['String']['output'];
  operationalFunds: Scalars['String']['output'];
  pendingFeesToStake: Scalars['String']['output'];
  totalFBTStaked: Scalars['String']['output'];
  totalFBTStakers: Scalars['Int']['output'];
  totalFeesCollected: Scalars['String']['output'];
  totalFeesStaked: Scalars['String']['output'];
  totalYieldDistributed: Scalars['String']['output'];
  yieldPerTokenStored: Scalars['String']['output'];
}

export interface TreasuryStatsUpdatedPayload {
  __typename?: 'TreasuryStatsUpdatedPayload';
  stats: TreasuryStats;
}

export interface TrendingFundraiser {
  __typename?: 'TrendingFundraiser';
  calculatedAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  donorsCount: Scalars['Int']['output'];
  fundraiserId: Scalars['String']['output'];
  goalAmount: Scalars['String']['output'];
  id: Scalars['String']['output'];
  images: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  period: TrendingPeriod;
  raisedAmount: Scalars['String']['output'];
  score: Scalars['Float']['output'];
}

export interface TrendingHashtag {
  __typename?: 'TrendingHashtag';
  calculatedAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  period: TrendingPeriod;
  postsCount: Scalars['Int']['output'];
  score: Scalars['Float']['output'];
  tag: Scalars['String']['output'];
}

export type TrendingPeriod =
  | 'ONE_HOUR'
  | 'SEVEN_DAYS'
  | 'TWENTY_FOUR_HOURS';

export interface TrendingUser {
  __typename?: 'TrendingUser';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  calculatedAt: Scalars['DateTime']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  followersCount: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  period: TrendingPeriod;
  score: Scalars['Float']['output'];
  userId: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
  walletAddress: Scalars['String']['output'];
}

export interface UnreadMessagesSummary {
  __typename?: 'UnreadMessagesSummary';
  /** Unread counts per conversation */
  byConversation: Array<ConversationUnreadCount>;
  /** Number of conversations with unread messages */
  conversationsWithUnread: Scalars['Int']['output'];
  /** Total number of unread messages */
  totalUnread: Scalars['Int']['output'];
}

export interface UnstakeInput {
  amount?: InputMaybe<Scalars['String']['input']>;
  stakeId: Scalars['String']['input'];
  txHash: Scalars['String']['input'];
}

export interface UpdateFundraiserInput {
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
}

export interface UpdateNotificationSettingsInput {
  emailEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnComment?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnDAOProposal?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnDonation?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnFBTVesting?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnFollow?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnLike?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnMention?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnStake?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnStockPurchase?: InputMaybe<Scalars['Boolean']['input']>;
  notifyOnYieldHarvest?: InputMaybe<Scalars['Boolean']['input']>;
  pushEnabled?: InputMaybe<Scalars['Boolean']['input']>;
}

export interface UpdatePostInput {
  content?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  visibility?: InputMaybe<PostVisibility>;
}

export interface UpdateProfileInput {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  bannerUrl?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  birthdate?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  isPrivate?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
}

export interface User {
  __typename?: 'User';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  bannerUrl?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  birthdate?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailVerified: Scalars['Boolean']['output'];
  goals: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  interests: Array<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isBlocked?: Maybe<Scalars['Boolean']['output']>;
  isFollowedBy?: Maybe<Scalars['Boolean']['output']>;
  isFollowing?: Maybe<Scalars['Boolean']['output']>;
  isPrivate: Scalars['Boolean']['output'];
  isVerifiedCreator: Scalars['Boolean']['output'];
  lastSeenAt?: Maybe<Scalars['DateTime']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  onboardingCompleted: Scalars['Boolean']['output'];
  stats: UserStats;
  updatedAt: Scalars['DateTime']['output'];
  username?: Maybe<Scalars['String']['output']>;
  verificationBadge?: Maybe<VerificationBadge>;
  walletAddress: Scalars['String']['output'];
  website?: Maybe<Scalars['String']['output']>;
}

export interface UserActivitySummary {
  __typename?: 'UserActivitySummary';
  commentsLast30Days: Scalars['Int']['output'];
  donatedAmountLast30Days: Scalars['String']['output'];
  donationsLast30Days: Scalars['Int']['output'];
  earnedFBTLast30Days: Scalars['String']['output'];
  postsLast30Days: Scalars['Int']['output'];
  stakesLast30Days: Scalars['Int']['output'];
}

export interface UserDonationStats {
  __typename?: 'UserDonationStats';
  averageDonation: Scalars['String']['output'];
  donationsCount: Scalars['Int']['output'];
  firstDonationAt?: Maybe<Scalars['DateTime']['output']>;
  fundraisersDonatedTo: Scalars['Int']['output'];
  lastDonationAt?: Maybe<Scalars['DateTime']['output']>;
  totalDonated: Scalars['String']['output'];
}

export interface UserFilterInput {
  isVerifiedCreator?: InputMaybe<Scalars['Boolean']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
}

export interface UserGlobalPoolVotes {
  __typename?: 'UserGlobalPoolVotes';
  allocations: Array<GlobalPoolVoteAllocation>;
  epochNumber: Scalars['Int']['output'];
  totalWeight: Scalars['String']['output'];
}

export interface UserMinimal {
  __typename?: 'UserMinimal';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isVerifiedCreator: Scalars['Boolean']['output'];
  username?: Maybe<Scalars['String']['output']>;
  verificationBadge?: Maybe<VerificationBadge>;
  walletAddress: Scalars['String']['output'];
}

export interface UserSearchResult {
  __typename?: 'UserSearchResult';
  total: Scalars['Int']['output'];
  users: Array<UserMinimal>;
}

export interface UserStakingStats {
  __typename?: 'UserStakingStats';
  activeStakesCount: Scalars['Int']['output'];
  fundraisersStakedIn: Scalars['Int']['output'];
  globalPoolStake?: Maybe<Scalars['String']['output']>;
  pendingYield: Scalars['String']['output'];
  totalStaked: Scalars['String']['output'];
  totalYieldEarned: Scalars['String']['output'];
}

export interface UserStats {
  __typename?: 'UserStats';
  fbtBalance: Scalars['String']['output'];
  fbtStakedBalance: Scalars['String']['output'];
  fbtVestedClaimed: Scalars['String']['output'];
  fbtVestedTotal: Scalars['String']['output'];
  followersCount: Scalars['Int']['output'];
  followingCount: Scalars['Int']['output'];
  fundraisersCount: Scalars['Int']['output'];
  postsCount: Scalars['Int']['output'];
  reputationScore: Scalars['Int']['output'];
  totalDonated: Scalars['String']['output'];
  totalStaked: Scalars['String']['output'];
}

export type VerificationBadge =
  | 'GOLD'
  | 'NONE'
  | 'OFFICIAL'
  | 'VERIFIED_CREATOR';

export interface VestedTokensClaimedPayload {
  __typename?: 'VestedTokensClaimedPayload';
  amount: Scalars['String']['output'];
  recipientAddress: Scalars['String']['output'];
  scheduleId: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  txHash: Scalars['String']['output'];
}

export interface VestingBreakdown {
  __typename?: 'VestingBreakdown';
  donationRewards: Scalars['String']['output'];
  ecosystem: Scalars['String']['output'];
  engagementRewards: Scalars['String']['output'];
  investor: Scalars['String']['output'];
  teamAllocation: Scalars['String']['output'];
}

export interface VestingClaimEvent {
  __typename?: 'VestingClaimEvent';
  amount: Scalars['String']['output'];
  claimedAt: Scalars['DateTime']['output'];
  scheduleId: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
}

export interface VestingSchedule {
  __typename?: 'VestingSchedule';
  claimableAmount: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  duration: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  isFullyClaimed: Scalars['Boolean']['output'];
  isFullyVested: Scalars['Boolean']['output'];
  progressPercent: Scalars['String']['output'];
  recipientAddress: Scalars['String']['output'];
  releasedAmount: Scalars['String']['output'];
  startTime: Scalars['DateTime']['output'];
  totalAmount: Scalars['String']['output'];
  txHash?: Maybe<Scalars['String']['output']>;
  vestingType: VestingType;
}

export interface VestingScheduleCreatedPayload {
  __typename?: 'VestingScheduleCreatedPayload';
  schedule: VestingSchedule;
}

export interface VestingStats {
  __typename?: 'VestingStats';
  activeSchedules: Scalars['Int']['output'];
  byType: VestingBreakdown;
  totalBurnedAmount: Scalars['String']['output'];
  totalClaimedAmount: Scalars['String']['output'];
  totalPendingAmount: Scalars['String']['output'];
  totalSchedules: Scalars['Int']['output'];
  totalVestedAmount: Scalars['String']['output'];
  uniqueRecipients: Scalars['Int']['output'];
}

export interface VestingSummary {
  __typename?: 'VestingSummary';
  activeScheduleCount: Scalars['Int']['output'];
  completedScheduleCount: Scalars['Int']['output'];
  scheduleCount: Scalars['Int']['output'];
  totalClaimable: Scalars['String']['output'];
  totalPending: Scalars['String']['output'];
  totalReleased: Scalars['String']['output'];
  totalVested: Scalars['String']['output'];
}

/** Type of vesting schedule */
export type VestingType =
  | 'DONATION_REWARD'
  | 'ECOSYSTEM'
  | 'ENGAGEMENT_REWARD'
  | 'INVESTOR'
  | 'TEAM_ALLOCATION';

export interface VoteAllocationInput {
  fundraiserId: Scalars['String']['input'];
  weight: Scalars['String']['input'];
}

/** Vote choice on a proposal */
export type VoteChoice =
  | 'ABSTAIN'
  | 'AGAINST'
  | 'FOR';

export interface VoteOnProposalInput {
  message?: InputMaybe<Scalars['String']['input']>;
  proposalId: Scalars['String']['input'];
  signature?: InputMaybe<Scalars['String']['input']>;
  vote: VoteChoice;
  votingPower: Scalars['String']['input'];
}

export interface VotingPowerInfo {
  __typename?: 'VotingPowerInfo';
  availableVotingPower: Scalars['String']['output'];
  lockedInVotes: Scalars['String']['output'];
  stakedBalance: Scalars['String']['output'];
  totalVotingPower: Scalars['String']['output'];
  vestedBalance: Scalars['String']['output'];
  walletBalance: Scalars['String']['output'];
}

export interface WealthBuildingDonation {
  __typename?: 'WealthBuildingDonation';
  beneficiaryAddr: Scalars['String']['output'];
  causeYieldPaid: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  directAmount: Scalars['String']['output'];
  donorAddress: Scalars['String']['output'];
  donorStockValue: Scalars['String']['output'];
  endowmentAmount: Scalars['String']['output'];
  endowmentPrincipal: Scalars['String']['output'];
  fundraiserId: Scalars['Int']['output'];
  fundraiserName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastHarvestAt?: Maybe<Scalars['DateTime']['output']>;
  lifetimeYield: Scalars['String']['output'];
  platformFee: Scalars['String']['output'];
  totalAmount: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
}

export interface WealthBuildingDonationCreatedPayload {
  __typename?: 'WealthBuildingDonationCreatedPayload';
  donation: WealthBuildingDonation;
}

export interface WealthBuildingStats {
  __typename?: 'WealthBuildingStats';
  activeFundraisersCount: Scalars['Int']['output'];
  donationsCount: Scalars['Int']['output'];
  totalCauseYieldPaid: Scalars['String']['output'];
  totalDirectToBeneficiaries: Scalars['String']['output'];
  totalDonations: Scalars['String']['output'];
  totalDonorStockValue: Scalars['String']['output'];
  totalEndowmentPrincipal: Scalars['String']['output'];
  totalYieldGenerated: Scalars['String']['output'];
  uniqueDonorsCount: Scalars['Int']['output'];
}

export interface YieldSplit {
  __typename?: 'YieldSplit';
  daoShare: Scalars['Int']['output'];
  platformShare: Scalars['Int']['output'];
  stakerShare: Scalars['Int']['output'];
}

export interface YieldSplitConfig {
  __typename?: 'YieldSplitConfig';
  causeShare: Scalars['Int']['output'];
  platformShare: Scalars['Int']['output'];
  stakerShare: Scalars['Int']['output'];
}

export interface YieldSplitInput {
  causeShare: Scalars['Int']['input'];
  platformShare: Scalars['Int']['input'];
  stakerShare: Scalars['Int']['input'];
}

export type DonationLeaderboardEntryFieldsFragment = { __typename?: 'DonationLeaderboardEntry', rank: number, totalDonated: string, donationsCount: number, donor: { __typename?: 'DonorInfo', id?: string | null, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isAnonymous: boolean } };

export type GetDonationLeaderboardQueryVariables = Exact<{
  period?: InputMaybe<LeaderboardPeriod>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetDonationLeaderboardQuery = { __typename?: 'Query', donationLeaderboard: { __typename?: 'DonationLeaderboard', period: string, total: number, entries: Array<{ __typename?: 'DonationLeaderboardEntry', rank: number, totalDonated: string, donationsCount: number, donor: { __typename?: 'DonorInfo', id?: string | null, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isAnonymous: boolean } }> } };

export type GetSuggestedUsersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetSuggestedUsersQuery = { __typename?: 'Query', suggestedUsers: Array<{ __typename?: 'User', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null, isFollowing?: boolean | null, isFollowedBy?: boolean | null, stats: { __typename?: 'UserStats', followersCount: number, followingCount: number, postsCount: number, reputationScore: number } }> };

export type PostAuthorFieldsFragment = { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean };

export type PostMediaFieldsFragment = { __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null };

export type PostFundraiserLinkFieldsFragment = { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string };

export type PostFieldsFragment = { __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null };

export type CommentFieldsFragment = { __typename?: 'Comment', id: string, postId: string, parentId?: string | null, content: string, createdAt: string, updatedAt: string, likesCount: number, isLiked?: boolean | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, replies: Array<{ __typename?: 'Comment', id: string, content: string, createdAt: string, likesCount: number, isLiked?: boolean | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean } }> };

export type GetFeedQueryVariables = Exact<{
  feedType: FeedType;
  cursor?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetFeedQuery = { __typename?: 'Query', feed: { __typename?: 'Feed', hasMore: boolean, nextCursor?: string | null, posts: Array<{ __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null }> } };

export type GetPostQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPostQuery = { __typename?: 'Query', post: { __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null } };

export type GetPostsQueryVariables = Exact<{
  filter?: InputMaybe<PostFilterInput>;
  sortBy?: InputMaybe<PostSortBy>;
  order?: InputMaybe<SortOrder>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPostsQuery = { __typename?: 'Query', posts: { __typename?: 'PaginatedPosts', hasMore: boolean, total: number, items: Array<{ __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null }> } };

export type GetUserPostsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetUserPostsQuery = { __typename?: 'Query', userPosts: { __typename?: 'PaginatedPosts', hasMore: boolean, total: number, items: Array<{ __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null }> } };

export type GetPostCommentsQueryVariables = Exact<{
  postId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPostCommentsQuery = { __typename?: 'Query', postComments: { __typename?: 'PaginatedComments', hasMore: boolean, total: number, items: Array<{ __typename?: 'Comment', id: string, postId: string, parentId?: string | null, content: string, createdAt: string, updatedAt: string, likesCount: number, isLiked?: boolean | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, replies: Array<{ __typename?: 'Comment', id: string, content: string, createdAt: string, likesCount: number, isLiked?: boolean | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean } }> }> } };

export type GetPostRepliesQueryVariables = Exact<{
  postId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPostRepliesQuery = { __typename?: 'Query', postReplies: { __typename?: 'PaginatedPosts', hasMore: boolean, total: number, items: Array<{ __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null }> } };

export type GetPostsByHashtagQueryVariables = Exact<{
  tag: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPostsByHashtagQuery = { __typename?: 'Query', postsByHashtag: { __typename?: 'PaginatedPosts', hasMore: boolean, total: number, items: Array<{ __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null }> } };

export type GetTrendingHashtagsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<TrendingPeriod>;
}>;


export type GetTrendingHashtagsQuery = { __typename?: 'Query', trendingHashtags: Array<{ __typename?: 'TrendingHashtag', id: string, tag: string, postsCount: number, score: number, period: TrendingPeriod, calculatedAt: string }> };

export type GetMyBookmarksQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMyBookmarksQuery = { __typename?: 'Query', myBookmarks: { __typename?: 'PaginatedPosts', hasMore: boolean, total: number, items: Array<{ __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null }> } };

export type CreatePostMutationVariables = Exact<{
  input: CreatePostInput;
}>;


export type CreatePostMutation = { __typename?: 'Mutation', createPost: { __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null } };

export type UpdatePostMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
  input: UpdatePostInput;
}>;


export type UpdatePostMutation = { __typename?: 'Mutation', updatePost: { __typename?: 'Post', id: string, content?: string | null, type: PostType, visibility: PostVisibility, createdAt: string, updatedAt: string, isEdited: boolean, isPinned: boolean, mentions: Array<string>, tags: Array<string>, likesCount: number, repostsCount: number, replyCount: number, bookmarksCount: number, viewsCount: number, isLiked?: boolean | null, isReposted?: boolean | null, isBookmarked?: boolean | null, parentId?: string | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, media: Array<{ __typename?: 'PostMedia', id: string, type: string, url: string, thumbnail?: string | null, alt?: string | null, width?: number | null, height?: number | null, mimeType?: string | null }>, fundraiser?: { __typename?: 'PostFundraiserLink', id: string, name: string, onChainId: number, images: Array<string>, goalAmount: string, raisedAmount: string } | null } };

export type DeletePostMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;


export type DeletePostMutation = { __typename?: 'Mutation', deletePost: boolean };

export type LikePostMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;


export type LikePostMutation = { __typename?: 'Mutation', likePost: boolean };

export type UnlikePostMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;


export type UnlikePostMutation = { __typename?: 'Mutation', unlikePost: boolean };

export type RepostMutationVariables = Exact<{
  input: RepostInput;
}>;


export type RepostMutation = { __typename?: 'Mutation', repost: boolean };

export type RemoveRepostMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;


export type RemoveRepostMutation = { __typename?: 'Mutation', removeRepost: boolean };

export type BookmarkPostMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;


export type BookmarkPostMutation = { __typename?: 'Mutation', bookmarkPost: boolean };

export type RemoveBookmarkMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;


export type RemoveBookmarkMutation = { __typename?: 'Mutation', removeBookmark: boolean };

export type CreateCommentMutationVariables = Exact<{
  input: CreateCommentInput;
}>;


export type CreateCommentMutation = { __typename?: 'Mutation', createComment: { __typename?: 'Comment', id: string, postId: string, parentId?: string | null, content: string, createdAt: string, updatedAt: string, likesCount: number, isLiked?: boolean | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean }, replies: Array<{ __typename?: 'Comment', id: string, content: string, createdAt: string, likesCount: number, isLiked?: boolean | null, author: { __typename?: 'PostAuthor', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean } }> } };

export type DeleteCommentMutationVariables = Exact<{
  commentId: Scalars['ID']['input'];
}>;


export type DeleteCommentMutation = { __typename?: 'Mutation', deleteComment: boolean };

export type LikeCommentMutationVariables = Exact<{
  commentId: Scalars['ID']['input'];
}>;


export type LikeCommentMutation = { __typename?: 'Mutation', likeComment: boolean };

export type UnlikeCommentMutationVariables = Exact<{
  commentId: Scalars['ID']['input'];
}>;


export type UnlikeCommentMutation = { __typename?: 'Mutation', unlikeComment: boolean };

export type UserMinimalFieldsFragment = { __typename?: 'UserMinimal', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null };

export type UserStatsFieldsFragment = { __typename?: 'UserStats', followersCount: number, followingCount: number, postsCount: number, fundraisersCount: number, totalDonated: string, totalStaked: string, reputationScore: number, fbtBalance: string, fbtStakedBalance: string, fbtVestedTotal: string, fbtVestedClaimed: string };

export type UserFieldsFragment = { __typename?: 'User', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, bannerUrl?: string | null, bio?: string | null, location?: string | null, website?: string | null, walletAddress: string, email?: string | null, emailVerified: boolean, birthdate?: string | null, interests: Array<string>, goals: Array<string>, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null, isPrivate: boolean, isActive: boolean, onboardingCompleted: boolean, createdAt: string, updatedAt: string, lastSeenAt?: string | null, isFollowing?: boolean | null, isFollowedBy?: boolean | null, isBlocked?: boolean | null, stats: { __typename?: 'UserStats', followersCount: number, followingCount: number, postsCount: number, fundraisersCount: number, totalDonated: string, totalStaked: string, reputationScore: number, fbtBalance: string, fbtStakedBalance: string, fbtVestedTotal: string, fbtVestedClaimed: string } };

export type FollowRelationFieldsFragment = { __typename?: 'FollowRelation', id: string, createdAt: string, user: { __typename?: 'UserMinimal', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null } };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, bannerUrl?: string | null, bio?: string | null, location?: string | null, website?: string | null, walletAddress: string, email?: string | null, emailVerified: boolean, birthdate?: string | null, interests: Array<string>, goals: Array<string>, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null, isPrivate: boolean, isActive: boolean, onboardingCompleted: boolean, createdAt: string, updatedAt: string, lastSeenAt?: string | null, isFollowing?: boolean | null, isFollowedBy?: boolean | null, isBlocked?: boolean | null, stats: { __typename?: 'UserStats', followersCount: number, followingCount: number, postsCount: number, fundraisersCount: number, totalDonated: string, totalStaked: string, reputationScore: number, fbtBalance: string, fbtStakedBalance: string, fbtVestedTotal: string, fbtVestedClaimed: string } } };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, bannerUrl?: string | null, bio?: string | null, location?: string | null, website?: string | null, walletAddress: string, email?: string | null, emailVerified: boolean, birthdate?: string | null, interests: Array<string>, goals: Array<string>, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null, isPrivate: boolean, isActive: boolean, onboardingCompleted: boolean, createdAt: string, updatedAt: string, lastSeenAt?: string | null, isFollowing?: boolean | null, isFollowedBy?: boolean | null, isBlocked?: boolean | null, stats: { __typename?: 'UserStats', followersCount: number, followingCount: number, postsCount: number, fundraisersCount: number, totalDonated: string, totalStaked: string, reputationScore: number, fbtBalance: string, fbtStakedBalance: string, fbtVestedTotal: string, fbtVestedClaimed: string } } };

export type GetUserByUsernameQueryVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type GetUserByUsernameQuery = { __typename?: 'Query', userByUsername: { __typename?: 'User', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, bannerUrl?: string | null, bio?: string | null, location?: string | null, website?: string | null, walletAddress: string, email?: string | null, emailVerified: boolean, birthdate?: string | null, interests: Array<string>, goals: Array<string>, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null, isPrivate: boolean, isActive: boolean, onboardingCompleted: boolean, createdAt: string, updatedAt: string, lastSeenAt?: string | null, isFollowing?: boolean | null, isFollowedBy?: boolean | null, isBlocked?: boolean | null, stats: { __typename?: 'UserStats', followersCount: number, followingCount: number, postsCount: number, fundraisersCount: number, totalDonated: string, totalStaked: string, reputationScore: number, fbtBalance: string, fbtStakedBalance: string, fbtVestedTotal: string, fbtVestedClaimed: string } } };

export type GetUserByWalletQueryVariables = Exact<{
  walletAddress: Scalars['String']['input'];
}>;


export type GetUserByWalletQuery = { __typename?: 'Query', userByWallet: { __typename?: 'User', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, bannerUrl?: string | null, bio?: string | null, location?: string | null, website?: string | null, walletAddress: string, email?: string | null, emailVerified: boolean, birthdate?: string | null, interests: Array<string>, goals: Array<string>, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null, isPrivate: boolean, isActive: boolean, onboardingCompleted: boolean, createdAt: string, updatedAt: string, lastSeenAt?: string | null, isFollowing?: boolean | null, isFollowedBy?: boolean | null, isBlocked?: boolean | null, stats: { __typename?: 'UserStats', followersCount: number, followingCount: number, postsCount: number, fundraisersCount: number, totalDonated: string, totalStaked: string, reputationScore: number, fbtBalance: string, fbtStakedBalance: string, fbtVestedTotal: string, fbtVestedClaimed: string } } };

export type SearchUsersQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchUsersQuery = { __typename?: 'Query', searchUsers: { __typename?: 'UserSearchResult', total: number, users: Array<{ __typename?: 'UserMinimal', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null }> } };

export type GetFollowersQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetFollowersQuery = { __typename?: 'Query', followers: { __typename?: 'PaginatedFollows', hasMore: boolean, total: number, items: Array<{ __typename?: 'FollowRelation', id: string, createdAt: string, user: { __typename?: 'UserMinimal', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null } }> } };

export type GetFollowingQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetFollowingQuery = { __typename?: 'Query', following: { __typename?: 'PaginatedFollows', hasMore: boolean, total: number, items: Array<{ __typename?: 'FollowRelation', id: string, createdAt: string, user: { __typename?: 'UserMinimal', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null } }> } };

export type GetMyFollowersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMyFollowersQuery = { __typename?: 'Query', myFollowers: { __typename?: 'PaginatedFollows', hasMore: boolean, total: number, items: Array<{ __typename?: 'FollowRelation', id: string, createdAt: string, user: { __typename?: 'UserMinimal', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null } }> } };

export type GetMyFollowingQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMyFollowingQuery = { __typename?: 'Query', myFollowing: { __typename?: 'PaginatedFollows', hasMore: boolean, total: number, items: Array<{ __typename?: 'FollowRelation', id: string, createdAt: string, user: { __typename?: 'UserMinimal', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null } }> } };

export type IsFollowingQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type IsFollowingQuery = { __typename?: 'Query', isFollowing: boolean };

export type IsUsernameAvailableQueryVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type IsUsernameAvailableQuery = { __typename?: 'Query', isUsernameAvailable: boolean };

export type GetTrendingUsersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<TrendingPeriod>;
}>;


export type GetTrendingUsersQuery = { __typename?: 'Query', trendingUsers: Array<{ __typename?: 'TrendingUser', id: string, userId: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, walletAddress: string, followersCount: number, score: number, period: TrendingPeriod, calculatedAt: string }> };

export type GetUsersQueryVariables = Exact<{
  filter?: InputMaybe<UserFilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetUsersQuery = { __typename?: 'Query', users: { __typename?: 'PaginatedUsers', hasMore: boolean, total: number, items: Array<{ __typename?: 'User', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, bannerUrl?: string | null, bio?: string | null, location?: string | null, website?: string | null, walletAddress: string, email?: string | null, emailVerified: boolean, birthdate?: string | null, interests: Array<string>, goals: Array<string>, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null, isPrivate: boolean, isActive: boolean, onboardingCompleted: boolean, createdAt: string, updatedAt: string, lastSeenAt?: string | null, isFollowing?: boolean | null, isFollowedBy?: boolean | null, isBlocked?: boolean | null, stats: { __typename?: 'UserStats', followersCount: number, followingCount: number, postsCount: number, fundraisersCount: number, totalDonated: string, totalStaked: string, reputationScore: number, fbtBalance: string, fbtStakedBalance: string, fbtVestedTotal: string, fbtVestedClaimed: string } }> } };

export type GetUserActivityQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserActivityQuery = { __typename?: 'Query', userActivity: { __typename?: 'UserActivitySummary', postsLast30Days: number, commentsLast30Days: number, donationsLast30Days: number, donatedAmountLast30Days: string, stakesLast30Days: number, earnedFBTLast30Days: string } };

export type GetMyActivityQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyActivityQuery = { __typename?: 'Query', myActivity: { __typename?: 'UserActivitySummary', postsLast30Days: number, commentsLast30Days: number, donationsLast30Days: number, donatedAmountLast30Days: string, stakesLast30Days: number, earnedFBTLast30Days: string } };

export type GetUserDonationStatsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserDonationStatsQuery = { __typename?: 'Query', userDonationStats: { __typename?: 'UserDonationStats', totalDonated: string, donationsCount: number, fundraisersDonatedTo: number, averageDonation: string, firstDonationAt?: string | null, lastDonationAt?: string | null } };

export type GetMyDonationStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyDonationStatsQuery = { __typename?: 'Query', myDonationStats: { __typename?: 'UserDonationStats', totalDonated: string, donationsCount: number, fundraisersDonatedTo: number, averageDonation: string, firstDonationAt?: string | null, lastDonationAt?: string | null } };

export type GetUserStakingStatsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserStakingStatsQuery = { __typename?: 'Query', userStakingStats: { __typename?: 'UserStakingStats', totalStaked: string, activeStakesCount: number, fundraisersStakedIn: number, globalPoolStake?: string | null, pendingYield: string, totalYieldEarned: string } };

export type GetMyStakingStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyStakingStatsQuery = { __typename?: 'Query', myStakingStats: { __typename?: 'UserStakingStats', totalStaked: string, activeStakesCount: number, fundraisersStakedIn: number, globalPoolStake?: string | null, pendingYield: string, totalYieldEarned: string } };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'User', id: string, username?: string | null, displayName?: string | null, avatarUrl?: string | null, bannerUrl?: string | null, bio?: string | null, location?: string | null, website?: string | null, walletAddress: string, email?: string | null, emailVerified: boolean, birthdate?: string | null, interests: Array<string>, goals: Array<string>, isVerifiedCreator: boolean, verificationBadge?: VerificationBadge | null, isPrivate: boolean, isActive: boolean, onboardingCompleted: boolean, createdAt: string, updatedAt: string, lastSeenAt?: string | null, isFollowing?: boolean | null, isFollowedBy?: boolean | null, isBlocked?: boolean | null, stats: { __typename?: 'UserStats', followersCount: number, followingCount: number, postsCount: number, fundraisersCount: number, totalDonated: string, totalStaked: string, reputationScore: number, fbtBalance: string, fbtStakedBalance: string, fbtVestedTotal: string, fbtVestedClaimed: string } } };

export type FollowUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type FollowUserMutation = { __typename?: 'Mutation', followUser: boolean };

export type UnfollowUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type UnfollowUserMutation = { __typename?: 'Mutation', unfollowUser: boolean };

export type BlockUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type BlockUserMutation = { __typename?: 'Mutation', blockUser: boolean };

export type UnblockUserMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type UnblockUserMutation = { __typename?: 'Mutation', unblockUser: boolean };

export const DonationLeaderboardEntryFieldsFragmentDoc = gql`
    fragment DonationLeaderboardEntryFields on DonationLeaderboardEntry {
  rank
  totalDonated
  donationsCount
  donor {
    id
    username
    displayName
    avatarUrl
    walletAddress
    isAnonymous
  }
}
    `;
export const PostAuthorFieldsFragmentDoc = gql`
    fragment PostAuthorFields on PostAuthor {
  id
  username
  displayName
  avatarUrl
  walletAddress
  isVerifiedCreator
}
    `;
export const PostMediaFieldsFragmentDoc = gql`
    fragment PostMediaFields on PostMedia {
  id
  type
  url
  thumbnail
  alt
  width
  height
  mimeType
}
    `;
export const PostFundraiserLinkFieldsFragmentDoc = gql`
    fragment PostFundraiserLinkFields on PostFundraiserLink {
  id
  name
  onChainId
  images
  goalAmount
  raisedAmount
}
    `;
export const PostFieldsFragmentDoc = gql`
    fragment PostFields on Post {
  id
  content
  type
  visibility
  createdAt
  updatedAt
  isEdited
  isPinned
  author {
    ...PostAuthorFields
  }
  media {
    ...PostMediaFields
  }
  fundraiser {
    ...PostFundraiserLinkFields
  }
  mentions
  tags
  likesCount
  repostsCount
  replyCount
  bookmarksCount
  viewsCount
  isLiked
  isReposted
  isBookmarked
  parentId
}
    ${PostAuthorFieldsFragmentDoc}
${PostMediaFieldsFragmentDoc}
${PostFundraiserLinkFieldsFragmentDoc}`;
export const CommentFieldsFragmentDoc = gql`
    fragment CommentFields on Comment {
  id
  postId
  parentId
  content
  createdAt
  updatedAt
  likesCount
  isLiked
  author {
    ...PostAuthorFields
  }
  replies {
    id
    content
    createdAt
    likesCount
    isLiked
    author {
      ...PostAuthorFields
    }
  }
}
    ${PostAuthorFieldsFragmentDoc}`;
export const UserStatsFieldsFragmentDoc = gql`
    fragment UserStatsFields on UserStats {
  followersCount
  followingCount
  postsCount
  fundraisersCount
  totalDonated
  totalStaked
  reputationScore
  fbtBalance
  fbtStakedBalance
  fbtVestedTotal
  fbtVestedClaimed
}
    `;
export const UserFieldsFragmentDoc = gql`
    fragment UserFields on User {
  id
  username
  displayName
  avatarUrl
  bannerUrl
  bio
  location
  website
  walletAddress
  email
  emailVerified
  birthdate
  interests
  goals
  isVerifiedCreator
  verificationBadge
  isPrivate
  isActive
  onboardingCompleted
  createdAt
  updatedAt
  lastSeenAt
  isFollowing
  isFollowedBy
  isBlocked
  stats {
    ...UserStatsFields
  }
}
    ${UserStatsFieldsFragmentDoc}`;
export const UserMinimalFieldsFragmentDoc = gql`
    fragment UserMinimalFields on UserMinimal {
  id
  username
  displayName
  avatarUrl
  walletAddress
  isVerifiedCreator
  verificationBadge
}
    `;
export const FollowRelationFieldsFragmentDoc = gql`
    fragment FollowRelationFields on FollowRelation {
  id
  createdAt
  user {
    ...UserMinimalFields
  }
}
    ${UserMinimalFieldsFragmentDoc}`;
export const GetDonationLeaderboardDocument = gql`
    query GetDonationLeaderboard($period: LeaderboardPeriod = ALL, $limit: Int = 6) {
  donationLeaderboard(period: $period, limit: $limit) {
    entries {
      ...DonationLeaderboardEntryFields
    }
    period
    total
  }
}
    ${DonationLeaderboardEntryFieldsFragmentDoc}`;

/**
 * __useGetDonationLeaderboardQuery__
 *
 * To run a query within a React component, call `useGetDonationLeaderboardQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDonationLeaderboardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDonationLeaderboardQuery({
 *   variables: {
 *      period: // value for 'period'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetDonationLeaderboardQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>(GetDonationLeaderboardDocument, options);
      }
export function useGetDonationLeaderboardLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>(GetDonationLeaderboardDocument, options);
        }
// @ts-ignore
export function useGetDonationLeaderboardSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>;
export function useGetDonationLeaderboardSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetDonationLeaderboardQuery | undefined, GetDonationLeaderboardQueryVariables>;
export function useGetDonationLeaderboardSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>(GetDonationLeaderboardDocument, options);
        }
export type GetDonationLeaderboardQueryHookResult = ReturnType<typeof useGetDonationLeaderboardQuery>;
export type GetDonationLeaderboardLazyQueryHookResult = ReturnType<typeof useGetDonationLeaderboardLazyQuery>;
export type GetDonationLeaderboardSuspenseQueryHookResult = ReturnType<typeof useGetDonationLeaderboardSuspenseQuery>;
export type GetDonationLeaderboardQueryResult = ApolloReactCommon.QueryResult<GetDonationLeaderboardQuery, GetDonationLeaderboardQueryVariables>;
export const GetSuggestedUsersDocument = gql`
    query GetSuggestedUsers($limit: Int = 5) {
  suggestedUsers(limit: $limit) {
    id
    username
    displayName
    avatarUrl
    walletAddress
    isVerifiedCreator
    verificationBadge
    isFollowing
    isFollowedBy
    stats {
      followersCount
      followingCount
      postsCount
      reputationScore
    }
  }
}
    `;

/**
 * __useGetSuggestedUsersQuery__
 *
 * To run a query within a React component, call `useGetSuggestedUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSuggestedUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSuggestedUsersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetSuggestedUsersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>(GetSuggestedUsersDocument, options);
      }
export function useGetSuggestedUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>(GetSuggestedUsersDocument, options);
        }
// @ts-ignore
export function useGetSuggestedUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>;
export function useGetSuggestedUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetSuggestedUsersQuery | undefined, GetSuggestedUsersQueryVariables>;
export function useGetSuggestedUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>(GetSuggestedUsersDocument, options);
        }
export type GetSuggestedUsersQueryHookResult = ReturnType<typeof useGetSuggestedUsersQuery>;
export type GetSuggestedUsersLazyQueryHookResult = ReturnType<typeof useGetSuggestedUsersLazyQuery>;
export type GetSuggestedUsersSuspenseQueryHookResult = ReturnType<typeof useGetSuggestedUsersSuspenseQuery>;
export type GetSuggestedUsersQueryResult = ApolloReactCommon.QueryResult<GetSuggestedUsersQuery, GetSuggestedUsersQueryVariables>;
export const GetFeedDocument = gql`
    query GetFeed($feedType: FeedType!, $cursor: String, $limit: Int = 20) {
  feed(feedType: $feedType, cursor: $cursor, limit: $limit) {
    posts {
      ...PostFields
    }
    hasMore
    nextCursor
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useGetFeedQuery__
 *
 * To run a query within a React component, call `useGetFeedQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFeedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFeedQuery({
 *   variables: {
 *      feedType: // value for 'feedType'
 *      cursor: // value for 'cursor'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetFeedQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetFeedQuery, GetFeedQueryVariables> & ({ variables: GetFeedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetFeedQuery, GetFeedQueryVariables>(GetFeedDocument, options);
      }
export function useGetFeedLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFeedQuery, GetFeedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetFeedQuery, GetFeedQueryVariables>(GetFeedDocument, options);
        }
// @ts-ignore
export function useGetFeedSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetFeedQuery, GetFeedQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetFeedQuery, GetFeedQueryVariables>;
export function useGetFeedSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetFeedQuery, GetFeedQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetFeedQuery | undefined, GetFeedQueryVariables>;
export function useGetFeedSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetFeedQuery, GetFeedQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetFeedQuery, GetFeedQueryVariables>(GetFeedDocument, options);
        }
export type GetFeedQueryHookResult = ReturnType<typeof useGetFeedQuery>;
export type GetFeedLazyQueryHookResult = ReturnType<typeof useGetFeedLazyQuery>;
export type GetFeedSuspenseQueryHookResult = ReturnType<typeof useGetFeedSuspenseQuery>;
export type GetFeedQueryResult = ApolloReactCommon.QueryResult<GetFeedQuery, GetFeedQueryVariables>;
export const GetPostDocument = gql`
    query GetPost($id: ID!) {
  post(id: $id) {
    ...PostFields
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useGetPostQuery__
 *
 * To run a query within a React component, call `useGetPostQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPostQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPostQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetPostQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetPostQuery, GetPostQueryVariables> & ({ variables: GetPostQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPostQuery, GetPostQueryVariables>(GetPostDocument, options);
      }
export function useGetPostLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPostQuery, GetPostQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPostQuery, GetPostQueryVariables>(GetPostDocument, options);
        }
// @ts-ignore
export function useGetPostSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetPostQuery, GetPostQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostQuery, GetPostQueryVariables>;
export function useGetPostSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostQuery, GetPostQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostQuery | undefined, GetPostQueryVariables>;
export function useGetPostSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostQuery, GetPostQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPostQuery, GetPostQueryVariables>(GetPostDocument, options);
        }
export type GetPostQueryHookResult = ReturnType<typeof useGetPostQuery>;
export type GetPostLazyQueryHookResult = ReturnType<typeof useGetPostLazyQuery>;
export type GetPostSuspenseQueryHookResult = ReturnType<typeof useGetPostSuspenseQuery>;
export type GetPostQueryResult = ApolloReactCommon.QueryResult<GetPostQuery, GetPostQueryVariables>;
export const GetPostsDocument = gql`
    query GetPosts($filter: PostFilterInput, $sortBy: PostSortBy = CREATED_AT, $order: SortOrder = DESC, $limit: Int = 20, $offset: Int = 0) {
  posts(
    filter: $filter
    sortBy: $sortBy
    order: $order
    limit: $limit
    offset: $offset
  ) {
    items {
      ...PostFields
    }
    hasMore
    total
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useGetPostsQuery__
 *
 * To run a query within a React component, call `useGetPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPostsQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      sortBy: // value for 'sortBy'
 *      order: // value for 'order'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetPostsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetPostsQuery, GetPostsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPostsQuery, GetPostsQueryVariables>(GetPostsDocument, options);
      }
export function useGetPostsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPostsQuery, GetPostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPostsQuery, GetPostsQueryVariables>(GetPostsDocument, options);
        }
// @ts-ignore
export function useGetPostsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetPostsQuery, GetPostsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostsQuery, GetPostsQueryVariables>;
export function useGetPostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostsQuery, GetPostsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostsQuery | undefined, GetPostsQueryVariables>;
export function useGetPostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostsQuery, GetPostsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPostsQuery, GetPostsQueryVariables>(GetPostsDocument, options);
        }
export type GetPostsQueryHookResult = ReturnType<typeof useGetPostsQuery>;
export type GetPostsLazyQueryHookResult = ReturnType<typeof useGetPostsLazyQuery>;
export type GetPostsSuspenseQueryHookResult = ReturnType<typeof useGetPostsSuspenseQuery>;
export type GetPostsQueryResult = ApolloReactCommon.QueryResult<GetPostsQuery, GetPostsQueryVariables>;
export const GetUserPostsDocument = gql`
    query GetUserPosts($userId: ID!, $limit: Int = 20, $offset: Int = 0) {
  userPosts(userId: $userId, limit: $limit, offset: $offset) {
    items {
      ...PostFields
    }
    hasMore
    total
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useGetUserPostsQuery__
 *
 * To run a query within a React component, call `useGetUserPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserPostsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetUserPostsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserPostsQuery, GetUserPostsQueryVariables> & ({ variables: GetUserPostsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserPostsQuery, GetUserPostsQueryVariables>(GetUserPostsDocument, options);
      }
export function useGetUserPostsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserPostsQuery, GetUserPostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserPostsQuery, GetUserPostsQueryVariables>(GetUserPostsDocument, options);
        }
// @ts-ignore
export function useGetUserPostsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUserPostsQuery, GetUserPostsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserPostsQuery, GetUserPostsQueryVariables>;
export function useGetUserPostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserPostsQuery, GetUserPostsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserPostsQuery | undefined, GetUserPostsQueryVariables>;
export function useGetUserPostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserPostsQuery, GetUserPostsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserPostsQuery, GetUserPostsQueryVariables>(GetUserPostsDocument, options);
        }
export type GetUserPostsQueryHookResult = ReturnType<typeof useGetUserPostsQuery>;
export type GetUserPostsLazyQueryHookResult = ReturnType<typeof useGetUserPostsLazyQuery>;
export type GetUserPostsSuspenseQueryHookResult = ReturnType<typeof useGetUserPostsSuspenseQuery>;
export type GetUserPostsQueryResult = ApolloReactCommon.QueryResult<GetUserPostsQuery, GetUserPostsQueryVariables>;
export const GetPostCommentsDocument = gql`
    query GetPostComments($postId: ID!, $limit: Int = 20, $offset: Int = 0) {
  postComments(postId: $postId, limit: $limit, offset: $offset) {
    items {
      ...CommentFields
    }
    hasMore
    total
  }
}
    ${CommentFieldsFragmentDoc}`;

/**
 * __useGetPostCommentsQuery__
 *
 * To run a query within a React component, call `useGetPostCommentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPostCommentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPostCommentsQuery({
 *   variables: {
 *      postId: // value for 'postId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetPostCommentsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetPostCommentsQuery, GetPostCommentsQueryVariables> & ({ variables: GetPostCommentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPostCommentsQuery, GetPostCommentsQueryVariables>(GetPostCommentsDocument, options);
      }
export function useGetPostCommentsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPostCommentsQuery, GetPostCommentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPostCommentsQuery, GetPostCommentsQueryVariables>(GetPostCommentsDocument, options);
        }
// @ts-ignore
export function useGetPostCommentsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetPostCommentsQuery, GetPostCommentsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostCommentsQuery, GetPostCommentsQueryVariables>;
export function useGetPostCommentsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostCommentsQuery, GetPostCommentsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostCommentsQuery | undefined, GetPostCommentsQueryVariables>;
export function useGetPostCommentsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostCommentsQuery, GetPostCommentsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPostCommentsQuery, GetPostCommentsQueryVariables>(GetPostCommentsDocument, options);
        }
export type GetPostCommentsQueryHookResult = ReturnType<typeof useGetPostCommentsQuery>;
export type GetPostCommentsLazyQueryHookResult = ReturnType<typeof useGetPostCommentsLazyQuery>;
export type GetPostCommentsSuspenseQueryHookResult = ReturnType<typeof useGetPostCommentsSuspenseQuery>;
export type GetPostCommentsQueryResult = ApolloReactCommon.QueryResult<GetPostCommentsQuery, GetPostCommentsQueryVariables>;
export const GetPostRepliesDocument = gql`
    query GetPostReplies($postId: ID!, $limit: Int = 20, $offset: Int = 0) {
  postReplies(postId: $postId, limit: $limit, offset: $offset) {
    items {
      ...PostFields
    }
    hasMore
    total
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useGetPostRepliesQuery__
 *
 * To run a query within a React component, call `useGetPostRepliesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPostRepliesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPostRepliesQuery({
 *   variables: {
 *      postId: // value for 'postId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetPostRepliesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetPostRepliesQuery, GetPostRepliesQueryVariables> & ({ variables: GetPostRepliesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPostRepliesQuery, GetPostRepliesQueryVariables>(GetPostRepliesDocument, options);
      }
export function useGetPostRepliesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPostRepliesQuery, GetPostRepliesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPostRepliesQuery, GetPostRepliesQueryVariables>(GetPostRepliesDocument, options);
        }
// @ts-ignore
export function useGetPostRepliesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetPostRepliesQuery, GetPostRepliesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostRepliesQuery, GetPostRepliesQueryVariables>;
export function useGetPostRepliesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostRepliesQuery, GetPostRepliesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostRepliesQuery | undefined, GetPostRepliesQueryVariables>;
export function useGetPostRepliesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostRepliesQuery, GetPostRepliesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPostRepliesQuery, GetPostRepliesQueryVariables>(GetPostRepliesDocument, options);
        }
export type GetPostRepliesQueryHookResult = ReturnType<typeof useGetPostRepliesQuery>;
export type GetPostRepliesLazyQueryHookResult = ReturnType<typeof useGetPostRepliesLazyQuery>;
export type GetPostRepliesSuspenseQueryHookResult = ReturnType<typeof useGetPostRepliesSuspenseQuery>;
export type GetPostRepliesQueryResult = ApolloReactCommon.QueryResult<GetPostRepliesQuery, GetPostRepliesQueryVariables>;
export const GetPostsByHashtagDocument = gql`
    query GetPostsByHashtag($tag: String!, $limit: Int = 20, $offset: Int = 0) {
  postsByHashtag(tag: $tag, limit: $limit, offset: $offset) {
    items {
      ...PostFields
    }
    hasMore
    total
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useGetPostsByHashtagQuery__
 *
 * To run a query within a React component, call `useGetPostsByHashtagQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPostsByHashtagQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPostsByHashtagQuery({
 *   variables: {
 *      tag: // value for 'tag'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetPostsByHashtagQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables> & ({ variables: GetPostsByHashtagQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables>(GetPostsByHashtagDocument, options);
      }
export function useGetPostsByHashtagLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables>(GetPostsByHashtagDocument, options);
        }
// @ts-ignore
export function useGetPostsByHashtagSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables>;
export function useGetPostsByHashtagSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetPostsByHashtagQuery | undefined, GetPostsByHashtagQueryVariables>;
export function useGetPostsByHashtagSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables>(GetPostsByHashtagDocument, options);
        }
export type GetPostsByHashtagQueryHookResult = ReturnType<typeof useGetPostsByHashtagQuery>;
export type GetPostsByHashtagLazyQueryHookResult = ReturnType<typeof useGetPostsByHashtagLazyQuery>;
export type GetPostsByHashtagSuspenseQueryHookResult = ReturnType<typeof useGetPostsByHashtagSuspenseQuery>;
export type GetPostsByHashtagQueryResult = ApolloReactCommon.QueryResult<GetPostsByHashtagQuery, GetPostsByHashtagQueryVariables>;
export const GetTrendingHashtagsDocument = gql`
    query GetTrendingHashtags($limit: Int = 10, $period: TrendingPeriod = TWENTY_FOUR_HOURS) {
  trendingHashtags(limit: $limit, period: $period) {
    id
    tag
    postsCount
    score
    period
    calculatedAt
  }
}
    `;

/**
 * __useGetTrendingHashtagsQuery__
 *
 * To run a query within a React component, call `useGetTrendingHashtagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTrendingHashtagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTrendingHashtagsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      period: // value for 'period'
 *   },
 * });
 */
export function useGetTrendingHashtagsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>(GetTrendingHashtagsDocument, options);
      }
export function useGetTrendingHashtagsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>(GetTrendingHashtagsDocument, options);
        }
// @ts-ignore
export function useGetTrendingHashtagsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>;
export function useGetTrendingHashtagsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetTrendingHashtagsQuery | undefined, GetTrendingHashtagsQueryVariables>;
export function useGetTrendingHashtagsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>(GetTrendingHashtagsDocument, options);
        }
export type GetTrendingHashtagsQueryHookResult = ReturnType<typeof useGetTrendingHashtagsQuery>;
export type GetTrendingHashtagsLazyQueryHookResult = ReturnType<typeof useGetTrendingHashtagsLazyQuery>;
export type GetTrendingHashtagsSuspenseQueryHookResult = ReturnType<typeof useGetTrendingHashtagsSuspenseQuery>;
export type GetTrendingHashtagsQueryResult = ApolloReactCommon.QueryResult<GetTrendingHashtagsQuery, GetTrendingHashtagsQueryVariables>;
export const GetMyBookmarksDocument = gql`
    query GetMyBookmarks($limit: Int = 20, $offset: Int = 0) {
  myBookmarks(limit: $limit, offset: $offset) {
    items {
      ...PostFields
    }
    hasMore
    total
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useGetMyBookmarksQuery__
 *
 * To run a query within a React component, call `useGetMyBookmarksQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyBookmarksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyBookmarksQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetMyBookmarksQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>(GetMyBookmarksDocument, options);
      }
export function useGetMyBookmarksLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>(GetMyBookmarksDocument, options);
        }
// @ts-ignore
export function useGetMyBookmarksSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>;
export function useGetMyBookmarksSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyBookmarksQuery | undefined, GetMyBookmarksQueryVariables>;
export function useGetMyBookmarksSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>(GetMyBookmarksDocument, options);
        }
export type GetMyBookmarksQueryHookResult = ReturnType<typeof useGetMyBookmarksQuery>;
export type GetMyBookmarksLazyQueryHookResult = ReturnType<typeof useGetMyBookmarksLazyQuery>;
export type GetMyBookmarksSuspenseQueryHookResult = ReturnType<typeof useGetMyBookmarksSuspenseQuery>;
export type GetMyBookmarksQueryResult = ApolloReactCommon.QueryResult<GetMyBookmarksQuery, GetMyBookmarksQueryVariables>;
export const CreatePostDocument = gql`
    mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ...PostFields
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useCreatePostMutation__
 *
 * To run a mutation, you first call `useCreatePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPostMutation, { data, loading, error }] = useCreatePostMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreatePostMutation, CreatePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreatePostMutation, CreatePostMutationVariables>(CreatePostDocument, options);
      }
export type CreatePostMutationHookResult = ReturnType<typeof useCreatePostMutation>;
export type CreatePostMutationResult = ApolloReactCommon.MutationResult<CreatePostMutation>;
export type CreatePostMutationOptions = ApolloReactCommon.BaseMutationOptions<CreatePostMutation, CreatePostMutationVariables>;
export const UpdatePostDocument = gql`
    mutation UpdatePost($postId: ID!, $input: UpdatePostInput!) {
  updatePost(postId: $postId, input: $input) {
    ...PostFields
  }
}
    ${PostFieldsFragmentDoc}`;

/**
 * __useUpdatePostMutation__
 *
 * To run a mutation, you first call `useUpdatePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePostMutation, { data, loading, error }] = useUpdatePostMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdatePostMutation, UpdatePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdatePostMutation, UpdatePostMutationVariables>(UpdatePostDocument, options);
      }
export type UpdatePostMutationHookResult = ReturnType<typeof useUpdatePostMutation>;
export type UpdatePostMutationResult = ApolloReactCommon.MutationResult<UpdatePostMutation>;
export type UpdatePostMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdatePostMutation, UpdatePostMutationVariables>;
export const DeletePostDocument = gql`
    mutation DeletePost($postId: ID!) {
  deletePost(postId: $postId)
}
    `;

/**
 * __useDeletePostMutation__
 *
 * To run a mutation, you first call `useDeletePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePostMutation, { data, loading, error }] = useDeletePostMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useDeletePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeletePostMutation, DeletePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeletePostMutation, DeletePostMutationVariables>(DeletePostDocument, options);
      }
export type DeletePostMutationHookResult = ReturnType<typeof useDeletePostMutation>;
export type DeletePostMutationResult = ApolloReactCommon.MutationResult<DeletePostMutation>;
export type DeletePostMutationOptions = ApolloReactCommon.BaseMutationOptions<DeletePostMutation, DeletePostMutationVariables>;
export const LikePostDocument = gql`
    mutation LikePost($postId: ID!) {
  likePost(postId: $postId)
}
    `;

/**
 * __useLikePostMutation__
 *
 * To run a mutation, you first call `useLikePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLikePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [likePostMutation, { data, loading, error }] = useLikePostMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useLikePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LikePostMutation, LikePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LikePostMutation, LikePostMutationVariables>(LikePostDocument, options);
      }
export type LikePostMutationHookResult = ReturnType<typeof useLikePostMutation>;
export type LikePostMutationResult = ApolloReactCommon.MutationResult<LikePostMutation>;
export type LikePostMutationOptions = ApolloReactCommon.BaseMutationOptions<LikePostMutation, LikePostMutationVariables>;
export const UnlikePostDocument = gql`
    mutation UnlikePost($postId: ID!) {
  unlikePost(postId: $postId)
}
    `;

/**
 * __useUnlikePostMutation__
 *
 * To run a mutation, you first call `useUnlikePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnlikePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unlikePostMutation, { data, loading, error }] = useUnlikePostMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useUnlikePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UnlikePostMutation, UnlikePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UnlikePostMutation, UnlikePostMutationVariables>(UnlikePostDocument, options);
      }
export type UnlikePostMutationHookResult = ReturnType<typeof useUnlikePostMutation>;
export type UnlikePostMutationResult = ApolloReactCommon.MutationResult<UnlikePostMutation>;
export type UnlikePostMutationOptions = ApolloReactCommon.BaseMutationOptions<UnlikePostMutation, UnlikePostMutationVariables>;
export const RepostDocument = gql`
    mutation Repost($input: RepostInput!) {
  repost(input: $input)
}
    `;

/**
 * __useRepostMutation__
 *
 * To run a mutation, you first call `useRepostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRepostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [repostMutation, { data, loading, error }] = useRepostMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRepostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RepostMutation, RepostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RepostMutation, RepostMutationVariables>(RepostDocument, options);
      }
export type RepostMutationHookResult = ReturnType<typeof useRepostMutation>;
export type RepostMutationResult = ApolloReactCommon.MutationResult<RepostMutation>;
export type RepostMutationOptions = ApolloReactCommon.BaseMutationOptions<RepostMutation, RepostMutationVariables>;
export const RemoveRepostDocument = gql`
    mutation RemoveRepost($postId: ID!) {
  removeRepost(postId: $postId)
}
    `;

/**
 * __useRemoveRepostMutation__
 *
 * To run a mutation, you first call `useRemoveRepostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveRepostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeRepostMutation, { data, loading, error }] = useRemoveRepostMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useRemoveRepostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemoveRepostMutation, RemoveRepostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemoveRepostMutation, RemoveRepostMutationVariables>(RemoveRepostDocument, options);
      }
export type RemoveRepostMutationHookResult = ReturnType<typeof useRemoveRepostMutation>;
export type RemoveRepostMutationResult = ApolloReactCommon.MutationResult<RemoveRepostMutation>;
export type RemoveRepostMutationOptions = ApolloReactCommon.BaseMutationOptions<RemoveRepostMutation, RemoveRepostMutationVariables>;
export const BookmarkPostDocument = gql`
    mutation BookmarkPost($postId: ID!) {
  bookmarkPost(postId: $postId)
}
    `;

/**
 * __useBookmarkPostMutation__
 *
 * To run a mutation, you first call `useBookmarkPostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBookmarkPostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bookmarkPostMutation, { data, loading, error }] = useBookmarkPostMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useBookmarkPostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<BookmarkPostMutation, BookmarkPostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<BookmarkPostMutation, BookmarkPostMutationVariables>(BookmarkPostDocument, options);
      }
export type BookmarkPostMutationHookResult = ReturnType<typeof useBookmarkPostMutation>;
export type BookmarkPostMutationResult = ApolloReactCommon.MutationResult<BookmarkPostMutation>;
export type BookmarkPostMutationOptions = ApolloReactCommon.BaseMutationOptions<BookmarkPostMutation, BookmarkPostMutationVariables>;
export const RemoveBookmarkDocument = gql`
    mutation RemoveBookmark($postId: ID!) {
  removeBookmark(postId: $postId)
}
    `;

/**
 * __useRemoveBookmarkMutation__
 *
 * To run a mutation, you first call `useRemoveBookmarkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveBookmarkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeBookmarkMutation, { data, loading, error }] = useRemoveBookmarkMutation({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function useRemoveBookmarkMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemoveBookmarkMutation, RemoveBookmarkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemoveBookmarkMutation, RemoveBookmarkMutationVariables>(RemoveBookmarkDocument, options);
      }
export type RemoveBookmarkMutationHookResult = ReturnType<typeof useRemoveBookmarkMutation>;
export type RemoveBookmarkMutationResult = ApolloReactCommon.MutationResult<RemoveBookmarkMutation>;
export type RemoveBookmarkMutationOptions = ApolloReactCommon.BaseMutationOptions<RemoveBookmarkMutation, RemoveBookmarkMutationVariables>;
export const CreateCommentDocument = gql`
    mutation CreateComment($input: CreateCommentInput!) {
  createComment(input: $input) {
    ...CommentFields
  }
}
    ${CommentFieldsFragmentDoc}`;

/**
 * __useCreateCommentMutation__
 *
 * To run a mutation, you first call `useCreateCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCommentMutation, { data, loading, error }] = useCreateCommentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCommentMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateCommentMutation, CreateCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateCommentMutation, CreateCommentMutationVariables>(CreateCommentDocument, options);
      }
export type CreateCommentMutationHookResult = ReturnType<typeof useCreateCommentMutation>;
export type CreateCommentMutationResult = ApolloReactCommon.MutationResult<CreateCommentMutation>;
export type CreateCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateCommentMutation, CreateCommentMutationVariables>;
export const DeleteCommentDocument = gql`
    mutation DeleteComment($commentId: ID!) {
  deleteComment(commentId: $commentId)
}
    `;

/**
 * __useDeleteCommentMutation__
 *
 * To run a mutation, you first call `useDeleteCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCommentMutation, { data, loading, error }] = useDeleteCommentMutation({
 *   variables: {
 *      commentId: // value for 'commentId'
 *   },
 * });
 */
export function useDeleteCommentMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteCommentMutation, DeleteCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteCommentMutation, DeleteCommentMutationVariables>(DeleteCommentDocument, options);
      }
export type DeleteCommentMutationHookResult = ReturnType<typeof useDeleteCommentMutation>;
export type DeleteCommentMutationResult = ApolloReactCommon.MutationResult<DeleteCommentMutation>;
export type DeleteCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteCommentMutation, DeleteCommentMutationVariables>;
export const LikeCommentDocument = gql`
    mutation LikeComment($commentId: ID!) {
  likeComment(commentId: $commentId)
}
    `;

/**
 * __useLikeCommentMutation__
 *
 * To run a mutation, you first call `useLikeCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLikeCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [likeCommentMutation, { data, loading, error }] = useLikeCommentMutation({
 *   variables: {
 *      commentId: // value for 'commentId'
 *   },
 * });
 */
export function useLikeCommentMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LikeCommentMutation, LikeCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LikeCommentMutation, LikeCommentMutationVariables>(LikeCommentDocument, options);
      }
export type LikeCommentMutationHookResult = ReturnType<typeof useLikeCommentMutation>;
export type LikeCommentMutationResult = ApolloReactCommon.MutationResult<LikeCommentMutation>;
export type LikeCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<LikeCommentMutation, LikeCommentMutationVariables>;
export const UnlikeCommentDocument = gql`
    mutation UnlikeComment($commentId: ID!) {
  unlikeComment(commentId: $commentId)
}
    `;

/**
 * __useUnlikeCommentMutation__
 *
 * To run a mutation, you first call `useUnlikeCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnlikeCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unlikeCommentMutation, { data, loading, error }] = useUnlikeCommentMutation({
 *   variables: {
 *      commentId: // value for 'commentId'
 *   },
 * });
 */
export function useUnlikeCommentMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UnlikeCommentMutation, UnlikeCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UnlikeCommentMutation, UnlikeCommentMutationVariables>(UnlikeCommentDocument, options);
      }
export type UnlikeCommentMutationHookResult = ReturnType<typeof useUnlikeCommentMutation>;
export type UnlikeCommentMutationResult = ApolloReactCommon.MutationResult<UnlikeCommentMutation>;
export type UnlikeCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<UnlikeCommentMutation, UnlikeCommentMutationVariables>;
export const GetMeDocument = gql`
    query GetMe {
  me {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

/**
 * __useGetMeQuery__
 *
 * To run a query within a React component, call `useGetMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
      }
export function useGetMeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
        }
// @ts-ignore
export function useGetMeSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMeQuery, GetMeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMeQuery, GetMeQueryVariables>;
export function useGetMeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMeQuery, GetMeQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMeQuery | undefined, GetMeQueryVariables>;
export function useGetMeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
        }
export type GetMeQueryHookResult = ReturnType<typeof useGetMeQuery>;
export type GetMeLazyQueryHookResult = ReturnType<typeof useGetMeLazyQuery>;
export type GetMeSuspenseQueryHookResult = ReturnType<typeof useGetMeSuspenseQuery>;
export type GetMeQueryResult = ApolloReactCommon.QueryResult<GetMeQuery, GetMeQueryVariables>;
export const GetUserDocument = gql`
    query GetUser($id: ID!) {
  user(id: $id) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserQuery, GetUserQueryVariables> & ({ variables: GetUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
// @ts-ignore
export function useGetUserSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserQuery, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserQuery | undefined, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserSuspenseQueryHookResult = ReturnType<typeof useGetUserSuspenseQuery>;
export type GetUserQueryResult = ApolloReactCommon.QueryResult<GetUserQuery, GetUserQueryVariables>;
export const GetUserByUsernameDocument = gql`
    query GetUserByUsername($username: String!) {
  userByUsername(username: $username) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

/**
 * __useGetUserByUsernameQuery__
 *
 * To run a query within a React component, call `useGetUserByUsernameQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserByUsernameQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserByUsernameQuery({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useGetUserByUsernameQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserByUsernameQuery, GetUserByUsernameQueryVariables> & ({ variables: GetUserByUsernameQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>(GetUserByUsernameDocument, options);
      }
export function useGetUserByUsernameLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>(GetUserByUsernameDocument, options);
        }
// @ts-ignore
export function useGetUserByUsernameSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>;
export function useGetUserByUsernameSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserByUsernameQuery | undefined, GetUserByUsernameQueryVariables>;
export function useGetUserByUsernameSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>(GetUserByUsernameDocument, options);
        }
export type GetUserByUsernameQueryHookResult = ReturnType<typeof useGetUserByUsernameQuery>;
export type GetUserByUsernameLazyQueryHookResult = ReturnType<typeof useGetUserByUsernameLazyQuery>;
export type GetUserByUsernameSuspenseQueryHookResult = ReturnType<typeof useGetUserByUsernameSuspenseQuery>;
export type GetUserByUsernameQueryResult = ApolloReactCommon.QueryResult<GetUserByUsernameQuery, GetUserByUsernameQueryVariables>;
export const GetUserByWalletDocument = gql`
    query GetUserByWallet($walletAddress: String!) {
  userByWallet(walletAddress: $walletAddress) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

/**
 * __useGetUserByWalletQuery__
 *
 * To run a query within a React component, call `useGetUserByWalletQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserByWalletQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserByWalletQuery({
 *   variables: {
 *      walletAddress: // value for 'walletAddress'
 *   },
 * });
 */
export function useGetUserByWalletQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserByWalletQuery, GetUserByWalletQueryVariables> & ({ variables: GetUserByWalletQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserByWalletQuery, GetUserByWalletQueryVariables>(GetUserByWalletDocument, options);
      }
export function useGetUserByWalletLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserByWalletQuery, GetUserByWalletQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserByWalletQuery, GetUserByWalletQueryVariables>(GetUserByWalletDocument, options);
        }
// @ts-ignore
export function useGetUserByWalletSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUserByWalletQuery, GetUserByWalletQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserByWalletQuery, GetUserByWalletQueryVariables>;
export function useGetUserByWalletSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserByWalletQuery, GetUserByWalletQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserByWalletQuery | undefined, GetUserByWalletQueryVariables>;
export function useGetUserByWalletSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserByWalletQuery, GetUserByWalletQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserByWalletQuery, GetUserByWalletQueryVariables>(GetUserByWalletDocument, options);
        }
export type GetUserByWalletQueryHookResult = ReturnType<typeof useGetUserByWalletQuery>;
export type GetUserByWalletLazyQueryHookResult = ReturnType<typeof useGetUserByWalletLazyQuery>;
export type GetUserByWalletSuspenseQueryHookResult = ReturnType<typeof useGetUserByWalletSuspenseQuery>;
export type GetUserByWalletQueryResult = ApolloReactCommon.QueryResult<GetUserByWalletQuery, GetUserByWalletQueryVariables>;
export const SearchUsersDocument = gql`
    query SearchUsers($query: String!, $limit: Int = 10) {
  searchUsers(query: $query, limit: $limit) {
    users {
      ...UserMinimalFields
    }
    total
  }
}
    ${UserMinimalFieldsFragmentDoc}`;

/**
 * __useSearchUsersQuery__
 *
 * To run a query within a React component, call `useSearchUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchUsersQuery({
 *   variables: {
 *      query: // value for 'query'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useSearchUsersQuery(baseOptions: ApolloReactHooks.QueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables> & ({ variables: SearchUsersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
      }
export function useSearchUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
        }
// @ts-ignore
export function useSearchUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<SearchUsersQuery, SearchUsersQueryVariables>;
export function useSearchUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<SearchUsersQuery | undefined, SearchUsersQueryVariables>;
export function useSearchUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchUsersQuery, SearchUsersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SearchUsersQuery, SearchUsersQueryVariables>(SearchUsersDocument, options);
        }
export type SearchUsersQueryHookResult = ReturnType<typeof useSearchUsersQuery>;
export type SearchUsersLazyQueryHookResult = ReturnType<typeof useSearchUsersLazyQuery>;
export type SearchUsersSuspenseQueryHookResult = ReturnType<typeof useSearchUsersSuspenseQuery>;
export type SearchUsersQueryResult = ApolloReactCommon.QueryResult<SearchUsersQuery, SearchUsersQueryVariables>;
export const GetFollowersDocument = gql`
    query GetFollowers($userId: ID!, $limit: Int = 20, $offset: Int = 0) {
  followers(userId: $userId, limit: $limit, offset: $offset) {
    items {
      ...FollowRelationFields
    }
    hasMore
    total
  }
}
    ${FollowRelationFieldsFragmentDoc}`;

/**
 * __useGetFollowersQuery__
 *
 * To run a query within a React component, call `useGetFollowersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFollowersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFollowersQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetFollowersQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetFollowersQuery, GetFollowersQueryVariables> & ({ variables: GetFollowersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetFollowersQuery, GetFollowersQueryVariables>(GetFollowersDocument, options);
      }
export function useGetFollowersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFollowersQuery, GetFollowersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetFollowersQuery, GetFollowersQueryVariables>(GetFollowersDocument, options);
        }
// @ts-ignore
export function useGetFollowersSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetFollowersQuery, GetFollowersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetFollowersQuery, GetFollowersQueryVariables>;
export function useGetFollowersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetFollowersQuery, GetFollowersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetFollowersQuery | undefined, GetFollowersQueryVariables>;
export function useGetFollowersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetFollowersQuery, GetFollowersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetFollowersQuery, GetFollowersQueryVariables>(GetFollowersDocument, options);
        }
export type GetFollowersQueryHookResult = ReturnType<typeof useGetFollowersQuery>;
export type GetFollowersLazyQueryHookResult = ReturnType<typeof useGetFollowersLazyQuery>;
export type GetFollowersSuspenseQueryHookResult = ReturnType<typeof useGetFollowersSuspenseQuery>;
export type GetFollowersQueryResult = ApolloReactCommon.QueryResult<GetFollowersQuery, GetFollowersQueryVariables>;
export const GetFollowingDocument = gql`
    query GetFollowing($userId: ID!, $limit: Int = 20, $offset: Int = 0) {
  following(userId: $userId, limit: $limit, offset: $offset) {
    items {
      ...FollowRelationFields
    }
    hasMore
    total
  }
}
    ${FollowRelationFieldsFragmentDoc}`;

/**
 * __useGetFollowingQuery__
 *
 * To run a query within a React component, call `useGetFollowingQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFollowingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFollowingQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetFollowingQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetFollowingQuery, GetFollowingQueryVariables> & ({ variables: GetFollowingQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetFollowingQuery, GetFollowingQueryVariables>(GetFollowingDocument, options);
      }
export function useGetFollowingLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFollowingQuery, GetFollowingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetFollowingQuery, GetFollowingQueryVariables>(GetFollowingDocument, options);
        }
// @ts-ignore
export function useGetFollowingSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetFollowingQuery, GetFollowingQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetFollowingQuery, GetFollowingQueryVariables>;
export function useGetFollowingSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetFollowingQuery, GetFollowingQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetFollowingQuery | undefined, GetFollowingQueryVariables>;
export function useGetFollowingSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetFollowingQuery, GetFollowingQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetFollowingQuery, GetFollowingQueryVariables>(GetFollowingDocument, options);
        }
export type GetFollowingQueryHookResult = ReturnType<typeof useGetFollowingQuery>;
export type GetFollowingLazyQueryHookResult = ReturnType<typeof useGetFollowingLazyQuery>;
export type GetFollowingSuspenseQueryHookResult = ReturnType<typeof useGetFollowingSuspenseQuery>;
export type GetFollowingQueryResult = ApolloReactCommon.QueryResult<GetFollowingQuery, GetFollowingQueryVariables>;
export const GetMyFollowersDocument = gql`
    query GetMyFollowers($limit: Int = 20, $offset: Int = 0) {
  myFollowers(limit: $limit, offset: $offset) {
    items {
      ...FollowRelationFields
    }
    hasMore
    total
  }
}
    ${FollowRelationFieldsFragmentDoc}`;

/**
 * __useGetMyFollowersQuery__
 *
 * To run a query within a React component, call `useGetMyFollowersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyFollowersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyFollowersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetMyFollowersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyFollowersQuery, GetMyFollowersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMyFollowersQuery, GetMyFollowersQueryVariables>(GetMyFollowersDocument, options);
      }
export function useGetMyFollowersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyFollowersQuery, GetMyFollowersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMyFollowersQuery, GetMyFollowersQueryVariables>(GetMyFollowersDocument, options);
        }
// @ts-ignore
export function useGetMyFollowersSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMyFollowersQuery, GetMyFollowersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyFollowersQuery, GetMyFollowersQueryVariables>;
export function useGetMyFollowersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyFollowersQuery, GetMyFollowersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyFollowersQuery | undefined, GetMyFollowersQueryVariables>;
export function useGetMyFollowersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyFollowersQuery, GetMyFollowersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMyFollowersQuery, GetMyFollowersQueryVariables>(GetMyFollowersDocument, options);
        }
export type GetMyFollowersQueryHookResult = ReturnType<typeof useGetMyFollowersQuery>;
export type GetMyFollowersLazyQueryHookResult = ReturnType<typeof useGetMyFollowersLazyQuery>;
export type GetMyFollowersSuspenseQueryHookResult = ReturnType<typeof useGetMyFollowersSuspenseQuery>;
export type GetMyFollowersQueryResult = ApolloReactCommon.QueryResult<GetMyFollowersQuery, GetMyFollowersQueryVariables>;
export const GetMyFollowingDocument = gql`
    query GetMyFollowing($limit: Int = 20, $offset: Int = 0) {
  myFollowing(limit: $limit, offset: $offset) {
    items {
      ...FollowRelationFields
    }
    hasMore
    total
  }
}
    ${FollowRelationFieldsFragmentDoc}`;

/**
 * __useGetMyFollowingQuery__
 *
 * To run a query within a React component, call `useGetMyFollowingQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyFollowingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyFollowingQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetMyFollowingQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyFollowingQuery, GetMyFollowingQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMyFollowingQuery, GetMyFollowingQueryVariables>(GetMyFollowingDocument, options);
      }
export function useGetMyFollowingLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyFollowingQuery, GetMyFollowingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMyFollowingQuery, GetMyFollowingQueryVariables>(GetMyFollowingDocument, options);
        }
// @ts-ignore
export function useGetMyFollowingSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMyFollowingQuery, GetMyFollowingQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyFollowingQuery, GetMyFollowingQueryVariables>;
export function useGetMyFollowingSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyFollowingQuery, GetMyFollowingQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyFollowingQuery | undefined, GetMyFollowingQueryVariables>;
export function useGetMyFollowingSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyFollowingQuery, GetMyFollowingQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMyFollowingQuery, GetMyFollowingQueryVariables>(GetMyFollowingDocument, options);
        }
export type GetMyFollowingQueryHookResult = ReturnType<typeof useGetMyFollowingQuery>;
export type GetMyFollowingLazyQueryHookResult = ReturnType<typeof useGetMyFollowingLazyQuery>;
export type GetMyFollowingSuspenseQueryHookResult = ReturnType<typeof useGetMyFollowingSuspenseQuery>;
export type GetMyFollowingQueryResult = ApolloReactCommon.QueryResult<GetMyFollowingQuery, GetMyFollowingQueryVariables>;
export const IsFollowingDocument = gql`
    query IsFollowing($userId: ID!) {
  isFollowing(userId: $userId)
}
    `;

/**
 * __useIsFollowingQuery__
 *
 * To run a query within a React component, call `useIsFollowingQuery` and pass it any options that fit your needs.
 * When your component renders, `useIsFollowingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useIsFollowingQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useIsFollowingQuery(baseOptions: ApolloReactHooks.QueryHookOptions<IsFollowingQuery, IsFollowingQueryVariables> & ({ variables: IsFollowingQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<IsFollowingQuery, IsFollowingQueryVariables>(IsFollowingDocument, options);
      }
export function useIsFollowingLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<IsFollowingQuery, IsFollowingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<IsFollowingQuery, IsFollowingQueryVariables>(IsFollowingDocument, options);
        }
// @ts-ignore
export function useIsFollowingSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<IsFollowingQuery, IsFollowingQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<IsFollowingQuery, IsFollowingQueryVariables>;
export function useIsFollowingSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<IsFollowingQuery, IsFollowingQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<IsFollowingQuery | undefined, IsFollowingQueryVariables>;
export function useIsFollowingSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<IsFollowingQuery, IsFollowingQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<IsFollowingQuery, IsFollowingQueryVariables>(IsFollowingDocument, options);
        }
export type IsFollowingQueryHookResult = ReturnType<typeof useIsFollowingQuery>;
export type IsFollowingLazyQueryHookResult = ReturnType<typeof useIsFollowingLazyQuery>;
export type IsFollowingSuspenseQueryHookResult = ReturnType<typeof useIsFollowingSuspenseQuery>;
export type IsFollowingQueryResult = ApolloReactCommon.QueryResult<IsFollowingQuery, IsFollowingQueryVariables>;
export const IsUsernameAvailableDocument = gql`
    query IsUsernameAvailable($username: String!) {
  isUsernameAvailable(username: $username)
}
    `;

/**
 * __useIsUsernameAvailableQuery__
 *
 * To run a query within a React component, call `useIsUsernameAvailableQuery` and pass it any options that fit your needs.
 * When your component renders, `useIsUsernameAvailableQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useIsUsernameAvailableQuery({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useIsUsernameAvailableQuery(baseOptions: ApolloReactHooks.QueryHookOptions<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables> & ({ variables: IsUsernameAvailableQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables>(IsUsernameAvailableDocument, options);
      }
export function useIsUsernameAvailableLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables>(IsUsernameAvailableDocument, options);
        }
// @ts-ignore
export function useIsUsernameAvailableSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables>;
export function useIsUsernameAvailableSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<IsUsernameAvailableQuery | undefined, IsUsernameAvailableQueryVariables>;
export function useIsUsernameAvailableSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables>(IsUsernameAvailableDocument, options);
        }
export type IsUsernameAvailableQueryHookResult = ReturnType<typeof useIsUsernameAvailableQuery>;
export type IsUsernameAvailableLazyQueryHookResult = ReturnType<typeof useIsUsernameAvailableLazyQuery>;
export type IsUsernameAvailableSuspenseQueryHookResult = ReturnType<typeof useIsUsernameAvailableSuspenseQuery>;
export type IsUsernameAvailableQueryResult = ApolloReactCommon.QueryResult<IsUsernameAvailableQuery, IsUsernameAvailableQueryVariables>;
export const GetTrendingUsersDocument = gql`
    query GetTrendingUsers($limit: Int = 10, $period: TrendingPeriod = TWENTY_FOUR_HOURS) {
  trendingUsers(limit: $limit, period: $period) {
    id
    userId
    username
    displayName
    avatarUrl
    walletAddress
    followersCount
    score
    period
    calculatedAt
  }
}
    `;

/**
 * __useGetTrendingUsersQuery__
 *
 * To run a query within a React component, call `useGetTrendingUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTrendingUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTrendingUsersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      period: // value for 'period'
 *   },
 * });
 */
export function useGetTrendingUsersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>(GetTrendingUsersDocument, options);
      }
export function useGetTrendingUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>(GetTrendingUsersDocument, options);
        }
// @ts-ignore
export function useGetTrendingUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>;
export function useGetTrendingUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetTrendingUsersQuery | undefined, GetTrendingUsersQueryVariables>;
export function useGetTrendingUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>(GetTrendingUsersDocument, options);
        }
export type GetTrendingUsersQueryHookResult = ReturnType<typeof useGetTrendingUsersQuery>;
export type GetTrendingUsersLazyQueryHookResult = ReturnType<typeof useGetTrendingUsersLazyQuery>;
export type GetTrendingUsersSuspenseQueryHookResult = ReturnType<typeof useGetTrendingUsersSuspenseQuery>;
export type GetTrendingUsersQueryResult = ApolloReactCommon.QueryResult<GetTrendingUsersQuery, GetTrendingUsersQueryVariables>;
export const GetUsersDocument = gql`
    query GetUsers($filter: UserFilterInput, $limit: Int = 20, $offset: Int = 0) {
  users(filter: $filter, limit: $limit, offset: $offset) {
    items {
      ...UserFields
    }
    hasMore
    total
  }
}
    ${UserFieldsFragmentDoc}`;

/**
 * __useGetUsersQuery__
 *
 * To run a query within a React component, call `useGetUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUsersQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetUsersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
      }
export function useGetUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
// @ts-ignore
export function useGetUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUsersQuery, GetUsersQueryVariables>;
export function useGetUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUsersQuery | undefined, GetUsersQueryVariables>;
export function useGetUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
export type GetUsersQueryHookResult = ReturnType<typeof useGetUsersQuery>;
export type GetUsersLazyQueryHookResult = ReturnType<typeof useGetUsersLazyQuery>;
export type GetUsersSuspenseQueryHookResult = ReturnType<typeof useGetUsersSuspenseQuery>;
export type GetUsersQueryResult = ApolloReactCommon.QueryResult<GetUsersQuery, GetUsersQueryVariables>;
export const GetUserActivityDocument = gql`
    query GetUserActivity($userId: ID!) {
  userActivity(userId: $userId) {
    postsLast30Days
    commentsLast30Days
    donationsLast30Days
    donatedAmountLast30Days
    stakesLast30Days
    earnedFBTLast30Days
  }
}
    `;

/**
 * __useGetUserActivityQuery__
 *
 * To run a query within a React component, call `useGetUserActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserActivityQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserActivityQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserActivityQuery, GetUserActivityQueryVariables> & ({ variables: GetUserActivityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserActivityQuery, GetUserActivityQueryVariables>(GetUserActivityDocument, options);
      }
export function useGetUserActivityLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserActivityQuery, GetUserActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserActivityQuery, GetUserActivityQueryVariables>(GetUserActivityDocument, options);
        }
// @ts-ignore
export function useGetUserActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUserActivityQuery, GetUserActivityQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserActivityQuery, GetUserActivityQueryVariables>;
export function useGetUserActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserActivityQuery, GetUserActivityQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserActivityQuery | undefined, GetUserActivityQueryVariables>;
export function useGetUserActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserActivityQuery, GetUserActivityQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserActivityQuery, GetUserActivityQueryVariables>(GetUserActivityDocument, options);
        }
export type GetUserActivityQueryHookResult = ReturnType<typeof useGetUserActivityQuery>;
export type GetUserActivityLazyQueryHookResult = ReturnType<typeof useGetUserActivityLazyQuery>;
export type GetUserActivitySuspenseQueryHookResult = ReturnType<typeof useGetUserActivitySuspenseQuery>;
export type GetUserActivityQueryResult = ApolloReactCommon.QueryResult<GetUserActivityQuery, GetUserActivityQueryVariables>;
export const GetMyActivityDocument = gql`
    query GetMyActivity {
  myActivity {
    postsLast30Days
    commentsLast30Days
    donationsLast30Days
    donatedAmountLast30Days
    stakesLast30Days
    earnedFBTLast30Days
  }
}
    `;

/**
 * __useGetMyActivityQuery__
 *
 * To run a query within a React component, call `useGetMyActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyActivityQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMyActivityQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyActivityQuery, GetMyActivityQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMyActivityQuery, GetMyActivityQueryVariables>(GetMyActivityDocument, options);
      }
export function useGetMyActivityLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyActivityQuery, GetMyActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMyActivityQuery, GetMyActivityQueryVariables>(GetMyActivityDocument, options);
        }
// @ts-ignore
export function useGetMyActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMyActivityQuery, GetMyActivityQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyActivityQuery, GetMyActivityQueryVariables>;
export function useGetMyActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyActivityQuery, GetMyActivityQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyActivityQuery | undefined, GetMyActivityQueryVariables>;
export function useGetMyActivitySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyActivityQuery, GetMyActivityQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMyActivityQuery, GetMyActivityQueryVariables>(GetMyActivityDocument, options);
        }
export type GetMyActivityQueryHookResult = ReturnType<typeof useGetMyActivityQuery>;
export type GetMyActivityLazyQueryHookResult = ReturnType<typeof useGetMyActivityLazyQuery>;
export type GetMyActivitySuspenseQueryHookResult = ReturnType<typeof useGetMyActivitySuspenseQuery>;
export type GetMyActivityQueryResult = ApolloReactCommon.QueryResult<GetMyActivityQuery, GetMyActivityQueryVariables>;
export const GetUserDonationStatsDocument = gql`
    query GetUserDonationStats($userId: ID!) {
  userDonationStats(userId: $userId) {
    totalDonated
    donationsCount
    fundraisersDonatedTo
    averageDonation
    firstDonationAt
    lastDonationAt
  }
}
    `;

/**
 * __useGetUserDonationStatsQuery__
 *
 * To run a query within a React component, call `useGetUserDonationStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserDonationStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserDonationStatsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserDonationStatsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables> & ({ variables: GetUserDonationStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables>(GetUserDonationStatsDocument, options);
      }
export function useGetUserDonationStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables>(GetUserDonationStatsDocument, options);
        }
// @ts-ignore
export function useGetUserDonationStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables>;
export function useGetUserDonationStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserDonationStatsQuery | undefined, GetUserDonationStatsQueryVariables>;
export function useGetUserDonationStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables>(GetUserDonationStatsDocument, options);
        }
export type GetUserDonationStatsQueryHookResult = ReturnType<typeof useGetUserDonationStatsQuery>;
export type GetUserDonationStatsLazyQueryHookResult = ReturnType<typeof useGetUserDonationStatsLazyQuery>;
export type GetUserDonationStatsSuspenseQueryHookResult = ReturnType<typeof useGetUserDonationStatsSuspenseQuery>;
export type GetUserDonationStatsQueryResult = ApolloReactCommon.QueryResult<GetUserDonationStatsQuery, GetUserDonationStatsQueryVariables>;
export const GetMyDonationStatsDocument = gql`
    query GetMyDonationStats {
  myDonationStats {
    totalDonated
    donationsCount
    fundraisersDonatedTo
    averageDonation
    firstDonationAt
    lastDonationAt
  }
}
    `;

/**
 * __useGetMyDonationStatsQuery__
 *
 * To run a query within a React component, call `useGetMyDonationStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyDonationStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyDonationStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMyDonationStatsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>(GetMyDonationStatsDocument, options);
      }
export function useGetMyDonationStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>(GetMyDonationStatsDocument, options);
        }
// @ts-ignore
export function useGetMyDonationStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>;
export function useGetMyDonationStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyDonationStatsQuery | undefined, GetMyDonationStatsQueryVariables>;
export function useGetMyDonationStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>(GetMyDonationStatsDocument, options);
        }
export type GetMyDonationStatsQueryHookResult = ReturnType<typeof useGetMyDonationStatsQuery>;
export type GetMyDonationStatsLazyQueryHookResult = ReturnType<typeof useGetMyDonationStatsLazyQuery>;
export type GetMyDonationStatsSuspenseQueryHookResult = ReturnType<typeof useGetMyDonationStatsSuspenseQuery>;
export type GetMyDonationStatsQueryResult = ApolloReactCommon.QueryResult<GetMyDonationStatsQuery, GetMyDonationStatsQueryVariables>;
export const GetUserStakingStatsDocument = gql`
    query GetUserStakingStats($userId: ID!) {
  userStakingStats(userId: $userId) {
    totalStaked
    activeStakesCount
    fundraisersStakedIn
    globalPoolStake
    pendingYield
    totalYieldEarned
  }
}
    `;

/**
 * __useGetUserStakingStatsQuery__
 *
 * To run a query within a React component, call `useGetUserStakingStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserStakingStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserStakingStatsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserStakingStatsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables> & ({ variables: GetUserStakingStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables>(GetUserStakingStatsDocument, options);
      }
export function useGetUserStakingStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables>(GetUserStakingStatsDocument, options);
        }
// @ts-ignore
export function useGetUserStakingStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables>;
export function useGetUserStakingStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserStakingStatsQuery | undefined, GetUserStakingStatsQueryVariables>;
export function useGetUserStakingStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables>(GetUserStakingStatsDocument, options);
        }
export type GetUserStakingStatsQueryHookResult = ReturnType<typeof useGetUserStakingStatsQuery>;
export type GetUserStakingStatsLazyQueryHookResult = ReturnType<typeof useGetUserStakingStatsLazyQuery>;
export type GetUserStakingStatsSuspenseQueryHookResult = ReturnType<typeof useGetUserStakingStatsSuspenseQuery>;
export type GetUserStakingStatsQueryResult = ApolloReactCommon.QueryResult<GetUserStakingStatsQuery, GetUserStakingStatsQueryVariables>;
export const GetMyStakingStatsDocument = gql`
    query GetMyStakingStats {
  myStakingStats {
    totalStaked
    activeStakesCount
    fundraisersStakedIn
    globalPoolStake
    pendingYield
    totalYieldEarned
  }
}
    `;

/**
 * __useGetMyStakingStatsQuery__
 *
 * To run a query within a React component, call `useGetMyStakingStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyStakingStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyStakingStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMyStakingStatsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>(GetMyStakingStatsDocument, options);
      }
export function useGetMyStakingStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>(GetMyStakingStatsDocument, options);
        }
// @ts-ignore
export function useGetMyStakingStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>;
export function useGetMyStakingStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetMyStakingStatsQuery | undefined, GetMyStakingStatsQueryVariables>;
export function useGetMyStakingStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>(GetMyStakingStatsDocument, options);
        }
export type GetMyStakingStatsQueryHookResult = ReturnType<typeof useGetMyStakingStatsQuery>;
export type GetMyStakingStatsLazyQueryHookResult = ReturnType<typeof useGetMyStakingStatsLazyQuery>;
export type GetMyStakingStatsSuspenseQueryHookResult = ReturnType<typeof useGetMyStakingStatsSuspenseQuery>;
export type GetMyStakingStatsQueryResult = ApolloReactCommon.QueryResult<GetMyStakingStatsQuery, GetMyStakingStatsQueryVariables>;
export const UpdateProfileDocument = gql`
    mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

/**
 * __useUpdateProfileMutation__
 *
 * To run a mutation, you first call `useUpdateProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfileMutation, { data, loading, error }] = useUpdateProfileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateProfileMutation, UpdateProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateProfileMutation, UpdateProfileMutationVariables>(UpdateProfileDocument, options);
      }
export type UpdateProfileMutationHookResult = ReturnType<typeof useUpdateProfileMutation>;
export type UpdateProfileMutationResult = ApolloReactCommon.MutationResult<UpdateProfileMutation>;
export type UpdateProfileMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const FollowUserDocument = gql`
    mutation FollowUser($userId: ID!) {
  followUser(userId: $userId)
}
    `;

/**
 * __useFollowUserMutation__
 *
 * To run a mutation, you first call `useFollowUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFollowUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [followUserMutation, { data, loading, error }] = useFollowUserMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useFollowUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<FollowUserMutation, FollowUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<FollowUserMutation, FollowUserMutationVariables>(FollowUserDocument, options);
      }
export type FollowUserMutationHookResult = ReturnType<typeof useFollowUserMutation>;
export type FollowUserMutationResult = ApolloReactCommon.MutationResult<FollowUserMutation>;
export type FollowUserMutationOptions = ApolloReactCommon.BaseMutationOptions<FollowUserMutation, FollowUserMutationVariables>;
export const UnfollowUserDocument = gql`
    mutation UnfollowUser($userId: ID!) {
  unfollowUser(userId: $userId)
}
    `;

/**
 * __useUnfollowUserMutation__
 *
 * To run a mutation, you first call `useUnfollowUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnfollowUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unfollowUserMutation, { data, loading, error }] = useUnfollowUserMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useUnfollowUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UnfollowUserMutation, UnfollowUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UnfollowUserMutation, UnfollowUserMutationVariables>(UnfollowUserDocument, options);
      }
export type UnfollowUserMutationHookResult = ReturnType<typeof useUnfollowUserMutation>;
export type UnfollowUserMutationResult = ApolloReactCommon.MutationResult<UnfollowUserMutation>;
export type UnfollowUserMutationOptions = ApolloReactCommon.BaseMutationOptions<UnfollowUserMutation, UnfollowUserMutationVariables>;
export const BlockUserDocument = gql`
    mutation BlockUser($userId: ID!, $reason: String) {
  blockUser(userId: $userId, reason: $reason)
}
    `;

/**
 * __useBlockUserMutation__
 *
 * To run a mutation, you first call `useBlockUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBlockUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [blockUserMutation, { data, loading, error }] = useBlockUserMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      reason: // value for 'reason'
 *   },
 * });
 */
export function useBlockUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<BlockUserMutation, BlockUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<BlockUserMutation, BlockUserMutationVariables>(BlockUserDocument, options);
      }
export type BlockUserMutationHookResult = ReturnType<typeof useBlockUserMutation>;
export type BlockUserMutationResult = ApolloReactCommon.MutationResult<BlockUserMutation>;
export type BlockUserMutationOptions = ApolloReactCommon.BaseMutationOptions<BlockUserMutation, BlockUserMutationVariables>;
export const UnblockUserDocument = gql`
    mutation UnblockUser($userId: ID!) {
  unblockUser(userId: $userId)
}
    `;

/**
 * __useUnblockUserMutation__
 *
 * To run a mutation, you first call `useUnblockUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnblockUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unblockUserMutation, { data, loading, error }] = useUnblockUserMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useUnblockUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UnblockUserMutation, UnblockUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UnblockUserMutation, UnblockUserMutationVariables>(UnblockUserDocument, options);
      }
export type UnblockUserMutationHookResult = ReturnType<typeof useUnblockUserMutation>;
export type UnblockUserMutationResult = ApolloReactCommon.MutationResult<UnblockUserMutation>;
export type UnblockUserMutationOptions = ApolloReactCommon.BaseMutationOptions<UnblockUserMutation, UnblockUserMutationVariables>;