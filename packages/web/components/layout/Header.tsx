"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { Plus } from "@/components/ui/icons";

export function Header() {
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: logo + primary nav */}
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            aria-label="FundBrave home"
          >
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-purple-500)_50%,var(--color-soft-purple-500)_100%)] bg-clip-text text-transparent">
                FundBrave
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/campaigns"
              className="rounded-md text-sm font-medium text-text-secondary transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              Campaigns
            </Link>
            {status === "authenticated" && user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-md text-sm font-medium text-text-secondary transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right: auth state */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link
              href={
                status === "authenticated" ? "/campaigns/create" : "/auth/login"
              }
              aria-label="Start a campaign"
            >
              <Plus size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Start a campaign</span>
            </Link>
          </Button>
          {status === "loading" ? (
            <Spinner size="sm" color="primary" />
          ) : status === "authenticated" && user ? (
            <>
              <Link
                href="/dashboard"
                className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-2 transition-colors hover:bg-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] sm:pr-3"
                aria-label="Open your dashboard"
              >
                <Avatar
                  src={user.avatarUrl ?? undefined}
                  alt={user.displayName || user.username || user.email}
                  size="sm"
                />
                <span className="hidden max-w-[140px] truncate text-sm text-foreground sm:inline">
                  {user.username ? `@${user.username}` : user.email}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                loading={loggingOut}
                loadingText="..."
              >
                Log out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
