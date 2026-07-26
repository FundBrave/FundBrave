"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";

interface AuthGuardProps {
  children: ReactNode;
  /** When true, users without a username are redirected to /onboarding. */
  requireOnboarded?: boolean;
}

/**
 * Client-side guard for authed pages.
 *
 * - unauthenticated  → /auth/login
 * - not_whitelisted  → /request-access
 * - needsOnboarding  → /onboarding (only when requireOnboarded)
 * - error            → inline retry state
 */
export function AuthGuard({
  children,
  requireOnboarded = false,
}: AuthGuardProps) {
  const router = useRouter();
  const { status, needsOnboarding, refetch } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    } else if (status === "not_whitelisted") {
      router.replace("/request-access");
    } else if (
      status === "authenticated" &&
      requireOnboarded &&
      needsOnboarding
    ) {
      router.replace("/onboarding");
    }
  }, [status, needsOnboarding, requireOnboarded, router]);

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="max-w-sm text-text-secondary">
          We could not load your account. The API may be unavailable or still
          starting up.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (status !== "authenticated" || (requireOnboarded && needsOnboarding)) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="Loading your account"
      >
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
