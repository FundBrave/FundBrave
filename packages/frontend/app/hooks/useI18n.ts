'use client';

import { useTranslations, useFormatter, useNow, useTimeZone, useLocale } from 'next-intl';

/**
 * Custom hook that wraps next-intl hooks for common i18n use cases.
 *
 * This provides a consistent API across the application and adds
 * helper functions for common formatting patterns.
 */
export function useI18n() {
  const locale = useLocale();
  const format = useFormatter();
  const now = useNow();
  const timeZone = useTimeZone();

  /**
   * Format a number as currency (USD)
   */
  const formatCurrency = (amount: number, currency = 'USD') => {
    return format.number(amount, {
      style: 'currency',
      currency,
    });
  };

  /**
   * Format a number as a percentage
   */
  const formatPercent = (value: number, decimals = 0) => {
    return format.number(value / 100, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  /**
   * Format a number in compact notation (e.g., 1.2K, 1.5M)
   */
  const formatCompact = (value: number) => {
    return format.number(value, {
      notation: 'compact',
      compactDisplay: 'short',
    });
  };

  /**
   * Format a date in short format
   */
  const formatDateShort = (date: Date | number) => {
    return format.dateTime(date, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Format a date in long format with time
   */
  const formatDateLong = (date: Date | number) => {
    return format.dateTime(date, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   */
  const formatRelativeTime = (date: Date | number) => {
    return format.relativeTime(date);
  };

  /**
   * Format a list of items (e.g., "A, B, and C")
   */
  const formatList = (items: string[], style: 'conjunction' | 'disjunction' = 'conjunction') => {
    return format.list(items, { type: style });
  };

  return {
    locale,
    format,
    now,
    timeZone,
    formatCurrency,
    formatPercent,
    formatCompact,
    formatDateShort,
    formatDateLong,
    formatRelativeTime,
    formatList,
  };
}

/**
 * Re-export useTranslations for convenience
 *
 * @example
 * // In a component
 * const t = useTranslations('campaigns.browse');
 * return <h1>{t('title')}</h1>;
 */
export { useTranslations, useFormatter, useNow, useTimeZone, useLocale };

/**
 * Type-safe translation helper
 *
 * This type can be used to ensure translation keys are valid.
 * Import your messages type from the generated types.
 */
export type TranslationKey = string;
