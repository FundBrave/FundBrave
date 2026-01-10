/**
 * Sanitization utilities for OAuth data and user inputs
 * Protects against XSS attacks (CWE-79)
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize OAuth data received from authentication providers
 * Prevents XSS attacks by cleaning email, username, and displayName
 */
export function sanitizeOAuthData(data: {
  email?: string;
  username?: string;
  displayName?: string;
}): typeof data {
  return {
    email: sanitizeEmail(data.email),
    username: sanitizeText(data.username),
    displayName: sanitizeText(data.displayName),
  };
}

/**
 * Sanitize email address
 * Validates format and removes any malicious content
 */
function sanitizeEmail(email?: string): string | undefined {
  if (!email) return undefined;

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    console.warn('Invalid email format detected');
    return undefined;
  }

  // Sanitize using DOMPurify (remove all HTML tags)
  return DOMPurify.sanitize(email, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize text fields (username, displayName, etc.)
 * Removes HTML tags and detects XSS attempts
 */
function sanitizeText(text?: string): string | undefined {
  if (!text) return undefined;

  // Check for common XSS patterns
  if (/<script|javascript:|onerror|onload|onclick|oninput/i.test(text)) {
    console.warn('XSS attempt detected in text field');
    return 'User'; // Safe default
  }

  // Sanitize using DOMPurify (remove all HTML tags and attributes)
  const sanitized = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  return sanitized.trim();
}

/**
 * Sanitize general user input
 * Can be used for form inputs, search queries, etc.
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';

  // Remove potentially dangerous content
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep text content
  });

  return sanitized.trim();
}

/**
 * Sanitize HTML content (for rich text editors)
 * Allows safe HTML tags while blocking dangerous ones
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  });
}
