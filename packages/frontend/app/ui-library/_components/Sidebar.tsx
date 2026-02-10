"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import {
  Box,
  TextCursorInput,
  LayoutList,
  MessageSquare,
  Users,
  Navigation,
  Accessibility,
  Shapes,
  ChevronDown,
  Home,
  Palette,
  Sparkles,
  Layers,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORIES,
  COMPONENT_REGISTRY,
  getComponentsByCategory,
} from "../registry";
import type { ComponentCategory } from "../types";

// ---------------------------------------------------------------------------
// Icon mapping: match the `icon` string in CategoryInfo to a lucide component
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, LucideIcon> = {
  Box,
  TextCursorInput,
  LayoutList,
  MessageSquare,
  Users,
  Navigation,
  Accessibility,
  Shapes,
};

// ---------------------------------------------------------------------------
// Special quick-links at the top of the sidebar
// ---------------------------------------------------------------------------
const QUICK_LINKS = [
  { href: "/ui-library", label: "Overview", icon: Home },
  { href: "/ui-library/design-tokens", label: "Design Tokens", icon: Palette },
  { href: "/ui-library/icons", label: "Icons", icon: Shapes },
  { href: "/ui-library/animations", label: "Animations", icon: Sparkles },
  { href: "/ui-library/patterns", label: "Patterns", icon: Layers },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface SidebarProps {
  /** Whether the mobile drawer is open */
  isOpen: boolean;
  /** Callback to close the mobile drawer */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar -- always visible at lg+ */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-[var(--z-sticky)]",
          "w-[280px] bg-background border-r border-white/10"
        )}
      >
        <SidebarContent pathname={pathname} onNavigate={() => {}} />
      </aside>

      {/* Mobile drawer backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="sidebar-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={cn(
              "fixed top-0 left-0 bottom-0 z-[var(--z-modal)] flex flex-col",
              "w-[280px] bg-background border-r border-white/10 lg:hidden"
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4 p-1.5 rounded-md",
                "text-text-tertiary hover:text-text-primary hover:bg-white/5",
                "transition-colors focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>

            <SidebarContent pathname={pathname} onNavigate={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// SidebarContent -- shared between desktop fixed sidebar and mobile drawer
// ---------------------------------------------------------------------------
interface SidebarContentProps {
  pathname: string;
  onNavigate: () => void;
}

function SidebarContent({ pathname, onNavigate }: SidebarContentProps) {
  const [showPlanned, setShowPlanned] = useState(true);

  const totalCount = COMPONENT_REGISTRY.length;
  const builtCount = useMemo(
    () => COMPONENT_REGISTRY.filter((c) => c.status === "built").length,
    []
  );

  return (
    <div className="flex flex-col h-full">
      {/* Logo / title */}
      <div className="px-5 pt-6 pb-4">
        <Link
          href="/ui-library"
          className="group inline-flex flex-col"
          onClick={onNavigate}
        >
          <span className="text-lg font-bold text-brand-gradient bg-clip-text font-display">
            FundBrave
          </span>
          <span className="text-xs text-text-tertiary tracking-wider uppercase mt-0.5">
            Design System
          </span>
        </Link>
      </div>

      {/* Scrollable nav area */}
      <nav
        className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar"
        aria-label="UI Library navigation"
      >
        {/* Quick links */}
        <div className="mb-4">
          {QUICK_LINKS.map((link) => {
            const isActive =
              link.href === "/ui-library"
                ? pathname === "/ui-library"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                  "transition-all duration-[var(--duration-fast)]",
                  isActive
                    ? "text-text-primary bg-primary/10 border-l-2 border-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5 border-l-2 border-transparent"
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-3 mb-4 border-t border-white/10" />

        {/* Filter toggle + count */}
        <div className="mx-1 mb-4 space-y-2.5">
          <button
            type="button"
            onClick={() => setShowPlanned((prev) => !prev)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 rounded-lg",
              "text-sm transition-all duration-[var(--duration-fast)]",
              "hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            role="switch"
            aria-checked={showPlanned}
          >
            <span className="text-text-secondary font-medium">
              Show planned
            </span>
            <span
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
                showPlanned ? "bg-primary" : "bg-white/15"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  showPlanned ? "translate-x-[18px]" : "translate-x-[3px]"
                )}
              />
            </span>
          </button>
          <div className="px-3 text-xs text-text-tertiary tabular-nums">
            <span className="text-emerald-400 font-medium">{builtCount}</span>
            {" built "}
            <span className="text-white/20">/</span>
            {" "}
            <span>{totalCount} total</span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 mb-4 border-t border-white/10" />

        {/* Category sections */}
        <div className="space-y-1">
          {CATEGORIES.map((category) => (
            <CategorySection
              key={category.id}
              categoryId={category.id}
              label={category.label}
              iconName={category.icon}
              pathname={pathname}
              onNavigate={onNavigate}
              showPlanned={showPlanned}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CategorySection -- collapsible category with component links
// ---------------------------------------------------------------------------
interface CategorySectionProps {
  categoryId: ComponentCategory;
  label: string;
  iconName: string;
  pathname: string;
  onNavigate: () => void;
  showPlanned: boolean;
}

function CategorySection({
  categoryId,
  label,
  iconName,
  pathname,
  onNavigate,
  showPlanned,
}: CategorySectionProps) {
  const allComponents = useMemo(
    () => getComponentsByCategory(categoryId),
    [categoryId]
  );
  const components = useMemo(
    () =>
      showPlanned
        ? allComponents
        : allComponents.filter((c) => c.status === "built"),
    [allComponents, showPlanned]
  );
  const builtCount = useMemo(
    () => allComponents.filter((c) => c.status === "built").length,
    [allComponents]
  );

  // Auto-expand if current path is in this category
  const hasActiveChild = useMemo(
    () =>
      components.some(
        (c) => pathname === `/ui-library/components/${c.slug}`
      ),
    [components, pathname]
  );

  const [isExpanded, setIsExpanded] = useState(hasActiveChild);

  const Icon = ICON_MAP[iconName] ?? Box;

  // Hide category entirely when all its components are filtered out
  if (components.length === 0) return null;

  return (
    <div>
      {/* Category header / toggle */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium",
          "text-text-secondary hover:text-text-primary hover:bg-white/5",
          "transition-all duration-[var(--duration-fast)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        aria-expanded={isExpanded}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">{label}</span>
        <span className="text-xs text-text-tertiary tabular-nums">
          {builtCount}/{allComponents.length}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-text-tertiary transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Expandable component list */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key={`category-${categoryId}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-0.5 mb-1 pl-3 border-l border-white/5 space-y-0.5">
              {components.map((component) => {
                const isActive =
                  pathname === `/ui-library/components/${component.slug}`;
                return (
                  <Link
                    key={component.slug}
                    href={`/ui-library/components/${component.slug}`}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm",
                      "transition-all duration-[var(--duration-fast)]",
                      isActive
                        ? "text-text-primary bg-primary/10 border-l-2 border-primary -ml-px"
                        : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.03] border-l-2 border-transparent -ml-px"
                    )}
                  >
                    {/* Status dot */}
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        component.status === "built"
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate">{component.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Sidebar;
