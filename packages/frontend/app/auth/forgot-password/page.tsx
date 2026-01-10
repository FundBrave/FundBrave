"use client";

import React, { useState } from "react";
import Link from "next/link";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

// Import reusable components
import AuthLogo from "../../components/auth/AuthLogo";
import AuthHeader from "../../components/auth/AuthHeader";
import ServerError from "../../components/auth/ServerError";
import FormInput from "../../components/auth/FormInput";
import { Button } from "../../components/ui/button";
import { authApi } from "../../../lib/api/auth";

// Email validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  // Form state
  const [formData, setFormData] = useState<ForgotPasswordFormValues>({
    email: "",
  });

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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

  // Validate form data
  const validateForm = (): boolean => {
    try {
      forgotPasswordSchema.parse(formData);
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

    setIsSubmitting(true);

    try {
      // Call backend API to send password reset email
      await authApi.forgotPassword(formData.email);

      // Show success state
      setIsSuccess(true);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Failed to send reset link. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Check your email
            </motion.h1>
            <motion.p
              className="text-text-secondary mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              We've sent a password reset link to
            </motion.p>
            <motion.p
              className="text-purple-400 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {formData.email}
            </motion.p>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <p className="text-center text-text-secondary text-sm">
              Didn't receive the email? Check your spam folder or
            </p>
            <Button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setFormData({ email: "" });
              }}
              variant="secondary"
              size="md"
              fullWidth
            >
              Try another email
            </Button>
          </motion.div>

          {/* Back to Login Link */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
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
          title="Forgot your password?"
          subtitle="No worries, we'll send you reset instructions"
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
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            delay={0.3}
            icon={<Mail className="h-5 w-5" />}
            inputMode="email"
            autoComplete="email"
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
              loadingText="Sending reset link..."
              variant="primary"
              size="md"
              fullWidth
            >
              Send Reset Link
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
