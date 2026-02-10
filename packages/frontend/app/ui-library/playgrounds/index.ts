import type { PlaygroundConfig } from "../types";

// Existing playgrounds
import buttonPlayground from "./button";
import badgePlayground from "./badge";
import cardPlayground from "./card";
import inputPlayground from "./input";
import textareaPlayground from "./textarea";
import selectPlayground from "./select";
import avatarPlayground from "./avatar";
import spinnerPlayground from "./spinner";
import togglePlayground from "./toggle";
import emptyStatePlayground from "./empty-state";
import alertPlayground from "./alert";
import progressPlayground from "./progress";
import dividerPlayground from "./divider";
import tooltipPlayground from "./tooltip";
import iconButtonPlayground from "./icon-button";
import labelPlayground from "./label";
import skeletonPlayground from "./skeleton";
import formFieldsPlayground from "./form-fields";
import otpInputPlayground from "./otp-input";
import passwordStrengthMeterPlayground from "./password-strength-meter";
import usernameInputPlayground from "./username-input";
import walletAddressInputPlayground from "./wallet-address-input";
import calendarPlayground from "./calendar";

// Phase 1: P0 feature components
import datePickerPlayground from "./date-picker";
import socialLinksGroupPlayground from "./social-links-group";
import avatarUploaderPlayground from "./avatar-uploader";
import toastPlayground from "./toast";
import tabNavigationPlayground from "./tab-navigation";
import successCardPlayground from "./success-card";

// Phase 2: Social atoms & molecules
import verifiedBadgePlayground from "./verified-badge";
import postIndicatorPlayground from "./post-indicator";
import postContentPlayground from "./post-content";
import postActionsPlayground from "./post-actions";
import commentInputPlayground from "./comment-input";
import postHeaderPlayground from "./post-header";
import postImageGridPlayground from "./post-image-grid";
import postActionBarPlayground from "./post-action-bar";
import commentCardPlayground from "./comment-card";
import postCardPlayground from "./post-card";

// Phase 3: Modal & overlay components
import modalBackdropPlayground from "./modal-backdrop";
import addReminderModalPlayground from "./add-reminder-modal";
import shareCampaignModalPlayground from "./share-campaign-modal";
import createPostPlayground from "./create-post";

// Phase 4: Threaded & scroll components
import commentThreadPlayground from "./comment-thread";
import commentSectionPlayground from "./comment-section";
import infiniteCommentListPlayground from "./infinite-comment-list";
import stickyCommentInputPlayground from "./sticky-comment-input";

// Phase 5: Accessibility & page-level
import skipLinkPlayground from "./skip-link";
import visuallyHiddenPlayground from "./visually-hidden";
import liveRegionPlayground from "./live-region";
import mainContentPlayground from "./main-content";
import contentSectionPlayground from "./content-section";
import notFoundPagePlayground from "./not-found-page";

// Phase 6: Planned component stubs
import checkboxPlayground from "./checkbox";
import radioPlayground from "./radio";
import dialogPlayground from "./dialog";
import popoverPlayground from "./popover";
import sheetPlayground from "./sheet";
import breadcrumbPlayground from "./breadcrumb";
import dropdownPlayground from "./dropdown";
import paginationPlayground from "./pagination";
import tabsPlayground from "./tabs";
import stepperPlayground from "./stepper";
import tablePlayground from "./table";

/**
 * Maps component slugs to their playground configurations.
 * Used by LiveDemos to render interactive ComponentPlayground instances.
 */
export const PLAYGROUND_REGISTRY: Record<string, PlaygroundConfig> = {
  // Existing
  button: buttonPlayground,
  badge: badgePlayground,
  card: cardPlayground,
  input: inputPlayground,
  textarea: textareaPlayground,
  select: selectPlayground,
  avatar: avatarPlayground,
  spinner: spinnerPlayground,
  toggle: togglePlayground,
  "empty-state": emptyStatePlayground,
  alert: alertPlayground,
  progress: progressPlayground,
  divider: dividerPlayground,
  tooltip: tooltipPlayground,
  "icon-button": iconButtonPlayground,
  label: labelPlayground,
  skeleton: skeletonPlayground,
  "form-fields": formFieldsPlayground,
  "otp-input": otpInputPlayground,
  "password-strength-meter": passwordStrengthMeterPlayground,
  "username-input": usernameInputPlayground,
  "wallet-address-input": walletAddressInputPlayground,
  calendar: calendarPlayground,

  // Phase 1: P0 feature components
  "date-picker": datePickerPlayground,
  "social-links-group": socialLinksGroupPlayground,
  "avatar-uploader": avatarUploaderPlayground,
  toast: toastPlayground,
  "tab-navigation": tabNavigationPlayground,
  "success-card": successCardPlayground,

  // Phase 2: Social atoms & molecules
  "verified-badge": verifiedBadgePlayground,
  "post-indicator": postIndicatorPlayground,
  "post-content": postContentPlayground,
  "post-actions": postActionsPlayground,
  "comment-input": commentInputPlayground,
  "post-header": postHeaderPlayground,
  "post-image-grid": postImageGridPlayground,
  "post-action-bar": postActionBarPlayground,
  "comment-card": commentCardPlayground,
  "post-card": postCardPlayground,

  // Phase 3: Modal & overlay components
  "modal-backdrop": modalBackdropPlayground,
  "add-reminder-modal": addReminderModalPlayground,
  "share-campaign-modal": shareCampaignModalPlayground,
  "create-post": createPostPlayground,

  // Phase 4: Threaded & scroll components
  "comment-thread": commentThreadPlayground,
  "comment-section": commentSectionPlayground,
  "infinite-comment-list": infiniteCommentListPlayground,
  "sticky-comment-input": stickyCommentInputPlayground,

  // Phase 5: Accessibility & page-level
  "skip-link": skipLinkPlayground,
  "visually-hidden": visuallyHiddenPlayground,
  "live-region": liveRegionPlayground,
  "main-content": mainContentPlayground,
  "content-section": contentSectionPlayground,
  "not-found-page": notFoundPagePlayground,

  // Phase 6: Planned component stubs
  checkbox: checkboxPlayground,
  radio: radioPlayground,
  dialog: dialogPlayground,
  popover: popoverPlayground,
  sheet: sheetPlayground,
  breadcrumb: breadcrumbPlayground,
  dropdown: dropdownPlayground,
  pagination: paginationPlayground,
  tabs: tabsPlayground,
  stepper: stepperPlayground,
  table: tablePlayground,
};
