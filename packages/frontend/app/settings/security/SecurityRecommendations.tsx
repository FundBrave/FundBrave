"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { priorityConfig, type SecurityRecommendation } from "./schemas";

/**
 * Inline SVG Icons
 */
const icons = {
  shieldCheck: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  chevronRight: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

export interface SecurityRecommendationsProps {
  /** List of security recommendations */
  recommendations: SecurityRecommendation[];
}

/**
 * SecurityRecommendations - Dynamic security checklist
 *
 * Features:
 * - Display security recommendations based on account state
 * - Priority indicators (critical, high, medium, low)
 * - Action buttons to complete tasks
 * - Progress indicator
 *
 * Based on PHASE2_UX_SPECS.md Section 4.8
 */
export function SecurityRecommendations({
  recommendations,
}: SecurityRecommendationsProps) {
  const completedCount = recommendations.filter((r) => r.isComplete).length;
  const totalCount = recommendations.length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 100;

  return (
    <section className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
      {/* Section Header */}
      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/10">
        <span className="text-primary">{icons.shieldCheck}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            Security Recommendations
          </h3>
          <p className="text-sm text-text-secondary mt-0.5">
            Strengthen your account security
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Security Score
            </span>
            <span className="text-sm text-text-secondary">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progressPercentage === 100
                  ? "bg-green-500"
                  : progressPercentage >= 50
                  ? "bg-purple-500"
                  : "bg-yellow-500"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="flex flex-col gap-2">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-all",
              recommendation.isComplete
                ? "border-green-500/30 bg-green-500/5"
                : "border-white/10 bg-surface-sunken/30 hover:border-white/20"
            )}
          >
            {/* Checkbox/Check Icon */}
            <div className="mt-0.5">
              {recommendation.isComplete ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white">{icons.check}</span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-white/30" />
              )}
            </div>

            {/* Recommendation Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={cn(
                        "text-sm font-semibold",
                        recommendation.isComplete
                          ? "text-text-secondary line-through"
                          : "text-foreground"
                      )}
                    >
                      {recommendation.title}
                    </h4>
                    {!recommendation.isComplete && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          priorityConfig[recommendation.priority].bgColor,
                          priorityConfig[recommendation.priority].textColor
                        )}
                      >
                        {recommendation.priority.charAt(0).toUpperCase() +
                          recommendation.priority.slice(1)}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-xs",
                      recommendation.isComplete
                        ? "text-text-tertiary"
                        : "text-text-secondary"
                    )}
                  >
                    {recommendation.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              {!recommendation.isComplete && (
                <div className="mt-3">
                  {recommendation.actionUrl.startsWith("#") ? (
                    <a
                      href={recommendation.actionUrl}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {recommendation.action}
                      {icons.chevronRight}
                    </a>
                  ) : (
                    <Link
                      href={recommendation.actionUrl}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {recommendation.action}
                      {icons.chevronRight}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty State - All Complete */}
        {totalCount === 0 || completedCount === totalCount ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 p-4 rounded-full bg-green-500/10">
              <span className="text-green-400">{icons.shieldCheck}</span>
            </div>
            <h4 className="text-base font-semibold text-foreground mb-1">
              All set!
            </h4>
            <p className="text-sm text-text-secondary max-w-xs">
              Your account security is up to date. We'll let you know if there are any new recommendations.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default SecurityRecommendations;
