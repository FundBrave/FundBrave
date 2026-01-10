/**
 * Confetti celebration utility
 * Reusable confetti animations for success states
 */

import confetti from "canvas-confetti";

// Brand colors for confetti particles
const BRAND_COLORS = ["#450cf0", "#8762fa", "#cd82ff", "#ffffff"];
const ACCENT_COLORS = ["#450cf0", "#8762fa", "#cd82ff"];

/**
 * Fire a celebration confetti burst
 * Used for successful donations and other achievements
 */
export const fireConfetti = () => {
  // First burst - center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
  });

  // Second burst after delay - sides
  setTimeout(() => {
    // Left side burst
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ACCENT_COLORS,
    });
    // Right side burst
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ACCENT_COLORS,
    });
  }, 250);
};

/**
 * Fire a smaller celebration burst
 * For minor achievements or milestones
 */
export const fireSmallConfetti = () => {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ACCENT_COLORS,
  });
};

/**
 * Fire confetti from a specific element
 * @param element - DOM element to originate confetti from
 */
export const fireConfettiFromElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x, y },
    colors: BRAND_COLORS,
  });
};
