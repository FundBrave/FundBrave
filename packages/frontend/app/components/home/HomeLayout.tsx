"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * HomeLayout - Responsive 3-column layout for home page
 * Twitter-style fixed sidebars with hidden scrollbars
 *
 * Breakpoints:
 * - Mobile (<768px): Single column
 * - Tablet (768-1024px): Single column
 * - Desktop (1024-1280px): Left sidebar + main
 * - Large Desktop (>1280px): Full 3-column
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
      {/* Left Sidebar - Fixed, 280px, hidden < lg (1024px) */}
      {leftSidebar && (
        <aside
          className={cn(
            "hidden lg:fixed lg:left-0 lg:top-20 lg:block w-[280px]",
            "h-[calc(100vh-80px)] overflow-y-auto scrollbar-hidden",
            "border-r border-white/5 p-4 bg-neutral-dark-500"
          )}
        >
          {leftSidebar}
        </aside>
      )}

      {/* Main Content - Centered with margins for fixed sidebars */}
      <main
        className={cn(
          "min-w-0",
          "px-4 py-4 pt-20",
          "lg:ml-[280px] xl:mr-[340px]",
          "max-w-xl mx-auto"
        )}
      >
        {children}
      </main>

      {/* Right Sidebar - Fixed, 340px, hidden < xl (1280px) */}
      {rightSidebar && (
        <aside
          className={cn(
            "hidden xl:fixed xl:right-0 xl:top-20 xl:block w-[340px]",
            "h-[calc(100vh-80px)] overflow-y-auto scrollbar-hidden",
            "border-l border-white/5 p-4 bg-neutral-dark-500"
          )}
        >
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}

export default HomeLayout;
