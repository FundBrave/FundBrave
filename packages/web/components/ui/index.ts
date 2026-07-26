/**
 * FundBrave MVP UI Kit
 *
 * Design-system subset ported from packages/frontend/app/components/ui.
 * Feature components (posts, comments, CreatePost, modals) intentionally
 * live with their features and are NOT part of this kit.
 */

// Core primitives
export { Button, buttonVariants, type ButtonProps } from "./button";
export { default as IconButton, type IconButtonProps } from "./icon-button";
export { Label } from "./label";
export { Spinner, type SpinnerSize } from "./Spinner";
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonCampaignCard,
  SkeletonPostCard,
  SkeletonTable,
  SkeletonList,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonChart,
  SkeletonStats,
  SkeletonProfile,
} from "./Skeleton";
export { Avatar, type AvatarProps, type AvatarSize } from "./Avatar";
export { Toggle, type ToggleProps } from "./Toggle";
export { EmptyState, EmptyStateCompact } from "./EmptyState";
export { default as TabNavigation } from "./TabNavigation";

// Toast system
export {
  ToastProvider,
  useToast,
  useToastWithHelpers,
  createToastHelpers,
} from "./Toast";

// Form components
export { SelectField, InputField, TextAreaField } from "./form/FormFields";
export { OTPInput } from "./form/OTPInput";
export { PasswordStrengthMeter } from "./form/PasswordStrengthMeter";
export { SocialLinksGroup, type SocialLinks } from "./form/SocialLinksGroup";
export { UsernameInput } from "./form/UsernameInput";
export { WalletAddressInput } from "./form/WalletAddressInput";
export { default as AvatarUploader } from "./form/AvatarUploader";

// Accessibility
export {
  SkipLink,
  SkipLinks,
  type SkipLinkProps,
  type SkipLinksProps,
} from "./SkipLink";
export {
  VisuallyHidden,
  LiveRegion,
  Announcement,
  type VisuallyHiddenProps,
  type LiveRegionProps,
  type AnnouncementProps,
} from "./VisuallyHidden";
export {
  MainContent,
  ContentSection,
  AsideContent,
  NavContent,
  FooterContent,
} from "./MainContent";

// Shared types (used by TabNavigation / form fields)
export type {
  PostType,
  SelectFieldProps,
  InputFieldProps,
  TextAreaFieldProps,
  MediaActionsProps,
} from "./types/CreatePost.types";

// Inline SVG icons used by form fields (ported from providerIcons.tsx)
export {
  AppleIcon,
  GoogleIcon,
  OutlookIcon,
  OutlookWebIcon,
  YahooIcon,
  GifIcon,
  PollIcon,
  Image,
  MapPin,
  Calendar,
  Smile,
} from "./providerIcons";
