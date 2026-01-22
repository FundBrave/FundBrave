"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaVerificationResponse } from "@/app/lib/ai-service";

// ============================================================================
// Types
// ============================================================================

export interface ImageVerificationBadgeProps {
  /** Verification result from AI service */
  result: MediaVerificationResponse | null;
  /** Whether verification is in progress */
  isVerifying: boolean;
  /** Error message if verification failed */
  error: string | null;
  /** Whether to show detailed breakdown */
  showDetails?: boolean;
  /** Callback to retry verification */
  onRetry?: () => void;
  /** Callback to dismiss the badge */
  onDismiss?: () => void;
  /** Optional class name */
  className?: string;
  /** Compact mode for inline display */
  compact?: boolean;
}

// ============================================================================
// Helper functions
// ============================================================================

function getVerificationStatus(result: MediaVerificationResponse) {
  if (result.is_authentic && result.confidence >= 0.9) {
    return "verified";
  } else if (result.is_authentic && result.confidence >= 0.7) {
    return "likely_authentic";
  } else if (!result.is_authentic && result.confidence >= 0.7) {
    return "suspicious";
  } else {
    return "review_needed";
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "verified":
      return {
        icon: ShieldCheck,
        label: "Verified Authentic",
        description: "This image passed our AI verification checks.",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        textColor: "text-green-500",
        iconColor: "text-green-500",
      };
    case "likely_authentic":
      return {
        icon: Shield,
        label: "Likely Authentic",
        description: "This image appears to be authentic but couldn't be fully verified.",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        textColor: "text-blue-500",
        iconColor: "text-blue-500",
      };
    case "suspicious":
      return {
        icon: ShieldAlert,
        label: "Potentially Manipulated",
        description: "This image may have been digitally altered or generated.",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        textColor: "text-red-500",
        iconColor: "text-red-500",
      };
    case "review_needed":
      return {
        icon: AlertTriangle,
        label: "Review Required",
        description: "We couldn't determine the authenticity of this image.",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        textColor: "text-yellow-500",
        iconColor: "text-yellow-500",
      };
    default:
      return {
        icon: Info,
        label: "Unknown",
        description: "Verification status unknown.",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-500/30",
        textColor: "text-gray-500",
        iconColor: "text-gray-500",
      };
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function ImageVerificationBadge({
  result,
  isVerifying,
  error,
  showDetails = false,
  onRetry,
  onDismiss,
  className,
  compact = false,
}: ImageVerificationBadgeProps) {
  // Loading state
  if (isVerifying) {
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
        <span className="text-sm font-medium text-primary">
          {compact ? "Verifying..." : "Verifying image authenticity..."}
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
          "flex items-center justify-between gap-2 px-3 py-2 rounded-lg",
          "bg-destructive/10 border border-destructive/30",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">
            {compact ? "Verification failed" : error}
          </span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-destructive hover:underline"
          >
            Retry
          </button>
        )}
      </motion.div>
    );
  }

  // No result
  if (!result) {
    return null;
  }

  const status = getVerificationStatus(result);
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

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
        <StatusIcon className={cn("w-3.5 h-3.5", config.iconColor)} />
        <span className={cn("text-xs font-medium", config.textColor)}>
          {Math.round(result.confidence * 100)}%
        </span>
      </motion.div>
    );
  }

  // Full badge
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
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("w-5 h-5", config.iconColor)} />
          <div>
            <p className={cn("text-sm font-semibold", config.textColor)}>
              {config.label}
            </p>
            <p className="text-xs text-text-secondary">
              {Math.round(result.confidence * 100)}% confidence
            </p>
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

      {/* Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-3 space-y-2">
              <p className="text-xs text-text-secondary">{config.description}</p>

              {result.analysis && (
                <div className="text-xs text-text-secondary">
                  <span className="font-medium">Analysis:</span> {result.analysis}
                </div>
              )}

              {result.requires_review && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Manual review recommended</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Inline Verification Status
// ============================================================================

export function InlineVerificationStatus({
  result,
  isVerifying,
}: {
  result: MediaVerificationResponse | null;
  isVerifying: boolean;
}) {
  if (isVerifying) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-primary">
        <Loader2 className="w-3 h-3 animate-spin" />
        Verifying
      </span>
    );
  }

  if (!result) return null;

  const status = getVerificationStatus(result);
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", config.textColor)}>
      <StatusIcon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default ImageVerificationBadge;
