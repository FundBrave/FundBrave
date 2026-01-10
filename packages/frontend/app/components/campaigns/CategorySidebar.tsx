"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import {
  Heart,
  GraduationCap,
  Leaf,
  AlertTriangle,
  Cat,
  Users,
  Briefcase,
  PlusCircle,
  Sparkles,
  CalendarCheck,
  Building2,
  Bell,
  CloudOff,
  HeartHandshake,
  Trophy,
  Plane,
  UserPlus,
  Laptop,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from "@/app/components/ui/icons";

// Category item type definition
export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

// Props for the CategorySidebar component
interface CategorySidebarProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// List of all available categories with their icons
const CATEGORIES: Category[] = [
  { id: "all", name: "All", icon: <CheckSquare size={20} /> },
  {
    id: "health-medical",
    name: "Health and Medical",
    icon: <Heart size={20} />,
  },
  { id: "education", name: "Education", icon: <GraduationCap size={20} /> },
  { id: "environment", name: "Environment", icon: <Leaf size={20} /> },
  { id: "emergency", name: "Emergency", icon: <AlertTriangle size={20} /> },
  { id: "animal", name: "Animal", icon: <Cat size={20} /> },
  { id: "community", name: "Community", icon: <Users size={20} /> },
  { id: "business", name: "Business", icon: <Briefcase size={20} /> },
  { id: "competition", name: "Competition", icon: <PlusCircle size={20} /> },
  { id: "creative", name: "Creative", icon: <Sparkles size={20} /> },
  { id: "event", name: "Event", icon: <CalendarCheck size={20} /> },
  { id: "religion", name: "Religion", icon: <Building2 size={20} /> },
  { id: "memorial", name: "Memorial", icon: <Bell size={20} /> },
  { id: "disaster", name: "Disaster", icon: <CloudOff size={20} /> },
  { id: "family", name: "Family", icon: <HeartHandshake size={20} /> },
  { id: "sports", name: "Sports", icon: <Trophy size={20} /> },
  { id: "travel", name: "Travel", icon: <Plane size={20} /> },
  { id: "volunteer", name: "Volunteer", icon: <UserPlus size={20} /> },
  { id: "tech-startups", name: "Tech Startups", icon: <Laptop size={20} /> },
];

/**
 * CategorySidebar - A collapsible sidebar component for browsing campaign categories
 * Displays a list of categories with icons that users can click to filter campaigns
 */
export default function CategorySidebar({
  onCategorySelect,
  selectedCategory = "all",
  isCollapsed = false,
  onToggleCollapse,
}: CategorySidebarProps) {
  const [activeCategory, setActiveCategory] = useState(selectedCategory);

  // GSAP refs
  const chevronLeftRef = useRef<SVGSVGElement>(null);
  const chevronRightRef = useRef<SVGSVGElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  // Cleanup GSAP on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf([chevronLeftRef.current, chevronRightRef.current]);
      if (categoriesRef.current) {
        const buttons = categoriesRef.current.querySelectorAll("button");
        gsap.killTweensOf(buttons);
      }
    };
  }, []);

  // Animate chevron rotation on collapse toggle
  useEffect(() => {
    const chevron = isCollapsed ? chevronRightRef.current : chevronLeftRef.current;
    if (chevron) {
      gsap.fromTo(
        chevron,
        { rotation: -90, scale: 0.8 },
        { rotation: 0, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isCollapsed]);

  // Stagger categories on initial mount
  useEffect(() => {
    if (categoriesRef.current && !hasAnimatedRef.current) {
      const buttons = categoriesRef.current.querySelectorAll("button");
      gsap.fromTo(
        buttons,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, stagger: 0.03, duration: 0.3, ease: "power2.out" }
      );
      hasAnimatedRef.current = true;
    }
  }, []);

  // Handle category selection with animation
  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    onCategorySelect?.(categoryId);
  }, [onCategorySelect]);

  return (
    <aside
      className={`h-full overflow-y-auto scrollbar-auto-hide flex-shrink-0 transition-all duration-300 border-r border-border-default hidden md:block ${
        isCollapsed ? "md:w-[60px]" : "md:w-[200px] lg:w-[240px]"
      }`}
    >
      <div className="flex flex-col gap-5 py-2 pr-4">
        {/* Header with title and collapse toggle */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-1">
            <h2 className="font-semibold text-lg text-foreground tracking-[0.36px] font-[family-name:var(--font-family-gilgan)]">
              Browse Categories
            </h2>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft ref={chevronLeftRef} size={18} className="text-text-secondary" />
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center p-2 rounded-lg hover:bg-surface-overlay transition-colors mx-auto"
            aria-label="Expand sidebar"
          >
            <ChevronRight ref={chevronRightRef} size={18} className="text-text-secondary" />
          </button>
        )}

        {/* Categories List */}
        <div ref={categoriesRef} className="flex flex-col gap-1">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;

            const buttonContent = (
              <button
                onClick={() => handleCategoryClick(category.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? ""
                    : "hover:bg-surface-overlay"
                }`}
              >
                {/* Category Icon */}
                <span
                  className={`flex-shrink-0 transition-colors ${
                    isActive ? "text-primary-500" : "text-text-secondary"
                  }`}
                >
                  {category.icon}
                </span>

                {/* Category Name - Hidden when collapsed */}
                {!isCollapsed && (
                  <span
                    className={`text-sm leading-5 tracking-[0.28px] whitespace-nowrap transition-colors ${
                      isActive ? "text-foreground font-medium" : "text-text-secondary"
                    }`}
                  >
                    {category.name}
                  </span>
                )}
              </button>
            );

            return <div key={category.id}>{buttonContent}</div>;
          })}
        </div>
      </div>
    </aside>
  );
}
