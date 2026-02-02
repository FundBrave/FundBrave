/**
 * Contract Configuration
 * Contract addresses and chain configuration
 */

import type { Address } from 'viem';

export const CHAIN_ID = 31337; // Hardhat localhost
export const BASE_SEPOLIA_CHAIN_ID = 84532; // Base Sepolia

export const CONTRACT_ADDRESSES = {
  fundraiserFactory: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE' as Address,
  fbtToken: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as Address,
  mockUsdc: '0x9A676e781A523b5d0C0e43731313A708CB607508' as Address,
} as const;

// Base Sepolia Addresses
export const BASE_SEPOLIA_ADDRESSES = {
  fundraiserFactory: '0x7253b4E79cc708873b83Bb3C3F50F3e81b21819c' as Address,
  fbtToken: '0xE42A6ff84160Ac399607667C32392378Bbb270E0' as Address,
  usdc: '0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f' as Address,
  weth: '0x4200000000000000000000000000000000000006' as Address,
  wealthBuildingDonation: '0x8DcC63E7Df76ece01c186568E269a2cF3aC8A886' as Address,
  platformTreasury: '0x664AbB27C9c3d287117676c77B6A1c88B831D836' as Address,
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
