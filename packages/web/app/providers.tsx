"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "wagmi";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ToastProvider } from "@/components/ui/Toast";
import { isPrivyConfigured, privyAppId } from "@/lib/privy-config";
import { wagmiConfig } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Wallet layer (wagmi + RainbowKit) mounts only when a WalletConnect
  // project ID is configured. wagmi v3 uses TanStack Query internally, so
  // WagmiProvider must sit BELOW the (shared) QueryClientProvider.
  const withWallet = wagmiConfig ? (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider theme={darkTheme()}>
        <ToastProvider>{children}</ToastProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  ) : (
    <ToastProvider>{children}</ToastProvider>
  );

  const inner = (
    <QueryClientProvider client={queryClient}>{withWallet}</QueryClientProvider>
  );

  // Degraded mode: no Privy app ID configured — skip PrivyProvider entirely.
  // useAuth() detects this via lib/privy-config and reports 'unauthenticated'.
  if (!isPrivyConfigured || privyAppId === null) {
    return inner;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["email", "google"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        appearance: { theme: "dark" },
      }}
    >
      {inner}
    </PrivyProvider>
  );
}
