"use client";

import { Wallet, Loader2, Sparkles, ExternalLink, CheckCircle2 } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import type { WalletConnectionProps } from "@/types/donation";

/**
 * WalletConnection - Wallet connection and donation button section
 * Handles connect wallet, disconnect, donate, and USDC approval actions
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
  needsApproval = false,
  onApprove,
  txHash,
  selectedCrypto = "ETH",
  isWealthBuilding = false,
  onToggleWealthBuilding,
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

          {/* Wealth Building Toggle */}
          {onToggleWealthBuilding && (
            <div className="flex items-center justify-between bg-surface-overlay rounded-xl px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">
                  Wealth Building Donation
                </span>
                <span className="text-xs text-text-tertiary">
                  80% direct, 20% invested for long-term impact
                </span>
              </div>
              <button
                onClick={onToggleWealthBuilding}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  isWealthBuilding ? "bg-primary-500" : "bg-surface-elevated"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                    isWealthBuilding && "translate-x-5"
                  )}
                />
              </button>
            </div>
          )}

          {/* USDC Approval Button (if needed) */}
          {needsApproval && selectedCrypto === "USDC" && onApprove && (
            <button
              onClick={onApprove}
              disabled={isDonating}
              className={cn(
                "w-full h-14 rounded-[20px] text-white font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2",
                isDonating
                  ? "bg-gradient-to-r from-primary-500 to-soft-purple-500 opacity-80 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-500 to-soft-purple-500 shadow-[0px_3px_3px_0px_rgba(254,254,254,0.25)] hover:shadow-[0px_6px_20px_0px_rgba(139,92,246,0.4)] hover:scale-[1.01] active:scale-[0.99]"
              )}
            >
              {isDonating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Approving USDC...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Approve USDC
                </>
              )}
            </button>
          )}

          {/* Donate Button */}
          <button
            onClick={onDonate}
            disabled={isDonating || amount <= 0 || (needsApproval && selectedCrypto === "USDC")}
            className={cn(
              "w-full h-14 rounded-[20px] text-white font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2",
              amount <= 0 || (needsApproval && selectedCrypto === "USDC")
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
                {isWealthBuilding ? "Donate with Wealth Building" : `Donate ${formatAmount(totalAmount, 2)} USD`}
              </>
            )}
          </button>

          {/* Transaction Hash Display */}
          {txHash && (
            <div className="flex items-center justify-between bg-green-500/10 rounded-xl px-4 py-3 border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">
                  Transaction Successful
                </span>
              </div>
              <a
                href={`https://sepolia.basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-green-500 hover:text-green-400 transition-colors"
              >
                View on Basescan
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
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
