/**
 * wagmi + RainbowKit configuration for wallet donations (phase 3).
 *
 * Degraded mode: when NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing (or
 * still the .env.example placeholder starting with "your-"), `wagmiConfig`
 * is null. Providers skip WagmiProvider/RainbowKitProvider entirely and the
 * DonatePanel hides the "Pay with wallet" tab, leaving address/QR donations.
 *
 * NEXT_PUBLIC_ env vars are inlined at build time, so these are stable
 * constants for the lifetime of the app.
 */

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  base,
  baseSepolia,
  mainnet,
  polygon,
  sepolia,
} from "viem/chains";

const rawProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

/** WalletConnect Cloud project ID, or null when not configured. */
export const walletConnectProjectId: string | null =
  rawProjectId && !rawProjectId.startsWith("your-") ? rawProjectId : null;

/** Whether wallet payments (wagmi + RainbowKit) are available. */
export const isWalletConfigured: boolean = walletConnectProjectId !== null;

/**
 * The wagmi config — null in degraded mode. The chain list mirrors the
 * chains the API's /api/donations/tokens endpoint can serve; donations go
 * to the same Safe address on every supported chain.
 */
export const wagmiConfig = walletConnectProjectId
  ? getDefaultConfig({
      appName: "FundBrave",
      projectId: walletConnectProjectId,
      chains: [base, mainnet, polygon, arbitrum, baseSepolia, sepolia],
      ssr: true,
    })
  : null;

/** Message shown when wallet payments are unavailable. */
export const WALLET_NOT_CONFIGURED_MESSAGE =
  "Wallet payments are unavailable: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. You can still donate by sending funds to the campaign address below.";
