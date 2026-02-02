"use client";

import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";

interface StakingActionButtonsProps {
  activeTab: "stake" | "unstake";
  isConnected: boolean;
  amount: string;
  needsApproval: boolean;
  isProcessing: boolean;
  onConnectWallet: () => void;
  onApprove: () => void;
  onStake: () => void;
  onUnstake: () => void;
}

/**
 * StakingActionButtons - Action buttons for staking operations
 * Handles connect wallet, approve, stake, and unstake actions
 */
export default function StakingActionButtons({
  activeTab,
  isConnected,
  amount,
  needsApproval,
  isProcessing,
  onConnectWallet,
  onApprove,
  onStake,
  onUnstake,
}: StakingActionButtonsProps) {
  // Not connected
  if (!isConnected) {
    return (
      <Button fullWidth size="lg" onClick={onConnectWallet}>
        Connect Wallet to Stake
      </Button>
    );
  }

  // Stake flow
  if (activeTab === "stake") {
    return (
      <div className="space-y-3">
        {needsApproval && (
          <Button
            fullWidth
            size="lg"
            onClick={onApprove}
            disabled={!amount || isProcessing}
            variant="secondary"
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Approving USDC...</span>
              </>
            ) : (
              "1. Approve USDC"
            )}
          </Button>
        )}
        <Button
          fullWidth
          size="lg"
          onClick={onStake}
          disabled={!amount || needsApproval || isProcessing}
        >
          {isProcessing ? (
            <>
              <Spinner size="sm" color="white" />
              <span>Staking...</span>
            </>
          ) : needsApproval ? (
            "2. Stake USDC"
          ) : (
            "Stake USDC"
          )}
        </Button>
      </div>
    );
  }

  // Unstake flow
  return (
    <Button
      fullWidth
      size="lg"
      onClick={onUnstake}
      disabled={!amount || isProcessing}
      variant="secondary"
    >
      {isProcessing ? (
        <>
          <Spinner size="sm" color="white" />
          <span>Unstaking...</span>
        </>
      ) : (
        "Unstake & Claim Yield"
      )}
    </Button>
  );
}
