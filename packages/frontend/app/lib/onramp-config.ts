/**
 * On-Ramp & Off-Ramp Configuration
 *
 * Onramper: Aggregator supporting 100+ providers for both buy (on-ramp)
 * and sell (off-ramp) flows via simple iframe/URL integration.
 *
 * Docs: https://docs.onramper.com/docs/integration-steps-1
 *
 * To get an API key:
 *   1. Sign up at https://onramper.com
 *   2. Go to Dashboard → API Keys
 *   3. Copy your pk_test_... (sandbox) or pk_prod_... (production) key
 *   4. Set it as NEXT_PUBLIC_ONRAMPER_API_KEY in .env.local
 */

// ============ Onramper Config ============

const apiKey = process.env.NEXT_PUBLIC_ONRAMPER_API_KEY || ''

export const ONRAMPER_CONFIG = {
  /** Onramper API Key (pk_test_... or pk_prod_...) */
  apiKey,
  /** Widget base URL — works for both test and prod keys */
  baseUrl: 'https://buy.onramper.com',
  /** Default crypto to buy/sell */
  defaultCrypto: 'USDC_BASE',
  /** Default fiat currency */
  defaultFiat: 'USD',
  /** Default amount */
  defaultAmount: 50,
} as const

// ============ Feature Flags ============

export const RAMP_FEATURES = {
  /** Enable on-ramp (card payments) */
  onRampEnabled: process.env.NEXT_PUBLIC_ONRAMP_ENABLED !== 'false',
  /** Enable off-ramp (crypto to bank) */
  offRampEnabled: process.env.NEXT_PUBLIC_OFFRAMP_ENABLED !== 'false',
} as const

// ============ Helpers ============

/**
 * Build Onramper widget URL for buying USDC on Base (on-ramp)
 *
 * URL format per docs:
 *   https://buy.onramper.com?apiKey=pk_prod_...&mode=buy&defaultCrypto=USDC_BASE
 *   &wallets=USDC_BASE:0x1234...
 */
export function buildOnramperBuyUrl(params: {
  walletAddress: string
  amount?: number
}): string {
  const url = new URL(ONRAMPER_CONFIG.baseUrl)

  url.searchParams.set('apiKey', ONRAMPER_CONFIG.apiKey)
  url.searchParams.set('mode', 'buy')
  url.searchParams.set('defaultCrypto', ONRAMPER_CONFIG.defaultCrypto)
  url.searchParams.set('onlyCryptos', 'USDC_BASE')
  url.searchParams.set('onlyCryptoNetworks', 'base')
  url.searchParams.set('defaultFiat', ONRAMPER_CONFIG.defaultFiat)
  // Wallet format: TOKEN_ID:address (per Onramper docs)
  url.searchParams.set('wallets', `USDC_BASE:${params.walletAddress}`)
  url.searchParams.set('isAddressEditable', 'false')
  url.searchParams.set('themeName', 'dark')

  if (params.amount && params.amount > 0) {
    url.searchParams.set('defaultAmount', params.amount.toString())
  } else {
    url.searchParams.set('defaultAmount', ONRAMPER_CONFIG.defaultAmount.toString())
  }

  return url.toString()
}

/**
 * Build Onramper widget URL for selling USDC (off-ramp)
 */
export function buildOnramperSellUrl(params: {
  walletAddress: string
  amount?: number
}): string {
  const url = new URL(ONRAMPER_CONFIG.baseUrl)

  url.searchParams.set('apiKey', ONRAMPER_CONFIG.apiKey)
  url.searchParams.set('mode', 'sell')
  url.searchParams.set('sell_defaultCrypto', ONRAMPER_CONFIG.defaultCrypto)
  url.searchParams.set('sell_onlyCryptos', 'USDC_BASE')
  url.searchParams.set('onlyCryptoNetworks', 'base')
  url.searchParams.set('wallets', `USDC_BASE:${params.walletAddress}`)
  url.searchParams.set('isAddressEditable', 'false')
  url.searchParams.set('themeName', 'dark')

  if (params.amount && params.amount > 0) {
    url.searchParams.set('sell_defaultAmount', params.amount.toString())
  }

  return url.toString()
}

/**
 * Build Onramper widget URL with both buy & sell modes available
 */
export function buildOnramperFullUrl(params: {
  walletAddress: string
  defaultMode?: 'buy' | 'sell'
  amount?: number
}): string {
  const url = new URL(ONRAMPER_CONFIG.baseUrl)

  url.searchParams.set('apiKey', ONRAMPER_CONFIG.apiKey)
  url.searchParams.set('mode', 'buy,sell')
  url.searchParams.set('defaultCrypto', ONRAMPER_CONFIG.defaultCrypto)
  url.searchParams.set('onlyCryptos', 'USDC_BASE')
  url.searchParams.set('sell_defaultCrypto', ONRAMPER_CONFIG.defaultCrypto)
  url.searchParams.set('sell_onlyCryptos', 'USDC_BASE')
  url.searchParams.set('onlyCryptoNetworks', 'base')
  url.searchParams.set('wallets', `USDC_BASE:${params.walletAddress}`)
  url.searchParams.set('isAddressEditable', 'false')
  url.searchParams.set('themeName', 'dark')

  if (params.amount && params.amount > 0) {
    url.searchParams.set('defaultAmount', params.amount.toString())
  }

  return url.toString()
}
