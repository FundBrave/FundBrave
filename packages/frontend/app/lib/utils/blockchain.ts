/**
 * Blockchain Utilities
 * Helper functions for blockchain data formatting and conversion
 */

import { USDC_DECIMALS, FBT_DECIMALS } from '@/app/lib/contracts/config';
import { formatUnits, parseUnits } from 'viem';
import type { Address } from 'viem';

/**
 * Format USDC amount from blockchain (6 decimals) to display string
 */
export function formatUSDC(amount: bigint | string): string {
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  return formatUnits(amountBigInt, USDC_DECIMALS);
}

/**
 * Parse USDC amount from user input to blockchain format (6 decimals)
 */
export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS);
}

/**
 * Format FBT amount from blockchain (18 decimals) to display string
 */
export function formatFBT(amount: bigint | string): string {
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  return formatUnits(amountBigInt, FBT_DECIMALS);
}

/**
 * Parse FBT amount from user input to blockchain format (18 decimals)
 */
export function parseFBT(amount: string): bigint {
  return parseUnits(amount, FBT_DECIMALS);
}

/**
 * Format wallet address for display (0x1234...5678)
 */
export function formatAddress(address: Address): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Calculate campaign progress percentage
 */
export function calculateProgress(raised: string | bigint, goal: string | bigint): number {
  const raisedBigInt = typeof raised === 'string' ? BigInt(raised) : raised;
  const goalBigInt = typeof goal === 'string' ? BigInt(goal) : goal;

  if (goalBigInt === BigInt(0)) return 0;

  const progress = (Number(raisedBigInt) / Number(goalBigInt)) * 100;
  return Math.min(progress, 100);
}

/**
 * Calculate days left until deadline
 */
export function calculateDaysLeft(deadline: string | Date): number {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = deadlineDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Format blockchain timestamp to readable date
 */
export function formatBlockchainDate(timestamp: bigint | number): string {
  const timestampMs = typeof timestamp === 'bigint'
    ? Number(timestamp) * 1000
    : timestamp * 1000;

  return new Date(timestampMs).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Check if campaign has expired
 */
export function isCampaignExpired(deadline: string | Date): boolean {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  return deadlineDate < new Date();
}

/**
 * Format large numbers with K, M suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Get blockchain explorer URL for transaction
 */
export function getExplorerTxUrl(hash: string, chainId: number = 31337): string {
  // For localhost, return placeholder
  if (chainId === 31337) {
    return `http://localhost:8545/tx/${hash}`;
  }

  // Add other networks as needed
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    5: 'https://goerli.etherscan.io/tx/',
    11155111: 'https://sepolia.etherscan.io/tx/',
    8453: 'https://basescan.org/tx/',
  };

  return `${explorers[chainId] || ''}${hash}`;
}

/**
 * Get blockchain explorer URL for address
 */
export function getExplorerAddressUrl(address: Address, chainId: number = 31337): string {
  // For localhost, return placeholder
  if (chainId === 31337) {
    return `http://localhost:8545/address/${address}`;
  }

  // Add other networks as needed
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/address/',
    5: 'https://goerli.etherscan.io/address/',
    11155111: 'https://sepolia.etherscan.io/address/',
    8453: 'https://basescan.org/address/',
  };

  return `${explorers[chainId] || ''}${address}`;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Wait for specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
