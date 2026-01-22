"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Navbar } from "@/app/components/common";

export default function StakingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Staking section error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
            <div className="relative bg-surface-elevated border border-border-subtle rounded-full p-6">
              <AlertCircle className="w-16 h-16 text-destructive" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Staking Error
        </h1>
        <p className="text-text-secondary mb-8">
          We couldn't load the staking data. This might be a blockchain connectivity issue.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <details className="mb-8 text-left bg-surface-elevated border border-border-subtle rounded-lg p-4">
            <summary className="cursor-pointer text-sm text-text-tertiary hover:text-foreground mb-2">
              Error details (dev only)
            </summary>
            <p className="text-xs font-mono text-destructive break-all">
              {error.message}
            </p>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/staking"}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Staking dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
