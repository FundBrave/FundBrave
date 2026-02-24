/**
 * Contract ABIs
 * Full ABI entries for all contract interactions
 * Ported from test-frontend with multi-currency, bridge, wealth building, and staking support
 */

// ============ Token ABIs ============

// MockUSDC (ERC20 with mint function)
export const MOCK_USDC_ABI = [
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ============ Aave ABIs ============

// MockAavePool (with simulateYield for testing)
export const MOCK_AAVE_POOL_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'simulateYield',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalDeposits',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'aUsdc',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ============ Core ABIs ============

// FundraiserFactory - Full ABI with multi-currency functions
export const FUNDRAISER_FACTORY_ABI = [
  // Campaign creation (8 params)
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'images', type: 'string[]' },
      { name: 'categories', type: 'string[]' },
      { name: 'description', type: 'string' },
      { name: 'region', type: 'string' },
      { name: 'beneficiary', type: 'address' },
      { name: 'goal', type: 'uint256' },
      { name: 'durationInDays', type: 'uint256' },
    ],
    name: 'createFundraiser',
    outputs: [{ name: 'fundraiserAddress', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Direct donation - ERC20 (auto-converts to USDC if non-USDC)
  {
    inputs: [
      { name: 'fundraiserId', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'donateERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Direct donation - Native ETH (auto-converts to USDC)
  {
    inputs: [{ name: 'fundraiserId', type: 'uint256' }],
    name: 'donateNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Wealth Building donation - USDC only
  {
    inputs: [
      { name: 'fundraiserId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'donateWealthBuilding',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Wealth Building donation - any ERC20 (auto-converts to USDC)
  {
    inputs: [
      { name: 'fundraiserId', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'donateWealthBuildingERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Wealth Building donation - Native ETH (auto-converts to USDC)
  {
    inputs: [{ name: 'fundraiserId', type: 'uint256' }],
    name: 'donateWealthBuildingNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Staking - ERC20 (auto-converts to USDC)
  {
    inputs: [
      { name: 'fundraiserId', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'stakeERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Staking - Native ETH (auto-converts to USDC)
  {
    inputs: [{ name: 'fundraiserId', type: 'uint256' }],
    name: 'stakeNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // View functions
  {
    inputs: [],
    name: 'currentId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'stakingPools',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'getFundraiserById',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'creator', type: 'address' }],
    name: 'getFundraisersByCreator',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'USDC',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'fundraiser', type: 'address' },
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'goal', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'FundraiserCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'donor', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'fundraiserId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'directAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'endowmentAmount', type: 'uint256' },
    ],
    name: 'WealthBuildingDonationMade',
    type: 'event',
  },
] as const;

// Fundraiser
export const FUNDRAISER_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'description',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'goal',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalDonations',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Keep amountRaised for backward compat with existing pages
  {
    inputs: [],
    name: 'amountRaised',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'beneficiary',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'deadline',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'creator',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'categories',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawUSDT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Donors count
  {
    inputs: [],
    name: 'donorsCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Per-donor cumulative donation amount (for refunds & dashboard)
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'donorDonations',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Legacy direct donation (used by existing pages)
  {
    inputs: [],
    name: 'donate',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'donateERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'donor', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
    ],
    name: 'DonationReceived',
    type: 'event',
  },
] as const;

// ============ Staking ABIs ============

// StakingPool - Full yield tracking
export const STAKING_POOL_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'harvestAndDistribute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimAllRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimStakerRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'stakerPrincipal',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'usdcRewards',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'staker', type: 'address' }],
    name: 'earnedUSDC',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'staker', type: 'address' }],
    name: 'claimableYield',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'staker', type: 'address' }],
    name: 'pendingRawYield',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalStakedPrincipal',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'yieldPerTokenStored',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lastHarvestTimestamp',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'staker', type: 'address' }],
    name: 'getEffectiveYieldSplit',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'causeShare', type: 'uint16' },
          { name: 'stakerShare', type: 'uint16' },
          { name: 'platformShare', type: 'uint16' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Legacy getStake for backward compat
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getStake',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'Staked',
    type: 'event',
  },
] as const;

// ============ Wealth Building ABIs ============

// WealthBuildingDonation
export const WEALTH_BUILDING_DONATION_ABI = [
  {
    inputs: [
      { name: 'donor', type: 'address' },
      { name: 'fundraiserId', type: 'uint256' },
    ],
    name: 'getEndowmentInfo',
    outputs: [
      {
        name: 'record',
        type: 'tuple',
        components: [
          { name: 'principal', type: 'uint256' },
          { name: 'lifetimeYield', type: 'uint256' },
          { name: 'causeYieldPaid', type: 'uint256' },
          { name: 'donorStockValue', type: 'uint256' },
          { name: 'lastHarvestTime', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'donor', type: 'address' },
      { name: 'fundraiserId', type: 'uint256' },
    ],
    name: 'getPendingYield',
    outputs: [
      { name: 'causeYield', type: 'uint256' },
      { name: 'donorYield', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'donor', type: 'address' },
      { name: 'fundraiserId', type: 'uint256' },
    ],
    name: 'harvestYield',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'stockToken', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'claimStocks',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'donor', type: 'address' }],
    name: 'getDonorStockPortfolio',
    outputs: [
      { name: 'tokens', type: 'address[]' },
      { name: 'balances', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'fundraiserId', type: 'uint256' }],
    name: 'fundraiserBeneficiaries',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPlatformStats',
    outputs: [
      { name: '_totalPrincipal', type: 'uint256' },
      { name: '_totalAUSDC', type: 'uint256' },
      { name: '_pendingYield', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ============ Bridge ABIs ============

// FundBraveBridge (LayerZero V2) - for cross-chain actions via EVM chains + RSK
export const FUND_BRAVE_BRIDGE_ABI = [
  // Send cross-chain action with ERC20
  {
    inputs: [
      { name: '_dstEid', type: 'uint32' },
      { name: '_fundraiserId', type: 'uint256' },
      { name: '_action', type: 'uint8' },
      { name: '_tokenIn', type: 'address' },
      { name: '_amountIn', type: 'uint256' },
    ],
    name: 'sendCrossChainAction',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Send cross-chain action with native currency
  {
    inputs: [
      { name: '_dstEid', type: 'uint32' },
      { name: '_fundraiserId', type: 'uint256' },
      { name: '_action', type: 'uint8' },
      { name: '_nativeAmount', type: 'uint256' },
    ],
    name: 'sendCrossChainActionNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Quote bridge fee
  {
    inputs: [
      { name: '_dstEid', type: 'uint32' },
      { name: '_fundraiserId', type: 'uint256' },
      { name: '_action', type: 'uint8' },
      { name: '_usdcAmount', type: 'uint256' },
    ],
    name: 'quoteCrossChainAction',
    outputs: [
      { name: 'nativeFee', type: 'uint256' },
      { name: 'lzTokenFee', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Stats
  {
    inputs: [],
    name: 'totalCrossChainTx',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalCrossChainVolumeUSDC',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// BridgeRouter - for reading bridge stats and chain info
export const BRIDGE_ROUTER_ABI = [
  {
    inputs: [{ name: 'chainId', type: 'uint256' }],
    name: 'getChainInfo',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'protocol', type: 'uint8' },
      { name: 'supported', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'chainId', type: 'uint256' }],
    name: 'getRemainingRateLimit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalRoutedMessages',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalRoutedVolumeUSDC',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'circuitBreakerTripped',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'chainVolume',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'chainMessageCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ============ Constants ============

export const CAMPAIGN_CATEGORIES = [
  'Medical',
  'Education',
  'Environment',
  'Community',
  'Emergency',
] as const

export type CampaignCategory = typeof CAMPAIGN_CATEGORIES[number]
