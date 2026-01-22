"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  Send,
  History,
  Info,
  ExternalLink,
  ArrowDownUp,
  Check,
  Clock,
  AlertCircle,
  Coins,
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { cn } from "@/lib/utils";

/**
 * Receipt token representing staking position
 */
interface ReceiptToken {
  id: string;
  name: string;
  symbol: string;
  balance: string;
  valueUSD: string;
  chain: {
    id: number;
    name: string;
    icon: string;
  };
  stakingPool: string;
  apr: number;
}

/**
 * Receipt token transfer record
 */
interface ReceiptTransfer {
  id: string;
  fromChain: {
    id: number;
    name: string;
    icon: string;
  };
  toChain: {
    id: number;
    name: string;
    icon: string;
  };
  amount: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  txHash: string;
}

// Mock receipt tokens
const mockReceiptTokens: ReceiptToken[] = [
  {
    id: "1",
    name: "Global Pool Receipt",
    symbol: "rcGLOBAL",
    balance: "500.00",
    valueUSD: "1250.00",
    chain: { id: 1, name: "Ethereum", icon: "⟠" },
    stakingPool: "Global Staking Pool",
    apr: 12.5,
  },
  {
    id: "2",
    name: "DAO Pool Receipt",
    symbol: "rcDAO",
    balance: "250.00",
    valueUSD: "650.00",
    chain: { id: 137, name: "Polygon", icon: "◆" },
    stakingPool: "Impact DAO Pool",
    apr: 15.2,
  },
];

// Mock transfer history
const mockTransfers: ReceiptTransfer[] = [
  {
    id: "1",
    fromChain: { id: 1, name: "Ethereum", icon: "⟠" },
    toChain: { id: 137, name: "Polygon", icon: "◆" },
    amount: "100.00 rcGLOBAL",
    status: "confirmed",
    timestamp: Date.now() - 3600000,
    txHash: "0xabc123...",
  },
  {
    id: "2",
    fromChain: { id: 137, name: "Polygon", icon: "◆" },
    toChain: { id: 1, name: "Ethereum", icon: "⟠" },
    amount: "50.00 rcDAO",
    status: "pending",
    timestamp: Date.now() - 600000,
    txHash: "0xdef456...",
  },
];

/**
 * Receipt OFT Token Management Page
 *
 * Manage cross-chain receipt tokens from staking pools.
 * Receipt tokens are OFT (Omnichain Fungible Tokens) that can be transferred across chains.
 */
