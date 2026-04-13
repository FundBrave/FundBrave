"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * HomeLayout - Responsive 3-column layout for home page
 * Twitter-style fixed sidebars with hidden scrollbars
 *
 * Navbar is fixed: h-16 (64px) on mobile, h-20 (80px) on desktop.
 * Sidebars stick below the navbar. Center feed is capped at 680px
 * for optimal reading width.
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
        "relative min-h-screen w-full flex",
        className
      )}
    >
      {/* Left Sidebar - Sticky, 280px, desktop only (≥1024px) */}
      {leftSidebar && (
        <aside
          className={cn(
            "hidden lg:block lg:sticky lg:top-20 w-[280px] shrink-0",
            "h-[calc(100vh-80px)] overflow-y-auto scrollbar-hidden",
            "border-r border-border-subtle p-6 bg-background"
          )}
        >
          {leftSidebar}
        </aside>
      )}

      {/* Main Content - Capped width center column */}
      <main
        className={cn(
          "flex-1 min-w-0 mx-auto w-full max-w-[680px]",
          "px-4 pb-4 pt-20",
          "md:px-6 md:pb-6 md:pt-24",
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
            "border-l border-border-subtle p-6 bg-background"
          )}
        >
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}

export default HomeLayout;