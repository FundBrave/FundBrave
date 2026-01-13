"use client";

import React from "react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { motion } from "motion/react";
import { User, Mail } from "@/app/components/ui/icons";
import { DatePicker } from "@/app/components/ui/date-picker";
import { useProfileForm } from "@/app/components/ui/hooks/useProfileForm";
import AvatarUploader from "@/app/components/ui/form/AvatarUploader";
import OnboardingNavButtons from "@/app/components/onboarding/OnboardingNavButtons";

const ProfileDetails: React.FC<StepComponentProps> = ({ onNext, onBack }) => {
  const {
    formData,
    errors,
    touchedFields,
    isLoading,
    avatarPreview,
    handleInputChange,
    handleBlur,
    handleSubmit,
    handleFileSelect,
    removeAvatar,
    getInitials,
    updateBirthdate,
  } = useProfileForm({ onSubmitSuccess: onNext });

  return (
    <div className="flex flex-col w-full max-w-2xl px-4">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-foreground tracking-wide">
          Profile Details
        </h2>
        <p className="text-muted-foreground text-lg">
          Update your account&apos;s profile information
        </p>
      </motion.div>

      {/* Form Content */}
      <div className="flex flex-col gap-8 mb-10">
        {/* Avatar Upload */}
        <AvatarUploader
          avatarPreview={avatarPreview}
          initials={getInitials()}
          onFileSelect={handleFileSelect}
          onRemove={removeAvatar}
          error={errors.avatar}
        />


        {/* Email Field */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label
            htmlFor="username"
            className="text-foreground text-lg font-medium tracking-wide"
          >
            Username
          </label>
          <div
            className={`h-[60px] bg-surface-elevated rounded-xl px-8 py-4 flex items-center gap-2 border ${
              errors.username && touchedFields.has("username")
                ? "border-red-500"
                : "border-border-default"
            } transition-colors focus-within:border-purple-500`}
          >
            <User className="w-6 h-6 text-text-tertiary" />
            <input
              id="username"
              type="text"
              name="username"
              inputMode="text"
              value={formData.username}
              onChange={handleInputChange}
              onBlur={() => handleBlur("username")}
              placeholder="johndoe"
              className="flex-1 min-w-0 text-foreground border-0! border-black border-none! text-base outline-none placeholder:text-muted-foreground font-medium tracking-wide"
            />
          </div>
          {errors.username && touchedFields.has("username") && (
            <p className="text-red-400 text-sm">{errors.username}</p>
          )}
        </motion.div>

        {/* Birthdate Field */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label
            htmlFor="birthdate"
            className="text-foreground text-lg font-medium tracking-wide"
          >
            Birthdate
          </label>
          <DatePicker
            value={formData.birthdate ? new Date(formData.birthdate) : undefined}
            onChange={updateBirthdate}
            placeholder="Pick a date"
            maxDate={new Date()}
          />
          {errors.birthdate && touchedFields.has("birthdate") && (
            <p className="text-red-400 text-sm">{errors.birthdate}</p>
          )}
        </motion.div>

        {/* Bio Field */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label
            htmlFor="bio"
            className="text-foreground text-lg font-medium tracking-wide"
          >
            Bio
          </label>
          <div
            className={`min-h-[161px] bg-surface-elevated rounded-xl px-8 py-4 border ${
              errors.bio && touchedFields.has("bio")
                ? "border-red-500"
                : "border-border-default"
            } focus-within:border-purple-500 transition-colors`}
          >
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              onBlur={() => handleBlur("bio")}
              placeholder="Write here..."
              rows={5}
              className="w-full bg-transparent focus:border-none! focus:border-0! text-foreground text-base outline-none placeholder:text-muted-foreground font-medium tracking-wide resize-none"
            />
          </div>
          <div className="flex justify-between">
            {errors.bio && touchedFields.has("bio") && (
              <p className="text-red-400 text-sm">{errors.bio}</p>
            )}
            <p className="text-muted-foreground text-sm ml-auto">
              {formData.bio?.length || 0}/500
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation Buttons */}
      <OnboardingNavButtons
        onBack={onBack}
        onNext={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ProfileDetails;
