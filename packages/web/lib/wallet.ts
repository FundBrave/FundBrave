/**
 * Wallet address helpers.
 *
 * Extracted verbatim from packages/frontend/app/campaigns/create/schemas.ts
 * (only the pure helpers needed by WalletAddressInput).
 */

/** Ethereum wallet address: 0x followed by 40 hex characters */
export const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Validate an Ethereum wallet address
 */
export function isValidWalletAddress(address: string): boolean {
  return WALLET_ADDRESS_REGEX.test(address);
}

/**
 * Truncate wallet address for display
 */
export function truncateWalletAddress(address: string, chars = 6): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
