"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import type { OAuthProvider, ConnectedAccount } from "./schemas";

/**
 * Provider Icons (inline SVG)
 */
const providerIcons: Record<OAuthProvider, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#5865F2" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
};

/**
 * Provider display names and colors
 */
const providerConfig: Record<OAuthProvider, { name: string; color: string }> = {
  google: { name: "Google", color: "#4285F4" },
  apple: { name: "Apple", color: "#000000" },
  twitter: { name: "X (Twitter)", color: "#000000" },
  discord: { name: "Discord", color: "#5865F2" },
  github: { name: "GitHub", color: "#181717" },
};

/**
 * Inline SVG Icons
 */
const icons = {
  link: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export interface ConnectedAccountsSectionProps {
  /** List of connected accounts */
  accounts: ConnectedAccount[];
  /** Handler for connecting an account */
  onConnect: (provider: OAuthProvider) => Promise<void>;
  /** Handler for disconnecting an account */
  onDisconnect: (provider: OAuthProvider) => Promise<void>;
  /** Additional className */
  className?: string;
}

/**
 * ConnectedAccountsSection - OAuth connections management
 *
 * Features:
 * - Lists all OAuth providers (Google, Apple, Twitter, Discord, GitHub)
 * - Shows connected/not connected status
 * - Connect/disconnect buttons
 * - Primary account indicator
 * - Loading states during actions
 *
 * Based on PHASE2_UX_SPECS.md Section 3.5
 */
export function ConnectedAccountsSection({
  accounts,
  onConnect,
  onDisconnect,
  className,
}: ConnectedAccountsSectionProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get all providers with their connection status
  const allProviders: OAuthProvider[] = ["google", "apple", "twitter", "discord", "github"];

  const getAccountForProvider = (provider: OAuthProvider): ConnectedAccount | undefined => {
    return accounts.find((a) => a.provider === provider);
  };

  // Count connected accounts to prevent disconnecting the last one
  const connectedCount = accounts.filter((a) => a.connected).length;

  const handleAction = async (provider: OAuthProvider, isConnected: boolean) => {
    setError(null);
    setLoadingProvider(provider);

    try {
      if (isConnected) {
        // Check if this is the last auth method
        if (connectedCount <= 1) {
          setError("You must have at least one login method connected.");
          return;
        }
        await onDisconnect(provider);
      } else {
        await onConnect(provider);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(message);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <section
      className={cn(
        "p-6 rounded-2xl border border-white/10 bg-surface-sunken/30",
        className
      )}
      aria-labelledby="connected-accounts-title"
    >
      {/* Section header */}
      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/10">
        <span className="text-text-tertiary">{icons.link}</span>
        <div className="flex flex-col">
          <h3
            id="connected-accounts-title"
            className="text-sm font-medium text-text-secondary"
          >
            Connected Accounts
          </h3>
          <p className="text-xs text-text-tertiary">
            Link accounts for easier sign-in
          </p>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
          >
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {allProviders.map((provider) => {
          const account = getAccountForProvider(provider);
          const isConnected = account?.connected ?? false;
          const isLoading = loadingProvider === provider;
          const config = providerConfig[provider];

          return (
            <div
              key={provider}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "border transition-all duration-200",
                isConnected
                  ? "border-white/20 bg-surface-sunken/50"
                  : "border-white/10 bg-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Provider icon */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    isConnected ? "bg-white/10" : "bg-surface-sunken opacity-50"
                  )}
                >
                  {providerIcons[provider]}
                </div>

                {/* Provider info */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {config.name}
                  </span>
                  {isConnected && account?.email && (
                    <span className="text-xs text-text-tertiary truncate max-w-[120px]">
                      {account.email}
                    </span>
                  )}
                  {isConnected && account?.isPrimary && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      {icons.check}
                      Primary
                    </span>
                  )}
                </div>
              </div>

              {/* Action button */}
              <Button
                type="button"
                variant={isConnected ? "outline" : "primary"}
                size="sm"
                onClick={() => handleAction(provider, isConnected)}
                disabled={isLoading}
                className={cn(
                  "min-w-[100px]",
                  isConnected && "text-text-secondary hover:text-foreground"
                )}
              >
                {isLoading ? (
                  <Spinner size="sm" color={isConnected ? "primary" : "white"} />
                ) : isConnected ? (
                  "Disconnect"
                ) : (
                  "Connect"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ConnectedAccountsSection;
