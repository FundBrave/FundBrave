"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModerationResponse } from "@/app/lib/ai-service";

// ============================================================================
// Types
// ============================================================================

export interface ContentModerationWarningProps {
  /** Moderation result from AI service */
  result: ModerationResponse | null;
  /** Whether moderation check is in progress */
  isChecking: boolean;
  /** Error message if moderation check failed */
  error: string | null;
  /** Callback to dismiss the warning */
  onDismiss?: () => void;
  /** Callback to edit content */
  onEdit?: () => void;
  /** Callback to proceed anyway */
  onProceed?: () => void;
  /** Whether user can proceed with flagged content */
  allowProceed?: boolean;
  /** Optional class name */
  className?: string;
  /** Compact mode for inline display */
  compact?: boolean;
}

// ============================================================================
// Helper functions
// ============================================================================

function getActionConfig(action: ModerationResponse["action"]) {
  switch (action) {
    case "approve":
      return {
        icon: CheckCircle,
        label: "Content Approved",
        description: "Your content meets our community guidelines.",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        textColor: "text-green-500",
        showActions: false,
      };
    case "flag":
      return {
        icon: AlertTriangle,
        label: "Content Flagged",
        description:
          "Your content has been flagged and will be reviewed by our moderation team.",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        textColor: "text-yellow-500",
        showActions: true,
      };
    case "reject":
      return {
        icon: XCircle,
        label: "Content Rejected",
        description:
          "Your content violates our community guidelines and cannot be posted.",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        textColor: "text-red-500",
        showActions: true,
      };
    case "quarantine":
      return {
        icon: AlertCircle,
        label: "Under Review",
        description: "Your content requires additional review before it can be posted.",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        textColor: "text-orange-500",
        showActions: true,
      };
    default:
      return {
        icon: Info,
        label: "Unknown Status",
        description: "Content moderation status unknown.",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-500/30",
        textColor: "text-gray-500",
        showActions: false,
      };
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    toxicity: "Toxic Language",
    severe_toxicity: "Severe Toxicity",
    threat: "Threatening Content",
    profanity: "Profanity",
    spam: "Spam",
    blocked_terms: "Blocked Terms",
    misleading: "Misleading Content",
    inappropriate: "Inappropriate Content",
    policy: "Policy Violation",
    insult: "Insult",
    identity_attack: "Identity Attack",
  };
  return labels[category] || category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// ============================================================================
// Main Component
// ============================================================================

export function ContentModerationWarning({
  result,
  isChecking,
  error,
  onDismiss,
  onEdit,
  onProceed,
  allowProceed = false,
  className,
  compact = false,
}: ContentModerationWarningProps) {
  // Loading state
  if (isChecking) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-primary/10 border border-primary/30",
          className
        )}
      >
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
        <span className="text-sm text-primary">
          {compact ? "Checking..." : "Checking content..."}
        </span>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-destructive/10 border border-destructive/30",
          className
        )}
      >
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="text-sm text-destructive">
          {compact ? "Check failed" : error}
        </span>
      </motion.div>
    );
  }

  // No result or approved (don't show for approved content)
  if (!result || result.is_safe) {
    return null;
  }

  const config = getActionConfig(result.action);
  const ActionIcon = config.icon;

  // Get triggered categories
  const triggeredCategories = result.categories.filter((c) => c.triggered);

  // Compact mode
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full",
          config.bgColor,
          "border",
          config.borderColor,
          className
        )}
      >
        <ActionIcon className={cn("w-3.5 h-3.5", config.textColor)} />
        <span className={cn("text-xs font-medium", config.textColor)}>{config.label}</span>
      </motion.div>
    );
  }

  // Full warning
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border overflow-hidden",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-start gap-3">
          <ActionIcon className={cn("w-5 h-5 mt-0.5", config.textColor)} />
          <div>
            <p className={cn("text-sm font-semibold", config.textColor)}>{config.label}</p>
            <p className="text-sm text-text-secondary mt-1">{config.description}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        )}
      </div>

      {/* Triggered categories */}
      {triggeredCategories.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-medium text-text-secondary mb-2">Issues detected:</p>
          <div className="flex flex-wrap gap-2">
            {triggeredCategories.map((cat, index) => (
              <span
                key={index}
                className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs",
                  "bg-white/10 text-text-secondary"
                )}
              >
                {getCategoryLabel(cat.category)}
                <span className="ml-1 opacity-60">({Math.round(cat.score * 100)}%)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reasons */}
      {result.reasons.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-medium text-text-secondary mb-1">Details:</p>
          <ul className="text-xs text-text-secondary space-y-1">
            {result.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="text-text-tertiary">-</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-medium text-text-secondary mb-1">Suggestions:</p>
          <ul className="text-xs text-text-secondary space-y-1">
            {result.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="text-primary">-</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {config.showActions && (onEdit || (onProceed && allowProceed)) && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
          {onEdit && (
            <button
              onClick={onEdit}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium",
                "bg-white/10 hover:bg-white/20 transition-colors",
                "text-foreground"
              )}
            >
              Edit Content
            </button>
          )}
          {onProceed && allowProceed && result.action === "flag" && (
            <button
              onClick={onProceed}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium",
                "text-text-secondary hover:text-foreground transition-colors"
              )}
            >
              Post Anyway
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Inline Moderation Status
// ============================================================================

export function InlineModerationStatus({
  result,
  isChecking,
}: {
  result: ModerationResponse | null;
  isChecking: boolean;
}) {
  if (isChecking) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-primary">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking
      </span>
    );
  }

  if (!result) return null;
  if (result.is_safe) return null;

  const config = getActionConfig(result.action);
  const ActionIcon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", config.textColor)}>
      <ActionIcon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default ContentModerationWarning;
