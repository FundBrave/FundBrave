/**
 * Donation-related type definitions
 * Shared types for donation components and hooks
 */

// Supported cryptocurrency types for donations
export type CryptoType = "ETH" | "BTC" | "USDC" | "USDT";

// Crypto exchange rates mapping
export type CryptoRates = Record<CryptoType, number>;

// Campaign data structure for donation context
export interface DonationCampaign {
  id: string;
  title: string;
  imageUrl: string;
  targetAmount: number;
  amountRaised: number;
  creator: {
    name: string;
    handle: string;
    avatarUrl: string;
  };
}

// Donation state managed by useDonation hook
export interface DonationState {
  amount: number;
  customAmount: string;
  tipPercentage: number;
  selectedPreset: number | null;
  selectedCrypto: CryptoType;
  isConnecting: boolean;
  isConnected: boolean;
  walletAddress: string;
  isDonating: boolean;
  donationSuccess: boolean;
  error: string;
}

// Calculated values derived from donation state
export interface DonationCalculations {
  tipAmount: number;
  totalAmount: number;
  cryptoAmount: number;
  donationImpact: number;
  currentProgress: number;
  newProgress: number;
}

// Handlers returned by useDonation hook
export interface DonationHandlers {
  handlePresetClick: (amount: number) => void;
  handleCustomAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCryptoSelect: (crypto: CryptoType) => void;
  handleConnectWallet: () => Promise<void>;
  handleDisconnect: () => void;
  handleDonate: () => Promise<void>;
}

// Props for DonationPresetAmounts component
export interface DonationPresetAmountsProps {
  presetAmounts: number[];
  selectedPreset: number | null;
  onPresetClick: (amount: number) => void;
}

// Props for DonationCustomInput component
export interface DonationCustomInputProps {
  customAmount: string;
  error: string;
  onCustomAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Props for CryptoSelector component
export interface CryptoSelectorProps {
  cryptoOptions: CryptoType[];
  selectedCrypto: CryptoType;
  cryptoAmount: number;
  amount: number;
  onCryptoSelect: (crypto: CryptoType) => void;
}

// Props for TipSlider component
export interface TipSliderProps {
  tipPercentage: number;
  tipAmount: number;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatAmount: (num: number, decimals?: number) => string;
}

// Props for DonationSummary component
export interface DonationSummaryProps {
  amount: number;
  tipAmount: number;
  totalAmount: number;
  cryptoAmount: number;
  selectedCrypto: CryptoType;
  animatingAmount: boolean;
  formatAmount: (num: number, decimals?: number) => string;
}

// Props for DonationImpactPreview component
export interface DonationImpactPreviewProps {
  currentProgress: number;
  newProgress: number;
  isMounted: boolean;
  amount: number;
}

// Props for WalletConnection component
export interface WalletConnectionProps {
  isConnected: boolean;
  isConnecting: boolean;
  isDonating: boolean;
  walletAddress: string;
  amount: number;
  totalAmount: number;
  onConnectWallet: () => Promise<void>;
  onDisconnect: () => void;
  onDonate: () => Promise<void>;
  formatAmount: (num: number, decimals?: number) => string;
}

// Props for CampaignInfoHeader component
export interface CampaignInfoHeaderProps {
  campaign: DonationCampaign;
  showImpact: boolean;
  donationImpact: number;
  amount: number;
  formatAmount: (num: number, decimals?: number) => string;
}
