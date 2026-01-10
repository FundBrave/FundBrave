"use client";

import { Wallet, Loader2, Sparkles } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import type { WalletConnectionProps } from "@/types/donation";

/**
 * WalletConnection - Wallet connection and donation button section
 * Handles connect wallet, disconnect, and donate actions
 */
export default function WalletConnection({
  isConnected,
  isConnecting,
  isDonating,
  walletAddress,
  amount,
  totalAmount,
  onConnectWallet,
  onDisconnect,
  onDonate,
  formatAmount,
}: WalletConnectionProps) {
  return (
    <div className="space-y-5">
      {!isConnected ? (
        // Connect Wallet Button
        <button
          onClick={onConnectWallet}
          disabled={isConnecting}
          className={cn(
            "w-full h-14 rounded-[20px] bg-gradient-to-r from-primary-500 to-soft-purple-500 text-white font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2",
            isConnecting
              ? "opacity-80 cursor-not-allowed"
              : "shadow-[0px_3px_3px_0px_rgba(254,254,254,0.25)] hover:shadow-[0px_6px_20px_0px_rgba(139,92,246,0.4)] hover:scale-[1.01] active:scale-[0.99]"
          )}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Connected Wallet Info */}
          <div className="flex items-center justify-between bg-surface-overlay rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-text-secondary">
                Connected: {walletAddress}
              </span>
            </div>
            <button
              onClick={onDisconnect}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Disconnect
            </button>
          </div>

          {/* Donate Button */}
          <button
            onClick={onDonate}
            disabled={isDonating || amount <= 0}
            className={cn(
              "w-full h-14 rounded-[20px] text-white font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2",
              amount <= 0
                ? "bg-surface-elevated text-text-tertiary cursor-not-allowed"
                : isDonating
                ? "bg-gradient-to-r from-primary-500 to-soft-purple-500 opacity-80 cursor-not-allowed"
                : "bg-gradient-to-r from-primary-500 to-soft-purple-500 shadow-[0px_3px_3px_0px_rgba(254,254,254,0.25)] hover:shadow-[0px_6px_20px_0px_rgba(139,92,246,0.4)] hover:scale-[1.01] active:scale-[0.99]"
            )}
          >
            {isDonating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Transaction...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Donate {formatAmount(totalAmount, 2)} USD
              </>
            )}
          </button>
        </div>
      )}

      {/* Terms and conditions text */}
      <p className="text-text-secondary text-sm leading-6 text-center">
        By choosing this payment method, you agree to the{" "}
        <span className="text-foreground/80 hover:text-foreground cursor-pointer transition-colors">
          FundBrave terms and conditions
        </span>{" "}
        and acknowledge the{" "}
        <span className="text-foreground/80 hover:text-foreground cursor-pointer transition-colors">
          privacy policy
        </span>
      </p>
    </div>
  );
}
