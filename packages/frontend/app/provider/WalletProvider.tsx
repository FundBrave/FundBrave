'use client';

import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, base, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// Configure supported chains
const chains = [mainnet, sepolia, base, baseSepolia] as const;

// Create wagmi config
const config = getDefaultConfig({
  appName: 'FundBrave',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains,
  ssr: false, // Disable SSR to prevent indexedDB errors
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface WalletProviderProps {
  children: React.ReactNode;
}

/**
 * Web3 Provider Component
 * Wraps the app with RainbowKit and wagmi providers for wallet connectivity
 */
export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#8B5CF6', // Purple-500 to match app theme
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
