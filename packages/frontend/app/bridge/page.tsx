"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import {
  ArrowLeft,
  ArrowDownUp,
  Info,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { formatEther, parseEther } from "viem";

/**
 * Supported chains for bridging
 */
interface Chain {
  id: number;
  name: string;
  shortName: string;
  icon: string;
  nativeCurrency: string;
  layerZeroChainId?: number;
}

/**
 * Bridge transaction record
 */
interface BridgeTransaction {
  id: string;
  from: Chain;
  to: Chain;
  amount: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  txHash: string;
  destinationTxHash?: string;
}

// Supported chains
const CHAINS: Chain[] = [
  {
    id: 1,
    name: "Ethereum",
    shortName: "ETH",
    icon: "⟠",
    nativeCurrency: "ETH",
    layerZeroChainId: 101,
  },
  {
    id: 137,
    name: "Polygon",
    shortName: "MATIC",
    icon: "◆",
    nativeCurrency: "MATIC",
    layerZeroChainId: 109,
  },
  {
    id: 56,
    name: "BNB Chain",
    shortName: "BNB",
    icon: "◉",
    nativeCurrency: "BNB",
    layerZeroChainId: 102,
  },
  {
    id: 42161,
    name: "Arbitrum",
    shortName: "ARB",
    icon: "▲",
    nativeCurrency: "ETH",
    layerZeroChainId: 110,
  },
  {
    id: 10,
    name: "Optimism",
    shortName: "OP",
    icon: "⚡",
    nativeCurrency: "ETH",
    layerZeroChainId: 111,
  },
  {
    id: 43114,
    name: "Avalanche",
    shortName: "AVAX",
    icon: "❄",
    nativeCurrency: "AVAX",
    layerZeroChainId: 106,
  },
];

/**
 * LayerZero Cross-Chain Bridge Interface
 *
 * Comprehensive bridge UI for transferring FBT tokens across chains.
 */
