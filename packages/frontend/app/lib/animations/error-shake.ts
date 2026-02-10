import gsap from "gsap";

/**
 * GSAP error-shake animation for form fields.
 *
 * Extracted from FormInput.tsx and FormFields.tsx to avoid duplication.
 * Uses keyframe-based horizontal displacement that decays over ~0.5s,
 * matching the existing shake pattern across the codebase:
 *
 *   x: -10 → 10 → -8 → 8 → -4 → 4 → 0
 *
 * @param element  The DOM element to shake (typically a field container ref).
 * @param options  Optional overrides for intensity and duration per keyframe.
 */
export function errorShake(
  element: HTMLElement | null,
  options?: {
    /** Peak displacement in pixels. Defaults to 10. */
    intensity?: number;
    /** Duration of each keyframe step in seconds. Defaults to 0.07. */
    stepDuration?: number;
  }
) {
  if (!element) return;

  const { intensity = 10, stepDuration = 0.07 } = options ?? {};

  // Scale factors matching the original decay pattern: 1, 1, 0.8, 0.8, 0.4, 0.4, 0
  const factors = [-1, 1, -0.8, 0.8, -0.4, 0.4, 0];

  gsap.to(element, {
    keyframes: factors.map((factor) => ({
      x: factor * intensity,
      duration: stepDuration,
    })),
    ease: "power2.inOut",
  });
}
