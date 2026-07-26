/**
 * Type definitions for CreatePost component
 */

export type PostType = "post" | "campaign-update";

// Audience types for post visibility
export type AudienceType = "everyone" | "public" | "friends" | "private";

export interface AudienceOption {
  id: AudienceType;
  label: string;
  description?: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  audience: AudienceType;
}

export interface CampaignOption {
  id: string;
  name: string;
  category: string;
}

export interface PostData {
  type: "post";
  content: string;
  mediaUrls?: string[];
}

export interface CampaignUpdateData {
  type: "campaign-update";
  category: string;
  campaign: string;
  title: string;
  update: string;
  mediaUrls?: string[];
}

export type PublishData = PostData | CampaignUpdateData;

export interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (data: PublishData) => void;
  user?: UserProfile;
  campaignCategories?: string[];
  userCampaigns?: CampaignOption[];
}

export interface MediaActionsProps {
  onImageClick?: () => void;
  onGifClick?: () => void;
  onPollClick?: () => void;
  onEmojiClick?: () => void;
  onCalendarClick?: () => void;
  onLocationClick?: () => void;
}

export interface PostFormErrors {
  content?: string;
}

export interface CampaignUpdateFormErrors {
  category?: string;
  campaign?: string;
  title?: string;
  update?: string;
}

export interface CreateCampaignUpdateFormProps {
  category: string;
  campaign: string;
  title: string;
  update: string;
  onCategoryChange: (category: string) => void;
  onCampaignChange: (campaign: string) => void;
  onTitleChange: (title: string) => void;
  onUpdateChange: (update: string) => void;
  onPublish: () => void;
  campaignCategories: string[];
  userCampaigns: CampaignOption[];
  isPublishing?: boolean;
  mediaActions?: MediaActionsProps;
  errors?: CampaignUpdateFormErrors;
}

export interface CreatePostFormProps {
  content: string;
  onContentChange: (content: string) => void;
  onRewriteWithAI: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
  mediaActions?: MediaActionsProps;
  error?: string;
}
// Form Field Props Types
export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  showMediaActions?: boolean;
  required?: boolean;
  mediaActions?: MediaActionsProps;
  disabled?: boolean;
  className?: string;
  id?: string;
  error?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  minLength?: number;
}

// Audience Dropdown Props
export interface AudienceDropdownProps {
  selectedAudience: AudienceType;
  onAudienceChange: (audience: AudienceType) => void;
  options: AudienceOption[];
}