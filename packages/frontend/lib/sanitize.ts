/**
 * Sanitization utilities for OAuth data and user inputs
 * Protects against XSS attacks (CWE-79)
 *
 * Uses regex-based sanitization instead of DOMPurify to avoid dependencies
 */

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

  // Remove all HTML tags and limit length
  return email.replace(/<[^>]*>/g, '').slice(0, 100);
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

  // Remove all HTML tags, attributes, and limit length
  const sanitized = text.replace(/<[^>]*>/g, '').slice(0, 100);

  return sanitized.trim();
}

/**
 * Sanitize general user input
 * Can be used for form inputs, search queries, etc.
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';

  // Remove potentially dangerous content (HTML tags and scripts)
  const sanitized = input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length

  return sanitized.trim();
}

/**
 * Sanitize HTML content (for rich text editors)
 * Allows safe HTML tags while blocking dangerous ones
 * Note: For production, consider using a proper HTML sanitization library
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove dangerous tags and attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .slice(0, 10000); // Limit length
}
