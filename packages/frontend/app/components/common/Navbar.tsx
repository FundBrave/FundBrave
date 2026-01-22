"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/components/theme/theme-provider";
import { useSearch } from "@/app/provider/SearchProvider";
import { Button } from "@/app/components/ui/button";
import { Avatar } from "@/app/components/ui/Avatar";
import {
  Search,
  Settings,
  MessageCircle,
  Menu,
  X,
  ChevronDown,
} from "@/app/components/ui/icons";
import { NotificationBell, NotificationPanel } from "@/app/components/notifications";
import { useUnreadCount } from "@/app/hooks/useMessaging";
import { useAuth } from "@/app/provider/AuthProvider";
import { useRouter } from "next/navigation";

/**
 * Navigation link configuration
 * Maps routes to display names
 */
const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/community", label: "Community" },
] as const;

export interface NavbarProps {
  className?: string;
}

/**
 * Global Navbar Component
 *
 * Pixel-perfect implementation based on Figma design (node 557-4291).
 * Features:
 * - Theme-aware logo (light logo in dark mode, dark logo in light mode)
 * - Search bar with dark background (#221a31)
 * - Navigation links with active indicator (white bar 15px wide, 3px height)
 * - "Add Campaign" primary button with gradient and glow
 * - Icon buttons for Settings, Messages, Notifications
 * - User avatar dropdown with name and "Connect Wallet"
 * - Responsive mobile menu
 */
