/**
 * Export all CreatePost related components and types
 */

export { default as CreatePost } from "../CreatePost/CreatePost";
export type {
  PostType,
  UserProfile,
  PostData,
  CampaignUpdateData,
  PublishData,
  CreatePostProps,
  MediaActionsProps,
  PostFormErrors,
  CampaignUpdateFormErrors,
} from "../types/CreatePost.types";
export {
  DEFAULT_USER,
  DEFAULT_CAMPAIGN_CATEGORIES,
  DEFAULT_USER_CAMPAIGNS,
  FORM_DIMENSIONS,
  MODAL_CONFIG,
} from "../constants/CreatePost.constants";
export { useCreatePost } from "../hooks/useCreatePost";
export {
  validatePostForm,
  validateCampaignUpdateForm,
  isFormValid,
  safeValidatePost,
  safeValidateCampaignUpdate,
  getFirstError,
  postSchema,
  campaignUpdateSchema,
  VALIDATION_LIMITS,
} from "@/lib/validation.utils";

export type {
  PostFormData,
  CampaignUpdateFormData,
} from "@/lib/validation.utils";
