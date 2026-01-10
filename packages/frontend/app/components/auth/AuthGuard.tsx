"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "@/lib/api/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side authentication guard component
 * Security updates:
 * - Checks authentication via backend API (validates HttpOnly cookies)
 * - No longer relies on localStorage tokens
 * - Redirects unauthenticated users to login page
 */
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check authentication via backend API
        // This validates the HttpOnly cookie tokens
        const user = await authApi.checkAuth();

        if (!user) {
          setIsAuthenticated(false);
          // Redirect to auth page with return URL
          router.push(`/auth?returnUrl=${encodeURIComponent(pathname)}`);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        router.push(`/auth?returnUrl=${encodeURIComponent(pathname)}`);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
