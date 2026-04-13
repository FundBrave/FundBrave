"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Search, Plus, Bell, User } from "@/app/components/ui/icons";
import { useUnreadCount } from "@/app/hooks/useMessaging";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** If true, renders as a prominent create button instead of a standard nav link */
  isCreate?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/campaigns/create", label: "Create", icon: Plus, isCreate: true },
  { href: "/settings/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

/**
 * BottomNavBar — Mobile-only sticky bottom navigation.
 * Follows product spec 3.10.3: visible below md breakpoint,
 * active = filled icon + label, inactive = outline icon only.
 */
export function BottomNavBar() {
  const pathname = usePathname();
  const { count: unreadCount } = useUnreadCount();

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-background/95 backdrop-blur-md",
        "border-t border-border-subtle",
        "safe-area-pb"
      )}
    >
      <ul className="flex items-center justify-around h-16 max-w-[480px] mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "flex items-center justify-center",
                    "w-12 h-12 rounded-full",
                    "bg-brand-gradient shadow-lg shadow-primary/30",
                    "active:scale-95 transition-transform"
                  )}
                >
                  <Icon size={24} className="text-white" />
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5",
                  "min-w-[48px] min-h-[48px] px-2 py-1",
                  "transition-colors active:scale-95 active:transition-transform",
                  isActive ? "text-primary" : "text-text-tertiary"
                )}
              >
                <span className="relative">
                  <Icon
                    size={22}
                    className={cn(
                      isActive && "stroke-[2.5]"
                    )}
                  />
                  {/* Notification badge */}
                  {item.label === "Alerts" && unreadCount > 0 && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-2",
                        "min-w-[18px] h-[18px] px-1",
                        "flex items-center justify-center",
                        "bg-primary text-white text-[10px] font-bold",
                        "rounded-full border-2 border-background"
                      )}
                      aria-label={`${unreadCount > 99 ? "99+" : unreadCount} unread notifications`}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                {isActive && (
                  <span className="text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
