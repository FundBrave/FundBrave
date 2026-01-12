"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import * as z from "zod";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

// Import reusable components
import AuthLogo from "../../components/auth/AuthLogo";
import AuthHeader from "../../components/auth/AuthHeader";
import ServerError from "../../components/auth/ServerError";
import FormInput from "../../components/auth/FormInput";
import PasswordStrengthIndicator from "../../components/auth/PasswordStrengthIndicator";
import { Button } from "../../components/ui/button";
import { authApi } from "../../../lib/api/auth";

// Password validation schema
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number, and special character"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Form state
  const [formData, setFormData] = useState<ResetPasswordFormValues>({
    password: "",
    confirmPassword: "",
  });

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError("Invalid reset link. Please request a new password reset.");
        setIsValidatingToken(false);
        return;
      }

      try {
        const result = await authApi.verifyResetToken(token);
        if (result.valid) {
          setIsTokenValid(true);
        } else {
          setTokenError(result.message || "This reset link has expired or is invalid.");
        }
      } catch (error) {
        setTokenError(
          error instanceof Error ? error.message : "Invalid or expired reset link."
        );
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle field blur (per-field validation)
  const handleBlur = (fieldName: keyof ResetPasswordFormValues) => {
    try {
      resetPasswordSchema.pick({ [fieldName]: true }).parse({ [fieldName]: formData[fieldName] });
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues[0]?.message;
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [fieldName]: fieldError }));
        }
      }
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      resetPasswordSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    if (!token) {
      setServerError("Invalid reset token");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call backend API to reset password
      await authApi.resetPassword(token, formData.password);

      // Show success state
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth");
      }, 3000);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Failed to reset password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-2">
        <motion.div
          className="w-full max-w-2xl rounded-2xl p-4 backdrop-blur-md text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <AuthLogo />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-foreground text-lg">Validating reset link...</div>
            <div className="mt-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Error state if token is invalid
  if (!isTokenValid) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-2">
        <motion.div
          className="w-full max-w-2xl rounded-2xl p-4 backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <AuthLogo />

          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Error Icon */}
            <motion.div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.5,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <AlertCircle className="h-10 w-10 text-red-400" />
              </motion.div>
            </motion.div>

            <motion.h1
              className="mb-2 text-2xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Invalid Reset Link
            </motion.h1>
            <motion.p
              className="text-text-secondary mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {tokenError}
            </motion.p>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Link href="/auth/forgot-password">
              <Button variant="primary" size="md" fullWidth>
                Request New Reset Link
              </Button>
            </Link>
          </motion.div>

          {/* Back to Login Link */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 text-primary transition-colors hover:text-primary/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Success state view
  if (isSuccess) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-2">
        <motion.div
          className="w-full max-w-2xl rounded-2xl p-4 backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <AuthLogo />

          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Success Icon */}
            <motion.div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.5,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <CheckCircle className="h-10 w-10 text-green-400" />
              </motion.div>
            </motion.div>

            <motion.h1
              className="mb-2 text-2xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Password Reset Successful!
            </motion.h1>
            <motion.p
              className="text-text-secondary mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Your password has been successfully reset.
            </motion.p>
            <motion.p
              className="text-purple-400 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Redirecting to login...
            </motion.p>
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <Link href="/auth">
              <Button variant="secondary" size="md" fullWidth>
                Go to Login Now
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Default form view
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-2">
      <motion.div
        className="w-full max-w-2xl rounded-2xl p-4 backdrop-blur-md"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <AuthLogo />

        <AuthHeader
          title="Reset Your Password"
          subtitle="Enter your new password below"
        />

        <ServerError error={serverError} />

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 320,
            damping: 22,
          }}
        >
          <FormInput
            id="password"
            name="password"
            type="password"
            label="New Password"
            placeholder="Enter your new password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={() => handleBlur("password")}
            error={errors.password}
            delay={0.3}
            autoComplete="new-password"
          />

          {/* Password Strength Indicator */}
          {formData.password && (
            <PasswordStrengthIndicator password={formData.password} />
          )}

          <FormInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            onBlur={() => handleBlur("confirmPassword")}
            error={errors.confirmPassword}
            delay={0.4}
            autoComplete="new-password"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              loadingText="Resetting password..."
              variant="primary"
              size="md"
              fullWidth
            >
              Reset Password
            </Button>
          </motion.div>
        </motion.form>

        {/* Back to Login Link */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 text-primary transition-colors hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
