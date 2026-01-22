"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
            <div className="relative bg-surface-elevated border border-border-subtle rounded-full p-6">
              <AlertCircle className="w-16 h-16 text-destructive" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-text-secondary">
            We encountered an unexpected error. This has been logged and we'll look into it.
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-text-tertiary hover:text-foreground">
                Error details (dev only)
              </summary>
              <div className="mt-2 p-4 bg-surface-sunken rounded-lg">
                <p className="text-xs font-mono text-destructive break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs font-mono text-text-tertiary mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go home
          </Button>
        </div>

        {/* Additional Help */}
        <p className="text-sm text-text-tertiary">
          If this problem persists, please{" "}
          <a
            href="/help"
            className="text-primary hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
