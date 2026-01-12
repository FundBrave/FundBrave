"use client";

import React, { useState, useCallback } from "react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "@/app/components/ui/icons";
import OnboardingNavButtons from "@/app/components/onboarding/OnboardingNavButtons";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";
import { EASE } from "@/lib/constants/animation";

/**
 * Connection states for wallet providers
 */
type ConnectionState = "idle" | "connecting" | "connected" | "error";

/**
 * Wallet provider definition
 */
interface WalletProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  detected?: boolean;
}

/**
 * Wallet benefit definition
 */
interface WalletBenefit {
  icon: React.ReactNode;
  text: string;
}

/**
 * Custom SVG icons for wallet providers
 * Hand-crafted for FundBrave design system
 */

// MetaMask fox icon
const MetaMaskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path d="M27.5 4L17.5 11.5L19.5 7L27.5 4Z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.5 4L14.4 11.6L12.5 7L4.5 4Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23.9 21.2L21.2 25.4L27 27L28.5 21.4L23.9 21.2Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.5 21.4L5 27L10.8 25.4L8.1 21.2L3.5 21.4Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 14.2L9 16.4L14.7 16.7L14.5 10.5L10.5 14.2Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.5 14.2L17.4 10.4L17.3 16.7L23 16.4L21.5 14.2Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.8 25.4L14.3 23.7L11.2 21.4L10.8 25.4Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.7 23.7L21.2 25.4L20.8 21.4L17.7 23.7Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.2 25.4L17.7 23.7L18 26.4L18 27L21.2 25.4Z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.8 25.4L14 27L14 26.4L14.3 23.7L10.8 25.4Z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.1 19.9L11.1 19L13.2 17.9L14.1 19.9Z" fill="#233447" stroke="#233447" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.9 19.9L18.8 17.9L20.9 19L17.9 19.9Z" fill="#233447" stroke="#233447" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.8 25.4L11.2 21.2L8.1 21.3L10.8 25.4Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.8 21.2L21.2 25.4L23.9 21.3L20.8 21.2Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 16.4L17.3 16.7L17.9 19.9L18.8 17.9L20.9 19L23 16.4Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.1 19L13.2 17.9L14.1 19.9L14.7 16.7L9 16.4L11.1 19Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 16.4L11.2 21.4L11.1 19L9 16.4Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.9 19L20.8 21.4L23 16.4L20.9 19Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.7 16.7L14.1 19.9L14.9 23.9L15 17.7L14.7 16.7Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.3 16.7L17 17.6L17.1 23.9L17.9 19.9L17.3 16.7Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.9 19.9L17.1 23.9L17.7 24.3L20.8 21.4L20.9 19L17.9 19.9Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.1 19L11.2 21.4L14.3 24.3L14.9 23.9L14.1 19.9L11.1 19Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 27L18 26.4L17.7 26.1H14.3L14 26.4L14 27L10.8 25.4L12 26.4L14.3 28H17.8L20 26.4L21.2 25.4L18 27Z" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.7 23.7L17.1 23.3H14.9L14.3 23.7L14 26.4L14.3 26.1H17.7L18 26.4L17.7 23.7Z" fill="#161616" stroke="#161616" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 12L29 7.5L27.5 4L17.7 11.2L21.5 14.2L26.8 15.7L28.1 14.2L27.5 13.8L28.4 13L27.7 12.4L28.6 11.7L28 12Z" fill="#763D16" stroke="#763D16" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 7.5L4 12L3.4 11.7L4.3 12.4L3.6 13L4.5 13.8L3.9 14.2L5.2 15.7L10.5 14.2L14.3 11.2L4.5 4L3 7.5Z" fill="#763D16" stroke="#763D16" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26.8 15.7L21.5 14.2L23 16.4L20.8 21.4L23.9 21.3H28.5L26.8 15.7Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 14.2L5.2 15.7L3.5 21.3H8.1L11.2 21.4L9 16.4L10.5 14.2Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.3 16.7L17.7 11.2L19.5 7H12.5L14.3 11.2L14.7 16.7L14.9 17.7L14.9 23.3H17.1L17.1 17.7L17.3 16.7Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Coinbase Wallet icon
const CoinbaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <rect width="32" height="32" rx="6" fill="#0052FF"/>
    <path d="M16 6C10.48 6 6 10.48 6 16C6 21.52 10.48 26 16 26C21.52 26 26 21.52 26 16C26 10.48 21.52 6 16 6ZM13.5 19.5C12.12 19.5 11 18.38 11 17V15C11 13.62 12.12 12.5 13.5 12.5H18.5C19.88 12.5 21 13.62 21 15V17C21 18.38 19.88 19.5 18.5 19.5H13.5Z" fill="white"/>
  </svg>
);

