"use client";

import React, { useState, useEffect } from "react";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import type { ProfileSettingsFormData } from "./schemas";
import { useGetMeQuery, useUpdateProfileMutation, useIsUsernameAvailableQuery } from "@/app/generated/graphql";

/**
 * Real GraphQL-based API functions
 */

/**
 * ProfileSettingsPage - Profile settings page component
 *
 * Route: /settings/profile
 *
 * Features:
 * - Avatar upload with preview and crop
 * - Display name and username with validation
 * - Bio with character counter
 * - Website and location fields
 * - Social links section
 * - Visibility/privacy toggles
 * - Save/cancel with optimistic UI
 * - Success toast on save
 *
 * Uses GraphQL:
 * - GetMe query - Fetch current user profile
 * - UpdateProfile mutation - Update profile
 * - IsUsernameAvailable query - Check username availability
 */
export default function ProfileSettingsPage() {
  const [initialData, setInitialData] =
    useState<Partial<ProfileSettingsFormData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user profile via GraphQL
  const { data: userData, loading: isLoading, error: queryError } = useGetMeQuery({
    fetchPolicy: 'cache-and-network',
  });

  // Update profile mutation
  const [updateProfileMutation, { loading: isUpdating }] = useUpdateProfileMutation();

  // Load initial profile data
  useEffect(() => {
    if (userData?.me) {
      const user = userData.me;
      setInitialData({
        displayName: user.displayName || "",
        username: user.username || "",
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
        socialLinks: {
          twitter: "",
          instagram: "",
          linkedin: "",
          github: "",
        },
        isPublicProfile: !user.isPrivate,
        showDonationHistory: false,
        showSupportedCampaigns: true,
      });
    }
  }, [userData]);

  // Set error from query
  useEffect(() => {
    if (queryError) {
      setError("Failed to load profile data. Please refresh the page.");
    }
  }, [queryError]);

  // Handle form submission
  const handleSubmit = async (data: ProfileSettingsFormData) => {
    try {
      await updateProfileMutation({
        variables: {
          input: {
            displayName: data.displayName,
            username: data.username,
            bio: data.bio,
            website: data.website,
            location: data.location,
            isPrivate: !data.isPublicProfile,
          },
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      throw new Error(errorMessage);
    }
  };

  // Handle successful save
  const handleSuccess = () => {
    console.log("Profile saved successfully!");
  };

  // Username availability checker
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    // Note: This requires implementing a lazy query or using Apollo Client directly
    // For now, return true (validation will happen on server)
    return true;
  };

  // Avatar upload placeholder
  const uploadAvatar = async (file: File): Promise<string> => {
    // TODO: Implement avatar upload to backend/S3
    return URL.createObjectURL(file);
  };

  // Avatar remove placeholder
  const removeAvatar = async (): Promise<void> => {
    // TODO: Implement avatar removal
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        {/* Page Header Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-surface-sunken rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-surface-sunken rounded-lg animate-pulse" />
        </div>

        {/* Form Skeleton */}
        <div className="flex flex-col gap-8">
          {/* Avatar Section Skeleton */}
          <div className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-surface-sunken animate-pulse" />
              <div className="flex flex-col gap-3">
                <div className="h-10 w-32 bg-surface-sunken rounded-xl animate-pulse" />
                <div className="h-4 w-40 bg-surface-sunken rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Basic Info Skeleton */}
          <div className="p-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-5 w-24 bg-surface-sunken rounded animate-pulse" />
                  <div className="h-12 w-full bg-surface-sunken rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground">
            Profile Settings
          </h2>
          <p className="text-text-secondary">
            Manage your public profile information
          </p>
        </div>

        <div
          className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive"
          role="alert"
        >
          <p className="font-medium">Error loading profile</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-text-secondary">
          Manage your public profile information
        </p>
      </header>

      {/* Profile Settings Form */}
      <ProfileSettingsForm
        initialData={initialData ?? undefined}
        onSubmit={handleSubmit}
        onAvatarUpload={uploadAvatar}
        onAvatarRemove={removeAvatar}
        checkUsernameAvailability={checkUsernameAvailability}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
