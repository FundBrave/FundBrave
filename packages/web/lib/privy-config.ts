/**
 * Privy configuration helper.
 *
 * When NEXT_PUBLIC_PRIVY_APP_ID is missing (or still the .env.example
 * placeholder starting with "your-"), the app runs in degraded mode:
 * PrivyProvider is skipped entirely and useAuth() reports 'unauthenticated',
 * with login() surfacing a helpful toast instead of crashing.
 *
 * NEXT_PUBLIC_ env vars are inlined at build time, so these are stable
 * constants for the lifetime of the app.
 */

const rawAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/** The Privy app ID, or null when not configured. */
export const privyAppId: string | null =
  rawAppId && !rawAppId.startsWith("your-") ? rawAppId : null;

/** Whether Privy auth is configured and PrivyProvider is mounted. */
export const isPrivyConfigured: boolean = privyAppId !== null;

/** Message shown when someone tries to sign in without Privy configured. */
export const PRIVY_NOT_CONFIGURED_MESSAGE =
  "Sign-in is unavailable: NEXT_PUBLIC_PRIVY_APP_ID is not set. Add your Privy app ID to packages/web/.env.local and restart the dev server.";
