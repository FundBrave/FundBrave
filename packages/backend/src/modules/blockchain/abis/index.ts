/**
 * Smart Contract ABIs for FundBrave
 * These ABIs define the interface for interacting with deployed contracts
 */

// ==================== FundraiserFactory ABI ====================
export const FUNDRAISER_FACTORY_ABI = [
  // Events
  'event FundraiserCreated(address indexed fundraiser, address indexed owner, uint256 indexed id, string name, uint256 goal, uint256 deadline)',
  'event StakingPoolCreated(uint256 indexed fundraiserId, address indexed poolAddress)',
  'event FundraiserDeactivated(uint256 indexed id, address indexed fundraiser)',
  'event WealthBuildingDonationMade(address indexed donor, uint256 indexed fundraiserId, uint256 totalAmount, uint256 directAmount, uint256 endowmentAmount)',

  // View Functions
  'function fundraisersCount() view returns (uint256)',
  'function currentId() view returns (uint256)',
  'function getFundraiserById(uint256 id) view returns (address)',
  'function stakingPools(uint256 fundraiserId) view returns (address)',
  'function activeFundraisers(uint256 id) view returns (bool)',
  'function totalFundraisersCreated() view returns (uint256)',
  'function totalFundsRaised() view returns (uint256)',
  'function activeFundraiserCount() view returns (uint256)',
  'function getPlatformStats() view returns (uint256, uint256, uint256)',
  'function getImpactDAOPool() view returns (address)',
  'function isImpactDAOPoolConfigured() view returns (bool)',
  'function USDC() view returns (address)',
  'function minGoal() view returns (uint256)',
  'function maxGoal() view returns (uint256)',
  'function minDuration() view returns (uint256)',
  'function maxDuration() view returns (uint256)',

  // State-Changing Functions
  'function createFundraiser(string name, string[] images, string[] categories, string description, string region, address beneficiary, uint256 goal, uint256 durationInDays) returns (address)',
  'function createVerifiedFundraiser(string name, string[] images, string[] categories, string description, string region, address beneficiary, uint256 goal, uint256 durationInDays) returns (address)',
  'function donateNative(uint256 fundraiserId) payable',
  'function donateERC20(uint256 fundraiserId, address token, uint256 amount)',
  'function donateWealthBuilding(uint256 fundraiserId, uint256 amount)',
  'function donateWealthBuildingERC20(uint256 fundraiserId, address token, uint256 amount)',
  'function donateWealthBuildingNative(uint256 fundraiserId) payable',
  'function stakeNative(uint256 fundraiserId) payable',
  'function stakeERC20(uint256 fundraiserId, address token, uint256 amount)',
] as const;

// ==================== Fundraiser ABI ====================
export const FUNDRAISER_ABI = [
  // Events
  'event DonationCredited(address indexed donor, uint256 amount, string sourceChain)',
  'event ProposalCreated(uint256 id, string title, uint256 requiredVotes)',
  'event Voted(uint256 id, address indexed voter, bool upvote)',
  'event ProposalExecuted(uint256 id)',
  'event Withdraw(uint256 amount, address token)',
  'event RefundClaimed(address indexed donor, uint256 amount)',
  'event RefundsEnabled(uint256 timestamp)',

  // View Functions
  'function id() view returns (uint256)',
  'function name() view returns (string)',
  'function description() view returns (string)',
  'function region() view returns (string)',
  'function beneficiary() view returns (address)',
  'function goal() view returns (uint256)',
  'function deadline() view returns (uint256)',
  'function totalDonations() view returns (uint256)',
  'function totalDonationsCount() view returns (uint256)',
  'function donorsCount() view returns (uint256)',
  'function proposalCount() view returns (uint256)',
  'function goalReached() view returns (bool)',
  'function refundsEnabled() view returns (bool)',
  'function getImageUrls() view returns (string[])',
  'function getCategories() view returns (string[])',
  'function getFundraiserStats() view returns (uint256, uint256, uint256, uint256, bool)',
  'function myDonationsCount() view returns (uint256)',
  'function allDonationsCount() view returns (uint256)',
  'function donorVotingPower(address donor) view returns (uint256)',
  'function getRefundAmount(address donor) view returns (uint256)',
  'function isCircuitBreakerTriggered() view returns (bool)',
  'function getCircuitBreakerStatus() view returns (uint256, uint256, uint256)',

  // State-Changing Functions
  'function createProposal(string title, string description, uint256 requiredVotes)',
  'function vote(uint256 proposalId, bool upvote)',
  'function executeProposal(uint256 proposalId)',
  'function enableRefunds()',
  'function claimRefund()',
] as const;

