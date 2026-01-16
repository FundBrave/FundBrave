"use client";

import React, { useState } from "react";
import Link from "next/link";
import * as z from "zod";
import { motion } from "motion/react";
import { loginSchema } from "../../../lib/validation.utils";
import { useRouter } from "next/navigation";

// Import reusable components
import AuthLogo from "../../components/auth/AuthLogo";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthDivider from "../../components/auth/AuthDivider";
import ServerError from "../../components/auth/ServerError";
import FormInput from "../../components/auth/FormInput";
import { Button } from "../../components/ui/button";
import { authApi } from "../../../lib/api/auth";
import SocialLoginButtons from "../../components/auth/SocialLoginButtons";
import { useAuth } from "../../provider/AuthProvider";
type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onToggle: () => void;
}

export default function LoginPage({ onToggle }: LoginPageProps) {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<LoginFormValues>({
    username: "",
    password: "",
    keepLoggedIn: false,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate single field on blur
  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    try {
      // Validate just this field
      const fieldSchema = loginSchema.shape[name as keyof typeof loginSchema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Clear error if validation passes
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set error for this field only
        setErrors((prev) => ({
          ...prev,
          [name]: error.issues[0]?.message || "Invalid value",
        }));
      }
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
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

  const handleGoogleLogin = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // OAuth routes are excluded from /api prefix to match Google Cloud Console callback URL
    window.location.href = `${API_URL}/auth/google`;
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
      // Call login API
      const response = await authApi.login({
        emailOrUsername: formData.username,
        password: formData.password,
      });

      // Update AuthProvider state (which stores auth data and sets user)
      // The auth page's useEffect will automatically redirect to "/" when isAuthenticated becomes true
      authLogin(response);
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle wallet authentication errors
  const handleWalletError = (error: string) => {
    setServerError(error);
  };

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
          title="Welcome back!"
          subtitle="Login with your details to get started"
        />

        <SocialLoginButtons
          onGoogleLogin={handleGoogleLogin}
          handleWalletError={handleWalletError}
          //isGoogleLoading={isOAuthLoading.google}
        />

        <AuthDivider text="Or Login with Email" />

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
            id="username"
            name="username"
            type="text"
            label="Username or Email"
            placeholder="@johndoe or email@example.com"
            value={formData.username}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            error={errors.username}
            delay={0.9}
            autoComplete="username"
          />

          <FormInput
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            error={errors.password}
            delay={1.0}
            autoComplete="current-password"
          />

          {/* Checkbox and Forgot Password */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
          >
            <motion.label
              htmlFor="keepLoggedIn"
              className="flex items-center gap-2 flex-2 cursor-pointer"
              style={{ minHeight: '44px', minWidth: '44px' }}
              whileHover={{ scale: 1.05 }}
            >
              <input
                type="checkbox"
                id="keepLoggedIn"
                name="keepLoggedIn"
                checked={formData.keepLoggedIn}
                onChange={handleInputChange}
                className="custom-checkbox"
              />
              <span className="text-foreground">Keep me logged in</span>
            </motion.label>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href="/auth/forgot-password"
                className="text-primary transition-colors hover:text-primary/80"
              >
                Forgot Password?
              </Link>
            </motion.div>
          </motion.div>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            loadingText="Logging in..."
            variant="primary"
            size="md"
            fullWidth
          >
            Login
          </Button>
        </motion.form>

        {/* Sign Up Link */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.4 }}
        >
          <span className="text-text-secondary">Don't have an account? </span>
          <motion.div className="inline-block" whileHover={{ scale: 1.05 }}>
            <button
              onClick={onToggle}
              className="text-primary transition-colors hover:text-primary/80"
            >
              Sign Up
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
