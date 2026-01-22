"use client";

import { useMemo, useState } from "react";
import { useGasPrice, useEstimateGas } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { Zap, Clock, Leaf, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/app/components/ui/Spinner";

export interface GasEstimateProps {
  /** Transaction parameters for gas estimation */
  transaction?: {
    to: `0x${string}`;
    data?: `0x${string}`;
    value?: bigint;
  };
  /** ETH to USD conversion rate */
  ethUsdPrice?: number;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when gas option is selected */
  onGasOptionSelect?: (option: GasOption) => void;
}

export interface GasOption {
  name: string;
  speed: "slow" | "standard" | "fast";
  gasPrice: bigint;
  estimatedTime: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

/**
 * Gas Estimate Component
 *
 * Displays gas price estimates with multiple speed options.
 * Shows total transaction cost in ETH and USD.
 * Provides gas optimization tips.
 */
export function GasEstimate({
  transaction,
  ethUsdPrice = 2000,
  showDetails = true,
  className,
  onGasOptionSelect,
}: GasEstimateProps) {
  const [selectedOption, setSelectedOption] = useState<"slow" | "standard" | "fast">("standard");

  // Fetch current gas price
  const { data: gasPrice, isLoading: gasPriceLoading } = useGasPrice();

  // Estimate gas for the transaction
  const { data: gasEstimate, isLoading: gasEstimateLoading } = useEstimateGas(
    transaction
      ? {
          to: transaction.to,
          data: transaction.data,
          value: transaction.value,
        }
      : undefined
  );

  // Calculate gas options (slow, standard, fast)
  const gasOptions = useMemo<GasOption[]>(() => {
    if (!gasPrice) return [];

    const basePrice = gasPrice;

    return [
      {
        name: "Slow",
        speed: "slow",
        gasPrice: (basePrice * BigInt(80)) / BigInt(100), // 80% of base
        estimatedTime: "~5 min",
        icon: <Leaf className="w-4 h-4" />,
        description: "Lower cost, longer wait",
        color: "text-green-500",
      },
      {
        name: "Standard",
        speed: "standard",
        gasPrice: basePrice,
        estimatedTime: "~2 min",
        icon: <Clock className="w-4 h-4" />,
        description: "Balanced cost and speed",
        color: "text-blue-500",
      },
      {
        name: "Fast",
        speed: "fast",
        gasPrice: (basePrice * BigInt(130)) / BigInt(100), // 130% of base
        estimatedTime: "~30 sec",
        icon: <Zap className="w-4 h-4" />,
        description: "Higher cost, faster confirmation",
        color: "text-orange-500",
      },
    ];
  }, [gasPrice]);

  // Calculate total costs for selected option
  const costs = useMemo(() => {
    const option = gasOptions.find((o) => o.speed === selectedOption);
    if (!option || !gasEstimate) {
      return {
        gasInEth: "0",
        gasInUsd: "0",
        totalInEth: "0",
        totalInUsd: "0",
      };
    }

    const gasInWei = option.gasPrice * gasEstimate;
    const gasInEth = formatUnits(gasInWei, 18);
    const gasInUsd = (parseFloat(gasInEth) * ethUsdPrice).toFixed(2);

    const transactionValue = transaction?.value || BigInt(0);
    const totalInWei = gasInWei + transactionValue;
    const totalInEth = formatUnits(totalInWei, 18);
    const totalInUsd = (parseFloat(totalInEth) * ethUsdPrice).toFixed(2);

    return {
      gasInEth,
      gasInUsd,
      totalInEth,
      totalInUsd,
    };
  }, [gasOptions, selectedOption, gasEstimate, ethUsdPrice, transaction?.value]);

  // Handle option selection
  const handleOptionSelect = (option: GasOption) => {
    setSelectedOption(option.speed);
    onGasOptionSelect?.(option);
  };

  // Loading state
  if (gasPriceLoading || gasEstimateLoading) {
    return (
      <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6", className)}>
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm text-text-secondary">Estimating gas costs...</span>
        </div>
      </div>
    );
  }

  // Error state - no gas price available
  if (!gasPrice || gasOptions.length === 0) {
    return (
      <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6", className)}>
        <div className="flex items-center gap-3 text-error">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Unable to estimate gas</p>
            <p className="text-xs text-text-tertiary mt-1">
              Please check your network connection and try again
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-surface-elevated border border-border-subtle rounded-xl p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Gas Estimate
        </h3>
        {gasEstimate && (
          <span className="text-xs text-text-tertiary">
            {gasEstimate.toLocaleString()} gas units
          </span>
        )}
      </div>

      {/* Gas Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {gasOptions.map((option) => {
          const isSelected = selectedOption === option.speed;
          const gasCost = gasEstimate
            ? formatUnits(option.gasPrice * gasEstimate, 18)
            : "0";

          return (
            <button
              key={option.speed}
              onClick={() => handleOptionSelect(option)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all text-left",
                "hover:border-primary/50 hover:bg-surface-overlay",
                isSelected
                  ? "border-primary bg-surface-overlay"
                  : "border-border-subtle bg-surface-sunken"
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}

              <div className="flex items-center gap-2 mb-2">
                <div className={cn("flex-shrink-0", option.color)}>{option.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-foreground">{option.name}</div>
                  <div className="text-[10px] text-text-tertiary">{option.estimatedTime}</div>
                </div>
              </div>

              <div className="text-xs font-medium text-foreground mb-1">
                {parseFloat(gasCost).toFixed(5)} ETH
              </div>
              <div className="text-[10px] text-text-secondary">
                ~${(parseFloat(gasCost) * ethUsdPrice).toFixed(2)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Cost Summary */}
      {showDetails && (
        <div className="space-y-3">
          <div className="p-4 bg-surface-sunken rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Gas fee:</span>
                <div className="text-right">
                  <div className="font-medium text-foreground">{parseFloat(costs.gasInEth).toFixed(5)} ETH</div>
                  <div className="text-xs text-text-tertiary">${costs.gasInUsd}</div>
                </div>
              </div>

              {transaction?.value && transaction.value > BigInt(0) && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Transaction value:</span>
                  <div className="text-right">
                    <div className="font-medium text-foreground">
                      {formatUnits(transaction.value, 18)} ETH
                    </div>
                    <div className="text-xs text-text-tertiary">
                      ${(parseFloat(formatUnits(transaction.value, 18)) * ethUsdPrice).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
                <span className="font-semibold text-foreground">Total cost:</span>
                <div className="text-right">
                  <div className="font-bold text-lg text-primary">{parseFloat(costs.totalInEth).toFixed(5)} ETH</div>
                  <div className="text-xs text-text-tertiary">${costs.totalInUsd}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Gas Optimization Tips */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-400 mb-1">Gas Optimization Tips</p>
                <ul className="text-[10px] text-text-tertiary space-y-0.5 list-disc list-inside">
                  <li>Use "Slow" speed during off-peak hours to save on fees</li>
                  <li>Combine multiple transactions to reduce total gas costs</li>
                  <li>Monitor gas prices at{" "}
                    <a href="https://etherscan.io/gastracker" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Etherscan Gas Tracker
                    </a>
                  </li>
                  {selectedOption === "fast" && (
                    <li className="text-orange-400">Consider using "Standard" to save ~{((costs.gasInUsd ? parseFloat(costs.gasInUsd) * 0.23 : 0)).toFixed(2)}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GasEstimate;