export default function ReceiptTokensPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"balances" | "transfer" | "history">("balances");
  const [selectedToken, setSelectedToken] = useState<ReceiptToken | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [targetChain, setTargetChain] = useState<number>(137);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to view and manage your receipt tokens
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <button
          onClick={() => router.push("/wallet")}
          className="text-text-secondary hover:text-foreground mb-6 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wallet
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Receipt Tokens</h1>
          <p className="text-text-secondary">
            Manage your cross-chain staking receipt tokens (OFT)
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-medium mb-1">What are Receipt Tokens?</p>
            <p>
              Receipt tokens represent your staking position and can be transferred across chains
              using LayerZero OFT technology. Transfer your staked position without unstaking!
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border-subtle">
          <button
            onClick={() => setActiveTab("balances")}
            className={cn(
              "px-4 py-3 font-medium transition-colors relative",
              activeTab === "balances"
                ? "text-primary"
                : "text-text-secondary hover:text-foreground"
            )}
          >
            Balances
            {activeTab === "balances" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={cn(
              "px-4 py-3 font-medium transition-colors relative",
              activeTab === "transfer"
                ? "text-primary"
                : "text-text-secondary hover:text-foreground"
            )}
          >
            Transfer
            {activeTab === "transfer" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-3 font-medium transition-colors relative",
              activeTab === "history"
                ? "text-primary"
                : "text-text-secondary hover:text-foreground"
            )}
          >
            History
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Balances Tab */}
        {activeTab === "balances" && (
          <div className="space-y-4">
            {/* Total Value Card */}
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary">Total Receipt Token Value</span>
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">
                $
                {mockReceiptTokens
                  .reduce((sum, token) => sum + parseFloat(token.valueUSD), 0)
                  .toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-text-secondary mt-1">
                Across {mockReceiptTokens.length} tokens
              </div>
            </div>

            {/* Token List */}
            {mockReceiptTokens.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="No receipt tokens"
                description="You don't have any staking receipt tokens yet. Stake FBT to receive receipt tokens."
                action={{
                  label: "Go to Staking",
                  onClick: () => router.push("/staking"),
                }}
              />
            ) : (
              <div className="space-y-3">
                {mockReceiptTokens.map((token) => (
                  <div
                    key={token.id}
                    className="bg-surface-elevated border border-border-subtle rounded-xl p-6 hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-full p-3">
                          <Coins className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{token.name}</h3>
                          <p className="text-sm text-text-secondary">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{token.balance}</div>
                        <div className="text-sm text-text-secondary">${token.valueUSD}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">Chain</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{token.chain.icon}</span>
                          <span className="text-sm font-medium text-foreground">
                            {token.chain.name}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">Pool APR</div>
                        <div className="text-sm font-semibold text-success">{token.apr}%</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedToken(token);
                          setActiveTab("transfer");
                        }}
                        className="flex-1"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Transfer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/staking")}
                        className="flex-1"
                      >
                        View Pool
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transfer Tab */}
        {activeTab === "transfer" && (
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Transfer Receipt Token</h2>

            {/* Select Token */}
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Receipt Token
              </label>
              <select
                value={selectedToken?.id || ""}
                onChange={(e) => {
                  const token = mockReceiptTokens.find((t) => t.id === e.target.value);
                  setSelectedToken(token || null);
                }}
                className="w-full bg-surface-sunken border border-border-subtle rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Select a token...</option>
                {mockReceiptTokens.map((token) => (
                  <option key={token.id} value={token.id}>
                    {token.name} - {token.balance} {token.symbol}
                  </option>
                ))}
              </select>
            </div>

            {selectedToken && (
              <>
                {/* Current Chain */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Current Chain
                  </label>
                  <div className="bg-surface-sunken border border-border-subtle rounded-lg p-4 flex items-center gap-3">
                    <span className="text-2xl">{selectedToken.chain.icon}</span>
                    <div>
                      <div className="font-medium text-foreground">{selectedToken.chain.name}</div>
                      <div className="text-sm text-text-secondary">
                        Balance: {selectedToken.balance}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">Amount</label>
                    <button
                      onClick={() => setTransferAmount(selectedToken.balance)}
                      className="text-sm text-primary hover:underline"
                    >
                      Max
                    </button>
                  </div>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-surface-sunken border border-border-subtle rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Target Chain */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Transfer To
                  </label>
                  <select
                    value={targetChain}
                    onChange={(e) => setTargetChain(Number(e.target.value))}
                    className="w-full bg-surface-sunken border border-border-subtle rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value={1}>⟠ Ethereum</option>
                    <option value={137}>◆ Polygon</option>
                    <option value={56}>◉ BNB Chain</option>
                    <option value={42161}>▲ Arbitrum</option>
                    <option value={10}>⚡ Optimism</option>
                  </select>
                </div>

                {/* OFT Fee Info */}
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-medium mb-1">LayerZero OFT Transfer</p>
                      <p className="mb-2">
                        Your receipt token will be transferred cross-chain while maintaining your
                        staking position.
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">LayerZero Fee:</span>
                          <span className="font-medium">~0.003 ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Transfer Time:</span>
                          <span className="font-medium">5-10 minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  disabled={!transferAmount || parseFloat(transferAmount) <= 0}
                  className="w-full"
                >
                  <ArrowDownUp className="w-4 h-4 mr-2" />
                  Transfer Receipt Token
                </Button>
              </>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {mockTransfers.length === 0 ? (
              <EmptyState
                icon={History}
                title="No transfer history"
                description="You haven't transferred any receipt tokens yet"
              />
            ) : (
              mockTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="bg-surface-elevated border border-border-subtle rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{transfer.fromChain.icon}</span>
                      <ArrowDownUp className="w-4 h-4 text-text-tertiary" />
                      <span className="text-xl">{transfer.toChain.icon}</span>
                      <div>
                        <div className="font-semibold text-foreground">{transfer.amount}</div>
                        <div className="text-sm text-text-secondary">
                          {transfer.fromChain.name} → {transfer.toChain.name}
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        transfer.status === "confirmed" && "text-success",
                        transfer.status === "pending" && "text-warning",
                        transfer.status === "failed" && "text-destructive"
                      )}
                    >
                      {transfer.status === "confirmed" && <Check className="w-4 h-4" />}
                      {transfer.status === "pending" && <Clock className="w-4 h-4" />}
                      {transfer.status === "failed" && <AlertCircle className="w-4 h-4" />}
                      {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {new Date(transfer.timestamp).toLocaleString()}
                    </span>
                    <a
                      href={`https://layerzeroscan.com/tx/${transfer.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      View on LayerZero Scan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Learn More Link */}
        <div className="mt-8 text-center">
          <a
            href="https://layerzero.network/oft"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center justify-center gap-1"
          >
            Learn more about LayerZero OFT
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
