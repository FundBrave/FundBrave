"use client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Auth logic removed; simply renders children without guarding.
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
