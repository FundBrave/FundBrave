"use client";

import { cn } from "@/lib/utils";
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
} from "@/app/components/ui/icons";

// Category item type (matching CategorySidebar)
interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

// Props for the MobileCategoryFilter component
interface MobileCategoryFilterProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

// Categories list with shortened names for mobile horizontal scroll
const CATEGORIES: Category[] = [
  { id: "all", name: "All", icon: <CheckSquare size={16} /> },
  { id: "health-medical", name: "Health", icon: <Heart size={16} /> },
  { id: "education", name: "Education", icon: <GraduationCap size={16} /> },
  { id: "environment", name: "Environment", icon: <Leaf size={16} /> },
  { id: "emergency", name: "Emergency", icon: <AlertTriangle size={16} /> },
  { id: "animal", name: "Animal", icon: <Cat size={16} /> },
  { id: "community", name: "Community", icon: <Users size={16} /> },
  { id: "business", name: "Business", icon: <Briefcase size={16} /> },
  { id: "competition", name: "Competition", icon: <PlusCircle size={16} /> },
  { id: "creative", name: "Creative", icon: <Sparkles size={16} /> },
  { id: "event", name: "Event", icon: <CalendarCheck size={16} /> },
  { id: "religion", name: "Religion", icon: <Building2 size={16} /> },
  { id: "memorial", name: "Memorial", icon: <Bell size={16} /> },
  { id: "disaster", name: "Disaster", icon: <CloudOff size={16} /> },
  { id: "family", name: "Family", icon: <HeartHandshake size={16} /> },
  { id: "sports", name: "Sports", icon: <Trophy size={16} /> },
  { id: "travel", name: "Travel", icon: <Plane size={16} /> },
  { id: "volunteer", name: "Volunteer", icon: <UserPlus size={16} /> },
  { id: "tech-startups", name: "Tech", icon: <Laptop size={16} /> },
];

/**
 * MobileCategoryFilter - Horizontal scrollable category pills for mobile
 * Displays a row of category buttons that users can scroll horizontally
 * Only visible on mobile (md:hidden)
 */
export default function MobileCategoryFilter({
  selectedCategory,
  onCategorySelect,
}: MobileCategoryFilterProps) {
  return (
    <div className="flex md:hidden overflow-x-auto gap-2 py-3 mb-4 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6">
      {CATEGORIES.map((category) => {
        const isSelected = selectedCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full whitespace-nowrap text-sm transition-all duration-200",
              "font-[family-name:var(--font-family-gilgan)] min-h-[44px]",
              isSelected
                ? "bg-primary-500 text-white"
                : "bg-surface-overlay text-text-secondary hover:bg-surface-elevated"
            )}
          >
            <span className="flex-shrink-0">{category.icon}</span>
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
