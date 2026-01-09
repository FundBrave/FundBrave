"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * HomeLayout - Responsive 3-column layout for home page
 * Twitter-style fixed sidebars with hidden scrollbars
 *
 * Breakpoints:
 * - Mobile (<768px): Single column, no sidebars
 * - Tablet (768-1023px): Main + right sidebar only
 * - Desktop (≥1024px): Full 3-column layout
 */

interface HomeLayoutProps {
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function HomeLayout({
  leftSidebar,
  rightSidebar,
  children,
  className,
}: HomeLayoutProps) {
  return (
    <div
      className={cn(
        "relative min-h-[calc(100vh-80px)] w-full flex",
        className
      )}
    >
      {/* Left Sidebar - Sticky, 280px, desktop only (≥1024px) */}
      {leftSidebar && (
        <aside
          className={cn(
            "hidden lg:block lg:sticky lg:top-20 w-[280px] shrink-0",
            "h-[calc(100vh-80px)] overflow-y-auto scrollbar-hidden",
            "border-r border-[var(--border-subtle)] p-6 bg-background"
          )}
        >
          {leftSidebar}
        </aside>
      )}

      {/* Main Content - Flexible center column */}
      <main
        className={cn(
          "flex-1 min-w-0",
          "md:px-6 md:py-6 md:pt-24 px-2 py-2 pt-12",
          "overflow-x-hidden"
        )}
      >
        {children}
      </main>

      {/* Right Sidebar - Sticky, 340px, tablet+ (≥768px) */}
      {rightSidebar && (
        <aside
          className={cn(
            "hidden md:block md:sticky md:top-20 w-[340px] shrink-0",
            "h-[calc(100vh-80px)] overflow-y-auto scrollbar-hidden",
            "border-l border-[var(--border-subtle)] p-6 bg-background"
          )}
        >
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}

export default HomeLayout;