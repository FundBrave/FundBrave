"use client";
import React from "react";
import * as z from "zod";
import { signUpSchema } from "../../../lib/validation.utils";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Import reusable components
import AuthLogo from "../../components/auth/AuthLogo";
import AuthHeader from "../../components/auth/AuthHeader";
import SocialLoginButtons from "../../components/auth/SocialLoginButtons";
import AuthDivider from "../../components/auth/AuthDivider";
import ServerError from "../../components/auth/ServerError";
import FormInput from "../../components/auth/FormInput";
import PasswordStrengthIndicator from "../../components/auth/PasswordStrengthIndicator";
import { Button } from "../../components/ui/button";
import { authApi } from "../../../lib/api/auth";

type SignUpData = z.infer<typeof signUpSchema>;

interface SignUpPageProps {
  onToggle: () => void;
}
export default function SignUpPage({ onToggle }: SignUpPageProps) {
  const router = useRouter();
  const [formData, setFormData] = React.useState<SignUpData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    emailUpdate: false,
    termsAccepted: false,
  });
  const [errors, setErrors] = React.useState<Partial<SignUpData>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState("");
  const [showPasswordStrength, setShowPasswordStrength] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Show password strength indicator when typing password
    if (name === 'password') {
      setShowPasswordStrength(true);
    }

    // Clear field error when user starts typing
    if (errors[name as keyof SignUpData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate single field on blur
  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Hide password strength on blur
    if (name === 'password') {
      setShowPasswordStrength(false);
    }

    try {
      // For confirmPassword, validate the whole form to check password match
      if (name === 'confirmPassword') {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const confirmPasswordError = result.error.issues.find(
            (issue) => issue.path[0] === 'confirmPassword'
          );
          if (confirmPasswordError) {
            setErrors((prev) => ({
              ...prev,
              confirmPassword: confirmPasswordError.message,
            }));
          } else {
            setErrors((prev) => ({
              ...prev,
              confirmPassword: "",
            }));
          }
        } else {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: "",
          }));
        }
      } else {
        // Validate just this field
        const fieldSchema = signUpSchema.shape[name as keyof typeof signUpSchema.shape];
        if (fieldSchema) {
          fieldSchema.parse(value);
          // Clear error if validation passes
          setErrors((prev) => ({
            ...prev,
            [name]: "",
          }));
        }
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

  const handleGoogleLogin = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // OAuth routes are excluded from /api prefix to match Google Cloud Console callback URL
    window.location.href = `${API_URL}/auth/google`;
  };

  const validateForm = (): boolean => {
    try {
      signUpSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const fieldName = err.path[0] as keyof SignUpData;
          if (
            fieldName === "confirmPassword" &&
            err.code === "custom" &&
            err.message.includes("match")
          ) {
            fieldErrors[fieldName] = "Passwords do not match";
          } else {
            fieldErrors[fieldName] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError("");

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Call register API
      const response = await authApi.register({
        email: formData.email,
        displayName: formData.username,
        password: formData.password,
      });

      // Store auth data
      authApi.storeAuthData(response);

      // Store email and username in localStorage for onboarding
      if (typeof window !== "undefined") {
        const onboardingData = {
          email: formData.email,
          profile: {
            fullName: formData.username,
            email: formData.email,
            birthdate: "",
            bio: "",
            avatar: "",
          },
          social: { twitter: "", instagram: "", linkedin: "", github: "" },
          goals: [],
          isComplete: false,
        };
        localStorage.setItem("onboarding_data", JSON.stringify(onboardingData));
      }

      // Redirect to onboarding
      router.push("/onboarding");
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError("Registration failed. Please try again.");
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
    <div className="flex min-h-screen w-full items-center justify-center p-2 ">
      <motion.div
        className="w-full max-w-2x p-4"
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 22,
          duration: 0.45,
        }}
      >
        <AuthLogo />

        <AuthHeader
          title="Let's get started!"
          subtitle="Register with your details to get started"
        />

        <SocialLoginButtons
          onGoogleLogin={handleGoogleLogin}
          handleWalletError={handleWalletError}
          //isGoogleLoading={isOAuthLoading.google}
        />
        

        <AuthDivider text="or Sign up with Email" />

        <ServerError error={serverError} />

        <motion.form
          className="w-full space-y-4"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 320,
            damping: 22,
          }}
        >
          <FormInput
            id="username"
            name="username"
            type="text"
            label="Name"
            placeholder="John Doe"
            value={formData.username}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            error={errors.username}
            delay={0.2}
            autoComplete="name"
          />

          <FormInput
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="johndoe@mail.com"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            error={errors.email}
            delay={0.2}
            autoComplete="email"
            inputMode="email"
          />

          <div>
            <FormInput
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleFieldBlur}
              error={errors.password}
              delay={0.2}
              autoComplete="new-password"
            />
            {showPasswordStrength && (
              <PasswordStrengthIndicator password={formData.password} />
            )}
          </div>

          <FormInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            error={errors.confirmPassword}
            delay={0.2}
            autoComplete="new-password"
          />

          {/* Checkboxes */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
          >
            <motion.label
              htmlFor="termsAccepted"
              className="flex items-center gap-3 cursor-pointer"
              style={{ minHeight: '44px' }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.input
                type="checkbox"
                name="termsAccepted"
                id="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="custom-checkbox"
                aria-required="true"
              />
              <span className="text-foreground text-sm">
                I agree to{' '}
                <Link
                  href="/terms"
                  className="text-primary hover:text-primary/80 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  terms and conditions
                </Link>
              </span>
            </motion.label>
            {errors.termsAccepted && (
              <p className="text-sm text-destructive">{errors.termsAccepted}</p>
            )}

            <motion.label
              htmlFor="emailUpdate"
              className="flex items-center gap-3 cursor-pointer"
              style={{ minHeight: '44px' }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.input
                type="checkbox"
                name="emailUpdate"
                id="emailUpdate"
                checked={formData.emailUpdate}
                onChange={handleInputChange}
                className="custom-checkbox"
              />
              <span className="text-foreground text-sm">
                I agree to receive email updates
              </span>
            </motion.label>
          </motion.div>

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            loadingText="Signing up..."
            variant="primary"
            size="md"
            fullWidth
          >
             Sign Up
          </Button>
        </motion.form>

        {/* Sign In Link */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <span className="text-text-secondary">Already have an account? </span>
          <motion.div className="inline-block" whileHover={{ scale: 1.05 }}>
            <button
              onClick={onToggle}
              className="text-primary transition-colors hover:text-primary/80"
            >
              {" "}
              Sign in
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
