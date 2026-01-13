"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { UsernameInput } from "@/app/components/ui/form/UsernameInput";
import { SocialLinksGroup } from "@/app/components/ui/form/SocialLinksGroup";
import { VisibilityToggles, type VisibilitySettings } from "./VisibilityToggles";
import {
  profileSettingsSchema,
  avatarUploadSchema,
  type ProfileSettingsFormData,
  defaultProfileSettings,
} from "./schemas";
import type { SocialLinks } from "@/app/components/ui/form/SocialLinksGroup";

/**
 * Inline SVG Icons - following NotFoundPage pattern
 */
const icons = {
  user: (
    <svg
      viewBox="0 0 24 24"
      width="40"
      height="40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  upload: (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  trash: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Section wrapper component with title
 */
function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30"
      aria-labelledby={`section-${title.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-white/10">
        <h3
          id={`section-${title.toLowerCase().replace(/\s/g, "-")}`}
          className="text-sm font-medium text-text-secondary"
        >
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

/**
 * Text input with label and error state
 */
function FormField({
  label,
  htmlFor,
  description,
  error,
  children,
  required = false,
}: {
  label: string;
  htmlFor: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-destructive"
            role="alert"
          >
            {error}
          </motion.p>
        ) : description ? (
          <motion.p
            key="description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-text-tertiary"
          >
            {description}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Standard text input component
 */
function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  error,
  maxLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url";
  disabled?: boolean;
  error?: string;
  maxLength?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const prevErrorRef = useRef<string | undefined>(undefined);

  // Shake animation when error appears
  useEffect(() => {
    if (error && !prevErrorRef.current && inputRef.current) {
      gsap.to(inputRef.current, {
        keyframes: [
          { x: -6, duration: 0.05 },
          { x: 6, duration: 0.05 },
          { x: -4, duration: 0.05 },
          { x: 4, duration: 0.05 },
          { x: -2, duration: 0.05 },
          { x: 2, duration: 0.05 },
          { x: 0, duration: 0.05 },
        ],
        ease: "power2.inOut",
      });
    }
    prevErrorRef.current = error;
  }, [error]);

  return (
    <input
      ref={inputRef}
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      aria-invalid={!!error}
      className={cn(
        "w-full bg-surface-sunken rounded-xl px-4 py-3",
        "text-foreground placeholder:text-text-tertiary",
        "border outline-none",
        "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
        "transition-all duration-200",
        "min-h-[44px]",
        error
          ? "border-destructive focus:ring-destructive/50 focus:border-destructive/50"
          : "border-white/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    />
  );
}

/**
 * Textarea with character counter
 */
function TextAreaInput({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  error,
  disabled = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevErrorRef = useRef<string | undefined>(undefined);

  const isNearLimit = maxLength && value.length >= maxLength * 0.9;
  const isOverLimit = maxLength && value.length > maxLength;

  // Shake animation when error appears
  useEffect(() => {
    if (error && !prevErrorRef.current && textareaRef.current) {
      gsap.to(textareaRef.current, {
        keyframes: [
          { x: -6, duration: 0.05 },
          { x: 6, duration: 0.05 },
          { x: -4, duration: 0.05 },
          { x: 4, duration: 0.05 },
          { x: -2, duration: 0.05 },
          { x: 2, duration: 0.05 },
          { x: 0, duration: 0.05 },
        ],
        ease: "power2.inOut",
      });
    }
    prevErrorRef.current = error;
  }, [error]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(
          "w-full bg-surface-sunken rounded-xl px-4 py-3",
          "text-foreground placeholder:text-text-tertiary",
          "border outline-none resize-none",
          "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
          "transition-all duration-200",
          error
            ? "border-destructive focus:ring-destructive/50 focus:border-destructive/50"
            : "border-white/10",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {maxLength && (
        <span
          className={cn(
            "absolute bottom-3 right-3 text-xs transition-colors",
            isOverLimit
              ? "text-destructive"
              : isNearLimit
                ? "text-yellow-500"
                : "text-text-tertiary"
          )}
        >
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

/**
 * Avatar upload section
 */
function AvatarUpload({
  avatarUrl,
  onUpload,
  onRemove,
  error,
  isUploading,
}: {
  avatarUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  error?: string;
  isUploading?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="flex flex-col sm:flex-row items-start gap-6">
      {/* Avatar preview */}
      <div className="relative group">
        <div
          className={cn(
            "w-24 h-24 rounded-full overflow-hidden",
            "bg-surface-sunken border-2",
            "flex items-center justify-center",
            error ? "border-destructive" : "border-white/10"
          )}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile avatar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-text-tertiary">{icons.user}</span>
          )}
        </div>

        {/* Hover overlay for upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "absolute inset-0 rounded-full bg-black/50",
            "flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "cursor-pointer focus-visible:opacity-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
          aria-label="Upload new avatar"
        >
          <span className="text-white">{icons.upload}</span>
        </button>

        {/* Remove button (when avatar exists) */}
        {avatarUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={isUploading}
            className={cn(
              "absolute -top-1 -right-1 w-6 h-6",
              "bg-destructive rounded-full",
              "flex items-center justify-center",
              "text-white hover:bg-destructive/90",
              "transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            )}
            aria-label="Remove avatar"
          >
            {icons.trash}
          </button>
        )}
      </div>

      {/* Upload button and instructions */}
      <div className="flex flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Choose avatar file"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          loading={isUploading}
          loadingText="Uploading..."
        >
          {icons.upload}
          <span className="ml-2">Upload photo</span>
        </Button>
        <p className="text-xs text-text-tertiary">
          JPG, PNG or GIF. Max size 5MB.
        </p>
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Form Component
// ============================================================================

export interface ProfileSettingsFormProps {
  /** Initial form data (from API) */
  initialData?: Partial<ProfileSettingsFormData>;
  /** Avatar URL from user profile */
  initialAvatarUrl?: string | null;
  /** Handler for form submission */
  onSubmit: (data: ProfileSettingsFormData) => Promise<void>;
  /** Handler for avatar upload */
  onAvatarUpload?: (file: File) => Promise<string>;
  /** Handler for avatar removal */
  onAvatarRemove?: () => Promise<void>;
  /** Handler for username availability check */
  checkUsernameAvailability?: (username: string) => Promise<boolean>;
  /** Success callback */
  onSuccess?: () => void;
}

/**
 * ProfileSettingsForm - Complete profile settings form
 *
 * Features:
 * - Avatar upload with preview
 * - Display name and username fields with validation
 * - Bio with character counter
 * - Website and location fields
 * - Social links section (collapsible on mobile)
 * - Visibility toggles
 * - Zod schema validation
 * - Error shake animations
 * - Success toast on save
 */
export function ProfileSettingsForm({
  initialData,
  initialAvatarUrl,
  onSubmit,
  onAvatarUpload,
  onAvatarRemove,
  checkUsernameAvailability,
  onSuccess,
}: ProfileSettingsFormProps) {
  // Form state
  const [formData, setFormData] = useState<ProfileSettingsFormData>({
    ...defaultProfileSettings,
    ...initialData,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialAvatarUrl ?? null
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileSettingsFormData, string>>
  >({});
  const [socialErrors, setSocialErrors] = useState<
    Partial<Record<keyof SocialLinks, string>>
  >({});
  const [avatarError, setAvatarError] = useState<string | undefined>();

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Track original data for reset
  const originalDataRef = useRef<ProfileSettingsFormData>({
    ...defaultProfileSettings,
    ...initialData,
  });
  const originalAvatarRef = useRef<string | null>(initialAvatarUrl ?? null);

  // Update field and mark form as dirty
  const updateField = useCallback(
    <K extends keyof ProfileSettingsFormData>(
      key: K,
      value: ProfileSettingsFormData[K]
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
      // Clear error on change
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    // Validate file
    const validation = avatarUploadSchema.safeParse({ file });
    if (!validation.success) {
      setAvatarError(validation.error.issues[0]?.message);
      return;
    }

    setAvatarError(undefined);
    setIsUploadingAvatar(true);

    try {
      if (onAvatarUpload) {
        const url = await onAvatarUpload(file);
        setAvatarUrl(url);
        setIsDirty(true);
      } else {
        // Local preview fallback
        const url = URL.createObjectURL(file);
        setAvatarUrl(url);
        setIsDirty(true);
      }
    } catch {
      setAvatarError("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle avatar removal
  const handleAvatarRemove = async () => {
    setIsUploadingAvatar(true);
    try {
      if (onAvatarRemove) {
        await onAvatarRemove();
      }
      setAvatarUrl(null);
      setIsDirty(true);
    } catch {
      setAvatarError("Failed to remove avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle social links change
  const handleSocialLinksChange = (socialLinks: SocialLinks) => {
    updateField("socialLinks", socialLinks);
    // Clear social errors on change
    setSocialErrors({});
  };

  // Handle visibility settings change
  const handleVisibilityChange = (visibility: VisibilitySettings) => {
    setFormData((prev) => ({
      ...prev,
      isPublicProfile: visibility.isPublicProfile,
      showDonationHistory: visibility.showDonationHistory,
      showSupportedCampaigns: visibility.showSupportedCampaigns,
    }));
    setIsDirty(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const result = profileSettingsSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Partial<Record<keyof ProfileSettingsFormData, string>> =
        {};
      const newSocialErrors: Partial<Record<keyof SocialLinks, string>> = {};

      result.error.issues.forEach((issue) => {
        const path = issue.path;
        if (path[0] === "socialLinks" && path[1]) {
          newSocialErrors[path[1] as keyof SocialLinks] = issue.message;
        } else if (path[0]) {
          newErrors[path[0] as keyof ProfileSettingsFormData] = issue.message;
        }
      });

      setErrors(newErrors);
      setSocialErrors(newSocialErrors);
      return false;
    }

    setErrors({});
    setSocialErrors({});
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      await onSubmit(formData);
      setShowSuccess(true);
      setIsDirty(false);
      originalDataRef.current = { ...formData };
      originalAvatarRef.current = avatarUrl;
      onSuccess?.();

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setErrors((prev) => ({
        ...prev,
        displayName: "Failed to save changes. Please try again.",
      }));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel/reset
  const handleCancel = () => {
    setFormData({ ...originalDataRef.current });
    setAvatarUrl(originalAvatarRef.current);
    setErrors({});
    setSocialErrors({});
    setAvatarError(undefined);
    setIsDirty(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Success message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl",
              "bg-green-500/10 border border-green-500/20",
              "text-green-400"
            )}
            role="status"
            aria-live="polite"
          >
            {icons.check}
            <span className="text-sm font-medium">
              Profile settings saved successfully!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Section */}
      <FormSection title="Profile Photo">
        <AvatarUpload
          avatarUrl={avatarUrl}
          onUpload={handleAvatarUpload}
          onRemove={handleAvatarRemove}
          error={avatarError}
          isUploading={isUploadingAvatar}
        />
      </FormSection>

      {/* Basic Information Section */}
      <FormSection title="Basic Information">
        <div className="flex flex-col gap-6">
          <FormField
            label="Display Name"
            htmlFor="displayName"
            description="This is how your name will appear on your profile"
            error={errors.displayName}
            required
          >
            <TextInput
              id="displayName"
              value={formData.displayName}
              onChange={(value) => updateField("displayName", value)}
              placeholder="Enter your display name"
              error={errors.displayName}
              maxLength={50}
            />
          </FormField>

          <FormField
            label="Username"
            htmlFor="username"
            description="Your unique username for FundBrave (3-30 characters)"
            error={errors.username}
            required
          >
            <UsernameInput
              id="username"
              value={formData.username}
              onChange={(value) => updateField("username", value)}
              placeholder="username"
              error={errors.username}
              checkAvailability={checkUsernameAvailability}
            />
          </FormField>

          <FormField
            label="Bio"
            htmlFor="bio"
            description="Write a short bio to introduce yourself"
            error={errors.bio}
          >
            <TextAreaInput
              id="bio"
              value={formData.bio || ""}
              onChange={(value) => updateField("bio", value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={280}
              error={errors.bio}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Additional Information Section */}
      <FormSection title="Additional Information">
        <div className="flex flex-col gap-6">
          <FormField
            label="Website"
            htmlFor="website"
            description="Add a link to your personal website or portfolio"
            error={errors.website}
          >
            <TextInput
              id="website"
              type="url"
              value={formData.website || ""}
              onChange={(value) => updateField("website", value)}
              placeholder="https://example.com"
              error={errors.website}
            />
          </FormField>

          <FormField
            label="Location"
            htmlFor="location"
            description="Where are you based?"
            error={errors.location}
          >
            <TextInput
              id="location"
              value={formData.location || ""}
              onChange={(value) => updateField("location", value)}
              placeholder="City, Country"
              error={errors.location}
              maxLength={100}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Social Links Section */}
      <FormSection title="Social Links">
        <SocialLinksGroup
          value={formData.socialLinks || {}}
          onChange={handleSocialLinksChange}
          errors={socialErrors}
          defaultCollapsed={false}
        />
      </FormSection>

      {/* Visibility Settings Section */}
      <FormSection title="Privacy Settings">
        <VisibilityToggles
          value={{
            isPublicProfile: formData.isPublicProfile,
            showDonationHistory: formData.showDonationHistory,
            showSupportedCampaigns: formData.showSupportedCampaigns,
          }}
          onChange={handleVisibilityChange}
        />
      </FormSection>

      {/* Action Buttons - Sticky on mobile when dirty */}
      <div
        className={cn(
          "flex items-center justify-end gap-4 pt-4 border-t border-white/10",
          // Sticky at bottom on mobile when form is dirty
          isDirty && "sticky bottom-0 bg-background py-4 -mx-4 px-4 md:relative md:mx-0 md:px-0"
        )}
      >
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving || !isDirty}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSaving}
          disabled={!isDirty}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}

export default ProfileSettingsForm;
