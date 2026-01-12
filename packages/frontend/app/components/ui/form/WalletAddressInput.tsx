"use client";

import { useState, useCallback, useMemo, useId, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Wallet, Check } from "@/app/components/ui/icons";
import { Spinner } from "@/app/components/ui/Spinner";
import { isValidWalletAddress, truncateWalletAddress } from "@/app/campaigns/create/schemas";

// ============================================================================
// Types
// ============================================================================

type ValidationState = "empty" | "typing" | "valid" | "invalid" | "resolving";

interface WalletAddressInputProps {
  /** Current wallet address value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether a wallet is currently connected (for auto-fill button) */
  isWalletConnected?: boolean;
  /** Connected wallet address (for auto-fill) */
  connectedWalletAddress?: string;
  /** Callback to trigger wallet connection */
  onConnectWallet?: () => void;
  /** Optional ENS name resolution (future enhancement) */
  ensName?: string;
  /** Whether ENS is being resolved */
  isResolvingEns?: boolean;
  /** Optional class name */
  className?: string;
  /** Label text */
  label?: string;
  /** Required field indicator */
  required?: boolean;
}

// ============================================================================
// Validation Icon
// ============================================================================

interface ValidationIconProps {
  state: ValidationState;
}

function ValidationIcon({ state }: ValidationIconProps) {
  switch (state) {
    case "valid":
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500"
        >
          <Check size={14} className="text-white" />
        </motion.div>
      );
    case "invalid":
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      );
    case "resolving":
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <Spinner size="sm" color="primary" />
        </motion.div>
      );
    default:
      return null;
  }
}

// ============================================================================
// Connect Wallet Button
// ============================================================================

interface ConnectWalletButtonProps {
  isConnected: boolean;
  connectedAddress?: string;
  onConnect?: () => void;
  onUseConnected: () => void;
  disabled?: boolean;
}

function ConnectWalletButton({
  isConnected,
  connectedAddress,
  onConnect,
  onUseConnected,
  disabled,
}: ConnectWalletButtonProps) {
  if (isConnected && connectedAddress) {
    return (
      <button
        type="button"
        onClick={onUseConnected}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-3 py-2 min-h-[44px]",
          "bg-primary/10 text-primary text-sm font-medium",
          "rounded-lg border border-primary/20",
          "hover:bg-primary/15 transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Wallet size={16} />
        <span className="hidden sm:inline">Use Connected Wallet</span>
        <span className="sm:hidden">Use Wallet</span>
      </button>
    );
  }

  if (onConnect) {
    return (
      <button
        type="button"
        onClick={onConnect}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-3 py-2 min-h-[44px]",
          "bg-surface-sunken text-foreground text-sm font-medium",
          "rounded-lg border border-border-subtle",
          "hover:border-primary/30 hover:bg-surface-sunken/80 transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Wallet size={16} />
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </button>
    );
  }

  return null;
}

// ============================================================================
// Main Component
// ============================================================================

export function WalletAddressInput({
  value,
  onChange,
  error,
  disabled,
  isWalletConnected = false,
  connectedWalletAddress,
  onConnectWallet,
  ensName,
  isResolvingEns = false,
  className,
  label = "Wallet Address",
  required = true,
}: WalletAddressInputProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  const [isFocused, setIsFocused] = useState(false);

  // Determine validation state
  const validationState = useMemo((): ValidationState => {
    if (isResolvingEns) return "resolving";
    if (!value || value === "0x") return "empty";
    if (value.length < 42) return "typing";
    if (isValidWalletAddress(value)) return "valid";
    return "invalid";
  }, [value, isResolvingEns]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Ensure the value starts with 0x
      if (!newValue.startsWith("0x")) {
        if (newValue.startsWith("0")) {
          newValue = "0x" + newValue.slice(1);
        } else if (newValue.length > 0) {
          newValue = "0x" + newValue;
        }
      }

      // Only allow hex characters after 0x
      const hexPart = newValue.slice(2);
      const cleanHexPart = hexPart.replace(/[^a-fA-F0-9]/g, "");

      // Limit to 40 hex characters (plus 0x prefix)
      const finalValue = "0x" + cleanHexPart.slice(0, 40);

      onChange(finalValue === "0x" ? "" : finalValue);
    },
    [onChange]
  );

  // Handle using connected wallet
  const handleUseConnectedWallet = useCallback(() => {
    if (connectedWalletAddress) {
      onChange(connectedWalletAddress);
    }
  }, [connectedWalletAddress, onChange]);

  // Handle paste
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text").trim();

      // If it looks like an address, use it directly
      if (pastedText.startsWith("0x")) {
        const hexPart = pastedText.slice(2).replace(/[^a-fA-F0-9]/g, "").slice(0, 40);
        onChange("0x" + hexPart);
      } else {
        // Try to extract an address from the pasted content
        const match = pastedText.match(/0x[a-fA-F0-9]{40}/);
        if (match) {
          onChange(match[0]);
        }
      }
    },
    [onChange]
  );

  const hasError = Boolean(error) || validationState === "invalid";
  const isValid = validationState === "valid";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="font-medium text-sm sm:text-base text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>

        {/* Connect wallet button */}
        <ConnectWalletButton
          isConnected={isWalletConnected}
          connectedAddress={connectedWalletAddress}
          onConnect={onConnectWallet}
          onUseConnected={handleUseConnectedWallet}
          disabled={disabled}
        />
      </div>

      {/* Input container */}
      <div
        className={cn(
          "flex items-center gap-2",
          "bg-surface-sunken rounded-xl",
          "border transition-all duration-200",
          isFocused && !hasError && "ring-2 ring-primary/50 border-primary",
          isValid && !isFocused && "border-green-500/50",
          hasError
            ? "border-destructive ring-2 ring-destructive/30"
            : !isFocused && !isValid && "border-transparent",
          disabled && "opacity-50"
        )}
      >
        {/* 0x prefix */}
        <span className="pl-4 text-text-tertiary font-mono text-sm sm:text-base select-none">
          0x
        </span>

        {/* Input */}
        <input
          id={inputId}
          type="text"
          value={value ? value.slice(2) : ""}
          onChange={(e) => {
            const newValue = e.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 40);
            onChange(newValue ? "0x" + newValue : "");
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPaste={handlePaste}
          placeholder="0000...0000"
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={`${helpId}${hasError ? ` ${errorId}` : ""}`}
          className={cn(
            "flex-1 bg-transparent",
            "py-3 sm:py-4 pr-3",
            "text-sm sm:text-base font-mono text-foreground",
            "placeholder:text-text-tertiary",
            "outline-none",
            disabled && "cursor-not-allowed"
          )}
        />

        {/* Validation indicator */}
        <div className="pr-3">
          <AnimatePresence mode="wait">
            <ValidationIcon state={validationState} />
          </AnimatePresence>
        </div>
      </div>

      {/* ENS name display (if resolved) */}
      <AnimatePresence>
        {ensName && isValid && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 text-sm text-text-secondary"
          >
            <span>Resolved:</span>
            <span className="font-medium text-foreground">{ensName}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address preview when valid */}
      <AnimatePresence>
        {isValid && value && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-green-500 font-medium">Valid address</span>
            <span className="text-text-tertiary font-mono">{truncateWalletAddress(value)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help text */}
      <p id={helpId} className="text-xs text-text-tertiary">
        Enter an Ethereum wallet address (0x + 40 hex characters)
      </p>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            className="text-sm text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WalletAddressInput;
