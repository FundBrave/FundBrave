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

// Base Sepolia Addresses (Updated: 2026-02-03)
export const BASE_SEPOLIA_ADDRESSES = {
  fundraiserFactory: '0xc8AE0239616ABD8AbB3FC8286E0b4A092f9B777F' as Address,
  fbtToken: '0xE42A6ff84160Ac399607667C32392378Bbb270E0' as Address,
  usdc: '0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f' as Address,
  weth: '0x4200000000000000000000000000000000000006' as Address,
  wealthBuildingDonation: '0x04bAa18401366B29630D6B5F29f006994BFC6A84' as Address,
  platformTreasury: '0x67b64BAa1f506a24fE8082166e337FBfAb5628a8' as Address,
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
