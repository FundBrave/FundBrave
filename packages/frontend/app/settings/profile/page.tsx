"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Upload, User } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Form field component for consistent styling
 */
function FormField({
  label,
  htmlFor,
  children,
  description,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {description && (
        <p className="text-xs text-text-tertiary">{description}</p>
      )}
    </div>
  );
}

/**
 * Text input component with consistent styling
 */
function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url";
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full bg-surface-sunken rounded-xl px-4 py-3",
        "text-foreground placeholder:text-text-tertiary",
        "border border-white/10 outline-none",
        "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
        "transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    />
  );
}

/**
 * Textarea component with consistent styling
 */
function TextAreaInput({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={cn(
          "w-full bg-surface-sunken rounded-xl px-4 py-3",
          "text-foreground placeholder:text-text-tertiary",
          "border border-white/10 outline-none resize-none",
          "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
          "transition-all duration-200"
        )}
      />
      {maxLength && (
        <span className="absolute bottom-3 right-3 text-xs text-text-tertiary">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

/**
 * Avatar upload section component
 */
function AvatarUpload({
  avatarUrl,
  onUpload,
}: {
  avatarUrl: string | null;
  onUpload: () => void;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="relative group">
        <div
          className={cn(
            "w-24 h-24 rounded-full overflow-hidden",
            "bg-surface-sunken border-2 border-white/10",
            "flex items-center justify-center"
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
            <User size={40} className="text-text-tertiary" />
          )}
        </div>
        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-black/50",
            "flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "cursor-pointer"
          )}
          onClick={onUpload}
        >
          <Upload size={24} className="text-white" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={onUpload}>
          Upload photo
        </Button>
        <p className="text-xs text-text-tertiary">
          JPG, PNG or GIF. Max size 2MB.
        </p>
      </div>
    </div>
  );
}

/**
 * Section divider with title
 */
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <h3 className="text-sm font-medium text-text-secondary whitespace-nowrap">
        {title}
      </h3>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

/**
 * ProfileSettingsPage - Profile settings form
 *
 * Features:
 * - Avatar upload
 * - Display name and username fields
 * - Bio/description with character limit
 * - Website and social links
 * - Location field
 * - Save/cancel actions
 */
export default function ProfileSettingsPage() {
  // Form state
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarUpload = () => {
    // Placeholder for avatar upload functionality
    console.log("Avatar upload triggered");
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Placeholder for save functionality
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    console.log("Profile saved", {
      displayName,
      username,
      bio,
      website,
      location,
    });
  };

  const handleCancel = () => {
    // Reset form to initial values
    setDisplayName("");
    setUsername("");
    setBio("");
    setWebsite("");
    setLocation("");
    setAvatarUrl(null);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-text-secondary">
          Manage your public profile information
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="flex flex-col gap-8"
      >
        {/* Avatar Section */}
        <div className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
          <SectionDivider title="Profile Photo" />
          <div className="mt-4">
            <AvatarUpload avatarUrl={avatarUrl} onUpload={handleAvatarUpload} />
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
          <SectionDivider title="Basic Information" />
          <div className="mt-4 flex flex-col gap-6">
            <FormField
              label="Display Name"
              htmlFor="displayName"
              description="This is how your name will appear on your profile"
            >
              <TextInput
                id="displayName"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Enter your display name"
              />
            </FormField>

            <FormField
              label="Username"
              htmlFor="username"
              description="Your unique username for FundBrave"
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className={cn(
                    "w-full bg-surface-sunken rounded-xl pl-8 pr-4 py-3",
                    "text-foreground placeholder:text-text-tertiary",
                    "border border-white/10 outline-none",
                    "focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </FormField>

            <FormField
              label="Bio"
              htmlFor="bio"
              description="Write a short bio to introduce yourself"
            >
              <TextAreaInput
                id="bio"
                value={bio}
                onChange={setBio}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={280}
              />
            </FormField>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
          <SectionDivider title="Additional Information" />
          <div className="mt-4 flex flex-col gap-6">
            <FormField
              label="Website"
              htmlFor="website"
              description="Add a link to your personal website or portfolio"
            >
              <TextInput
                id="website"
                type="url"
                value={website}
                onChange={setWebsite}
                placeholder="https://example.com"
              />
            </FormField>

            <FormField
              label="Location"
              htmlFor="location"
              description="Where are you based?"
            >
              <TextInput
                id="location"
                value={location}
                onChange={setLocation}
                placeholder="City, Country"
              />
            </FormField>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
