/**
 * Accessibility Utilities for FundBrave
 * Provides utilities for keyboard navigation, focus management, and screen reader support
 */

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  container.addEventListener("keydown", handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(
  container: HTMLElement
): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    )
  );

  return elements.filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.offsetWidth > 0 &&
      el.offsetHeight > 0
  );
}

/**
 * Move focus to the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container);
  focusableElements[0]?.focus();
}

/**
 * Announce message to screen readers using aria-live
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.setAttribute("class", "sr-only");
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Create a visually hidden element for screen readers only
 */
export function createScreenReaderOnly(text: string): HTMLElement {
  const element = document.createElement("span");
  element.className = "sr-only";
  element.textContent = text;
  return element;
}

/**
 * Handle keyboard navigation for custom components
 */
export interface KeyboardNavigationConfig {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shiftKey: boolean) => void;
}

export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  config: KeyboardNavigationConfig
): void {
  switch (event.key) {
    case "Enter":
      config.onEnter?.();
      break;
    case " ":
      event.preventDefault(); // Prevent page scroll
      config.onSpace?.();
      break;
    case "Escape":
      config.onEscape?.();
      break;
    case "ArrowUp":
      event.preventDefault(); // Prevent page scroll
      config.onArrowUp?.();
      break;
    case "ArrowDown":
      event.preventDefault(); // Prevent page scroll
      config.onArrowDown?.();
      break;
    case "ArrowLeft":
      config.onArrowLeft?.();
      break;
    case "ArrowRight":
      config.onArrowRight?.();
      break;
    case "Tab":
      config.onTab?.(event.shiftKey);
      break;
  }
}

/**
 * Check if touch target meets minimum size requirements (44x44px)
 */
export function isTouchTargetAccessible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const MIN_SIZE = 44;
  return rect.width >= MIN_SIZE && rect.height >= MIN_SIZE;
}

/**
 * Manage focus restoration (save and restore focus)
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null;

  saveFocus(): void {
    this.previousFocus = document.activeElement as HTMLElement;
  }

  restoreFocus(): void {
    if (this.previousFocus && typeof this.previousFocus.focus === "function") {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }
}

/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(
  targetId: string,
  label: string = "Skip to main content"
): HTMLElement {
  const skipLink = document.createElement("a");
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className =
    "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md";

  skipLink.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  return skipLink;
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  return (
    !element.hasAttribute("aria-hidden") ||
    element.getAttribute("aria-hidden") !== "true"
  );
}

/**
 * Get accessible name for an element (for debugging/testing)
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent || "";
  }

  // Check associated label
  if (element instanceof HTMLInputElement) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || "";
  }

  // Check alt attribute (for images)
  const alt = element.getAttribute("alt");
  if (alt) return alt;

  // Fall back to text content
  return element.textContent || "";
}