export default function BridgePage() {
  const router = useRouter();
  const { address, isConnected, chain: currentChain } = useAccount();

  // Find current chain
  const sourceChain = CHAINS.find((c) => c.id === currentChain?.id) || CHAINS[0];

  const [destinationChain, setDestinationChain] = useState<Chain>(
    CHAINS.find((c) => c.id !== sourceChain.id) || CHAINS[1]
  );
  const [amount, setAmount] = useState("");
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<"idle" | "confirming" | "bridging" | "success" | "error">("idle");
  const [showSourceChains, setShowSourceChains] = useState(false);
  const [showDestChains, setShowDestChains] = useState(false);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);

  // Get FBT balance (mock for now)
  const fbtBalance = "1000.00"; // Replace with real balance hook

  // Bridge fee (LayerZero fee + gas)
  const estimatedFee = "0.005"; // ETH or native currency
  const layerZeroFee = "0.003";
  const gasFee = "0.002";

  // Min/max bridge amounts
  const minBridgeAmount = "10";
  const maxBridgeAmount = "10000";

  /**
   * Swap source and destination chains
   */
  function handleSwapChains() {
    const temp = sourceChain;
    setDestinationChain(temp);
    // In real implementation, this would trigger a network switch
  }

  /**
   * Validate bridge amount
   */
  function validateAmount(): { valid: boolean; error?: string } {
    if (!amount || parseFloat(amount) === 0) {
      return { valid: false, error: "Enter an amount" };
    }

    if (parseFloat(amount) < parseFloat(minBridgeAmount)) {
      return { valid: false, error: `Minimum ${minBridgeAmount} FBT` };
    }

    if (parseFloat(amount) > parseFloat(maxBridgeAmount)) {
      return { valid: false, error: `Maximum ${maxBridgeAmount} FBT` };
    }

    if (parseFloat(amount) > parseFloat(fbtBalance)) {
      return { valid: false, error: "Insufficient balance" };
    }

    return { valid: true };
  }

  /**
   * Execute bridge transaction
   */
  async function handleBridge() {
    const validation = validateAmount();
    if (!validation.valid) return;

    setIsBridging(true);
    setBridgeStatus("confirming");

    try {
      // In real implementation:
      // 1. Approve FBT token spending
      // 2. Call LayerZero bridge contract
      // 3. Wait for source chain confirmation
      // 4. Wait for destination chain delivery

      // Simulate confirmation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setBridgeStatus("bridging");

      // Simulate bridging
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Add to transactions
      const newTx: BridgeTransaction = {
        id: `bridge-${Date.now()}`,
        from: sourceChain,
        to: destinationChain,
        amount,
        status: "confirmed",
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        destinationTxHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      };

      setTransactions((prev) => [newTx, ...prev]);
      setBridgeStatus("success");
      setAmount("");

      // Reset after 3 seconds
      setTimeout(() => {
        setBridgeStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Bridge failed:", error);
      setBridgeStatus("error");
      setTimeout(() => {
        setBridgeStatus("idle");
      }, 3000);
    } finally {
      setIsBridging(false);
    }
  }

  /**
   * Set max amount
   */
  function handleSetMax() {
    setAmount(fbtBalance);
  }

  const validation = validateAmount();
  const canBridge = isConnected && validation.valid && !isBridging;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to bridge FBT tokens across chains
            </p>
            <Button onClick={() => router.push("/auth")}>Connect Wallet</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <button
          onClick={() => router.push("/wallet")}
          className="text-text-secondary hover:text-foreground mb-6 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wallet
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cross-Chain Bridge</h1>
          <p className="text-text-secondary">
            Transfer FBT tokens across supported blockchains using LayerZero
          </p>
        </div>

        {/* Bridge Interface */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-6">
          {/* Source Chain */}
          <div className="mb-4">
            <label className="text-sm font-medium text-text-secondary mb-2 block">From</label>
            <div
              className="bg-surface-sunken border border-border-subtle rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
              onClick={() => setShowSourceChains(!showSourceChains)}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{sourceChain.icon}</div>
                <div>
                  <div className="font-semibold text-foreground">{sourceChain.name}</div>
                  <div className="text-sm text-text-tertiary">{sourceChain.shortName}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-text-secondary">Balance</div>
                <div className="font-semibold text-foreground">{fbtBalance} FBT</div>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwapChains}
              className="bg-surface-elevated border-2 border-border-subtle rounded-full p-2 hover:bg-surface-sunken hover:border-primary transition-all"
              aria-label="Swap chains"
            >
              <ArrowDownUp className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Destination Chain */}
          <div className="mb-6">
            <label className="text-sm font-medium text-text-secondary mb-2 block">To</label>
            <div
              className="bg-surface-sunken border border-border-subtle rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
              onClick={() => setShowDestChains(!showDestChains)}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{destinationChain.icon}</div>
                <div>
                  <div className="font-semibold text-foreground">{destinationChain.name}</div>
                  <div className="text-sm text-text-tertiary">{destinationChain.shortName}</div>
                </div>
              </div>
              <div className="text-sm text-text-secondary">Select destination</div>
            </div>

            {/* Destination Chain Selector */}
            {showDestChains && (
              <div className="mt-2 bg-surface-sunken border border-border-subtle rounded-lg overflow-hidden">
                {CHAINS.filter((c) => c.id !== sourceChain.id).map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => {
                      setDestinationChain(chain);
                      setShowDestChains(false);
                    }}
                    className="w-full p-4 flex items-center gap-3 hover:bg-surface-elevated transition-colors border-b border-border-subtle last:border-b-0"
                  >
                    <div className="text-2xl">{chain.icon}</div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">{chain.name}</div>
                      <div className="text-sm text-text-tertiary">{chain.shortName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">Amount</label>
              <button
                onClick={handleSetMax}
                className="text-sm text-primary hover:underline font-medium"
              >
                Max
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surface-sunken border border-border-subtle rounded-lg px-4 py-3 text-lg text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
                FBT
              </div>
            </div>
            {amount && !validation.valid && (
              <div className="text-sm text-destructive mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validation.error}
              </div>
            )}
          </div>

          {/* Fee Breakdown */}
          <div className="bg-surface-sunken rounded-lg p-4 mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">LayerZero Fee</span>
              <span className="text-foreground">
                ~{layerZeroFee} {sourceChain.nativeCurrency}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Gas Fee</span>
              <span className="text-foreground">
                ~{gasFee} {sourceChain.nativeCurrency}
              </span>
            </div>
            <div className="border-t border-border-subtle pt-2 flex items-center justify-between font-medium">
              <span className="text-foreground">Total Fee</span>
              <span className="text-foreground">
                ~{estimatedFee} {sourceChain.nativeCurrency}
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="mb-2">
                Bridge limits: {minBridgeAmount} - {maxBridgeAmount} FBT
              </p>
              <p>
                Estimated time: 5-10 minutes. Your tokens will arrive on {destinationChain.name}{" "}
                after confirmation.
              </p>
            </div>
          </div>

          {/* Bridge Button */}
          <Button
            onClick={handleBridge}
            disabled={!canBridge}
            className="w-full"
            size="lg"
          >
            {bridgeStatus === "idle" && "Bridge Tokens"}
            {bridgeStatus === "confirming" && (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirm in Wallet...
              </>
            )}
            {bridgeStatus === "bridging" && (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Bridging...
              </>
            )}
            {bridgeStatus === "success" && (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Bridge Successful!
              </>
            )}
            {bridgeStatus === "error" && (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Bridge Failed
              </>
            )}
          </Button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Recent Bridges</h2>
          {transactions.length === 0 ? (
            <EmptyState
              icon={ArrowDownUp}
              title="No bridge transactions yet"
              description="Your bridge history will appear here"
            />
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-surface-sunken border border-border-subtle rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tx.from.icon}</span>
                      <ArrowDownUp className="w-4 h-4 text-text-tertiary" />
                      <span className="text-lg">{tx.to.icon}</span>
                      <span className="font-semibold text-foreground">{tx.amount} FBT</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        tx.status === "confirmed" && "text-success",
                        tx.status === "pending" && "text-warning",
                        tx.status === "failed" && "text-destructive"
                      )}
                    >
                      {tx.status === "confirmed" && <CheckCircle className="w-4 h-4" />}
                      {tx.status === "pending" && <Clock className="w-4 h-4" />}
                      {tx.status === "failed" && <AlertCircle className="w-4 h-4" />}
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                    <a
                      href={`https://layerzeroscan.com/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      View on LayerZero Scan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
