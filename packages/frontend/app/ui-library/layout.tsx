"use client";

import { useState, useEffect, useCallback } from "react";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, Search, Command } from "lucide-react";
import { ThemeToggle } from "@/app/components/theme/theme-toggle";
import { Sidebar } from "./_components/Sidebar";
import { ComponentSearch } from "./_components/ComponentSearch";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export default function UILibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dev-only guard — returns 404 in production
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // ---- Keyboard shortcut: Cmd+K / Ctrl+K to open search ----
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Close sidebar when navigating (detected by children change is handled
  // within the Sidebar via the onClose prop on each Link)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area (offset by sidebar width on desktop) */}
      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        {/* Header bar */}
        <header
          className={cn(
            "sticky top-0 z-[var(--z-sticky)] flex items-center gap-3",
            "h-14 px-4 lg:px-6",
            "bg-background/80 backdrop-blur-md border-b border-white/10"
          )}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "lg:hidden p-2 -ml-2 rounded-lg",
              "text-text-secondary hover:text-text-primary hover:bg-white/5",
              "transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Title */}
          <h1 className="text-sm font-semibold text-text-primary tracking-tight select-none">
            UI Library
          </h1>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search trigger button */}
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "border border-white/10 bg-white/[0.03]",
              "text-text-tertiary text-sm",
              "hover:border-white/20 hover:bg-white/[0.06] hover:text-text-secondary",
              "transition-all duration-[var(--duration-fast)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            aria-label="Search components (Cmd+K)"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Search...</span>
            <kbd
              className={cn(
                "hidden sm:inline-flex items-center gap-0.5",
                "ml-2 px-1.5 py-0.5 rounded border border-white/10",
                "bg-white/5 text-[10px] font-mono text-text-tertiary"
              )}
            >
              <Command className="h-2.5 w-2.5" aria-hidden="true" />K
            </kbd>
          </button>

          {/* Theme toggle */}
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-5xl w-full mx-auto"
        >
          {children}
        </main>
      </div>

      {/* Search modal (rendered at layout level) */}
      <ComponentSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
