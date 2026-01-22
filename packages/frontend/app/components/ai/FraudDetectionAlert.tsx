"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import type { FraudCheckResponse } from "@/app/lib/ai-service";

// ============================================================================
// Types
// ============================================================================

export interface FraudDetectionAlertProps {
  /** Fraud check result from AI service */
  result: FraudCheckResponse | null;
  /** Whether fraud check is in progress */
  isChecking: boolean;
  /** Error message if fraud check failed */
  error: string | null;
  /** Callback to retry fraud check */
  onRetry?: () => void;
  /** Callback to dismiss the alert */
  onDismiss?: () => void;
  /** Callback to report fraud */
  onReport?: () => void;
  /** Optional class name */
  className?: string;
  /** Show as compact badge */
  compact?: boolean;
  /** Whether to show in campaign card */
  inCampaignCard?: boolean;
}

// ============================================================================
// Helper functions
// ============================================================================

function getRiskConfig(riskLevel: FraudCheckResponse["risk_level"]) {
  switch (riskLevel) {
    case "low":
      return {
        icon: ShieldCheck,
        label: "Low Risk",
        shortLabel: "Safe",
        description: "This campaign shows no signs of fraudulent activity.",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        textColor: "text-green-500",
        badgeBg: "bg-green-500/20",
      };
    case "medium":
      return {
        icon: Info,
        label: "Medium Risk",
        shortLabel: "Review",
        description:
          "This campaign has some characteristics that warrant caution. Please verify before donating.",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        textColor: "text-yellow-500",
        badgeBg: "bg-yellow-500/20",
      };
    case "high":
      return {
        icon: AlertTriangle,
        label: "High Risk",
        shortLabel: "Warning",
        description:
          "This campaign has multiple indicators of potential fraud. Exercise extreme caution.",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        textColor: "text-orange-500",
        badgeBg: "bg-orange-500/20",
      };
    case "critical":
      return {
        icon: AlertOctagon,
        label: "Critical Risk",
        shortLabel: "Danger",
        description:
          "This campaign has been flagged for serious fraud indicators. We recommend not donating.",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        textColor: "text-red-500",
        badgeBg: "bg-red-500/20",
      };
    default:
      return {
        icon: ShieldAlert,
        label: "Unknown",
        shortLabel: "Unknown",
        description: "Risk assessment unavailable.",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-500/30",
        textColor: "text-gray-500",
        badgeBg: "bg-gray-500/20",
      };
  }
}

function getSeverityConfig(severity: string) {
  switch (severity.toLowerCase()) {
    case "low":
      return { color: "text-yellow-500", icon: Info };
    case "medium":
      return { color: "text-orange-500", icon: AlertTriangle };
    case "high":
      return { color: "text-red-500", icon: AlertOctagon };
    case "critical":
      return { color: "text-red-600", icon: AlertOctagon };
    default:
      return { color: "text-text-secondary", icon: Info };
  }
}

// ============================================================================
// Risk Score Meter
// ============================================================================

function RiskScoreMeter({ score }: { score: number }) {
  const percentage = Math.min(100, Math.max(0, score * 100));
  const getColor = () => {
    if (percentage < 30) return "bg-green-500";
    if (percentage < 60) return "bg-yellow-500";
    if (percentage < 80) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getColor())}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-medium text-text-secondary w-12 text-right">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

// ============================================================================
// Compact Risk Badge
// ============================================================================

export function FraudRiskBadge({
  result,
  isChecking,
  className,
}: {
  result: FraudCheckResponse | null;
  isChecking: boolean;
  className?: string;
}) {
  if (isChecking) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
          "bg-primary/20 text-primary",
          className
        )}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking
      </span>
    );
  }

  if (!result) return null;

  const config = getRiskConfig(result.risk_level);
  const RiskIcon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        config.badgeBg,
        config.textColor,
        className
      )}
    >
      <RiskIcon className="w-3 h-3" />
      {config.shortLabel}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function FraudDetectionAlert({
  result,
  isChecking,
  error,
  onRetry,
  onDismiss,
  onReport,
  className,
  compact = false,
  inCampaignCard = false,
}: FraudDetectionAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          {compact ? "Analyzing..." : "Analyzing campaign for fraud indicators..."}
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
            {compact ? "Analysis failed" : error}
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
  if (!result) return null;

  const config = getRiskConfig(result.risk_level);
  const RiskIcon = config.icon;

  // Don't show low risk alerts in campaign cards
  if (inCampaignCard && result.risk_level === "low") {
    return null;
  }

  // Compact mode - just a badge
  if (compact) {
    return <FraudRiskBadge result={result} isChecking={false} className={className} />;
  }

  // Full alert
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
          <RiskIcon className={cn("w-5 h-5 mt-0.5", config.textColor)} />
          <div className="flex-1">
            <p className={cn("text-sm font-semibold", config.textColor)}>
              {config.label}
            </p>
            <p className="text-sm text-text-secondary mt-1">{config.description}</p>

            {/* Risk Score */}
            <div className="mt-3">
              <p className="text-xs font-medium text-text-secondary mb-1">Risk Score</p>
              <RiskScoreMeter score={result.risk_score} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand/Collapse */}
          {result.indicators.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-text-secondary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-secondary" />
              )}
            </button>
          )}

          {/* Dismiss */}
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
      </div>

      {/* Indicators (expandable) */}
      <AnimatePresence>
        {isExpanded && result.indicators.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-4">
              <p className="text-xs font-medium text-text-secondary mb-3">
                Risk Indicators ({result.indicators.length})
              </p>
              <div className="space-y-3">
                {result.indicators.map((indicator, index) => {
                  const severityConfig = getSeverityConfig(indicator.severity);
                  const IndicatorIcon = severityConfig.icon;

                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
                    >
                      <IndicatorIcon
                        className={cn("w-4 h-4 mt-0.5 flex-shrink-0", severityConfig.color)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {indicator.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              severityConfig.color,
                              "bg-white/10"
                            )}
                          >
                            {indicator.severity}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">
                          {indicator.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-medium text-text-secondary mb-2">Recommendations:</p>
          <ul className="space-y-1">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="text-primary">-</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {(onReport || result.requires_review) && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-white/10">
          {result.requires_review && (
            <span className="text-xs text-text-secondary">
              This campaign is under review by our team.
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {onReport && result.risk_level !== "low" && (
              <Button variant="outline" size="sm" onClick={onReport} className="gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Report
              </Button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Inline Risk Indicator
// ============================================================================

export function InlineRiskIndicator({
  riskLevel,
  className,
}: {
  riskLevel: FraudCheckResponse["risk_level"];
  className?: string;
}) {
  const config = getRiskConfig(riskLevel);
  const RiskIcon = config.icon;

  // Don't show for low risk
  if (riskLevel === "low") return null;

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs", config.textColor, className)}
      title={config.label}
    >
      <RiskIcon className="w-3 h-3" />
      {config.shortLabel}
    </span>
  );
}

export default FraudDetectionAlert;