// ==================== StakingPool ABI ====================
export const STAKING_POOL_ABI = [
  // Events
  'event Staked(address indexed staker, uint256 usdcAmount)',
  'event Unstaked(address indexed staker, uint256 usdcAmount)',
  'event YieldHarvested(uint256 totalYield, uint256 stakerShare)',
  'event UsdcRewardsClaimed(address indexed staker, uint256 amount)',
  'event RewardAdded(uint256 reward)',
  'event FbtRewardPaid(address indexed user, uint256 reward)',
  'event YieldSplitSet(address indexed staker, uint16 causeShare, uint16 stakerShare, uint16 platformShare)',

  // View Functions
  'function totalStakedPrincipal() view returns (uint256)',
  'function stakerPrincipal(address staker) view returns (uint256)',
  'function beneficiary() view returns (address)',
  'function platformWallet() view returns (address)',
  'function earnedFBT(address account) view returns (uint256)',
  'function earnedUSDC(address staker) view returns (uint256)',
  'function claimableYield(address staker) view returns (uint256)',
  'function pendingRawYield(address staker) view returns (uint256)',
  'function rewardPerToken() view returns (uint256)',
  'function lastTimeRewardApplicable() view returns (uint256)',
  'function periodFinish() view returns (uint256)',
  'function rewardRate() view returns (uint256)',
  'function rewardsDuration() view returns (uint256)',
  'function getEffectiveYieldSplit(address staker) view returns (tuple(uint16 causeShare, uint16 stakerShare, uint16 platformShare))',
  'function defaultYieldSplit() view returns (tuple(uint16 causeShare, uint16 stakerShare, uint16 platformShare))',

  // State-Changing Functions
  'function depositFor(address staker, uint256 usdcAmount)',
  'function unstake(uint256 usdcAmount)',
  'function claimAllRewards()',
  'function claimStakerRewards()',
  'function setYieldSplit(uint16 causeShare, uint16 stakerShare, uint16 platformShare)',
  'function resetYieldSplit()',
  'function harvestAndDistribute()',
] as const;

// ==================== FundBraveToken ABI ====================
export const FUND_BRAVE_TOKEN_ABI = [
  // Events
  'event VestingScheduleCreated(address indexed recipient, uint256 indexed scheduleId, uint256 amount, uint256 duration, uint256 startTime)',
  'event VestedTokensClaimed(address indexed recipient, uint256 indexed scheduleId, uint256 amount)',
  'event TokensBurned(address indexed account, uint256 amount)',
  'event StakeBalanceUpdated(address indexed account, uint256 newBalance)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',

  // View Functions (ERC20)
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',

  // View Functions (Vesting)
  'function getVestingSchedule(uint256 scheduleId) view returns (tuple(address recipient, uint256 totalAmount, uint256 releasedAmount, uint256 startTime, uint256 duration, bool revocable))',
  'function getVestingSchedulesCount(address recipient) view returns (uint256)',
  'function computeReleasableAmount(uint256 scheduleId) view returns (uint256)',
  'function getVestedAmount(uint256 scheduleId) view returns (uint256)',

  // State-Changing Functions (ERC20)
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',

  // State-Changing Functions (Vesting/Burning)
  'function createVestingSchedule(address recipient, uint256 amount, uint256 duration, uint256 startTime, bool revocable) returns (uint256)',
  'function claimVestedTokens(uint256 scheduleId)',
  'function burn(uint256 amount)',
  'function burnFrom(address account, uint256 amount)',
] as const;

