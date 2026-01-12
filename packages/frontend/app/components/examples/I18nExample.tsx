'use client';

/**
 * i18n Example Component
 *
 * This component demonstrates various i18n patterns used in FundBrave.
 * Use this as a reference when implementing translations in other components.
 *
 * NOTE: This is an example/reference component and should not be used in production.
 */

import { useTranslations } from 'next-intl';
import { useI18n } from '@/app/hooks/useI18n';

interface I18nExampleProps {
  donorCount: number;
  daysLeft: number;
  raised: number;
  goal: number;
  createdAt: Date;
}

export function I18nExample({
  donorCount,
  daysLeft,
  raised,
  goal,
  createdAt,
}: I18nExampleProps) {
  // Use namespaced translations for specific sections
  const tCampaign = useTranslations('campaigns.card');
  const tCommon = useTranslations('common.actions');
  const tErrors = useTranslations('errors.404');

  // Use the custom hook for formatting
  const { formatCurrency, formatPercent, formatRelativeTime, formatCompact } = useI18n();

  const percentFunded = Math.round((raised / goal) * 100);

  return (
    <div className="space-y-8 p-6 bg-card rounded-xl border border-white/10">
      <h2 className="text-xl font-bold">i18n Examples</h2>

      {/* Basic Translation */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Basic Translation</h3>
        <p className="text-muted-foreground">
          404 Title: <span className="text-foreground">{tErrors('title')}</span>
        </p>
        <p className="text-muted-foreground">
          404 Message: <span className="text-foreground">{tErrors('message')}</span>
        </p>
      </section>

      {/* Pluralization */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Pluralization (ICU Format)</h3>
        <p className="text-muted-foreground">
          1 donor: <span className="text-foreground">{tCampaign('donors', { count: 1 })}</span>
        </p>
        <p className="text-muted-foreground">
          {donorCount} donors:{' '}
          <span className="text-foreground">{tCampaign('donors', { count: donorCount })}</span>
        </p>
        <p className="text-muted-foreground">
          Days left: <span className="text-foreground">{tCampaign('daysLeft', { count: daysLeft })}</span>
        </p>
      </section>

      {/* Variable Interpolation */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Variable Interpolation</h3>
        <p className="text-muted-foreground">
          Percent funded:{' '}
          <span className="text-foreground">
            {tCampaign('percentFunded', { percent: percentFunded })}
          </span>
        </p>
      </section>

      {/* Number Formatting */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Number Formatting</h3>
        <p className="text-muted-foreground">
          Currency: <span className="text-foreground">{formatCurrency(raised)}</span>
        </p>
        <p className="text-muted-foreground">
          Percentage: <span className="text-foreground">{formatPercent(percentFunded)}</span>
        </p>
        <p className="text-muted-foreground">
          Compact: <span className="text-foreground">{formatCompact(raised)}</span>
        </p>
      </section>

      {/* Date/Time Formatting */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Date/Time Formatting</h3>
        <p className="text-muted-foreground">
          Relative time: <span className="text-foreground">{formatRelativeTime(createdAt)}</span>
        </p>
      </section>

      {/* Common Actions */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Common Action Buttons</h3>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary text-white rounded-lg">
            {tCommon('donate')}
          </button>
          <button className="px-4 py-2 bg-secondary text-foreground rounded-lg">
            {tCommon('share')}
          </button>
          <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg">
            {tCommon('cancel')}
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Usage Example:
 *
 * ```tsx
 * <I18nExample
 *   donorCount={42}
 *   daysLeft={7}
 *   raised={12500}
 *   goal={50000}
 *   createdAt={new Date(Date.now() - 2 * 60 * 60 * 1000)} // 2 hours ago
 * />
 * ```
 */
