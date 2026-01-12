'use client';

import { useCallback, type KeyboardEvent } from 'react';
import { cn } from '@/app/lib/utils';

/**
 * SkipLink - Accessibility component that allows keyboard users to skip navigation
 *
 * This component is visually hidden by default but becomes visible when focused.
 * It provides a quick way for keyboard users to jump directly to the main content
 * without having to tab through all navigation elements.
 *
 * WCAG 2.2 AA Compliance:
 * - Success Criterion 2.4.1 (Bypass Blocks)
 * - Success Criterion 2.4.3 (Focus Order)
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <body>
 *   <SkipLink />
 *   <Header />
 *   <main id="main-content">...</main>
 * </body>
 * ```
 */

export interface SkipLinkProps {
  /**
   * The ID of the element to skip to
   * @default "main-content"
   */
  targetId?: string;

  /**
   * The label text displayed in the skip link
   * @default "Skip to main content"
   */
  label?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SkipLink({
  targetId = 'main-content',
  label = 'Skip to main content',
  className,
}: SkipLinkProps) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      const target = document.getElementById(targetId);
      if (target) {
        // Set tabindex to make the element focusable if it isn't already
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }

        // Focus the target element
        target.focus();

        // Scroll into view with smooth behavior (respects prefers-reduced-motion)
        target.scrollIntoView({
          behavior: 'auto', // Use 'auto' to respect reduced motion preferences
          block: 'start',
        });
      }
    },
    [targetId]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>) => {
      // Handle Enter key press
      if (event.key === 'Enter') {
        const target = document.getElementById(targetId);
        if (target) {
          event.preventDefault();

          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
          }

          target.focus();
          target.scrollIntoView({
            behavior: 'auto',
            block: 'start',
          });
        }
      }
    },
    [targetId]
  );

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Visible on focus
        'focus:not-sr-only',
        'focus:fixed',
        'focus:top-4',
        'focus:left-4',
        'focus:z-[9999]',
        // Styling
        'focus:px-4',
        'focus:py-3',
        'focus:bg-primary',
        'focus:text-white',
        'focus:font-semibold',
        'focus:text-sm',
        'focus:rounded-lg',
        'focus:shadow-lg',
        'focus:outline-none',
        // Focus ring for visibility
        'focus:ring-2',
        'focus:ring-white',
        'focus:ring-offset-2',
        'focus:ring-offset-primary',
        // Ensure touch target size
        'focus:min-h-[44px]',
        'focus:min-w-[44px]',
        // Transition
        'transition-all',
        'duration-200',
        className
      )}
    >
      {label}
    </a>
  );
}

/**
 * SkipLinks - Component for multiple skip links
 *
 * Use this when you have multiple sections users might want to skip to.
 *
 * @example
 * ```tsx
 * <SkipLinks
 *   links={[
 *     { targetId: 'main-content', label: 'Skip to main content' },
 *     { targetId: 'main-nav', label: 'Skip to navigation' },
 *     { targetId: 'footer', label: 'Skip to footer' },
 *   ]}
 * />
 * ```
 */
export interface SkipLinksProps {
  links: Array<{
    targetId: string;
    label: string;
  }>;
  className?: string;
}

export function SkipLinks({ links, className }: SkipLinksProps) {
  return (
    <div className={cn('skip-links-container', className)}>
      {links.map((link, index) => (
        <SkipLink
          key={link.targetId}
          targetId={link.targetId}
          label={link.label}
          className={index > 0 ? 'focus:left-auto focus:ml-[200px]' : undefined}
        />
      ))}
    </div>
  );
}

export default SkipLink;
