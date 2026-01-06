"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  User,
  HelpCircle,
  Settings,
  ChevronRight,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/components/ui/Avatar";
import { PremiumBanner } from "./PremiumBanner";
import type { UserProfile, NavItem, FooterLink } from "@/app/types/earnings";
import { useTheme } from "@/app/components/theme/theme-provider";

/**
 * ProfileSidebar - Left sidebar with user profile and navigation
 * Reusable across Home page and Dashboard
 *
 * Figma specs (280px width):
 * - Cover image at top (120px height)
 * - Circular avatar overlapping cover image (80px, positioned -40px from cover bottom)
 * - User name + handle
 * - Bio text (light gray, smaller font)
 * - Premium promo banner
 * - Stats row: "Post impressions" and "Donations"
 * - Navigation items with icons
 * - Dark mode toggle
 * - Footer links
 */

export interface ProfileSidebarProps {
  user: UserProfile;
  onTryPremium?: () => void;
  showDarkModeToggle?: boolean;
  className?: string;
}

// Default navigation items
const defaultNavItems: NavItem[] = [
  { id: "saved", label: "Saved items", icon: Bookmark },
  { id: "account", label: "Account", icon: User },
  { id: "help", label: "Help center", icon: HelpCircle },
  { id: "settings", label: "Settings and privacy", icon: Settings },
];

// Default footer links
const defaultFooterLinks: FooterLink[] = [
  { id: "terms", label: "Terms and conditions", href: "/terms" },
  { id: "privacy", label: "Privacy policy", href: "/privacy" },
  { id: "use", label: "Terms of use", href: "/terms-of-use" },
  { id: "feedback", label: "Give us feedback!", href: "/feedback" },
];

export function ProfileSidebar({
  user,
  onTryPremium,
  showDarkModeToggle = true,
  className,
}: ProfileSidebarProps) {
  const { theme, setTheme } = useTheme();

  // Placeholder handlers for navigation items
  const handleNavClick = (id: string) => {
    console.log(`Navigation clicked: ${id}`);
  };

  const handleDarkModeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-[#1a1625]/60 rounded-xl overflow-hidden",
        className
      )}
    >
      {/* Cover Image Section */}
      <div className="relative h-[120px] bg-neutral-dark-300">
        {user.coverImage ? (
          <Image
            src={user.coverImage}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500/30 to-soft-purple-500/30" />
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative px-4 pb-4">
        {/* Avatar - Overlapping cover image */}
        <div className="relative -mt-10 mb-3">
          <Avatar
            src={user.avatar}
            alt={user.name}
            size="xl"
            showGradientBorder
            className="w-20 h-20 ring-4 ring-[#1a1625]"
          />
        </div>

        {/* Name and Username */}
        <h2 className="text-lg font-semibold text-white">{user.name}</h2>
        <p className="text-sm text-white/50 mb-3">{user.username}</p>

        {/* Bio */}
        <p className="text-sm text-white/60 leading-relaxed mb-4">{user.bio}</p>

        {/* Premium Banner */}
        <PremiumBanner onTryPremium={onTryPremium} className="mb-4" />

        {/* Stats Row */}
        <div className="flex flex-col gap-2 py-3 border-t border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Post impressions</span>
            <span className="text-sm font-medium text-primary-400">
              {user.postImpressions.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Donations</span>
            <span className="text-sm font-medium text-primary-400">
              {user.donations.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="px-2 py-2 border-b border-white/10">
        {defaultNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "text-white/70 hover:text-white hover:bg-white/5",
              "transition-colors group"
            )}
          >
            <item.icon className="w-5 h-5 text-white/50 group-hover:text-white/70" />
            <span className="flex-1 text-sm text-left">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}

        {/* Dark Mode Toggle */}
        {showDarkModeToggle && (
          <button
            onClick={handleDarkModeToggle}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "text-white/70 hover:text-white hover:bg-white/5",
              "transition-colors group"
            )}
          >
            <Moon className="w-5 h-5 text-white/50 group-hover:text-white/70" />
            <span className="flex-1 text-sm text-left">Dark mode</span>
            {/* Toggle Switch */}
            <div
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                theme === "dark" ? "bg-primary-500" : "bg-white/20"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  theme === "dark" ? "left-5" : "left-0.5"
                )}
              />
            </div>
          </button>
        )}
      </nav>

      {/* Footer Links */}
      <div className="px-4 py-4">
        <div className="flex flex-col gap-2">
          {defaultFooterLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href || "#"}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default ProfileSidebar;
