/**
 * Per-chain donation token allowlist.
 * Only transfers of these tokens count toward campaign totals — anything
 * else is stored as EXCLUDED (spam/scam token protection).
 *
 * ⚠️ Addresses are widely known canonical deployments, but VERIFY each one
 * against the token issuer / chain explorer before enabling mainnet chains.
 */

export interface AllowedToken {
  chainId: number;
  /** null = native coin */
  address: string | null;
  symbol: string;
  decimals: number;
  coingeckoId: string;
  isStablecoin: boolean;
}

export const ALLOWED_TOKENS: AllowedToken[] = [
  // ─── Base Sepolia (84532) — testnet ───────────────────────────
  { chainId: 84532, address: null, symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum', isStablecoin: false },
  { chainId: 84532, address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', symbol: 'USDC', decimals: 6, coingeckoId: 'usd-coin', isStablecoin: true },

  // ─── Sepolia (11155111) — testnet ─────────────────────────────
  { chainId: 11155111, address: null, symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum', isStablecoin: false },
  { chainId: 11155111, address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', symbol: 'USDC', decimals: 6, coingeckoId: 'usd-coin', isStablecoin: true },

  // ─── Ethereum (1) ─────────────────────────────────────────────
  { chainId: 1, address: null, symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum', isStablecoin: false },
  { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6, coingeckoId: 'usd-coin', isStablecoin: true },
  { chainId: 1, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6, coingeckoId: 'tether', isStablecoin: true },
  { chainId: 1, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18, coingeckoId: 'dai', isStablecoin: true },
  { chainId: 1, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18, coingeckoId: 'weth', isStablecoin: false },

  // ─── Base (8453) ──────────────────────────────────────────────
  { chainId: 8453, address: null, symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum', isStablecoin: false },
  { chainId: 8453, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6, coingeckoId: 'usd-coin', isStablecoin: true },
  { chainId: 8453, address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', decimals: 18, coingeckoId: 'dai', isStablecoin: true },
  { chainId: 8453, address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18, coingeckoId: 'weth', isStablecoin: false },

  // ─── Polygon (137) ────────────────────────────────────────────
  { chainId: 137, address: null, symbol: 'POL', decimals: 18, coingeckoId: 'polygon-ecosystem-token', isStablecoin: false },
  { chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', decimals: 6, coingeckoId: 'usd-coin', isStablecoin: true },
  { chainId: 137, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6, coingeckoId: 'tether', isStablecoin: true },
  { chainId: 137, address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', decimals: 18, coingeckoId: 'dai', isStablecoin: true },
  { chainId: 137, address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', decimals: 18, coingeckoId: 'weth', isStablecoin: false },

  // ─── Arbitrum (42161) ─────────────────────────────────────────
  { chainId: 42161, address: null, symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum', isStablecoin: false },
  { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6, coingeckoId: 'usd-coin', isStablecoin: true },
  { chainId: 42161, address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', decimals: 6, coingeckoId: 'tether', isStablecoin: true },
  { chainId: 42161, address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', decimals: 18, coingeckoId: 'dai', isStablecoin: true },
  { chainId: 42161, address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18, coingeckoId: 'weth', isStablecoin: false },
];

export function findToken(chainId: number, address: string | null): AllowedToken | undefined {
  const a = address?.toLowerCase() ?? null;
  return ALLOWED_TOKENS.find(
    (t) => t.chainId === chainId && (t.address?.toLowerCase() ?? null) === a,
  );
}

export function tokensForChain(chainId: number): AllowedToken[] {
  return ALLOWED_TOKENS.filter((t) => t.chainId === chainId);
}
