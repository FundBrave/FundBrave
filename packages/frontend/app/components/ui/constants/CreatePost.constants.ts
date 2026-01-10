/**
 * Constants for CreatePost component
 */

import type { UserProfile, CampaignOption, AudienceOption } from "../types/CreatePost.types";

export const AUDIENCE_OPTIONS: AudienceOption[] = [
  { id: "everyone", label: "Everyone", description: "Anyone can see this post" },
  { id: "public", label: "Public", description: "Visible to all users" },
  { id: "friends", label: "Friends", description: "Only friends can see" },
  { id: "private", label: "Private", description: "Only you can see" },
];

export const DEFAULT_USER: UserProfile = {
  name: "Anna Doe",
  avatar: "/api/placeholder/42/42",
  audience: "everyone",
};

export const DEFAULT_CAMPAIGN_CATEGORIES: string[] = [
  "Health and Medical",
  "Education",
  "Community",
  "Emergency",
  "Animals",
  "Environment",
];

export const DEFAULT_USER_CAMPAIGNS: CampaignOption[] = [
  { id: "1", name: "Support John's Fight Against Cancer", category: "Health and Medical" },
  { id: "2", name: "Help Build School Library", category: "Education" },
  { id: "3", name: "Community Garden Project", category: "Community" },
  { id: "4", name: "Emergency Relief Fund", category: "Emergency" },
  { id: "5", name: "Save the Local Animal Shelter", category: "Animals" },
  { id: "6", name: "City Park Restoration Initiative", category: "Environment" },
];

export const FORM_DIMENSIONS = {
  POST_FORM_WIDTH: "559px",
  CAMPAIGN_UPDATE_FORM_WIDTH: "554px",
  DEFAULT_TEXTAREA_HEIGHT: "272px",
  CAMPAIGN_UPDATE_TEXTAREA_HEIGHT: "188px",
} as const;

export const MODAL_CONFIG = {
  MAX_WIDTH: "843px",
  MAX_HEIGHT: "90vh",
  PADDING_X: "142px",
  PADDING_Y: "37px",
  CONTENT_MAX_HEIGHT: "calc(90vh-240px)",
} as const;
