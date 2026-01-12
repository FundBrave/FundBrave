"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Check, X } from "@/app/components/ui/icons";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";

// ============================================================================
// Types
// ============================================================================

interface SuccessModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Campaign title for the success message */
  campaignTitle: string;
  /** Campaign ID/slug for sharing */
  campaignId?: string;
  /** Callback when "View Campaign" is clicked */
  onViewCampaign: () => void;
  /** Callback when "Create Another" is clicked */
  onCreateAnother: () => void;
  /** Callback when modal is closed */
  onClose?: () => void;
}

interface ShareButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

// ============================================================================
// Confetti Animation
// ============================================================================

function useConfetti(isOpen: boolean, prefersReducedMotion: boolean) {
  useEffect(() => {
    if (!isOpen || prefersReducedMotion) return;

    // Dynamic import for canvas-confetti
    let cleanup: (() => void) | undefined;

    const triggerConfetti = async () => {
      try {
        const confetti = (await import("canvas-confetti")).default;

        // Initial burst
        const burst = () => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#450cf0", "#8762fa", "#cd82ff", "#ffffff"],
          });
        };

        // Side cannons
        const sideCannon = (x: number, angle: number) => {
          confetti({
            particleCount: 50,
            angle,
            spread: 55,
            origin: { x, y: 0.7 },
            colors: ["#450cf0", "#8762fa", "#cd82ff"],
          });
        };

        // Fire initial burst
        burst();

        // Fire side cannons with delay
        const timeouts: NodeJS.Timeout[] = [];

        timeouts.push(
          setTimeout(() => sideCannon(0, 60), 100),
          setTimeout(() => sideCannon(1, 120), 100),
          setTimeout(() => burst(), 200),
          setTimeout(() => sideCannon(0.3, 70), 300),
          setTimeout(() => sideCannon(0.7, 110), 300)
        );

        cleanup = () => {
          timeouts.forEach(clearTimeout);
        };
      } catch (error) {
        console.warn("Failed to load confetti:", error);
      }
    };

    triggerConfetti();

    return () => {
      cleanup?.();
    };
  }, [isOpen, prefersReducedMotion]);
}

// ============================================================================
// Share Button Component
// ============================================================================

function ShareButton({ icon, label, onClick, className }: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 min-w-[64px] min-h-[44px]",
        "rounded-xl transition-all duration-200 active:scale-[0.95]",
        "hover:bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-primary/50",
        className
      )}
      aria-label={`Share on ${label}`}
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-sunken">
        {icon}
      </div>
      <span className="text-xs text-text-secondary">{label}</span>
    </button>
  );
}

// ============================================================================
// Share Icons
// ============================================================================

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SuccessModal({
  isOpen,
  campaignTitle,
  campaignId,
  onViewCampaign,
  onCreateAnother,
  onClose,
}: SuccessModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  // Trigger confetti
  useConfetti(isOpen, prefersReducedMotion);

  // Generate campaign URL
  const campaignUrl = campaignId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/campaigns/${campaignId}`
    : "";

  // Share handlers
  const handleShareX = useCallback(() => {
    const text = encodeURIComponent(`Check out my campaign: ${campaignTitle}`);
    const url = encodeURIComponent(campaignUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }, [campaignTitle, campaignUrl]);

  const handleShareFacebook = useCallback(() => {
    const url = encodeURIComponent(campaignUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  }, [campaignUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [campaignUrl]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.3,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className={cn(
              "relative w-full max-w-md",
              "bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900",
              "rounded-2xl shadow-2xl overflow-hidden",
              "border border-purple-500/20"
            )}
          >
            {/* Close button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "absolute top-4 right-4 z-10",
                  "w-8 h-8 flex items-center justify-center",
                  "bg-white/10 hover:bg-white/20 rounded-full",
                  "text-white transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            )}

            {/* Content */}
            <div className="p-8 sm:p-10 text-center">
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="mb-6"
              >
                <div
                  className={cn(
                    "w-20 h-20 mx-auto",
                    "flex items-center justify-center",
                    "bg-white rounded-full shadow-lg"
                  )}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : 0.4,
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    <Check size={40} className="text-green-500" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                id="success-modal-title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
                className="text-2xl sm:text-3xl font-bold text-white mb-4"
              >
                Campaign Created!
              </motion.h2>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.4 }}
                className="text-white/90 text-sm sm:text-base mb-6 leading-relaxed"
              >
                Your campaign &ldquo;{campaignTitle}&rdquo; has been successfully created and is now
                live. Share it with your network to start receiving donations!
              </motion.p>

              {/* Share options */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.5 }}
                className="mb-8"
              >
                <p className="text-white/70 text-xs uppercase tracking-wider mb-4">
                  Share your campaign
                </p>
                <div className="flex items-center justify-center gap-2">
                  <ShareButton
                    icon={<XIcon className="text-foreground" />}
                    label="X"
                    onClick={handleShareX}
                  />
                  <ShareButton
                    icon={<FacebookIcon className="text-blue-500" />}
                    label="Facebook"
                    onClick={handleShareFacebook}
                  />
                  <ShareButton
                    icon={
                      copied ? (
                        <Check className="text-green-500" size={20} />
                      ) : (
                        <LinkIcon className="text-foreground" />
                      )
                    }
                    label={copied ? "Copied!" : "Copy Link"}
                    onClick={handleCopyLink}
                  />
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.6 }}
                className="flex flex-col gap-3"
              >
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={onViewCampaign}
                  className="bg-white text-purple-700 hover:bg-white/90"
                >
                  View Campaign
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  onClick={onCreateAnother}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Create Another Campaign
                </Button>
              </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-purple-400/20 to-transparent rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SuccessModal;
