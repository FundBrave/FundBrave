"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  History,
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { formatEther } from "viem";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number;
  change24h: number;
  address: string;
  logo?: string;
}

interface NFTHolding {
  id: string;
  name: string;
  collection: string;
  image: string;
  tokenId: string;
  contractAddress: string;
}

// Mock token balances - Replace with actual blockchain queries
const mockTokens: TokenBalance[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    balance: "2.5834",
    usdValue: 5166.80,
    change24h: 2.5,
    address: "0x0000000000000000000000000000000000000000",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    balance: "15,420.00",
    usdValue: 15420.00,
    change24h: 0.01,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  {
    symbol: "FBT",
    name: "FundBrave Token",
    balance: "12,500",
    usdValue: 1875.00,
    change24h: 8.3,
    address: "0x1234567890123456789012345678901234567890",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    balance: "0.8543",
    usdValue: 1708.60,
    change24h: 2.5,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
];

// Mock NFT holdings - Replace with actual NFT queries
const mockNFTs: NFTHolding[] = [
  {
    id: "nft-1",
    name: "Impact Badge #234",
    collection: "FundBrave Impact Badges",
    image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=300&fit=crop",
    tokenId: "234",
    contractAddress: "0xabc1234567890abcdef1234567890abcdef12345",
  },
  {
    id: "nft-2",
    name: "Donor NFT #1521",
    collection: "FundBrave Donor Collection",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=300&fit=crop",
    tokenId: "1521",
    contractAddress: "0xdef1234567890abcdef1234567890abcdef12345",
  },
];

export default function WalletPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [activeTab, setActiveTab] = useState<"tokens" | "nfts">("tokens");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Calculate total portfolio value
  const totalValue = useMemo(() => {
    return mockTokens.reduce((sum, token) => sum + token.usdValue, 0);
  }, []);

  // Calculate 24h change
  const portfolioChange24h = useMemo(() => {
    const weightedChange = mockTokens.reduce((sum, token) => {
      const weight = token.usdValue / totalValue;
      return sum + token.change24h * weight;
    }, 0);
    return weightedChange;
  }, [totalValue]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Wallet className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to view your portfolio
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Wallet</h1>
          <p className="text-text-secondary">Manage your digital assets and portfolio</p>
        </div>

        {/* Wallet Address Card */}
        <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-sm text-foreground/80 mb-1">Wallet Address</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-semibold text-foreground">
                    {formatAddress(address)}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-surface-overlay rounded transition-colors"
                    title="Copy address"
                  >
                    <Copy className={cn("w-4 h-4", copiedAddress ? "text-success" : "text-text-tertiary")} />
                  </button>
                  <a
                    href={`https://etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-surface-overlay rounded transition-colors"
                    title="View on Etherscan"
                  >
                    <ExternalLink className="w-4 h-4 text-text-tertiary" />
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-surface-overlay rounded-lg transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-5 h-5 text-text-tertiary", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Portfolio Value Card */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm text-text-tertiary mb-2">Total Portfolio Value</div>
              <div className="text-4xl font-bold text-foreground mb-2">
                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2">
                {portfolioChange24h >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-success" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4 text-error" />
                )}
                <span className={cn("text-sm font-medium", portfolioChange24h >= 0 ? "text-success" : "text-error")}>
                  {portfolioChange24h >= 0 ? "+" : ""}
                  {portfolioChange24h.toFixed(2)}% (24h)
                </span>
              </div>
            </div>
            <TrendingUp className="w-12 h-12 text-primary" />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/campaigns")}
              className="w-full"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Donate
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/wallet/transactions")}
              className="w-full"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl overflow-hidden mb-8">
          <div className="border-b border-border-subtle">
            <div className="flex">
              <button
                onClick={() => setActiveTab("tokens")}
                className={cn(
                  "flex-1 px-6 py-4 text-sm font-medium transition-colors",
                  activeTab === "tokens"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-text-secondary hover:text-foreground hover:bg-surface-overlay"
                )}
              >
                Tokens ({mockTokens.length})
              </button>
              <button
                onClick={() => setActiveTab("nfts")}
                className={cn(
                  "flex-1 px-6 py-4 text-sm font-medium transition-colors",
                  activeTab === "nfts"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-text-secondary hover:text-foreground hover:bg-surface-overlay"
                )}
              >
                NFTs ({mockNFTs.length})
              </button>
            </div>
          </div>

          {/* Tokens Tab */}
          {activeTab === "tokens" && (
            <div className="divide-y divide-border-subtle">
              {mockTokens.map((token) => (
                <div
                  key={token.symbol}
                  className="p-4 hover:bg-surface-overlay transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold">
                        {token.symbol[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{token.symbol}</div>
                        <div className="text-sm text-text-tertiary">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{token.balance}</div>
                      <div className="text-sm text-text-secondary">
                        ${token.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div
                        className={cn(
                          "text-xs font-medium flex items-center justify-end gap-1",
                          token.change24h >= 0 ? "text-success" : "text-error"
                        )}
                      >
                        {token.change24h >= 0 ? "+" : ""}
                        {token.change24h}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NFTs Tab */}
          {activeTab === "nfts" && (
            <div>
              {mockNFTs.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-text-tertiary mb-2">No NFTs found</div>
                  <div className="text-sm text-text-secondary">Your NFT collection will appear here</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                  {mockNFTs.map((nft) => (
                    <div
                      key={nft.id}
                      className="bg-surface-sunken rounded-xl overflow-hidden border border-border-subtle hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-3">
                        <div className="font-semibold text-foreground text-sm mb-1">{nft.name}</div>
                        <div className="text-xs text-text-tertiary">{nft.collection}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
