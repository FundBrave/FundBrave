"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Shield,
  Bell,
  Lock,
  Moon,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Settings navigation item configuration
 */
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: "/settings/profile",
    label: "Profile",
    icon: User,
    description: "Manage your public profile",
  },
  {
    href: "/settings/account",
    label: "Account",
    icon: Settings,
    description: "Account preferences",
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    icon: Bell,
    description: "Notification preferences",
  },
  {
    href: "/settings/privacy",
    label: "Privacy",
    icon: Lock,
    description: "Privacy and data settings",
  },
  {
    href: "/settings/appearance",
    label: "Appearance",
    icon: Moon,
    description: "Theme and display",
  },
  {
    href: "/settings/security",
    label: "Security",
    icon: Shield,
    description: "Password and security",
  },
];

/**
 * SettingsSidebar - Navigation sidebar for settings pages
 * Displays list of setting categories with active state indication
 */
function SettingsSidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              "hover:bg-surface-overlay",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20"
                : "text-text-secondary hover:text-foreground"
            )}
          >
            <Icon
              size={20}
              className={cn(
                "flex-shrink-0 transition-colors",
                isActive ? "text-primary" : "text-text-tertiary"
              )}
            />
            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  "text-sm font-medium truncate",
                  isActive && "text-primary"
                )}
              >
                {item.label}
              </span>
              <span className="text-xs text-text-tertiary truncate hidden lg:block">
                {item.description}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * MobileSettingsHeader - Header with menu toggle for mobile view
 */
function MobileSettingsHeader({
  isDrawerOpen,
  onToggle,
}: {
  isDrawerOpen: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const currentItem = navItems.find((item) => item.href === pathname);

  return (
    <div className="flex items-center gap-3 p-4 border-b border-white/10 md:hidden">
      <button
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-surface-overlay transition-colors"
        aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
      >
        {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="p-2 rounded-lg hover:bg-surface-overlay transition-colors"
          aria-label="Back to home"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">
          {currentItem?.label || "Settings"}
        </h1>
      </div>
    </div>
  );
}

/**
 * MobileDrawer - Slide-out drawer for mobile navigation
 */
function MobileDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-background border-r border-white/10 z-50 md:hidden overflow-y-auto scrollbar-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-overlay transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

/**
 * SettingsLayout - Shared layout for all settings pages
 * Features:
 * - Fixed sidebar navigation on desktop
 * - Slide-out drawer on mobile
 * - Consistent styling with dark theme
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleNavClick = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileSettingsHeader
        isDrawerOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <SettingsSidebar onNavClick={handleNavClick} />
      </MobileDrawer>

      <div className="flex h-[calc(100vh-65px)] md:h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 border-r border-white/10 bg-background overflow-y-auto scrollbar-hidden">
          {/* Desktop Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-surface-overlay transition-colors"
              aria-label="Back to home"
            >
              <ChevronLeft size={20} className="text-text-secondary" />
            </Link>
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          </div>
          <SettingsSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hidden">
          <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