// ==================== GlobalStakingPool / ImpactDAOPool ABI ====================
export const IMPACT_DAO_POOL_ABI = [
  // Events
  'event Staked(address indexed staker, uint256 amount, uint16 daoShare, uint16 stakerShare, uint16 platformShare)',
  'event Unstaked(address indexed staker, uint256 amount)',
  'event YieldHarvested(uint256 totalYield, uint256 daoShare, uint256 stakerShare, uint256 platformShare)',
  'event YieldSplitSet(address indexed staker, uint16 daoShare, uint16 stakerShare, uint16 platformShare)',
  'event FBTRewardPaid(address indexed staker, uint256 amount)',
  'event StakerYieldClaimed(address indexed staker, uint256 amount)',
  'event RewardAdded(uint256 reward)',

  // View Functions
  'function totalStakedPrincipal() view returns (uint256)',
  'function stakerPrincipal(address staker) view returns (uint256)',
  'function earnedFBT(address account) view returns (uint256)',
  'function earnedUSDC(address staker) view returns (uint256)',
  'function getStakerYieldSplit(address staker) view returns (tuple(uint16 daoShare, uint16 stakerShare, uint16 platformShare))',
  'function defaultYieldSplit() view returns (tuple(uint16 daoShare, uint16 stakerShare, uint16 platformShare))',
  'function rewardPerToken() view returns (uint256)',

  // State-Changing Functions
  'function stake(uint256 amount)',
  'function stakeWithSplit(uint256 amount, uint16 daoShare, uint16 stakerShare, uint16 platformShare)',
  'function unstake(uint256 amount)',
  'function setYieldSplit(uint16 daoShare, uint16 stakerShare, uint16 platformShare)',
  'function claimFBTRewards()',
  'function claimUSDCYield()',
  'function claimAllRewards()',
] as const;

// ==================== WealthBuildingDonation ABI ====================
export const WEALTH_BUILDING_DONATION_ABI = [
  // Events
  'event DonationMade(address indexed donor, uint256 indexed fundraiserId, uint256 totalAmount, uint256 directAmount, uint256 endowmentAmount, uint256 platformFee)',
  'event YieldHarvested(address indexed donor, uint256 indexed fundraiserId, uint256 totalYield, uint256 causeAmount, uint256 donorAmount)',
  'event StockPurchased(address indexed donor, address indexed stockToken, uint256 usdcAmount, uint256 stockAmount)',
  'event StocksClaimed(address indexed donor, address indexed stockToken, uint256 amount)',
  'event FundraiserRegistered(uint256 indexed fundraiserId, address indexed beneficiary)',

  // View Functions
  'function getEndowmentInfo(address donor, uint256 fundraiserId) view returns (tuple(uint256 principal, uint256 lifetimeYield, uint256 causeYieldPaid, uint256 pendingDonorYield))',
  'function getDonorStockBalance(address donor, address stockToken) view returns (uint256)',
  'function getTotalEndowmentPrincipal() view returns (uint256)',
  'function getSupportedStocks() view returns (address[])',
  'function getDefaultStockToken() view returns (address)',
  'function getPendingYield(address donor, uint256 fundraiserId) view returns (uint256)',

  // State-Changing Functions
  'function donate(address donor, uint256 fundraiserId, uint256 amount, address beneficiary) returns (uint256 directAmount, uint256 endowmentAmount)',
  'function harvestYield(uint256 fundraiserId)',
  'function claimStocks(address stockToken)',
] as const;

// ==================== PlatformTreasury ABI ====================
export const PLATFORM_TREASURY_ABI = [
  // Events
  'event FeeReceived(address indexed from, uint256 amount, string source)',
  'event FeesStaked(uint256 amount, uint256 endowmentAmount)',
  'event FBTStaked(address indexed staker, uint256 amount)',
  'event FBTUnstaked(address indexed staker, uint256 amount)',
  'event YieldClaimed(address indexed staker, uint256 amount)',
  'event YieldHarvested(uint256 totalYield)',
  'event YieldDistributed(uint256 amount)',

  // View Functions
  'function totalFBTStaked() view returns (uint256)',
  'function fbtStakerBalance(address staker) view returns (uint256)',
  'function pendingYield(address staker) view returns (uint256)',
  'function totalFeesCollected() view returns (uint256)',
  'function pendingFeesToStake() view returns (uint256)',
  'function getOperationalBalance() view returns (uint256)',
  'function getTreasuryStats() view returns (tuple(uint256 totalFeesCollected, uint256 totalFeesStaked, uint256 pendingFeesToStake, uint256 totalFBTStaked, uint256 totalYieldDistributed))',

  // State-Changing Functions
  'function stakeFBT(uint256 amount)',
  'function unstakeFBT(uint256 amount)',
  'function claimYield()',
  'function stakeAccumulatedFees()',
] as const;

// ==================== ERC20 Standard ABI (for token interactions) ====================
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

export type ContractABI = readonly string[];
