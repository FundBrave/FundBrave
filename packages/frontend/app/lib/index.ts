/**
 * Library Index
 * Central export for all library modules
 */

// API Client
export { apiClient } from './api/client';

// Contract Configuration
export {
  CHAIN_ID,
  CONTRACT_ADDRESSES,
  BACKEND_API_URL,
  USDC_DECIMALS,
  FBT_DECIMALS,
  MIN_CAMPAIGN_GOAL,
  MAX_CAMPAIGN_GOAL,
  MIN_CAMPAIGN_DURATION_DAYS,
  MAX_CAMPAIGN_DURATION_DAYS,
  MIN_DONATION_AMOUNT,
} from './contracts/config';

// Contract ABIs
export {
  FUNDRAISER_FACTORY_ABI,
  FUNDRAISER_ABI,
  ERC20_ABI,
  STAKING_POOL_ABI,
} from './contracts/abis';

// Blockchain Utilities
export {
  formatUSDC,
  parseUSDC,
  formatFBT,
  parseFBT,
  formatAddress,
  calculateProgress,
  calculateDaysLeft,
  formatBlockchainDate,
  isCampaignExpired,
  formatCompactNumber,
  formatTxHash,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  isValidAddress,
  sleep,
} from './utils/blockchain';

// General Utilities
export {
  cn,
  formatNumber,
  formatCurrency,
  truncate,
  generateId,
  debounce,
  throttle,
} from './utils';
