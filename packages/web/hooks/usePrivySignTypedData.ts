"use client";

/**
 * Sign a Safe EIP-712 transaction with the user's Privy embedded wallet.
 *
 * We go through the embedded wallet's EIP-1193 provider and call
 * `eth_signTypedData_v4` directly. This is stable across Privy SDK versions
 * and guarantees we sign with the embedded wallet (walletClientType 'privy')
 * — the same address the API registered as a Safe owner.
 *
 * The API sends SafeTypedData WITHOUT the EIP712Domain type entry; we add it
 * here because eth_signTypedData_v4 requires the full types map.
 */

import { useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";
import { isPrivyConfigured } from "@/lib/privy-config";
import type { SafeTypedData } from "@/lib/withdrawals";

export class SigningError extends Error {}

function buildV4Payload(typedData: SafeTypedData) {
  return {
    domain: {
      chainId: typedData.domain.chainId,
      verifyingContract: typedData.domain.verifyingContract,
    },
    types: {
      EIP712Domain: [
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      SafeTx: typedData.types.SafeTx,
    },
    primaryType: "SafeTx",
    message: typedData.message,
  };
}

export interface PrivySigner {
  /** Sign the SafeTx typed data with the embedded wallet. Returns 0x signature. */
  signSafeTx: (typedData: SafeTypedData) => Promise<string>;
  /** The embedded wallet address, or null if not ready. */
  address: string | null;
  ready: boolean;
}

/** Real implementation — mounted only when PrivyProvider is present. */
function usePrivySignerReal(): PrivySigner {
  const { wallets, ready } = useWallets();

  const embedded = wallets.find((w) => w.walletClientType === "privy") ?? null;

  const signSafeTx = useCallback(
    async (typedData: SafeTypedData): Promise<string> => {
      if (!embedded) {
        throw new SigningError(
          "Your embedded wallet isn't ready yet. Please try again in a moment."
        );
      }
      const provider = await embedded.getEthereumProvider();
      const payload = buildV4Payload(typedData);
      const signature = (await provider.request({
        method: "eth_signTypedData_v4",
        params: [embedded.address, JSON.stringify(payload)],
      })) as string;
      if (typeof signature !== "string" || !signature.startsWith("0x")) {
        throw new SigningError("Wallet returned an invalid signature");
      }
      return signature;
    },
    [embedded]
  );

  return { signSafeTx, address: embedded?.address ?? null, ready };
}

/** Degraded mode — Privy not configured. */
function usePrivySignerDegraded(): PrivySigner {
  const signSafeTx = useCallback(async (): Promise<string> => {
    throw new SigningError(
      "Signing is unavailable: NEXT_PUBLIC_PRIVY_APP_ID is not configured."
    );
  }, []);
  return { signSafeTx, address: null, ready: true };
}

export function usePrivySignTypedData(): PrivySigner {
  /* eslint-disable react-hooks/rules-of-hooks */
  return isPrivyConfigured ? usePrivySignerReal() : usePrivySignerDegraded();
  /* eslint-enable react-hooks/rules-of-hooks */
}
