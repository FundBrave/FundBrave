/**
 * i18n Configuration
 *
 * Defines the supported locales and default locale for the application.
 * Currently supports English only; additional locales can be added in Phase 2.
 */

export const locales = ['en'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

/**
 * Time zone configuration for date/time formatting
 */
export const timeZone = 'UTC';

/**
 * Number formatting configuration
 */
export const formats = {
  dateTime: {
    short: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
  },
  number: {
    currency: {
      style: 'currency',
      currency: 'USD',
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    },
    compact: {
      notation: 'compact',
      compactDisplay: 'short',
    },
  },
} as const;
