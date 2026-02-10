"use client";

import { ContentSection } from "@/app/components/ui/MainContent";
import type { PlaygroundConfig } from "../types";

/**
 * ContentSectionDemo - Wraps sample FundBrave content and shows which
 * HTML element is being rendered by the `as` prop.
 */
function ContentSectionDemo(props: { as: "section" | "article" | "div" }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Rendered ContentSection with sample content */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-elevated">
        <ContentSection
          as={props.as}
          aria-labelledby="demo-section-heading"
          className="p-6"
        >
          <h3
            id="demo-section-heading"
            className="mb-2 text-base font-semibold text-text-primary"
          >
            Campaign Statistics
          </h3>
          <p className="mb-4 text-sm text-text-secondary">
            Real-time metrics for decentralized fundraising on FundBrave.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-bold text-primary">342</p>
              <p className="text-xs text-text-tertiary">Active Campaigns</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-bold text-primary">1,204 ETH</p>
              <p className="text-xs text-text-tertiary">Total Raised</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-bold text-primary">8,912</p>
              <p className="text-xs text-text-tertiary">Donors</p>
            </div>
          </div>
        </ContentSection>
      </div>

      {/* Element info */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Rendered Element
        </p>
        <pre className="overflow-x-auto rounded-lg bg-black/20 p-3 text-xs font-mono text-text-secondary">
{`<${props.as}${props.as === "section" ? ' aria-labelledby="..."' : ""}>
  {children}
</${props.as}>`}
        </pre>
        <div className="mt-3 text-xs text-text-tertiary">
          {props.as === "section" && (
            <span>
              <strong className="text-text-secondary">section</strong> creates a
              generic landmark. Pair with{" "}
              <code className="font-mono text-primary">aria-labelledby</code>{" "}
              for screen reader identification.
            </span>
          )}
          {props.as === "article" && (
            <span>
              <strong className="text-text-secondary">article</strong>{" "}
              represents self-contained content that could be distributed
              independently, such as a campaign card or donation receipt.
            </span>
          )}
          {props.as === "div" && (
            <span>
              <strong className="text-text-secondary">div</strong> is a generic
              container with no semantic meaning. Use only when{" "}
              <code className="font-mono text-primary">section</code> or{" "}
              <code className="font-mono text-primary">article</code> are not
              appropriate.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const contentSectionPlayground: PlaygroundConfig = {
  componentName: "ContentSection",
  importPath: "@/app/components/ui/MainContent",
  defaultChildren: undefined,
  controls: [
    {
      prop: "as",
      label: "Element",
      type: "select",
      options: ["section", "article", "div"],
      defaultValue: "section",
    },
  ],
  renderPreview: (props) => (
    <ContentSectionDemo as={props.as as "section" | "article" | "div"} />
  ),
};

export default contentSectionPlayground;
