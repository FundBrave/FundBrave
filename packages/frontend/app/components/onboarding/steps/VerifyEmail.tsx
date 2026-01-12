"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { useOnboardingData } from "@/app/provider/OnboardingDataContext";
import { Button } from "@/app/components/ui/button";
import { authApi } from "@/lib/api/auth";

/**
 * Maps technical backend/database errors to user-friendly messages
 * @param error - The error object or message
 * @returns User-friendly error message
 */
const mapErrorToUserMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Database/Connection errors
    if (
      errorMessage.includes("database") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("enotfound")
    ) {
      return "Service temporarily unavailable. Please try again in a moment.";
    }

    // Network errors
    if (
      errorMessage.includes("network") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("cors")
    ) {
      return "Network error. Please check your connection.";
    }

    // Rate limit errors - keep the backend message as it's already user-friendly
    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many") ||
      errorMessage.includes("wait")
    ) {
      return error.message;
    }

    // Server errors (5xx)
    if (
      errorMessage.includes("500") ||
      errorMessage.includes("502") ||
      errorMessage.includes("503") ||
      errorMessage.includes("504") ||
      errorMessage.includes("internal server")
    ) {
      return "Service temporarily unavailable. Please try again in a moment.";
    }

    // Return the original message if it seems user-friendly (no technical jargon)
    if (
      !errorMessage.includes("prisma") &&
      !errorMessage.includes("sql") &&
      !errorMessage.includes("query") &&
      !errorMessage.includes("stack")
    ) {
      return error.message;
    }
  }

  // Generic fallback for unknown errors
  return "Failed to resend code. Please try again.";
};

const VerifyEmail: React.FC<StepComponentProps> = ({ onNext }) => {
  const { data } = useOnboardingData();
  const [codes, setCodes] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(4).fill(null));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  const userEmail = data.email || "your email";

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;

    // Clear error when user types
    if (error) setError("");

    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otp = codes.join("");

    // Validate OTP is complete
    if (otp.length !== 4) {
      setError("Please enter all 4 digits");
      return;
    }

    // Validate email
    if (!data.email) {
      setError("Email not found. Please sign up again.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await authApi.verifyOtp(data.email, otp);

      if (response.success) {
        setSuccessMessage(response.message || "Email verified successfully!");
        setRetryCount(0); // Reset retry count on success
        // Wait a moment to show success message, then continue
        setTimeout(() => {
          onNext?.();
        }, 1500);
      } else {
        setError(response.message || "Invalid verification code. Please try again.");
      }
    } catch (err) {
      // Map technical errors to user-friendly messages
      const userFriendlyError = mapErrorToUserMessage(err);

      // Check if this is a transient error that can be retried
      const isTransientError =
        err instanceof Error &&
        (err.message.toLowerCase().includes("timeout") ||
         err.message.toLowerCase().includes("network") ||
         err.message.toLowerCase().includes("connection"));

      if (isTransientError && retryCount < MAX_RETRIES) {
        setRetryCount(retryCount + 1);
        setError(`${userFriendlyError} Retrying... (${retryCount + 1}/${MAX_RETRIES})`);

        // Retry after a short delay
        setTimeout(() => {
          handleVerifyOtp();
        }, 1500);
      } else {
        setError(userFriendlyError);
        setRetryCount(0); // Reset retry count after max retries
      }
    } finally {
      if (retryCount >= MAX_RETRIES || error) {
        setIsVerifying(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) {
      return;
    }

    if (!data.email) {
      setError("Email not found. Please sign up again.");
      return;
    }

    setIsResending(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await authApi.resendOtp(data.email);

      if (response.success) {
        setSuccessMessage(response.message || "Verification code sent!");

        // Set cooldown if provided
        if (response.cooldownSeconds) {
          setCooldownSeconds(response.cooldownSeconds);

          // Countdown timer
          const interval = setInterval(() => {
            setCooldownSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        setError(response.message || "Failed to resend code. Please try again.");
      }
    } catch (err) {
      // Map technical errors to user-friendly messages
      const userFriendlyError = mapErrorToUserMessage(err);
      setError(userFriendlyError);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      className="text-center w-full px-4 h-full flex flex-col justify-center items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
        Verify your email
      </h2>
      <p className="text-muted-foreground mb-8 text-sm md:text-base">
        We sent a code to <span className="text-purple-400">{userEmail}</span>
      </p>

      {/* Verification code inputs */}
      <div className="flex justify-center gap-2 md:gap-3 mb-4">
        {codes.map((digit, i) => (
          <motion.input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={isVerifying}
            className={`w-12 h-12 md:w-16 md:h-16 text-2xl md:text-3xl text-center bg-surface-elevated rounded-lg text-foreground border transition ${
              error
                ? 'border-destructive'
                : 'border-border-default focus:border-purple-500'
            } outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={`Digit ${i + 1}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          />
        ))}
      </div>

      {/* Error and Success Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            role="alert"
            className="text-sm text-destructive mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        {successMessage && !error && (
          <motion.p
            role="status"
            className="text-sm text-green-500 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {successMessage}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="text-muted-foreground mb-6 text-sm md:text-base">
        Didn&apos;t get a code?{" "}
        <button
          onClick={handleResendOtp}
          disabled={cooldownSeconds > 0 || isResending}
          className="text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending
            ? "Sending..."
            : cooldownSeconds > 0
            ? `Resend in ${cooldownSeconds}s`
            : "Click to resend"}
        </button>
      </p>

      <Button
        variant="primary"
        size="md"
        onClick={handleVerifyOtp}
        loading={isVerifying}
        disabled={isVerifying || codes.join("").length !== 4}
        className="w-full max-w-xs mx-auto"
      >
        {isVerifying ? "Verifying..." : "Continue"}
      </Button>
    </motion.div>
  );
};

export default VerifyEmail;
