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
    <div className="flex flex-col w-full max-w-[800px] px-4 overflow-y-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-white tracking-wide">
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

        {/* Name & Username Row */}
        <motion.div
          className="flex gap-5 w-full flex-col sm:flex-row"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Name Field */}
          <div className="flex flex-col gap-3 flex-1 max-w-[267px]">
            <label
              htmlFor="name"
              className="text-white text-lg font-medium tracking-wide"
            >
              Name
            </label>
            <div
              className={`h-[60px] bg-neutral-dark-400 rounded-xl px-8 py-4 flex items-center gap-2 border ${
                errors.name && touchedFields.has("name")
                  ? "border-red-500"
                  : "border-transparent"
              } focus-within:border-purple-500 transition-colors`}
            >
              <User className="w-6 h-6 text-muted-foreground" />
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                onBlur={() => handleBlur("name")}
                placeholder="John Doe"
                className="flex-1 min-w-0 bg-transparent text-white text-base outline-none placeholder:text-muted-foreground font-medium tracking-wide"
              />
            </div>
            {errors.name && touchedFields.has("name") && (
              <p className="text-red-400 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Username Field */}
          <div className="flex flex-col gap-3 flex-1 max-w-[267px]">
            <label
              htmlFor="username"
              className="text-white text-lg font-medium tracking-wide"
            >
              Username
            </label>
            <div
              className={`h-[60px] bg-[#221a31] rounded-xl px-8 py-4 flex items-center gap-2 border ${
                errors.username && touchedFields.has("username")
                  ? "border-red-500"
                  : "border-transparent"
              } focus-within:border-purple-500 transition-colors`}
            >
              <User className="w-6 h-6 text-gray-400" />
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onBlur={() => handleBlur("username")}
                placeholder="johndoe"
                className="flex-1 min-w-0 bg-transparent text-white text-base outline-none placeholder:text-gray-500 font-medium tracking-wide"
              />
            </div>
            {errors.username && touchedFields.has("username") && (
              <p className="text-red-400 text-sm">{errors.username}</p>
            )}
          </div>
        </motion.div>

        {/* Email Field */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label
            htmlFor="email"
            className="text-white text-lg font-medium tracking-wide"
          >
            Email
          </label>
          <div
            className={`h-[60px] bg-[#221a31] rounded-xl px-8 py-4 flex items-center gap-2 border ${
              errors.email && touchedFields.has("email")
                ? "border-red-500"
                : "border-transparent"
            } focus-within:border-purple-500 transition-colors`}
          >
            <Mail className="w-6 h-6 text-muted-foreground" />
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={() => handleBlur("email")}
              placeholder="johndoe@gmail.com"
              className="flex-1 min-w-0 bg-transparent text-white text-base outline-none placeholder:text-muted-foreground font-medium tracking-wide"
            />
          </div>
          {errors.email && touchedFields.has("email") && (
            <p className="text-red-400 text-sm">{errors.email}</p>
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
            className="text-white text-lg font-medium tracking-wide"
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
            className="text-white text-lg font-medium tracking-wide"
          >
            Bio
          </label>
          <div
            className={`min-h-[161px] bg-neutral-dark-400 rounded-xl px-8 py-4 border ${
              errors.bio && touchedFields.has("bio")
                ? "border-red-500"
                : "border-transparent"
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
              className="w-full bg-transparent text-white text-base outline-none placeholder:text-muted-foreground font-medium tracking-wide resize-none"
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
        backWidth="w-[265px]"
        nextWidth="w-[265px]"
      />
    </div>
  );
};

export default ProfileDetails;
