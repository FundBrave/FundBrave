"use client";

import { useState, useCallback, useMemo, useRef, type ComponentType } from "react";
import { cn } from "@/lib/utils";

// Action Icons
import {
  Heart,
  Bookmark,
  Share,
  Share2,
  Repeat2,
  Bell,
  MessageCircle,
  BarChart3,
} from "@/app/components/ui/icons";

// Navigation Icons
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PanelRightClose,
  PanelRightOpen,
} from "@/app/components/ui/icons";

// UI Icons
import {
  Loader2,
  Search,
  Plus,
  CalendarIcon,
  Send,
  MoreHorizontal,
  Trash2,
  FileText,
  Play,
  Pin,
  Moon,
  Sun,
  Music,
  Smile,
  Paperclip,
  Wallet,
  TrendingUp,
  Shield,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  PartyPopper,
  Settings,
  Clock,
  Star,
  Info,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
} from "@/app/components/ui/icons";

// Form Icons
import {
  Mail,
  Lock,
  User,
  Upload,
  UploadIcon,
  Eye,
  EyeOff,
} from "@/app/components/ui/icons";

// Category Icons
import {
  GraduationCap,
  Leaf,
  AlertTriangle,
  Cat,
  Users,
  Briefcase,
  HeartHandshake,
  Trophy,
  Plane,
  Laptop,
  Grid3X3,
  Sparkles,
  Rocket,
  Gift,
  Globe,
  Check,
  PlusCircle,
  CalendarCheck,
  Building2,
  CloudOff,
  UserPlus,
  CheckSquare,
  UserRound,
  UsersRound,
  PencilLine,
} from "@/app/components/ui/icons";

// Social Icons
import {
  LinkedInIcon,
  XIcon,
  InstagramIcon,
  FacebookIcon,
  WhatsAppIcon,
  EmailIcon,
} from "@/app/components/ui/icons/SocialIcons";

// ---------------------------------------------------------------------------
// Icon Data
// ---------------------------------------------------------------------------

type IconCategory = "all" | "action" | "navigation" | "ui" | "form" | "category" | "social";

interface IconEntry {
  name: string;
  component: ComponentType<{ className?: string }>;
  category: Exclude<IconCategory, "all">;
  importName: string;
}

