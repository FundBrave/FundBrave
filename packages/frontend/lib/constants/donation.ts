/**
 * Donation-related constants
 * Centralized configuration for donation features
 */

import type { CryptoType, CryptoRates } from "@/types/donation";

// Preset donation amounts displayed as quick-select buttons
export const PRESET_AMOUNTS: number[] = [100, 200, 300, 500, 1000, 1500];

// Simulated crypto exchange rates (in real app, fetch from API)
export const CRYPTO_RATES: CryptoRates = {
  ETH: 3500,
  BTC: 95000,
  USDC: 1,
  USDT: 1,
};

// Available cryptocurrency options for donations
export const CRYPTO_OPTIONS: CryptoType[] = ["ETH", "BTC", "USDC", "USDT"];

// Donation validation limits
export const DONATION_LIMITS = {
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 1000000,
} as const;

// Tip slider configuration
export const TIP_SLIDER_CONFIG = {
  MIN: 0,
  MAX: 30,
  STEP: 1,
  DEFAULT: 1,
} as const;

// Keyboard shortcuts for preset amounts
export const PRESET_KEYBOARD_MAP: Record<string, number> = {
  "1": 100,
  "2": 200,
  "3": 300,
  "5": 500,
  "0": 1000,
};
