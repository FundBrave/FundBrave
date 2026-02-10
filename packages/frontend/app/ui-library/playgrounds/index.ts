import type { PlaygroundConfig } from "../types";

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

/**
 * Maps component slugs to their playground configurations.
 * Used by LiveDemos to render interactive ComponentPlayground instances.
 */
export const PLAYGROUND_REGISTRY: Record<string, PlaygroundConfig> = {
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
};