// WalletConnect icon
const WalletConnectIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <rect width="32" height="32" rx="6" fill="#3B99FC"/>
    <path d="M9.5 12.5C13.1 8.9 18.9 8.9 22.5 12.5L23 13C23.2 13.2 23.2 13.5 23 13.7L21.5 15.2C21.4 15.3 21.2 15.3 21.1 15.2L20.4 14.5C17.9 12 13.9 12 11.4 14.5L10.6 15.3C10.5 15.4 10.3 15.4 10.2 15.3L8.7 13.8C8.5 13.6 8.5 13.3 8.7 13.1L9.5 12.5ZM25.5 15.5L26.8 16.8C27 17 27 17.3 26.8 17.5L21.3 23C21.1 23.2 20.8 23.2 20.6 23L16.8 19.2C16.75 19.15 16.65 19.15 16.6 19.2L12.8 23C12.6 23.2 12.3 23.2 12.1 23L6.6 17.5C6.4 17.3 6.4 17 6.6 16.8L7.9 15.5C8.1 15.3 8.4 15.3 8.6 15.5L12.4 19.3C12.45 19.35 12.55 19.35 12.6 19.3L16.4 15.5C16.6 15.3 16.9 15.3 17.1 15.5L20.9 19.3C20.95 19.35 21.05 19.35 21.1 19.3L24.9 15.5C25.1 15.3 25.3 15.3 25.5 15.5Z" fill="white"/>
  </svg>
);

// Benefit icons
const CoinsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
    <path d="M7 6h1v4"/>
    <path d="m16.71 13.88.7.71-2.82 2.82"/>
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const AwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

// Loading spinner icon
const SpinnerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// Error icon
const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

/**
 * Wallet options for connection
 */
const WALLET_OPTIONS: WalletProvider[] = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Popular browser wallet",
    icon: <MetaMaskIcon />,
    detected: typeof window !== "undefined" && !!(window as { ethereum?: unknown }).ethereum,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Easy-to-use mobile wallet",
    icon: <CoinbaseIcon />,
    detected: false,
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Connect any mobile wallet",
    icon: <WalletConnectIcon />,
    detected: true, // Always available
  },
];

/**
 * Benefits of connecting a wallet
 */
const WALLET_BENEFITS: WalletBenefit[] = [
  { icon: <CoinsIcon />, text: "Lower fees on donations" },
  { icon: <GlobeIcon />, text: "Donate from anywhere" },
  { icon: <ShieldIcon />, text: "Full transaction transparency" },
  { icon: <AwardIcon />, text: "Earn on-chain badges" },
];

// Spring transition for wallet option cards
const cardSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 20,
};

// Wallet option animation variants
const walletOptionVariants = {
  rest: {
    scale: 1,
    boxShadow: "0 0 0 rgba(69, 12, 240, 0)",
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 30px rgba(69, 12, 240, 0.2)",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.98,
  },
};

// Checkmark animation variants for connected state
const checkmarkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 25,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * ConnectWallet Step Component
 *
 * Motion (Framer Motion) controls:
 * - Card entrance stagger animation
 * - Wallet option hover/tap states
 * - Connection state transitions (loading, success, error)
 *
 * Features:
 * - MetaMask, Coinbase Wallet, WalletConnect options
 * - Connection states: idle, connecting, connected, error
 * - Skip option: "I'll use a card instead"
 * - Benefits explanation section
 * - 44px touch targets for accessibility
 *
 * Respects prefers-reduced-motion for accessibility
 */