const ICON_DATA: IconEntry[] = [
  // Action
  { name: "Heart", component: Heart, category: "action", importName: "Heart" },
  { name: "Bookmark", component: Bookmark, category: "action", importName: "Bookmark" },
  { name: "Share", component: Share, category: "action", importName: "Share" },
  { name: "Share2", component: Share2, category: "action", importName: "Share2" },
  { name: "Repeat2", component: Repeat2, category: "action", importName: "Repeat2" },
  { name: "Bell", component: Bell, category: "action", importName: "Bell" },
  { name: "MessageCircle", component: MessageCircle, category: "action", importName: "MessageCircle" },
  { name: "BarChart3", component: BarChart3, category: "action", importName: "BarChart3" },

  // Navigation
  { name: "Menu", component: Menu, category: "navigation", importName: "Menu" },
  { name: "X", component: X, category: "navigation", importName: "X" },
  { name: "ChevronLeft", component: ChevronLeft, category: "navigation", importName: "ChevronLeft" },
  { name: "ChevronRight", component: ChevronRight, category: "navigation", importName: "ChevronRight" },
  { name: "ChevronDown", component: ChevronDown, category: "navigation", importName: "ChevronDown" },
  { name: "ChevronUp", component: ChevronUp, category: "navigation", importName: "ChevronUp" },
  { name: "PanelRightClose", component: PanelRightClose, category: "navigation", importName: "PanelRightClose" },
  { name: "PanelRightOpen", component: PanelRightOpen, category: "navigation", importName: "PanelRightOpen" },

  // UI
  { name: "Loader2", component: Loader2, category: "ui", importName: "Loader2" },
  { name: "Search", component: Search, category: "ui", importName: "Search" },
  { name: "Plus", component: Plus, category: "ui", importName: "Plus" },
  { name: "CalendarIcon", component: CalendarIcon, category: "ui", importName: "CalendarIcon" },
  { name: "Send", component: Send, category: "ui", importName: "Send" },
  { name: "MoreHorizontal", component: MoreHorizontal, category: "ui", importName: "MoreHorizontal" },
  { name: "Trash2", component: Trash2, category: "ui", importName: "Trash2" },
  { name: "FileText", component: FileText, category: "ui", importName: "FileText" },
  { name: "Play", component: Play, category: "ui", importName: "Play" },
  { name: "Pin", component: Pin, category: "ui", importName: "Pin" },
  { name: "Moon", component: Moon, category: "ui", importName: "Moon" },
  { name: "Sun", component: Sun, category: "ui", importName: "Sun" },
  { name: "Music", component: Music, category: "ui", importName: "Music" },
  { name: "Smile", component: Smile, category: "ui", importName: "Smile" },
  { name: "Paperclip", component: Paperclip, category: "ui", importName: "Paperclip" },
  { name: "Wallet", component: Wallet, category: "ui", importName: "Wallet" },
  { name: "TrendingUp", component: TrendingUp, category: "ui", importName: "TrendingUp" },
  { name: "Shield", component: Shield, category: "ui", importName: "Shield" },
  { name: "ArrowRight", component: ArrowRight, category: "ui", importName: "ArrowRight" },
  { name: "ArrowLeft", component: ArrowLeft, category: "ui", importName: "ArrowLeft" },
  { name: "MessageSquare", component: MessageSquare, category: "ui", importName: "MessageSquare" },
  { name: "PartyPopper", component: PartyPopper, category: "ui", importName: "PartyPopper" },
  { name: "Settings", component: Settings, category: "ui", importName: "Settings" },
  { name: "Clock", component: Clock, category: "ui", importName: "Clock" },
  { name: "Star", component: Star, category: "ui", importName: "Star" },
  { name: "Info", component: Info, category: "ui", importName: "Info" },
  { name: "CheckCircle2", component: CheckCircle2, category: "ui", importName: "CheckCircle2" },
  { name: "ExternalLink", component: ExternalLink, category: "ui", importName: "ExternalLink" },
  { name: "AlertCircle", component: AlertCircle, category: "ui", importName: "AlertCircle" },

  // Form
  { name: "Mail", component: Mail, category: "form", importName: "Mail" },
  { name: "Lock", component: Lock, category: "form", importName: "Lock" },
  { name: "User", component: User, category: "form", importName: "User" },
  { name: "Upload", component: Upload, category: "form", importName: "Upload" },
  { name: "UploadIcon", component: UploadIcon, category: "form", importName: "UploadIcon" },
  { name: "Eye", component: Eye, category: "form", importName: "Eye" },
  { name: "EyeOff", component: EyeOff, category: "form", importName: "EyeOff" },

  // Category
  { name: "GraduationCap", component: GraduationCap, category: "category", importName: "GraduationCap" },
  { name: "Leaf", component: Leaf, category: "category", importName: "Leaf" },
  { name: "AlertTriangle", component: AlertTriangle, category: "category", importName: "AlertTriangle" },
  { name: "Cat", component: Cat, category: "category", importName: "Cat" },
  { name: "Users", component: Users, category: "category", importName: "Users" },
  { name: "Briefcase", component: Briefcase, category: "category", importName: "Briefcase" },
  { name: "HeartHandshake", component: HeartHandshake, category: "category", importName: "HeartHandshake" },
  { name: "Trophy", component: Trophy, category: "category", importName: "Trophy" },
  { name: "Plane", component: Plane, category: "category", importName: "Plane" },
  { name: "Laptop", component: Laptop, category: "category", importName: "Laptop" },
  { name: "Grid3X3", component: Grid3X3, category: "category", importName: "Grid3X3" },
  { name: "Sparkles", component: Sparkles, category: "category", importName: "Sparkles" },
  { name: "Rocket", component: Rocket, category: "category", importName: "Rocket" },
  { name: "Gift", component: Gift, category: "category", importName: "Gift" },
  { name: "Globe", component: Globe, category: "category", importName: "Globe" },
  { name: "Check", component: Check, category: "category", importName: "Check" },
  { name: "PlusCircle", component: PlusCircle, category: "category", importName: "PlusCircle" },
  { name: "CalendarCheck", component: CalendarCheck, category: "category", importName: "CalendarCheck" },
  { name: "Building2", component: Building2, category: "category", importName: "Building2" },
  { name: "CloudOff", component: CloudOff, category: "category", importName: "CloudOff" },
  { name: "UserPlus", component: UserPlus, category: "category", importName: "UserPlus" },
  { name: "CheckSquare", component: CheckSquare, category: "category", importName: "CheckSquare" },
  { name: "UserRound", component: UserRound, category: "category", importName: "UserRound" },
  { name: "UsersRound", component: UsersRound, category: "category", importName: "UsersRound" },
  { name: "PencilLine", component: PencilLine, category: "category", importName: "PencilLine" },

  // Social
  { name: "LinkedInIcon", component: LinkedInIcon, category: "social", importName: "LinkedInIcon" },
  { name: "XIcon", component: XIcon, category: "social", importName: "XIcon" },
  { name: "InstagramIcon", component: InstagramIcon, category: "social", importName: "InstagramIcon" },
  { name: "FacebookIcon", component: FacebookIcon, category: "social", importName: "FacebookIcon" },
  { name: "WhatsAppIcon", component: WhatsAppIcon, category: "social", importName: "WhatsAppIcon" },
  { name: "EmailIcon", component: EmailIcon, category: "social", importName: "EmailIcon" },
];

