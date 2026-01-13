/**
 * Privacy Settings - Coming Soon Page
 *
 * Route: /settings/privacy
 *
 * Placeholder page for upcoming privacy settings features including:
 * - Profile visibility controls
 * - Data sharing preferences
 * - Activity visibility settings
 * - Blocked users management
 * - Data export/download options
 */
import { Lock } from "@/app/components/ui/icons";

export default function PrivacySettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Privacy Settings</h2>
        <p className="text-text-secondary">
          Control your privacy and data preferences
        </p>
      </header>

      {/* Coming Soon Content */}
      <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-white/10 bg-surface-sunken/30">
        {/* Icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Lock size={40} className="text-primary/60" />
        </div>

        {/* Heading */}
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Coming Soon
        </h3>

        {/* Description */}
        <p className="text-text-secondary text-center max-w-md mb-8">
          We are building powerful privacy controls to give you complete control
          over your data and visibility on FundBrave.
        </p>

        {/* Planned Features List */}
        <div className="flex flex-col gap-3 text-sm text-text-tertiary">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span>Profile visibility controls</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span>Data sharing preferences</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span>Activity visibility settings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span>Blocked users management</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span>Data export and download</span>
          </div>
        </div>

        {/* Notify Me Button (non-functional placeholder) */}
        <button
          type="button"
          className="mt-8 px-6 py-3 rounded-xl bg-primary/10 text-primary font-medium transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-target"
          aria-label="Get notified when privacy settings are available"
        >
          Notify Me When Available
        </button>
      </div>
    </div>
  );
}
