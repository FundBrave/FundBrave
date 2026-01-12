'use client';

import {
  useEffect,
  useRef,
  useCallback,
  type RefObject,
  type MutableRefObject,
} from 'react';

/**
 * Selector for all focusable elements
 */
const FOCUSABLE_ELEMENTS_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * useFocusTrap - Traps focus within a container element
 *
 * This hook is essential for modal dialogs, dropdown menus, and other
 * interactive elements that should contain keyboard focus. When enabled,
 * pressing Tab will cycle through focusable elements within the container
 * and prevent focus from leaving.
 *
 * WCAG 2.2 AA Compliance:
 * - Success Criterion 2.1.2 (No Keyboard Trap) - with proper escape handling
 * - Success Criterion 2.4.3 (Focus Order)
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
 *
 *   useEffect(() => {
 *     const handleEscape = (e: KeyboardEvent) => {
 *       if (e.key === 'Escape') onClose();
 *     };
 *     if (isOpen) {
 *       document.addEventListener('keydown', handleEscape);
 *       return () => document.removeEventListener('keydown', handleEscape);
 *     }
 *   }, [isOpen, onClose]);
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       <button>First focusable</button>
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * }
 * ```
 */

export interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is currently active
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether to focus the first element when the trap is activated
   * @default true
   */
  autoFocus?: boolean;

  /**
   * Whether to restore focus to the previously focused element when deactivated
   * @default true
   */
  restoreFocus?: boolean;

  /**
   * Initial element to focus (by ref or selector)
   */
  initialFocus?: RefObject<HTMLElement> | string;

  /**
   * Element to focus when deactivated (by ref)
   */
  finalFocus?: RefObject<HTMLElement>;
}

export function useFocusTrap<T extends HTMLElement>(
  enabled: boolean = true,
  options: UseFocusTrapOptions = {}
): RefObject<T | null> {
  const {
    autoFocus = true,
    restoreFocus = true,
    initialFocus,
    finalFocus,
  } = options;

  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(
        FOCUSABLE_ELEMENTS_SELECTOR
      )
    );

    // Filter out elements that are not visible
    return elements.filter(
      (el) =>
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        getComputedStyle(el).visibility !== 'hidden'
    );
  }, []);

  /**
   * Focus the first element or initial focus target
   */
  const focusInitialElement = useCallback(() => {
    if (!containerRef.current) return;

    let elementToFocus: HTMLElement | null = null;

    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        // Selector string
        elementToFocus = containerRef.current.querySelector(initialFocus);
      } else {
        // Ref
        elementToFocus = initialFocus.current;
      }
    }

    if (!elementToFocus) {
      const focusableElements = getFocusableElements();
      elementToFocus = focusableElements[0] || null;
    }

    elementToFocus?.focus();
  }, [initialFocus, getFocusableElements]);

  /**
   * Handle Tab key to trap focus
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return;
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: If on first element, move to last
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: If on last element, move to first
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [enabled, getFocusableElements]
  );

  /**
   * Save previous focus when trap is activated
   */
  useEffect(() => {
    if (enabled && restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [enabled, restoreFocus]);

  /**
   * Set up focus trap and auto-focus
   */
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Auto-focus first element
    if (autoFocus) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(focusInitialElement, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [enabled, autoFocus, focusInitialElement]);

  /**
   * Add keyboard listener for focus trapping
   */
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  /**
   * Restore focus when trap is deactivated
   */
  useEffect(() => {
    return () => {
      if (restoreFocus) {
        const focusTarget = finalFocus?.current || previousFocusRef.current;
        if (
          focusTarget &&
          typeof focusTarget.focus === 'function' &&
          document.body.contains(focusTarget)
        ) {
          // Small delay to ensure the container is unmounted
          setTimeout(() => focusTarget.focus(), 0);
        }
      }
    };
  }, [restoreFocus, finalFocus]);

  return containerRef;
}

/**
 * useFocusOnMount - Focus an element when the component mounts
 *
 * Useful for dialogs, modals, and other components that need to
 * receive focus when they appear.
 *
 * @example
 * ```tsx
 * function Dialog() {
 *   const headingRef = useFocusOnMount<HTMLHeadingElement>();
 *
 *   return (
 *     <div role="dialog">
 *       <h2 ref={headingRef} tabIndex={-1}>Dialog Title</h2>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusOnMount<T extends HTMLElement>(
  enabled: boolean = true
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (enabled && ref.current) {
      ref.current.focus();
    }
  }, [enabled]);

  return ref;
}

