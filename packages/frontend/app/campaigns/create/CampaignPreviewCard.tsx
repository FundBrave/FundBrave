"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Clock, Check, PencilLine } from "@/app/components/ui/icons";
import { formatGoalAmount, type Currency, type BeneficiaryType } from "./schemas";

// ============================================================================
// Types
// ============================================================================

type DeviceView = "desktop" | "mobile";

interface CampaignPreviewData {
  title: string;
  category: string;
  goalAmount: string;
  currency: Currency;
  description: string;
  imagePreview: string | null;
  duration: string;
  beneficiaryType: BeneficiaryType;
  beneficiaryName: string;
  beneficiaryWallet: string;
}

interface CampaignPreviewCardProps {
  /** Campaign form data */
  data: CampaignPreviewData;
  /** Callback when edit button is clicked */
  onEdit: (step: number) => void;
  /** Optional class name */
  className?: string;
}

interface CompletionItem {
  label: string;
  isComplete: boolean;
  step: number;
}

// ============================================================================
// Device Toggle
// ============================================================================

interface DeviceToggleProps {
  view: DeviceView;
  onChange: (view: DeviceView) => void;
}

function DeviceToggle({ view, onChange }: DeviceToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-sunken rounded-lg p-1">
      <button
        type="button"
        onClick={() => onChange("desktop")}
        aria-pressed={view === "desktop"}
        className={cn(
          "flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium",
          "transition-all duration-200 active:scale-[0.98]",
          view === "desktop"
            ? "bg-primary text-white shadow-sm"
            : "text-text-secondary hover:text-foreground"
        )}
      >
        {/* Desktop icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="1" y="2" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 14H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 11V14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="hidden sm:inline">Desktop</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("mobile")}
        aria-pressed={view === "mobile"}
        className={cn(
          "flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium",
          "transition-all duration-200 active:scale-[0.98]",
          view === "mobile"
            ? "bg-primary text-white shadow-sm"
            : "text-text-secondary hover:text-foreground"
        )}
      >
        {/* Mobile icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="4" y="1" width="8" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="12" r="1" fill="currentColor" />
        </svg>
        <span className="hidden sm:inline">Mobile</span>
      </button>
    </div>
  );
}

// ============================================================================
// Edit Button
// ============================================================================

interface EditButtonProps {
  onClick: () => void;
  label: string;
}

function EditButton({ onClick, label }: EditButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-2 right-2 z-10",
        "flex items-center gap-1.5 px-3 py-2 min-h-[44px]",
        "bg-black/60 hover:bg-black/80 backdrop-blur-sm",
        "text-white text-xs font-medium rounded-md",
        "transition-all duration-150 active:scale-[0.95]",
        "opacity-0 group-hover:opacity-100",
        "focus:outline-none focus:ring-2 focus:ring-white/50 focus:opacity-100"
      )}
      aria-label={label}
    >
      <PencilLine size={12} />
      <span>Edit</span>
    </button>
  );
}

// ============================================================================
// Phone Frame (Mobile Preview)
// ============================================================================

interface PhoneFrameProps {
  children: React.ReactNode;
}

function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="flex justify-center py-4">
      <div className="relative">
        {/* Phone frame */}
        <div
          className={cn(
            "relative w-[280px] h-[560px]",
            "bg-neutral-dark-900 rounded-[32px]",
            "border-4 border-neutral-dark-700",
            "shadow-xl overflow-hidden"
          )}
        >
          {/* Notch */}
          <div
            className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 z-20",
              "w-24 h-6 bg-neutral-dark-900 rounded-b-xl"
            )}
          />

          {/* Screen content */}
          <div className="relative w-full h-full overflow-y-auto custom-scrollbar bg-background pt-6">
            {children}
          </div>

          {/* Home indicator */}
          <div
            className={cn(
              "absolute bottom-2 left-1/2 -translate-x-1/2",
              "w-24 h-1 bg-white/30 rounded-full"
            )}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Preview Content
// ============================================================================

interface PreviewContentProps {
  data: CampaignPreviewData;
  isMobile: boolean;
  onEdit: (step: number) => void;
}

