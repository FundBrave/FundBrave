"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { Check, ChevronDown, Info, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Supported chain for donations
 */
export interface DonationChain {
  id: number;
  name: string;
  shortName: string;
  icon: string;
  nativeCurrency: string;
  layerZeroChainId?: number;
  bridgeAvailable: boolean;
}

/**
 * Supported chains for cross-chain donations
 */
export const DONATION_CHAINS: DonationChain[] = [
  {
    id: 1,
    name: "Ethereum",
    shortName: "ETH",
    icon: "⟠",
    nativeCurrency: "ETH",
    layerZeroChainId: 101,
    bridgeAvailable: true,
  },
  {
    id: 137,
    name: "Polygon",
    shortName: "MATIC",
    icon: "◆",
    nativeCurrency: "MATIC",
    layerZeroChainId: 109,
    bridgeAvailable: true,
  },
  {
    id: 56,
    name: "BNB Chain",
    shortName: "BNB",
    icon: "◉",
    nativeCurrency: "BNB",
    layerZeroChainId: 102,
    bridgeAvailable: true,
  },
  {
    id: 42161,
    name: "Arbitrum",
    shortName: "ARB",
    icon: "▲",
    nativeCurrency: "ETH",
    layerZeroChainId: 110,
    bridgeAvailable: true,
  },
  {
    id: 10,
    name: "Optimism",
    shortName: "OP",
    icon: "⚡",
    nativeCurrency: "ETH",
    layerZeroChainId: 111,
    bridgeAvailable: true,
  },
];

interface ChainSelectorProps {
  /** Currently selected chain */
  selectedChain: DonationChain;
  /** Campaign's target chain (where funds will be received) */
  campaignChain: DonationChain;
  /** Called when chain is changed */
  onChainSelect: (chain: DonationChain) => void;
  /** Bridge fee in native currency */
  bridgeFee?: string;
  /** Whether bridging is required */
  requiresBridge: boolean;
}

/**
 * ChainSelector Component
 *
 * Allows users to select which blockchain to donate from.
 * Shows bridging information when donating cross-chain.
 */
