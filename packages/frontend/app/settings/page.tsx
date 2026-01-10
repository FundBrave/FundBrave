import { redirect } from "next/navigation";

/**
 * Settings Hub Page
 *
 * This page serves as the entry point for settings.
 * It immediately redirects to the Profile settings page as the default view.
 */
export default function SettingsPage() {
  redirect("/settings/profile");
}