/**
 * useFocusReturn - Saves focus on mount and restores it on unmount
 *
 * Use this for any component that takes focus but should return
 * focus to the previous element when closed.
 *
 * @example
 * ```tsx
 * function Dropdown({ isOpen, onClose }) {
 *   useFocusReturn(isOpen);
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div role="listbox">
 *       <button onClick={onClose}>Option 1</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusReturn(enabled: boolean = true): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (enabled) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      return () => {
        const element = previousFocusRef.current;
        if (
          element &&
          typeof element.focus === 'function' &&
          document.body.contains(element)
        ) {
          setTimeout(() => element.focus(), 0);
        }
      };
    }
  }, [enabled]);
}

/**
 * useArrowKeyNavigation - Keyboard navigation for lists/grids
 *
 * Enables arrow key navigation within a container, useful for
 * menus, tabs, and other list-like components.
 *
 * @example
 * ```tsx
 * function Menu({ items }) {
 *   const { containerRef, focusedIndex, setFocusedIndex } =
 *     useArrowKeyNavigation(items.length);
 *
 *   return (
 *     <ul ref={containerRef} role="menu">
 *       {items.map((item, index) => (
 *         <li
 *           key={item.id}
 *           role="menuitem"
 *           tabIndex={index === focusedIndex ? 0 : -1}
 *         >
 *           {item.label}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export interface UseArrowKeyNavigationOptions {
  /**
   * Whether to wrap from last to first (and vice versa)
   * @default true
   */
  loop?: boolean;

  /**
   * Navigation direction
   * @default "vertical"
   */
  direction?: 'vertical' | 'horizontal' | 'both';

  /**
   * Callback when Enter/Space is pressed on focused item
   */
  onSelect?: (index: number) => void;
}

export interface ArrowKeyNavigationResult<T extends HTMLElement> {
  containerRef: MutableRefObject<T | null>;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
}

export function useArrowKeyNavigation<T extends HTMLElement>(
  itemCount: number,
  options: UseArrowKeyNavigationOptions = {}
): ArrowKeyNavigationResult<T> {
  const { loop = true, direction = 'vertical', onSelect } = options;

  const containerRef = useRef<T>(null);
  const focusedIndexRef = useRef(0);

  const setFocusedIndex = useCallback(
    (index: number) => {
      focusedIndexRef.current = index;

      // Focus the element at the new index
      if (containerRef.current) {
        const focusableElements = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            '[role="menuitem"], [role="option"], [role="tab"], button, [tabindex]'
          )
        ).filter((el) => !el.hasAttribute('disabled'));

        focusableElements[index]?.focus();
      }
    },
    [containerRef]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentIndex = focusedIndexRef.current;
      let newIndex = currentIndex;

      const isVerticalKey =
        event.key === 'ArrowUp' || event.key === 'ArrowDown';
      const isHorizontalKey =
        event.key === 'ArrowLeft' || event.key === 'ArrowRight';

      const shouldHandle =
        (direction === 'vertical' && isVerticalKey) ||
        (direction === 'horizontal' && isHorizontalKey) ||
        (direction === 'both' && (isVerticalKey || isHorizontalKey));

      if (!shouldHandle) {
        // Handle Enter/Space for selection
        if (
          (event.key === 'Enter' || event.key === ' ') &&
          onSelect
        ) {
          event.preventDefault();
          onSelect(currentIndex);
        }
        return;
      }

      event.preventDefault();

      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowRight'
      ) {
        if (currentIndex < itemCount - 1) {
          newIndex = currentIndex + 1;
        } else if (loop) {
          newIndex = 0;
        }
      } else if (
        event.key === 'ArrowUp' ||
        event.key === 'ArrowLeft'
      ) {
        if (currentIndex > 0) {
          newIndex = currentIndex - 1;
        } else if (loop) {
          newIndex = itemCount - 1;
        }
      }

      if (newIndex !== currentIndex) {
        setFocusedIndex(newIndex);
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [itemCount, loop, direction, onSelect, setFocusedIndex]);

  return {
    containerRef,
    focusedIndex: focusedIndexRef.current,
    setFocusedIndex,
  };
}

export default useFocusTrap;
