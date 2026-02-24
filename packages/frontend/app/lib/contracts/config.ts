/**
 * Contract Configuration
 * Contract addresses, chain configuration, tokens, and utility helpers
 */

import type { Address } from 'viem';

export const CHAIN_ID = 31337; // Hardhat localhost
export const BASE_SEPOLIA_CHAIN_ID = 84532; // Base Sepolia

export const CONTRACT_ADDRESSES = {
  fundraiserFactory: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE' as Address,
  fbtToken: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as Address,
  mockUsdc: '0x9A676e781A523b5d0C0e43731313A708CB607508' as Address,
} as const;

// Base Sepolia Addresses (Updated: 2026-02-18)
// Synced with .env.local NEXT_PUBLIC_* values and current deployed contracts
export const BASE_SEPOLIA_ADDRESSES = {
  fundraiserFactory: '0xb89D6039dE729f6c951862EB177795Ac4aDfD2cd' as Address,
  fbtToken: '0xE42A6ff84160Ac399607667C32392378Bbb270E0' as Address,
  usdc: '0xf269f54304f8DB2dB613341CC7E189B02BEf98dE' as Address,
  weth: '0x8140C9fE21D9639FD69E9eF345Be39d767eE7FE2' as Address,
  wealthBuildingDonation: '0x34329F963C4C67BE258aD5ED4bB0769B81FD9034' as Address,
  platformTreasury: '0x67b64BAa1f506a24fE8082166e337FBfAb5628a8' as Address,
  aavePool: '0xA14694B3a1788D22c660C837842B2d22E24983B4' as Address,
  // Implementation contracts (for reference)
  fundraiserImplementation: '0xf79732B4D25521F2C8d8619c568C065fBf69bc9e' as Address,
  stakingPoolImplementation: '0x51A41B4F07a7b5b6D2eF72E3AaD97aDE1e3E86F8' as Address,
} as const;

export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// Token decimals
export const USDC_DECIMALS = 6;
export const FBT_DECIMALS = 18;

// Campaign constraints from contracts
export const MIN_CAMPAIGN_GOAL = BigInt(1) * BigInt(10 ** USDC_DECIMALS); // 1 USDC
export const MAX_CAMPAIGN_GOAL = BigInt(1_000_000) * BigInt(10 ** USDC_DECIMALS); // 1M USDC
export const MIN_CAMPAIGN_DURATION_DAYS = 1;
export const MAX_CAMPAIGN_DURATION_DAYS = 365;

// Donation constraints
export const MIN_DONATION_AMOUNT = BigInt(1) * BigInt(10 ** USDC_DECIMALS); // 1 USDC

// ============ Environment-based Contract Addresses ============
// Used by new DonationTabs, Withdraw, and Bridge components

export const CONTRACTS = {
  FACTORY_ADDRESS: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address,
  USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS as Address,
  AAVE_POOL_ADDRESS: process.env.NEXT_PUBLIC_AAVE_POOL_ADDRESS as Address,
  WEALTH_BUILDING_ADDRESS: process.env.NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS as Address,
  BRIDGE_ROUTER_ADDRESS: (process.env.NEXT_PUBLIC_BRIDGE_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  FUND_BRAVE_BRIDGE_ADDRESS: (process.env.NEXT_PUBLIC_FUND_BRAVE_BRIDGE_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
  WORMHOLE_RECEIVER_ADDRESS: (process.env.NEXT_PUBLIC_WORMHOLE_RECEIVER_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
}

// ============ Supported Tokens ============

export interface TokenInfo {
  symbol: string
  name: string
  address: Address | 'native' // 'native' for ETH
  decimals: number
  isNative: boolean
  logo?: string // Optional icon reference
}

/**
 * Tokens supported for donation/staking.
 * On testnet, these are mock tokens that can be freely minted.
 * Any non-USDC token is auto-converted to USDC by the smart contract swap adapter.
 */
export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS as Address,
    decimals: 6,
    isNative: false,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: 'native',
    decimals: 18,
    isNative: true,
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: (process.env.NEXT_PUBLIC_DAI_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
    decimals: 18,
    isNative: false,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: (process.env.NEXT_PUBLIC_WETH_ADDRESS || '0x0000000000000000000000000000000000000000') as Address,
    decimals: 18,
    isNative: false,
  },
]

// ============ Utility Helpers ============

/**
 * Format USDC amount from bigint (6 decimals) to human-readable string
 */
export function formatUSDC(amount: bigint): string {
  const num = Number(amount) / 1e6
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Get Base Sepolia explorer URL for a transaction hash
 */
export function getExplorerUrl(txHash: string): string {
  return `https://sepolia.basescan.org/tx/${txHash}`
}

/**
 * Shorten an Ethereum address for display
 */
export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
