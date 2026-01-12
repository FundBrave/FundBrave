import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, timeZone, formats } from './config';

/**
 * Server-side i18n configuration for next-intl
 *
 * This is called for each request and provides the messages
 * and configuration for server components.
 */
export default getRequestConfig(async () => {
  // For Phase 1, we only support English
  // In Phase 2, this will detect the user's locale from headers/cookies
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone,
    formats,
    // Configure how dates and numbers are formatted
    now: new Date(),
    // Error handling for missing translations
    onError(error) {
      // In development, log warnings for missing translations
      if (process.env.NODE_ENV === 'development') {
        console.warn('[next-intl]', error.message);
      }
    },
    // Return the translation key when a translation is missing
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter(Boolean).join('.');
      if (process.env.NODE_ENV === 'development') {
        return `[Missing: ${path}]`;
      }
      // In production, return the key without the "Missing" prefix
      return key;
    },
  };
});