export default function Navbar({ className }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { openSearch } = useSearch();
  const { user, isAuthenticated, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // Fetch unread message count
  const { count: unreadMessageCount } = useUnreadCount();

  // Get user display name and avatar
  const userName = user?.username || user?.email || "Anonymous";
  const userAvatar = undefined; // TODO: Add avatar URL to user object
  const userFallback = userName.charAt(0).toUpperCase();

  // Theme-aware logo: light logo for dark mode, dark logo for light mode
  const logoSrc =
    theme === "dark" || theme === "system"
      ? "/FundBrave_light_logo.png"
      : "/FundBrave_dark_logo.png";

  // Check if a nav link is active
  const isActiveLink = useCallback((href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }, [pathname]);

  // Get active link index
  const getActiveIndex = useCallback(() => {
    return NAV_LINKS.findIndex((link) => isActiveLink(link.href));
  }, [isActiveLink]);

  // Animate indicator with GSAP
  useEffect(() => {
    const activeIndex = getActiveIndex();
    const activeLink = NAV_LINKS[activeIndex];

    if (activeIndex === -1 || !indicatorRef.current || !navContainerRef.current) {
      // Hide indicator if no active link
      if (indicatorRef.current) {
        gsap.to(indicatorRef.current, {
          opacity: 0,
          duration: 0.2,
        });
      }
      return;
    }

    const linkElement = linkRefs.current.get(activeLink.href);
    if (!linkElement) return;

    // Use offsetLeft/offsetWidth for simpler DOM-based positioning
    gsap.to(indicatorRef.current, {
      x: linkElement.offsetLeft,
      width: linkElement.offsetWidth,
      opacity: 1,
      duration: 0.4,
      ease: "power3.out",
    });
  }, [pathname, getActiveIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Toggle user dropdown
  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setUserDropdownOpen(false);
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background w-full border-b border-border-default",
        className
      )}
    >
      {/* Skip to main content link - for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-10">
        {/* Desktop Navigation - Height: 80px as per Figma */}
        <div className="hidden lg:flex h-20 items-center justify-between max-w-full mx-auto">
          {/* Logo - 146px x 44px */}
          <Link href="/" className="shrink-0">
            <div className="h-11 w-[146px] relative overflow-hidden">
              <Image
                src={logoSrc}
                alt="FundBrave Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Search Button - Opens global SearchModal */}
          <button
            onClick={openSearch}
            className="min-h-[44px] min-w-[44px] size-11 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-surface-elevated active:bg-surface-overlay active:scale-[0.98] transition-colors cursor-pointer"
            aria-label="Search (Cmd+K)"
          >
            <Search size={20} className="text-text-secondary" />
          </button>

          {/* Navigation Links - Always visible, no animation */}
          <div
            ref={navContainerRef}
            className="relative flex gap-6 items-center justify-center"
          >
            {/* Animated indicator - slides between links */}
            <div
              ref={indicatorRef}
              className="absolute left-0 bottom-0 h-[2px] bg-foreground rounded-full"
              style={{ width: 0, opacity: 0 }}
            />

            {NAV_LINKS.map((link) => {
              const isActive = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  ref={(el) => {
                    if (el) linkRefs.current.set(link.href, el);
                  }}
                  className="relative flex flex-col items-center group py-2"
                >
                  {/* Link text */}
                  <span
                    className={cn(
                      "text-sm tracking-wide transition-colors duration-200",
                      isActive
                        ? "text-foreground font-bold"
                        : "text-text-secondary font-medium hover:text-foreground/80"
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right Section - Actions */}
          <div className="flex gap-3 items-center">
            {/* Add Campaign Button - Primary with gradient */}
            <Link href="/campaigns/create">
              <Button
                variant="primary"
                className="px-5 py-2.5 h-10 rounded-2xl text-sm font-semibold"
                style={{
                  backgroundImage:
                    "linear-gradient(107.303deg, rgb(69, 12, 240) 0%, rgb(205, 130, 255) 100%)",
                  boxShadow: "0px 4px 20px 0px rgba(97, 36, 243, 0.3)",
                }}
              >
                Add Campaign
              </Button>
            </Link>

            {/* Icon Buttons Group */}
            <div className="flex gap-1.5 items-center">
              {/* Settings Icon Button - 44px min touch target */}
              <Link
                href="/settings"
                className="min-h-[44px] min-w-[44px] size-9 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-surface-overlay active:bg-surface-overlay active:scale-[0.98] transition-colors"
                aria-label="Settings"
              >
                <Settings size={18} className="text-foreground/80" />
              </Link>

              {/* Messages Icon Button - 44px min touch target */}
              <Link
                href="/messenger"
                className="relative min-h-[44px] min-w-[44px] size-9 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-surface-overlay active:bg-surface-overlay active:scale-[0.98] transition-colors"
                aria-label={`Messages${unreadMessageCount > 0 ? ` (${unreadMessageCount} unread)` : ""}`}
              >
                <MessageCircle size={18} className="text-foreground/80" />
                {/* Unread Badge */}
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full border-2 border-background">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </span>
                )}
              </Link>

              {/* Notifications Bell with Panel */}
              <div className="relative">
                <NotificationBell size="md" />
                <NotificationPanel />
              </div>

              {/* User Avatar with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="flex gap-2 items-center cursor-pointer group"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  {/* Avatar - 36px */}
                  <Avatar
                    src={userAvatar}
                    alt={userName}
                    fallback={userFallback}
                    size="sm"
                    className="size-9"
                  />

                  {/* User Info */}
                  <div className="flex flex-col items-start">
                    <div className="flex gap-1 items-center">
                      <span className="text-foreground text-xs font-medium">
                        {userName}
                      </span>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "text-text-secondary transition-transform duration-200",
                          userDropdownOpen && "rotate-180"
                        )}
                      />
                    </div>
                    {/* Wallet Address or Connect Wallet */}
                    <span
                      className="text-[10px] font-semibold bg-clip-text text-transparent"
                      style={{
                        backgroundImage:
                          "linear-gradient(124.256deg, rgb(69, 12, 240) 0%, rgb(205, 130, 255) 100%)",
                        WebkitBackgroundClip: "text",
                      }}
                    >
                      {user?.walletAddress
                        ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                        : "Connect Wallet"
                      }
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-border-default rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="py-2">
                      <Link
                        href="/profile/me"
                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-surface-overlay active:bg-surface-overlay hover:text-foreground transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        View Profile
                      </Link>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-surface-overlay active:bg-surface-overlay hover:text-foreground transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-surface-overlay active:bg-surface-overlay hover:text-foreground transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Settings
                      </Link>
                      <hr className="border-border-default my-1" />
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-foreground/80 hover:bg-surface-overlay active:bg-surface-overlay hover:text-foreground transition-colors"
                        onClick={() => {
                          // Handle wallet connection
                          setUserDropdownOpen(false);
                        }}
                      >
                        Connect Wallet
                      </button>
                      <hr className="border-border-default my-1" />
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-surface-overlay active:bg-surface-overlay hover:text-red-300 transition-colors"
                        onClick={handleLogout}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex w-full lg:hidden h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <div className="h-8 w-[100px] relative overflow-hidden">
              <Image
                src={logoSrc}
                alt="FundBrave Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Mobile Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button (Mobile) - Opens global SearchModal */}
            <button
              onClick={openSearch}
              className="size-11 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-surface-elevated active:bg-surface-overlay active:scale-[0.98] transition-colors"
              aria-label="Search (Cmd+K)"
            >
              <Search size={20} className="text-text-secondary" />
            </button>

            {/* Notifications Bell (Mobile) */}
            <div className="relative">
              <NotificationBell size="sm" />
              <NotificationPanel />
            </div>

            {/* User Avatar (Mobile) */}
            <Avatar
              src={userAvatar}
              alt={userName}
              fallback={userFallback}
              size="sm"
              className="size-10"
            />

            {/* Hamburger Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="size-11 rounded-full bg-surface-overlay border border-border-default flex items-center justify-center active:bg-surface-overlay"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X size={20} className="text-foreground" />
              ) : (
                <Menu size={20} className="text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="fixed top-16 left-0 right-0 bg-background border-t border-border-default z-[60] lg:hidden max-h-[calc(100vh-64px)] overflow-y-auto">
            {/* Mobile Search Button - Opens global SearchModal */}
            <div className="p-4 border-b border-border-default">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSearch();
                }}
                className="w-full bg-surface-sunken flex items-center gap-2 h-12 px-4 rounded-xl hover:bg-surface-elevated active:bg-surface-overlay transition-colors"
                aria-label="Search (Cmd+K)"
              >
                <Search size={20} className="text-text-secondary shrink-0" />
                <span className="text-text-secondary text-sm">Type to Search...</span>
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <div className="py-2">
              {NAV_LINKS.map((link) => {
                const isActive = isActiveLink(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-4 min-h-[44px] text-base transition-colors active:bg-white/10 active:scale-[0.99]",
                      isActive
                        ? "text-foreground bg-surface-overlay border-l-2 border-primary-500"
                        : "text-text-secondary hover:text-foreground hover:bg-surface-overlay"
                    )}
                  >
                    {/* Active indicator dot for mobile */}
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                    )}
                    <span className={isActive ? "font-bold" : "font-semibold"}>
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Add Campaign Button */}
            <div className="p-4 border-t border-border-default">
              <Link href="/campaigns/create" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="primary"
                  fullWidth
                  className="h-14 rounded-[20px] text-base tracking-[0.64px] font-semibold"
                  style={{
                    backgroundImage:
                      "linear-gradient(107.303deg, rgb(69, 12, 240) 0%, rgb(205, 130, 255) 100%)",
                    boxShadow: "0px 8px 30px 0px rgba(97, 36, 243, 0.35)",
                  }}
                >
                  Add Campaign
                </Button>
              </Link>
            </div>

            {/* Mobile Quick Actions */}
            <div className="px-4 pb-4 grid grid-cols-3 gap-3">
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-4 min-h-[44px] rounded-xl bg-surface-overlay border border-border-default hover:bg-surface-elevated active:bg-surface-elevated active:scale-[0.98] transition-colors"
              >
                <Settings size={24} className="text-foreground/80" />
                <span className="text-xs text-text-secondary">Settings</span>
              </Link>
              <Link
                href="/messenger"
                onClick={() => setMobileMenuOpen(false)}
                className="relative flex flex-col items-center gap-2 p-4 min-h-[44px] rounded-xl bg-surface-overlay border border-border-default hover:bg-surface-elevated active:bg-surface-elevated active:scale-[0.98] transition-colors"
              >
                <div className="relative">
                  <MessageCircle size={24} className="text-foreground/80" />
                  {/* Unread Badge */}
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-primary text-white text-[9px] font-bold rounded-full border-2 border-background">
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-secondary">Messages</span>
              </Link>
              <Link
                href="/profile/me"
                onClick={() => setMobileMenuOpen(false)}
                className="flex flex-col items-center gap-2 p-4 min-h-[44px] rounded-xl bg-surface-overlay border border-border-default hover:bg-surface-elevated active:bg-surface-elevated active:scale-[0.98] transition-colors"
              >
                <Avatar
                  src={userAvatar}
                  alt="Profile"
                  fallback={userFallback}
                  size="sm"
                  className="size-6"
                />
                <span className="text-xs text-text-secondary">Profile</span>
              </Link>
            </div>

            {/* Connect Wallet - Mobile */}
            <div className="px-4 pb-6">
              <button
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-primary-500 text-primary-500 hover:bg-primary-500/10 transition-colors"
                onClick={() => {
                  // Handle wallet connection
                  setMobileMenuOpen(false);
                }}
              >
                <span className="font-semibold">Connect Wallet</span>
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