// ---------------------------------------------------------------------------
// Category Tabs
// ---------------------------------------------------------------------------

const CATEGORIES: { id: IconCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "action", label: "Action" },
  { id: "navigation", label: "Navigation" },
  { id: "ui", label: "UI" },
  { id: "form", label: "Form" },
  { id: "category", label: "Category" },
  { id: "social", label: "Social" },
];

// ---------------------------------------------------------------------------
// Toast Notification
// ---------------------------------------------------------------------------

function CopyToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "rounded-xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-lg px-4 py-2.5",
        "text-sm font-medium text-emerald-400",
        "transition-all duration-300 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      )}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon Card
// ---------------------------------------------------------------------------

function IconCard({
  entry,
  onCopy,
}: {
  entry: IconEntry;
  onCopy: (importStatement: string) => void;
}) {
  const Icon = entry.component;
  const isSocial = entry.category === "social";
  const importStatement = isSocial
    ? `import { ${entry.importName} } from "@/app/components/ui/icons/SocialIcons";`
    : `import { ${entry.importName} } from "@/app/components/ui/icons";`;

  return (
    <button
      type="button"
      onClick={() => onCopy(importStatement)}
      className={cn(
        "group flex flex-col items-center justify-center gap-3 rounded-xl",
        "border border-border-subtle bg-surface-elevated p-4",
        "transition-all duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
        "hover:border-border-emphasis hover:shadow-[var(--shadow-elevated)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "cursor-pointer"
      )}
      title={`Click to copy import for ${entry.name}`}
      aria-label={`Copy import statement for ${entry.name}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] transition-colors group-hover:bg-white/[0.08]">
        <Icon className="h-6 w-6 text-text-secondary group-hover:text-text-primary transition-colors" />
      </div>
      <span className="text-xs text-text-tertiary group-hover:text-text-secondary transition-colors truncate max-w-full">
        {entry.name}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Icons Page
// ---------------------------------------------------------------------------

export default function IconsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<IconCategory>("all");
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons = ICON_DATA;

    // Filter by category
    if (activeCategory !== "all") {
      icons = icons.filter((icon) => icon.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      icons = icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(query) ||
          icon.category.toLowerCase().includes(query)
      );
    }

    return icons;
  }, [searchQuery, activeCategory]);

  // Copy import statement to clipboard
  const handleCopy = useCallback((importStatement: string) => {
    navigator.clipboard.writeText(importStatement).then(
      () => {
        setToastMessage("Import copied to clipboard");
        setToastVisible(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 2000);
      },
      () => {
        // Fallback for insecure contexts
        const textarea = document.createElement("textarea");
        textarea.value = importStatement;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setToastMessage("Import copied to clipboard");
        setToastVisible(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 2000);
      }
    );
  }, []);

  return (
    <article className="mx-auto max-w-5xl space-y-8 py-8">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Icons
        </h1>
        <p className="text-lg leading-relaxed text-text-secondary max-w-2xl">
          {ICON_DATA.length} custom SVG icons with forwardRef support for
          GSAP and Motion animation compatibility. Click any icon to copy its
          import statement.
        </p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search icons by name..."
          className={cn(
            "w-full rounded-xl border border-border-subtle bg-surface-elevated",
            "py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary",
            "transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          )}
          aria-label="Search icons"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Icon categories">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          const count =
            category.id === "all"
              ? ICON_DATA.length
              : ICON_DATA.filter((i) => i.category === category.id).length;

          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
                "transition-all duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "bg-white/[0.04] text-text-secondary border border-transparent hover:bg-white/[0.08] hover:text-text-primary"
              )}
            >
              {category.label}
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-1.5 text-xs",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-white/[0.06] text-text-tertiary"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-tertiary">
          Showing {filteredIcons.length} of {ICON_DATA.length} icons
        </p>
      </div>

      {/* Icon Grid */}
      {filteredIcons.length > 0 ? (
        <div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
          role="tabpanel"
        >
          {filteredIcons.map((entry) => (
            <IconCard key={entry.name} entry={entry} onCopy={handleCopy} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-white/[0.04] p-4">
            <Search className="h-8 w-8 text-text-tertiary" />
          </div>
          <p className="text-sm font-medium text-text-secondary">
            No icons found
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            Try a different search term or category.
          </p>
        </div>
      )}

      {/* Import Info */}
      <section className="space-y-3 rounded-xl border border-border-subtle bg-surface-elevated p-6">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Usage
        </h2>
        <p className="text-sm text-text-secondary">
          All icons support forwardRef for animation compatibility with GSAP
          and Motion. Import from the unified icon barrel:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#1e1e2e] p-4 text-sm">
          <code className="font-mono text-[#d4d4d4]">
            <span className="text-[#c586c0]">import</span>
            {" { "}
            <span className="text-[#d4d4d4]">Heart, Search, Bell</span>
            {" } "}
            <span className="text-[#c586c0]">from</span>{" "}
            <span className="text-[#ce9178]">
              {'"'}@/app/components/ui/icons{'"'}
            </span>
            ;
          </code>
        </pre>
        <p className="text-sm text-text-secondary">
          Social icons are imported separately:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#1e1e2e] p-4 text-sm">
          <code className="font-mono text-[#d4d4d4]">
            <span className="text-[#c586c0]">import</span>
            {" { "}
            <span className="text-[#d4d4d4]">LinkedInIcon, XIcon</span>
            {" } "}
            <span className="text-[#c586c0]">from</span>{" "}
            <span className="text-[#ce9178]">
              {'"'}@/app/components/ui/icons/SocialIcons{'"'}
            </span>
            ;
          </code>
        </pre>
      </section>

      {/* Copy Toast */}
      <CopyToast message={toastMessage} visible={toastVisible} />
    </article>
  );
}
