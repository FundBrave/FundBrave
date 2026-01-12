import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/app/lib/utils';

/**
 * VisuallyHidden - Renders content that is visually hidden but accessible to screen readers
 *
 * This component is essential for providing context to screen reader users without
 * cluttering the visual interface. It's commonly used for:
 * - Icon-only buttons that need accessible labels
 * - Form field hints and instructions
 * - Status updates and announcements
 * - Skip link targets
 *
 * WCAG 2.2 AA Compliance:
 * - Success Criterion 1.3.1 (Info and Relationships)
 * - Success Criterion 4.1.2 (Name, Role, Value)
 *
 * @example
 * ```tsx
 * // Icon button with accessible label
 * <button>
 *   <SearchIcon aria-hidden="true" />
 *   <VisuallyHidden>Search</VisuallyHidden>
 * </button>
 *
 * // Form field with hidden hint
 * <label htmlFor="password">Password</label>
 * <VisuallyHidden id="password-hint">
 *   Must be at least 8 characters with one number
 * </VisuallyHidden>
 * <input id="password" aria-describedby="password-hint" />
 * ```
 */

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * The content to be hidden visually but accessible to screen readers
   */
  children: ReactNode;

  /**
   * The HTML element to render
   * @default "span"
   */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';

  /**
   * If true, the element becomes visible when focused (useful for skip links)
   * @default false
   */
  focusable?: boolean;
}

export function VisuallyHidden({
  children,
  as: Component = 'span',
  focusable = false,
  className,
  ...props
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        // Screen reader only styles - matches Tailwind's sr-only
        'absolute',
        'w-px',
        'h-px',
        'p-0',
        '-m-px',
        'overflow-hidden',
        'whitespace-nowrap',
        'border-0',
        '[clip:rect(0,0,0,0)]',
        // If focusable, show on focus
        focusable && [
          'focus:static',
          'focus:w-auto',
          'focus:h-auto',
          'focus:p-2',
          'focus:m-0',
          'focus:overflow-visible',
          'focus:whitespace-normal',
          'focus:[clip:auto]',
        ],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * LiveRegion - Announces dynamic content changes to screen readers
 *
 * This component creates an ARIA live region that announces content changes
 * to screen reader users. Use it for status updates, form validation messages,
 * and other dynamic content that users need to be aware of.
 *
 * @example
 * ```tsx
 * // Polite announcement (doesn't interrupt)
 * <LiveRegion>
 *   {isLoading ? 'Loading content...' : 'Content loaded'}
 * </LiveRegion>
 *
 * // Assertive announcement (interrupts)
 * <LiveRegion priority="assertive">
 *   {error && `Error: ${error.message}`}
 * </LiveRegion>
 * ```
 */

export interface LiveRegionProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The content to announce
   */
  children: ReactNode;

  /**
   * The priority of the announcement
   * - "polite": Waits for the user to finish their current task
   * - "assertive": Interrupts the user immediately (use sparingly)
   * @default "polite"
   */
  priority?: 'polite' | 'assertive';

  /**
   * Whether the entire region should be announced when content changes
   * @default true
   */
  atomic?: boolean;

  /**
   * Whether the region is visually hidden
   * @default true
   */
  visuallyHidden?: boolean;
}

export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  visuallyHidden = true,
  className,
  ...props
}: LiveRegionProps) {
  const content = (
    <div
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic={atomic}
      className={cn(!visuallyHidden && className)}
      {...props}
    >
      {children}
    </div>
  );

  if (visuallyHidden) {
    return <VisuallyHidden as="div">{content}</VisuallyHidden>;
  }

  return content;
}

/**
 * Announcement - Creates a one-time screen reader announcement
 *
 * This component is useful for announcing one-time events like:
 * - Form submission success/error
 * - Navigation changes
 * - Action confirmations
 *
 * @example
 * ```tsx
 * {showSuccess && (
 *   <Announcement message="Your changes have been saved" />
 * )}
 * ```
 */

export interface AnnouncementProps {
  /**
   * The message to announce
   */
  message: string;

  /**
   * The priority of the announcement
   * @default "polite"
   */
  priority?: 'polite' | 'assertive';
}

export function Announcement({
  message,
  priority = 'polite',
}: AnnouncementProps) {
  return (
    <LiveRegion priority={priority} visuallyHidden>
      {message}
    </LiveRegion>
  );
}

export default VisuallyHidden;