const ConnectWallet: React.FC<StepComponentProps> = ({ onNext, onBack }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleConnect = useCallback(async (walletId: string) => {
    setSelectedWallet(walletId);
    setConnectionState("connecting");
    setErrorMessage(null);

    try {
      // Simulate wallet connection
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate 90% success rate
          if (Math.random() > 0.1) {
            resolve(true);
          } else {
            reject(new Error("Connection rejected"));
          }
        }, 2000);
      });

      setConnectionState("connected");

      // Auto-proceed after successful connection
      setTimeout(() => {
        if (onNext) {
          onNext();
        }
      }, 1500);
    } catch {
      setConnectionState("error");
      setErrorMessage("Connection failed. Please try again.");

      // Reset after error display
      setTimeout(() => {
        setConnectionState("idle");
        setSelectedWallet(null);
        setErrorMessage(null);
      }, 3000);
    }
  }, [onNext]);

  const handleSkip = () => {
    if (onNext) {
      onNext();
    }
  };

  // Animation settings based on motion preference
  const staggerDelay = prefersReducedMotion ? 0 : 0.1;

  const getWalletStateIcon = (walletId: string) => {
    if (selectedWallet !== walletId) return null;

    switch (connectionState) {
      case "connecting":
        return <SpinnerIcon />;
      case "connected":
        return <Check className="w-5 h-5 text-green-500" />;
      case "error":
        return <ErrorIcon />;
      default:
        return null;
    }
  };

  const getWalletStateClass = (walletId: string) => {
    if (selectedWallet !== walletId) return "";

    switch (connectionState) {
      case "connecting":
        return "border-purple-400/50 bg-purple-900/20";
      case "connected":
        return "border-green-500/50 bg-green-900/20";
      case "error":
        return "border-red-500/50 bg-red-900/20";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[500px] px-4 overflow-y-auto scrollbar-hidden">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-6"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.15 : 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-foreground tracking-wide">
          Connect your wallet
        </h2>
        <p className="text-text-secondary text-lg">
          Enable crypto donations and unlock exclusive benefits
        </p>
      </motion.div>

      {/* Benefits Section */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {WALLET_BENEFITS.map((benefit, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-2 p-3 rounded-lg bg-surface-elevated border border-border-default"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * staggerDelay }}
          >
            <span className="text-purple-400">{benefit.icon}</span>
            <span className="text-sm text-text-secondary">{benefit.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Wallet Options */}
      <div className="flex flex-col gap-3 mb-6">
        {WALLET_OPTIONS.map((wallet, index) => {
          const isSelected = selectedWallet === wallet.id;
          const isDisabled = connectionState !== "idle" && !isSelected;
          const stateClass = getWalletStateClass(wallet.id);
          const stateIcon = getWalletStateIcon(wallet.id);

          return (
            <motion.button
              key={wallet.id}
              onClick={() => !isDisabled && handleConnect(wallet.id)}
              disabled={isDisabled}
              className={`relative flex items-center gap-4 p-4 rounded-xl transition-colors min-h-[72px] ${
                isDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              } ${
                stateClass ||
                "bg-surface-elevated border border-border-default hover:border-purple-400/25"
              }`}
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -20 }}
              animate={{ opacity: isDisabled ? 0.5 : 1, x: 0 }}
              transition={{
                delay: 0.4 + index * staggerDelay,
                ...cardSpring,
              }}
              variants={prefersReducedMotion ? undefined : walletOptionVariants}
              whileHover={isDisabled || prefersReducedMotion ? {} : "hover"}
              whileTap={isDisabled || prefersReducedMotion ? {} : "tap"}
            >
              {/* Wallet icon */}
              <div className="w-10 h-10 flex-shrink-0">{wallet.icon}</div>

              {/* Wallet info */}
              <div className="flex flex-col items-start flex-1">
                <span className="text-foreground font-semibold">
                  {wallet.name}
                </span>
                <span className="text-text-tertiary text-sm">
                  {wallet.description}
                </span>
              </div>

              {/* State indicator */}
              <AnimatePresence mode="wait">
                {stateIcon && (
                  <motion.div
                    variants={checkmarkVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex items-center justify-center"
                  >
                    {stateIcon}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Detected badge */}
              {wallet.detected && connectionState === "idle" && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  Detected
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.p
            className="text-red-400 text-center mb-4 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Connection status message */}
      <AnimatePresence>
        {connectionState === "connected" && (
          <motion.p
            className="text-green-400 text-center mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            Wallet connected successfully!
          </motion.p>
        )}
      </AnimatePresence>

      {/* Navigation Buttons - hidden during connection */}
      {connectionState === "idle" && (
        <OnboardingNavButtons
          onBack={onBack}
          onNext={handleSkip}
          nextLabel="Skip for now"
        />
      )}

      {/* Skip link */}
      {connectionState === "idle" && (
        <motion.button
          onClick={handleSkip}
          className="mt-4 text-text-tertiary hover:text-text-secondary text-sm underline-offset-4 hover:underline transition-colors min-h-[44px] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          I'll use a card instead
        </motion.button>
      )}
    </div>
  );
};

export default ConnectWallet;
