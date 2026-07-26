"use client";

/**
 * Admin co-signature control (wagmi). Only mounted when the wallet layer is
 * configured (WagmiProvider present). The admin signs the SAME SafeTx typed
 * data the creator signed, with their own connected wallet; the API then
 * deploys (if needed) and executes on-chain.
 */

import { useAccount, useSignTypedData, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import type { SafeTypedData } from "@/lib/withdrawals";
import { useAdminSign } from "@/hooks/useWithdrawals";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";

/** Convert the API's string-valued typed data to wagmi/viem typed values. */
function toSignArgs(td: SafeTypedData) {
  const m = td.message;
  return {
    domain: {
      chainId: td.domain.chainId,
      verifyingContract: td.domain.verifyingContract as `0x${string}`,
    },
    types: { SafeTx: td.types.SafeTx },
    primaryType: "SafeTx" as const,
    message: {
      to: m.to as `0x${string}`,
      value: BigInt(m.value),
      data: m.data as `0x${string}`,
      operation: Number(m.operation),
      safeTxGas: BigInt(m.safeTxGas),
      baseGas: BigInt(m.baseGas),
      gasPrice: BigInt(m.gasPrice),
      gasToken: m.gasToken as `0x${string}`,
      refundReceiver: m.refundReceiver as `0x${string}`,
      nonce: BigInt(m.nonce),
    },
  };
}

export function AdminApproveControls({
  id,
  typedData,
}: {
  id: string;
  typedData: SafeTypedData;
}) {
  const { isConnected, chain } = useAccount();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { signTypedDataAsync, isPending: signing } = useSignTypedData();
  const adminSign = useAdminSign();
  const { showToast } = useToast();

  const targetChainId = typedData.domain.chainId;
  const wrongChain = isConnected && chain?.id !== targetChainId;

  const approve = async () => {
    try {
      if (wrongChain) {
        await switchChainAsync({ chainId: targetChainId });
      }
      const signature = await signTypedDataAsync(toSignArgs(typedData));
      await adminSign.mutateAsync({ id, signature });
      showToast("Approved — executing on-chain", "success", 6000);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error && /rejected|denied/i.test(err.message)
            ? "Signature request was rejected"
            : "Approval failed";
      showToast(msg, "error", 7000);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-text-tertiary">
          Connect the admin wallet to co-sign.
        </p>
        <div className={cn("[&_button]:!h-11")}>
          <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
        </div>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={approve}
      loading={switching || signing || adminSign.isPending}
      loadingText={switching ? "Switching…" : signing ? "Signing…" : "Approving…"}
      className="self-start"
    >
      {wrongChain ? "Switch network & approve" : "Approve & co-sign"}
    </Button>
  );
}

export default AdminApproveControls;
