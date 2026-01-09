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
        "min-h-[calc(100vh-80px)]",
        className
      )}
    >
      {/* Left Sidebar - Fixed, 280px, desktop only (≥1024px) */}
      {leftSidebar && (
        <aside
          className={cn(
            "hidden lg:fixed lg:left-0 lg:top-20 lg:block w-[280px]",
            "h-[calc(100vh-80px)] overflow-y-auto scrollbar-hidden",
            "border-r border-[var(--border-subtle)] p-6 bg-background"
          )}
        >
          {leftSidebar}
        </aside>
      )}

      {/* Main Content - Centered with margins for fixed sidebars */}
      <main
        className={cn(
          "min-w-0",
          "px-6 py-6 pt-24",
          "lg:ml-[296px] md:mr-[356px]",
          "max-w-xl mx-auto"
        )}
      >
        {children}
      </main>

      {/* Right Sidebar - Fixed, 340px, tablet+ (≥768px) */}
      {rightSidebar && (
        <aside
          className={cn(
            "hidden md:fixed md:right-0 md:top-20 md:block w-[340px]",
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
