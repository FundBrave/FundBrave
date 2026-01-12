"use client";

import React, { useState, useEffect } from "react";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import type { ProfileSettingsFormData } from "./schemas";

/**
 * Mock API functions - replace with actual API calls
 * These simulate the backend endpoints from PHASE2_UX_SPECS.md Section 2.5
 */

// Simulated current user data
const mockUserProfile: Partial<ProfileSettingsFormData> = {
  displayName: "",
  username: "",
  bio: "",
  website: "",
  location: "",
  socialLinks: {
    twitter: "",
    instagram: "",
    linkedin: "",
    github: "",
  },
  isPublicProfile: true,
  showDonationHistory: false,
  showSupportedCampaigns: true,
};

// Simulated unavailable usernames
const unavailableUsernames = new Set([
  "admin",
  "fundbrave",
  "support",
  "help",
  "test",
  "user",
  "official",
]);

/**
 * Simulates GET /api/users/me/profile
 */
async function fetchUserProfile(): Promise<Partial<ProfileSettingsFormData>> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockUserProfile;
}

/**
 * Simulates PATCH /api/users/me/profile
 */
async function updateUserProfile(
  data: ProfileSettingsFormData
): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate validation error for specific usernames
  if (unavailableUsernames.has(data.username.toLowerCase())) {
    throw new Error("Username is not available");
  }

  // In real implementation, this would send data to the API
  console.log("Profile updated:", data);
}

/**
 * Simulates GET /api/users/check-username
 */
async function checkUsernameAvailability(username: string): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Check against unavailable usernames
  return !unavailableUsernames.has(username.toLowerCase());
}

/**
 * Simulates POST /api/users/me/avatar
 */
async function uploadAvatar(file: File): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // In real implementation, this would upload to storage and return URL
  // For now, create a local object URL
  return URL.createObjectURL(file);
}

/**
 * Simulates DELETE /api/users/me/avatar
 */
async function removeAvatar(): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // In real implementation, this would delete from storage
}

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
 * API Endpoints (from PHASE2_UX_SPECS.md):
 * - GET /api/users/me/profile - Fetch current profile
 * - PATCH /api/users/me/profile - Update profile
 * - GET /api/users/check-username - Check username availability
 * - POST /api/users/me/avatar - Upload avatar
 * - DELETE /api/users/me/avatar - Remove avatar
 */
export default function ProfileSettingsPage() {
  const [initialData, setInitialData] =
    useState<Partial<ProfileSettingsFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchUserProfile();
        setInitialData(data);
      } catch {
        setError("Failed to load profile data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Handle form submission
  const handleSubmit = async (data: ProfileSettingsFormData) => {
    await updateUserProfile(data);
  };

  // Handle successful save
  const handleSuccess = () => {
    // Could trigger a global toast notification here
    console.log("Profile saved successfully!");
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
