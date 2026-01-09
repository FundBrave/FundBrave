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
import { Button } from "../../components/ui/button";

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
  const [isOAuthLoading, setIsOAuthLoading] = React.useState({
    google: false,
    twitter: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error when user starts typing
    if (errors[name as keyof SignUpData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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

  const handleValidate = (e: React.FormEvent) => {
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
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
    setIsSubmitting(false);
    router.push("/onboarding");
  };

  const handleGoogleLogin = async () => {
    setIsOAuthLoading({ ...isOAuthLoading, google: true });
    setServerError("Google sign in is disabled in this build.");
    setIsOAuthLoading({ ...isOAuthLoading, google: false });
  };

  const handleXLogin = async () => {
    setIsOAuthLoading({ ...isOAuthLoading, twitter: true });
    setServerError("Twitter sign in is disabled in this build.");
    setIsOAuthLoading({ ...isOAuthLoading, twitter: false });
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
          onXLogin={handleXLogin}
          isGoogleLoading={isOAuthLoading.google}
          isXLoading={isOAuthLoading.twitter}
        />

        <AuthDivider text="or Sign up with" />

        <ServerError error={serverError} />

        <motion.form
          className="w-full space-y-4"
          onSubmit={handleSubmit}
          onChange={handleValidate}
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
            error={errors.username}
            delay={0.2}
          />

          <FormInput
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="johndoe@mail.com"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            delay={0.2}
          />

          <FormInput
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            delay={0.2}
          />

          <FormInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            delay={0.2}
          />

          {/* Checkbox and Forgot Password */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
          >
            <motion.label
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <motion.input
                type="checkbox"
                name="termsAccepted"
                id="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="custom-checkbox"
              />
              <span className="text-white text-sm">
                I agree to terms and conditions
              </span>
            </motion.label>

            <motion.label
              className="flex items-center gap-3"
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
              <span className="text-white text-sm">
                I agree to receive email updates
              </span>
            </motion.label>

            <motion.div whileHover={{ scale: 1.02 }} className="text-right">
              <Link
                href="/forgot-password"
                className="text-purple-400 transition-colors hover:text-purple-300 text-sm"
              >
                Forgot Password?
              </Link>
            </motion.div>
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
            Join Referral Program
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
              className="text-purple-400 transition-colors br-none hover:text-purple-300"
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
