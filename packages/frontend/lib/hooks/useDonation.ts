"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseUnits, type Address } from 'viem';
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
import { FUNDRAISER_FACTORY_ABI, ERC20_ABI } from "@/app/lib/contracts/abis";
import { BASE_SEPOLIA_ADDRESSES, BASE_SEPOLIA_CHAIN_ID, USDC_DECIMALS } from "@/app/lib/contracts/config";
import { useRecordDonationMutation } from "@/app/generated/graphql";

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
 * Custom hook for managing donation state and blockchain transactions
 * Implements real Web3 donations using wagmi
 */
export function useDonation({
  campaign,
  onSuccess,
}: UseDonationProps): UseDonationReturn {
  // Wagmi hooks
  const { address, isConnected: walletConnected } = useAccount();
  const chainId = useChainId();

  // GraphQL mutation
  const [recordDonationMutation] = useRecordDonationMutation();

  // Core donation state
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [tipPercentage, setTipPercentage] = useState<number>(
    TIP_SLIDER_CONFIG.DEFAULT
  );
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Crypto state
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>("ETH");
  const [isWealthBuilding, setIsWealthBuilding] = useState<boolean>(false);

  // Transaction state
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [needsApproval, setNeedsApproval] = useState(false);

  // UI state
  const [animatingAmount, setAnimatingAmount] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Error state
  const [error, setError] = useState<string>("");

  // Contract write hooks
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check USDC balance
  const { data: usdcBalance } = useReadContract({
    address: BASE_SEPOLIA_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });

  // Check USDC allowance for ERC20 donations
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: BASE_SEPOLIA_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, BASE_SEPOLIA_ADDRESSES.fundraiserFactory] : undefined,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });

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

  // Handle transaction success
  useEffect(() => {
    if (txSuccess && hash && campaign) {
      handleTransactionSuccess(hash);
    }
  }, [txSuccess, hash]);

  // Check allowance for USDC donations
  const checkAllowance = useCallback(async (requiredAmount: bigint) => {
    if (!allowance) {
      setNeedsApproval(true);
      return false;
    }

    const hasAllowance = allowance >= requiredAmount;
    setNeedsApproval(!hasAllowance);
    return hasAllowance;
  }, [allowance]);

  // Approve USDC for donation
  const approveUSDC = useCallback(async () => {
    if (!address || !campaign) {
      setError('Wallet not connected');
      return false;
    }

    setIsDonating(true);
    setError("");

    try {
      const amountInUSDC = parseUnits(totalAmount.toString(), USDC_DECIMALS);

      writeContract({
        address: BASE_SEPOLIA_ADDRESSES.usdc,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BASE_SEPOLIA_ADDRESSES.fundraiserFactory, amountInUSDC],
        chainId: BASE_SEPOLIA_CHAIN_ID,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve USDC';
      setError(errorMessage);
      setIsDonating(false);
      return false;
    }
  }, [address, campaign, totalAmount, writeContract]);

  // Record donation to backend
  const handleTransactionSuccess = useCallback(async (transactionHash: `0x${string}`) => {
    if (!campaign || !address) return;

    setTxHash(transactionHash);

    try {
      // Determine token address based on donation type
      const tokenAddress = selectedCrypto === "ETH"
        ? BASE_SEPOLIA_ADDRESSES.weth
        : BASE_SEPOLIA_ADDRESSES.usdc;

      const amountInUSDC = parseUnits(totalAmount.toString(), USDC_DECIMALS);

      await recordDonationMutation({
        variables: {
          input: {
            fundraiserId: campaign.id,
            amount: amountInUSDC.toString(),
            token: tokenAddress,
            txHash: transactionHash,
            chainId: BASE_SEPOLIA_CHAIN_ID,
            isAnonymous: false,
            message: "",
          },
        },
      });

      setIsDonating(false);
      setDonationSuccess(true);

      // Fire confetti celebration!
      fireConfetti();

      // Trigger success callback
      onSuccess?.();

      // Reset form after 3 seconds
      setTimeout(() => {
        resetWrite();
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record donation';
      setError(errorMessage);
      setIsDonating(false);
    }
  }, [campaign, address, selectedCrypto, totalAmount, recordDonationMutation, onSuccess, resetWrite]);

  // Main donation handler
  const handleDonate = useCallback(async () => {
    if (amount <= 0) {
      setError("Please enter a donation amount");
      return;
    }

    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!campaign) {
      setError("Campaign not found");
      return;
    }

    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      setError("Please switch to Base Sepolia network");
      return;
    }

    setIsDonating(true);
    setError("");

    try {
      const fundraiserId = BigInt(campaign.id);
      const amountInUSDC = parseUnits(totalAmount.toString(), USDC_DECIMALS);

      // Native ETH donations
      if (selectedCrypto === "ETH") {
        const ethAmount = parseUnits(cryptoAmount.toFixed(18), 18);

        if (isWealthBuilding) {
          writeContract({
            address: BASE_SEPOLIA_ADDRESSES.fundraiserFactory,
            abi: FUNDRAISER_FACTORY_ABI,
            functionName: 'donateWealthBuildingNative',
            args: [fundraiserId],
            value: ethAmount,
            chainId: BASE_SEPOLIA_CHAIN_ID,
          });
        } else {
          writeContract({
            address: BASE_SEPOLIA_ADDRESSES.fundraiserFactory,
            abi: FUNDRAISER_FACTORY_ABI,
            functionName: 'donateNative',
            args: [fundraiserId],
            value: ethAmount,
            chainId: BASE_SEPOLIA_CHAIN_ID,
          });
        }
      }
      // USDC donations
      else if (selectedCrypto === "USDC") {
        // Check balance
        if (usdcBalance && amountInUSDC > usdcBalance) {
          setError('Insufficient USDC balance');
          setIsDonating(false);
          return;
        }

        // Check allowance
        const hasAllowance = await checkAllowance(amountInUSDC);
        if (!hasAllowance) {
          setError('Please approve USDC first');
          setIsDonating(false);
          return;
        }

        if (isWealthBuilding) {
          writeContract({
            address: BASE_SEPOLIA_ADDRESSES.fundraiserFactory,
            abi: FUNDRAISER_FACTORY_ABI,
            functionName: 'donateWealthBuilding',
            args: [fundraiserId, amountInUSDC],
            chainId: BASE_SEPOLIA_CHAIN_ID,
          });
        } else {
          writeContract({
            address: BASE_SEPOLIA_ADDRESSES.fundraiserFactory,
            abi: FUNDRAISER_FACTORY_ABI,
            functionName: 'donateERC20',
            args: [fundraiserId, BASE_SEPOLIA_ADDRESSES.usdc, amountInUSDC],
            chainId: BASE_SEPOLIA_CHAIN_ID,
          });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process donation';
      setError(errorMessage);
      setIsDonating(false);
    }
  }, [
    amount,
    address,
    campaign,
    chainId,
    totalAmount,
    selectedCrypto,
    cryptoAmount,
    isWealthBuilding,
    usdcBalance,
    checkAllowance,
    writeContract,
  ]);

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
    // This is now handled by wagmi's connect modal
    // The button should trigger the wagmi connect modal
    setError("Please use the wallet connect button in your app");
  }, []);

  const handleDisconnect = useCallback(() => {
    // This is now handled by wagmi's disconnect
    setError("Please use the wallet disconnect button in your app");
  }, []);

  const toggleWealthBuilding = useCallback(() => {
    setIsWealthBuilding((prev) => !prev);
  }, []);

  // Compose state object
  const state: DonationState = {
    amount,
    customAmount,
    tipPercentage,
    selectedPreset,
    selectedCrypto,
    isConnecting: false,
    isConnected: walletConnected,
    walletAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "",
    isDonating: isDonating || isWritePending || isConfirming,
    donationSuccess,
    error: error || (writeError?.message ?? ""),
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
    state: {
      ...state,
      // Add additional properties for UI
      txHash,
      needsApproval,
      isWealthBuilding,
    } as any,
    calculations,
    handlers: {
      ...handlers,
      approveUSDC,
      toggleWealthBuilding,
    } as any,
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
