"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

interface BackHeaderProps {
  title: string;
  subtitle?: string;
  fallbackHref?: string;
  className?: string;
  sticky?: boolean;
  /** Sticky top position - "top-0" for pages without navbar, "top-20" with navbar */
  stickyTop?: "top-0" | "top-20";
}

export function BackHeader({
  title,
  subtitle,
  fallbackHref = "/",
  className,
  sticky = true,
  stickyTop = "top-0",
}: BackHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <header
      className={cn(
        "flex items-center gap-4 px-4 py-3 bg-background/95 backdrop-blur-sm",
        "border-b border-[var(--border-subtle)]",
        sticky && `sticky ${stickyTop} z-40`,
        className
      )}
    >
      <button
        onClick={handleBack}
        className={cn(
          "size-10 rounded-full flex items-center justify-center",
          "hover:bg-surface-overlay active:bg-foreground/15 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        )}
        aria-label="Go back"
      >
        <ArrowLeft size={20} className="text-foreground" />
      </button>

      <div className="flex flex-col min-w-0">
        <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
        {subtitle && (
          <span className="text-sm text-text-secondary truncate">{subtitle}</span>
        )}
      </div>
    </header>
  );
}

export default BackHeader;
