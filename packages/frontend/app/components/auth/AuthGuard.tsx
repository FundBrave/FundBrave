"use client";
import React from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean; // If true, requires authentication (for protected pages)
  redirectTo?: string; // Where to redirect if auth requirement not met
}

export default function AuthGuard({ children }: AuthGuardProps) {
  // Auth logic removed; render children without redirects or checks.
  return <>{children}</>;
}