export function ChainSelector({
  selectedChain,
  campaignChain,
  onChainSelect,
  bridgeFee = "0.005",
  requiresBridge,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentChainId = useChainId();
  const { isConnected } = useAccount();

  // Find current wallet chain
  const walletChain = DONATION_CHAINS.find((c) => c.id === currentChainId);

  return (
    <div className="space-y-4">
      {/* Chain Selector Dropdown */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">Donate From</label>
          {isConnected && walletChain && (
            <button
              onClick={() => onChainSelect(walletChain)}
              className="text-xs text-primary hover:underline font-medium"
            >
              Use wallet chain ({walletChain.name})
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-surface-elevated border border-border-subtle rounded-lg p-4 flex items-center justify-between hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{selectedChain.icon}</div>
              <div className="text-left">
                <div className="font-semibold text-foreground">{selectedChain.name}</div>
                <div className="text-sm text-text-tertiary">{selectedChain.shortName}</div>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-text-tertiary transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-border-subtle rounded-lg shadow-lg z-10 overflow-hidden">
              {DONATION_CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    onChainSelect(chain);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full p-4 flex items-center justify-between hover:bg-surface-sunken transition-colors border-b border-border-subtle last:border-b-0",
                    selectedChain.id === chain.id && "bg-surface-sunken"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{chain.icon}</div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">{chain.name}</div>
                      <div className="text-sm text-text-tertiary">{chain.shortName}</div>
                    </div>
                  </div>
                  {selectedChain.id === chain.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Target Chain Info */}
      <div className="bg-surface-elevated border border-border-subtle rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-medium text-foreground">Campaign Chain</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-2xl">{campaignChain.icon}</div>
          <div>
            <div className="font-medium text-foreground">{campaignChain.name}</div>
            <div className="text-sm text-text-secondary">
              Funds will be received on {campaignChain.name}
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Chain Bridge Info */}
      {requiresBridge && selectedChain.bridgeAvailable && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-2">Cross-Chain Donation</h4>
              <div className="text-sm text-foreground space-y-2">
                <p>
                  You're donating from <strong>{selectedChain.name}</strong> to a campaign on{" "}
                  <strong>{campaignChain.name}</strong>. Your donation will be bridged using
                  LayerZero.
                </p>

                <div className="bg-surface-elevated rounded-lg p-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Bridge Fee:</span>
                    <span className="font-medium">
                      ~{bridgeFee} {selectedChain.nativeCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Bridge Time:</span>
                    <span className="font-medium">5-10 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Security:</span>
                    <span className="font-medium text-success">LayerZero Protocol</span>
                  </div>
                </div>

                <a
                  href="https://layerzero.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-xs"
                >
                  Learn about LayerZero
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Same Chain Info */}
      {!requiresBridge && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Direct Donation</h4>
              <p className="text-sm text-foreground">
                Your donation will be sent directly to the campaign on {campaignChain.name}. No
                bridging required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bridge Not Available Warning */}
      {requiresBridge && !selectedChain.bridgeAvailable && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Bridging Not Available</h4>
              <p className="text-sm text-foreground">
                Cross-chain donations from {selectedChain.name} are not currently supported. Please
                select {campaignChain.name} or use the{" "}
                <a href="/bridge" className="text-primary hover:underline">
                  bridge page
                </a>{" "}
                to transfer funds first.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bridge Status Tracker Component
 *
 * Shows the status of a cross-chain donation bridge transaction.
 */
interface BridgeStatusProps {
  status: "pending" | "bridging" | "confirmed" | "failed";
  sourceChain: DonationChain;
  targetChain: DonationChain;
  sourceTxHash?: string;
  targetTxHash?: string;
}

export function BridgeStatus({
  status,
  sourceChain,
  targetChain,
  sourceTxHash,
  targetTxHash,
}: BridgeStatusProps) {
  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-lg p-6">
      <h3 className="font-semibold text-foreground mb-4">Cross-Chain Transfer Status</h3>

      {/* Progress Steps */}
      <div className="space-y-4">
        {/* Step 1: Source Chain */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              status !== "pending"
                ? "bg-success/20 text-success"
                : "bg-surface-sunken text-text-tertiary"
            )}
          >
            {status !== "pending" ? <Check className="w-4 h-4" /> : "1"}
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground">
              Confirmed on {sourceChain.name}
            </div>
            <div className="text-sm text-text-secondary">
              Transaction confirmed on source chain
            </div>
            {sourceTxHash && (
              <a
                href={`https://layerzeroscan.com/${sourceTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
              >
                View transaction
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Step 2: Bridging */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              status === "confirmed"
                ? "bg-success/20 text-success"
                : status === "bridging"
                ? "bg-primary/20 text-primary"
                : "bg-surface-sunken text-text-tertiary"
            )}
          >
            {status === "confirmed" ? (
              <Check className="w-4 h-4" />
            ) : status === "bridging" ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              "2"
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground">LayerZero Bridge</div>
            <div className="text-sm text-text-secondary">
              {status === "bridging"
                ? "Transferring across chains..."
                : status === "confirmed"
                ? "Bridge completed"
                : "Waiting for confirmation"}
            </div>
          </div>
        </div>

        {/* Step 3: Target Chain */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              status === "confirmed"
                ? "bg-success/20 text-success"
                : "bg-surface-sunken text-text-tertiary"
            )}
          >
            {status === "confirmed" ? <Check className="w-4 h-4" /> : "3"}
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground">
              Received on {targetChain.name}
            </div>
            <div className="text-sm text-text-secondary">
              {status === "confirmed"
                ? "Donation received by campaign"
                : "Waiting for bridge completion"}
            </div>
            {targetTxHash && (
              <a
                href={`https://layerzeroscan.com/${targetTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
              >
                View transaction
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {status === "bridging" && (
        <div className="mt-4 bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-foreground">
          <Info className="w-4 h-4 inline mr-2" />
          This usually takes 5-10 minutes. You can safely close this page.
        </div>
      )}

      {status === "confirmed" && (
        <div className="mt-4 bg-success/10 border border-success/30 rounded-lg p-3 text-sm text-foreground">
          <Check className="w-4 h-4 inline mr-2" />
          Your donation has been successfully delivered to the campaign!
        </div>
      )}

      {status === "failed" && (
        <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-foreground">
          Bridge transaction failed. Please try again or contact support.
        </div>
      )}
    </div>
  );
}
