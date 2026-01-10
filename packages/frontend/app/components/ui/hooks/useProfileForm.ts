import { useState, useCallback } from "react";
import { z } from "zod";

// Zod validation schema
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z.string().email("Please enter a valid email address"),
  birthdate: z.string().min(1, "Please select your birthdate"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

interface UseProfileFormOptions {
  onSubmitSuccess?: () => void;
  initialData?: Partial<ProfileFormData>;
}

/**
 * Custom hook for managing profile form state and validation.
 * Extracts all logic from ProfileDetail.tsx for better separation of concerns.
 */
export function useProfileForm(options: UseProfileFormOptions = {}) {
  const { onSubmitSuccess, initialData } = options;

  const [formData, setFormData] = useState<ProfileFormData>({
    name: initialData?.name ?? "",
    username: initialData?.username ?? "",
    email: initialData?.email ?? "",
    birthdate: initialData?.birthdate ?? "",
    bio: initialData?.bio ?? "",
    avatar: initialData?.avatar ?? "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData?.avatar ?? null
  );
  const [touchedFields, setTouchedFields] = useState<Set<keyof ProfileFormData>>(
    new Set()
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear error when user starts typing
      if (errors[name as keyof ProfileFormData]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (field: keyof ProfileFormData) => {
      setTouchedFields((prev) => new Set(prev).add(field));

      // Validate single field on blur
      try {
        profileSchema.pick({ [field]: true }).parse({ [field]: formData[field] });
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors((prev) => ({
            ...prev,
            [field]: error.issues[0]?.message,
          }));
        }
      }
    },
    [formData]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          avatar: "Please upload PNG or JPEG format only",
        }));
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          avatar: "File size must be less than 5MB",
        }));
        return;
      }

      // Check dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < 400 || img.height < 400) {
          setErrors((prev) => ({
            ...prev,
            avatar: "Image must be at least 400x400px",
          }));
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
            setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
            setErrors((prev) => ({ ...prev, avatar: undefined }));
          };
          reader.readAsDataURL(file);
        }
      };
      img.src = URL.createObjectURL(file);
    },
    []
  );

  const removeAvatar = useCallback(() => {
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatar: "" }));
  }, []);

  const getInitials = useCallback(() => {
    if (!formData.name.trim()) return "?";
    const parts = formData.name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }, [formData.name]);

  const handleSubmit = useCallback(async () => {
    // Validate all fields
    try {
      profileSchema.parse(formData);
      setErrors({});

      // Simulate API call with loading state
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsLoading(false);
      onSubmitSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ProfileFormData] = err.message;
          }
        });
        setErrors(fieldErrors);

        // Mark all fields as touched
        setTouchedFields(
          new Set(Object.keys(formData) as Array<keyof ProfileFormData>)
        );
      }
      setIsLoading(false);
    }
  }, [formData, onSubmitSuccess]);

  const updateBirthdate = useCallback(
    (date: Date | undefined) => {
      setFormData((prev) => ({
        ...prev,
        birthdate: date ? date.toISOString().split("T")[0] : "",
      }));
      if (errors.birthdate) {
        setErrors((prev) => ({ ...prev, birthdate: undefined }));
      }
      setTouchedFields((prev) => new Set(prev).add("birthdate"));
    },
    [errors.birthdate]
  );

  return {
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
  };
}