function PreviewContent({ data, isMobile, onEdit }: PreviewContentProps) {
  const goalFormatted = useMemo(() => {
    const amount = parseFloat(data.goalAmount) || 0;
    return formatGoalAmount(amount, data.currency);
  }, [data.goalAmount, data.currency]);

  const truncatedWallet = useMemo(() => {
    if (!data.beneficiaryWallet) return "Not specified";
    return `${data.beneficiaryWallet.slice(0, 6)}...${data.beneficiaryWallet.slice(-4)}`;
  }, [data.beneficiaryWallet]);

  return (
    <div className="bg-surface-sunken rounded-2xl overflow-hidden border border-border-subtle">
      {/* Image section */}
      <div className={cn("relative group", isMobile ? "aspect-[4/3]" : "aspect-video")}>
        {data.imagePreview ? (
          <img
            src={data.imagePreview}
            alt={data.title || "Campaign preview"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-neutral-dark-400 flex items-center justify-center">
            <p className="text-text-tertiary text-sm">No image uploaded</p>
          </div>
        )}
        <EditButton onClick={() => onEdit(2)} label="Edit story" />
      </div>

      {/* Content */}
      <div className={cn("space-y-4", isMobile ? "p-4" : "p-6")}>
        {/* Category badge */}
        <div className="relative group">
          {data.category && (
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {data.category}
            </span>
          )}
          <EditButton onClick={() => onEdit(1)} label="Edit basics" />
        </div>

        {/* Title */}
        <h3 className={cn("font-bold text-foreground", isMobile ? "text-lg" : "text-xl")}>
          {data.title || "Campaign Title"}
        </h3>

        {/* Goal */}
        <div className="flex items-center gap-2">
          <span className={cn("font-bold text-foreground", isMobile ? "text-xl" : "text-2xl")}>
            {goalFormatted}
          </span>
          <span className="text-text-secondary text-sm">goal</span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Clock size={16} />
          <span>{data.duration} days campaign</span>
        </div>

        {/* Description preview */}
        <div className="relative group pt-4 border-t border-border-subtle">
          <h4 className="font-medium text-foreground mb-2 text-sm">About this campaign</h4>
          <p className={cn("text-text-secondary text-sm", isMobile ? "line-clamp-3" : "line-clamp-4")}>
            {data.description || "No description provided."}
          </p>
          <EditButton onClick={() => onEdit(2)} label="Edit description" />
        </div>

        {/* Beneficiary info */}
        <div className="relative group pt-4 border-t border-border-subtle">
          <h4 className="font-medium text-foreground mb-2 text-sm">Beneficiary</h4>
          <p className="text-text-secondary text-sm">
            {data.beneficiaryType === "self"
              ? "Campaign creator"
              : data.beneficiaryName || "Not specified"}
          </p>
          {data.beneficiaryWallet && (
            <p className="text-text-tertiary text-xs font-mono mt-1">{truncatedWallet}</p>
          )}
          <EditButton onClick={() => onEdit(3)} label="Edit beneficiary" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Completion Checklist
// ============================================================================

interface CompletionChecklistProps {
  items: CompletionItem[];
  onEdit: (step: number) => void;
}

function CompletionChecklist({ items, onEdit }: CompletionChecklistProps) {
  const completedCount = items.filter((item) => item.isComplete).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className="bg-surface-sunken rounded-xl border border-border-subtle p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground text-sm">Completion Status</h4>
        <span className="text-xs text-text-secondary">
          {completedCount}/{items.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-neutral-dark-400 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-brand-gradient rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Checklist items */}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  item.isComplete ? "bg-green-500" : "bg-neutral-dark-400"
                )}
              >
                {item.isComplete && <Check size={12} className="text-white" />}
              </div>
              <span
                className={cn(
                  "text-sm",
                  item.isComplete ? "text-foreground" : "text-text-tertiary"
                )}
              >
                {item.label}
              </span>
            </div>
            {!item.isComplete && (
              <button
                type="button"
                onClick={() => onEdit(item.step)}
                className="text-xs text-primary hover:underline"
              >
                Add
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CampaignPreviewCard({ data, onEdit, className }: CampaignPreviewCardProps) {
  const [deviceView, setDeviceView] = useState<DeviceView>("desktop");

  // Calculate completion status
  const completionItems: CompletionItem[] = useMemo(
    () => [
      {
        label: "Campaign title",
        isComplete: Boolean(data.title && data.title.length >= 10),
        step: 1,
      },
      {
        label: "Category selected",
        isComplete: Boolean(data.category),
        step: 1,
      },
      {
        label: "Goal amount set",
        isComplete: Boolean(data.goalAmount && parseFloat(data.goalAmount) >= 100),
        step: 1,
      },
      {
        label: "Campaign description",
        isComplete: Boolean(data.description && data.description.length >= 100),
        step: 2,
      },
      {
        label: "Cover image uploaded",
        isComplete: Boolean(data.imagePreview),
        step: 2,
      },
      {
        label: "Duration selected",
        isComplete: Boolean(data.duration),
        step: 3,
      },
      {
        label: "Wallet address added",
        isComplete: Boolean(data.beneficiaryWallet && data.beneficiaryWallet.length === 42),
        step: 3,
      },
    ],
    [data]
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with device toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Preview Your Campaign</h2>
          <p className="text-text-secondary mt-1">
            Review your campaign before publishing. Click edit buttons to make changes.
          </p>
        </div>
        <DeviceToggle view={deviceView} onChange={setDeviceView} />
      </div>

      {/* Preview content */}
      <div className="grid lg:grid-cols-[1fr,280px] gap-6">
        {/* Main preview */}
        <div>
          <AnimatePresence mode="wait">
            {deviceView === "mobile" ? (
              <motion.div
                key="mobile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <PhoneFrame>
                  <PreviewContent data={data} isMobile={true} onEdit={onEdit} />
                </PhoneFrame>
              </motion.div>
            ) : (
              <motion.div
                key="desktop"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <PreviewContent data={data} isMobile={false} onEdit={onEdit} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Completion checklist - desktop only */}
        <div className="hidden lg:block">
          <CompletionChecklist items={completionItems} onEdit={onEdit} />
        </div>
      </div>

      {/* Mobile completion checklist */}
      <div className="lg:hidden">
        <CompletionChecklist items={completionItems} onEdit={onEdit} />
      </div>
    </div>
  );
}

export default CampaignPreviewCard;
