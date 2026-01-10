"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  CryptoType,
  DonationCampaign,
  DonationState,
  DonationCalculations,
  DonationHandlers,
} from "@/types/donation";
import {
  CRYPTO_RATES,
  DONATION_LIMITS,
  TIP_SLIDER_CONFIG,
  PRESET_KEYBOARD_MAP,
} from "@/lib/constants/donation";
import { fireConfetti } from "@/lib/confetti";

interface UseDonationProps {
  campaign: DonationCampaign | null;
  onSuccess?: () => void;
}

interface UseDonationReturn {
  state: DonationState;
  calculations: DonationCalculations;
  handlers: DonationHandlers;
  animatingAmount: boolean;
  showImpact: boolean;
  isMounted: boolean;
}

/**
 * Custom hook for managing donation state and logic
 * Encapsulates all donation-related business logic
 */
export function useDonation({
  campaign,
  onSuccess,
}: UseDonationProps): UseDonationReturn {
  // Core donation state
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [tipPercentage, setTipPercentage] = useState<number>(
    TIP_SLIDER_CONFIG.DEFAULT
  );
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Crypto state
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>("ETH");

  // Wallet state
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  // Transaction state
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  // UI state
  const [animatingAmount, setAnimatingAmount] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Error state
  const [error, setError] = useState<string>("");

  // Memoized calculations
  const tipAmount = useMemo(
    () => (amount * tipPercentage) / 100,
    [amount, tipPercentage]
  );

  const totalAmount = useMemo(() => amount + tipAmount, [amount, tipAmount]);

  const cryptoAmount = useMemo(
    () => totalAmount / CRYPTO_RATES[selectedCrypto],
    [totalAmount, selectedCrypto]
  );

  const donationImpact = useMemo(() => {
    if (!campaign) return 0;
    return Math.min((amount / campaign.targetAmount) * 100, 100);
  }, [amount, campaign]);

  const currentProgress = useMemo(() => {
    if (!campaign) return 0;
    return Math.min((campaign.amountRaised / campaign.targetAmount) * 100, 100);
  }, [campaign]);

  const newProgress = useMemo(() => {
    if (!campaign) return 0;
    return Math.min(
      ((campaign.amountRaised + amount) / campaign.targetAmount) * 100,
      100
    );
  }, [campaign, amount]);

  // Track client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show impact animation when amount changes
  useEffect(() => {
    if (amount > 0) {
      setShowImpact(true);
      const timer = setTimeout(() => setShowImpact(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [amount]);

  // Keyboard shortcuts for quick amounts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (PRESET_KEYBOARD_MAP[e.key]) {
        handlePresetClick(PRESET_KEYBOARD_MAP[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handlers
  const handlePresetClick = useCallback((val: number) => {
    setAnimatingAmount(true);
    setSelectedPreset(val);
    setAmount(val);
    setCustomAmount("");
    setError("");
    setTimeout(() => setAnimatingAmount(false), 300);
  }, []);

  const handleCustomAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCustomAmount(val);
      setSelectedPreset(null);
      const numVal = parseFloat(val);

      if (val && (isNaN(numVal) || numVal < 0)) {
        setError("Please enter a valid amount");
        setAmount(0);
      } else if (numVal > DONATION_LIMITS.MAX_AMOUNT) {
        setError(
          `Maximum donation is $${DONATION_LIMITS.MAX_AMOUNT.toLocaleString()}`
        );
        setAmount(DONATION_LIMITS.MAX_AMOUNT);
      } else {
        setError("");
        setAmount(isNaN(numVal) ? 0 : numVal);
      }
    },
    []
  );

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTipPercentage(parseInt(e.target.value));
    },
    []
  );

  const handleCryptoSelect = useCallback((crypto: CryptoType) => {
    setSelectedCrypto(crypto);
  }, []);

  const handleConnectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError("");

    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate successful connection
    setIsConnected(true);
    setWalletAddress("0x1234...5678");
    setIsConnecting(false);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setWalletAddress("");
  }, []);

  const handleDonate = useCallback(async () => {
    if (amount <= 0) {
      setError("Please enter a donation amount");
      return;
    }

    setIsDonating(true);
    setError("");

    // Simulate blockchain transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsDonating(false);
    setDonationSuccess(true);

    // Fire confetti celebration!
    fireConfetti();

    // Trigger success callback
    onSuccess?.();
  }, [amount, onSuccess]);

  // Compose state object
  const state: DonationState = {
    amount,
    customAmount,
    tipPercentage,
    selectedPreset,
    selectedCrypto,
    isConnecting,
    isConnected,
    walletAddress,
    isDonating,
    donationSuccess,
    error,
  };

  // Compose calculations object
  const calculations: DonationCalculations = {
    tipAmount,
    totalAmount,
    cryptoAmount,
    donationImpact,
    currentProgress,
    newProgress,
  };

  // Compose handlers object
  const handlers: DonationHandlers = {
    handlePresetClick,
    handleCustomAmountChange,
    handleSliderChange,
    handleCryptoSelect,
    handleConnectWallet,
    handleDisconnect,
    handleDonate,
  };

  return {
    state,
    calculations,
    handlers,
    animatingAmount,
    showImpact,
    isMounted,
  };
}

/**
 * Utility function to format numbers with locale formatting
 */
export function formatAmount(num: number, decimals: number = 0): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
