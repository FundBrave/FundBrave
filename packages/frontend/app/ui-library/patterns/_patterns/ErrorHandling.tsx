"use client";

import { Input } from "@/app/components/ui/primitives/input";
import { Alert } from "@/app/components/ui/primitives/alert";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Button } from "@/app/components/ui/button";
import { CodeBlock } from "@/app/ui-library/_components/CodeBlock";
import { AlertCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------
const INLINE_ERROR_CODE = `<div className="space-y-1.5">
  <label htmlFor="email" className="text-sm font-medium text-text-primary">
    Email Address
  </label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    value="invalid-email"
    error
    errorMessage="Please enter a valid email address."
  />
</div>`;

const ALERT_BANNER_CODE = `<Alert variant="destructive" title="Transaction Failed" onClose={() => {}}>
  The transaction could not be processed. Your wallet rejected the request
  or you have insufficient funds. Please check your balance and try again.
</Alert>`;

const EMPTY_STATE_CODE = `<EmptyState
  icon={AlertCircle}
  title="Something went wrong"
  description="We couldn't load your campaign data. This might be a temporary issue with our servers."
  action={{
    label: "Try Again",
    onClick: () => window.location.reload(),
    variant: "primary",
  }}
  secondaryAction={{
    label: "Contact Support",
    onClick: () => {},
  }}
/>`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ErrorHandling() {
  return (
    <div className="space-y-10">
      {/* Pattern 1: Inline field error */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-text-primary">
            1. Inline Field Error
          </h4>
          <p className="text-xs text-text-tertiary">
            Validation errors displayed directly below the input field for
            immediate, contextual feedback.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 max-w-md">
          <div className="space-y-1.5">
            <label
              htmlFor="demo-email"
              className="text-sm font-medium text-text-primary"
            >
              Email Address
            </label>
            <Input
              id="demo-email"
              type="email"
              placeholder="you@example.com"
              defaultValue="invalid-email"
              error
              errorMessage="Please enter a valid email address."
            />
          </div>
        </div>

        <CodeBlock
          code={INLINE_ERROR_CODE}
          language="tsx"
          title="Inline field validation error"
        />
      </section>

      {/* Pattern 2: Alert banner */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-text-primary">
            2. Alert Banner
          </h4>
          <p className="text-xs text-text-tertiary">
            A prominent banner for page-level or action-level errors that
            require the user&apos;s attention before proceeding.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <Alert variant="destructive" title="Transaction Failed">
            The transaction could not be processed. Your wallet rejected the
            request or you have insufficient funds. Please check your balance
            and try again.
          </Alert>
        </div>

        <CodeBlock
          code={ALERT_BANNER_CODE}
          language="tsx"
          title="Destructive alert banner"
        />
      </section>

      {/* Pattern 3: Empty state with retry */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-text-primary">
            3. Error Empty State
          </h4>
          <p className="text-xs text-text-tertiary">
            A full-section error state for when data fails to load, with clear
            retry and fallback actions.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <EmptyState
            icon={AlertCircle}
            title="Something went wrong"
            description="We couldn't load your campaign data. This might be a temporary issue with our servers."
            action={{
              label: "Try Again",
              onClick: () => {},
              variant: "primary",
            }}
            secondaryAction={{
              label: "Contact Support",
              onClick: () => {},
            }}
          />
        </div>

        <CodeBlock
          code={EMPTY_STATE_CODE}
          language="tsx"
          title="Error empty state with retry"
        />
      </section>
    </div>
  );
}
