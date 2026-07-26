"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth, ME_QUERY_KEY } from "@/hooks/useAuth";
import { apiFetch, ApiError, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UsernameInput } from "@/components/ui/form/UsernameInput";
import { InputField, TextAreaField } from "@/components/ui/form/FormFields";
import { useToast } from "@/components/ui/Toast";

const USERNAME_REGEX = /^[a-z0-9_]+$/;

function validateUsername(username: string): string | undefined {
  if (username.length === 0) return "Pick a username to continue";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be 20 characters or fewer";
  if (!USERNAME_REGEX.test(username)) {
    return "Only lowercase letters, numbers, and underscores are allowed";
  }
  return undefined;
}

function OnboardingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, getToken } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setUsernameError(undefined);
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new ApiError("Your session expired. Please sign in again.", 401);
      }

      const { user: updated } = await apiFetch<{ user: User }>(
        "/api/users/me",
        {
          method: "PATCH",
          token,
          body: {
            username,
            displayName: displayName.trim() || undefined,
            bio: bio.trim() || undefined,
          },
        }
      );

      queryClient.setQueryData(ME_QUERY_KEY, updated);
      showToast("Profile saved. Welcome to FundBrave!", "success");
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setUsernameError("This username is already taken");
      } else {
        showToast(
          err instanceof Error ? err.message : "Something went wrong",
          "error"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col justify-center gap-8 px-4 py-10"
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Set up your profile
        </h1>
        <p className="text-text-secondary">
          Pick a username so people can find and support you.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-surface-elevated p-6 sm:p-8"
      >
        {/* Username (required) */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="username" className="text-foreground">
            Username <span className="text-destructive">*</span>
          </Label>
          <UsernameInput
            id="username"
            value={username}
            onChange={(value) => {
              setUsername(value);
              if (usernameError) setUsernameError(undefined);
            }}
            error={usernameError}
            disabled={submitting}
          />
          <p className="text-xs text-text-tertiary">
            3-20 characters. Lowercase letters, numbers, and underscores only.
          </p>
        </div>

        {/* Display name (optional) */}
        <InputField
          label="Display name"
          value={displayName}
          onChange={setDisplayName}
          placeholder="How your name appears publicly"
          maxLength={50}
          showCharacterCount
        />

        {/* Bio (optional) */}
        <TextAreaField
          label="Bio"
          value={bio}
          onChange={setBio}
          placeholder="Tell people a little about yourself (optional)"
          minHeight="188px"
          showMediaActions={false}
          maxLength={280}
          showCharacterCount
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          loadingText="Saving profile..."
        >
          Continue
        </Button>
      </form>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingForm />
    </AuthGuard>
  );
}
