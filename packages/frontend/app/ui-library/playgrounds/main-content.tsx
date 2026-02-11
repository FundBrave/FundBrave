"use client";

import { MainContent } from "@/app/components/ui/MainContent";
import type { PlaygroundConfig } from "../types";

/**
 * MainContentDemo - Wraps sample FundBrave content and visualises the
 * semantic <main> landmark structure produced by the component.
 */
function MainContentDemo(props: { id: string; skipTabIndex: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Rendered MainContent with sample content */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-elevated">
        <MainContent
          id={props.id}
          skipTabIndex={props.skipTabIndex}
          className="p-6"
        >
          <h2 className="mb-2 text-lg font-semibold text-text-primary">
            Active Campaigns
          </h2>
          <p className="mb-4 text-sm text-text-secondary">
            Browse decentralized fundraising campaigns and stake crypto to
            support causes you believe in.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-sm font-medium text-text-primary">
                DeFi Education Fund
              </p>
              <p className="text-xs text-text-tertiary">12.4 ETH raised</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-sm font-medium text-text-primary">
                Open Source Web3 Grants
              </p>
              <p className="text-xs text-text-tertiary">8.7 ETH raised</p>
            </div>
          </div>
        </MainContent>
      </div>

      {/* Semantic structure info */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Semantic Structure
        </p>
        <pre className="overflow-x-auto rounded-lg bg-black/20 p-3 text-xs font-mono text-text-secondary">
{`<main
  id="${props.id}"
  role="main"
  tabIndex={${props.skipTabIndex ? "undefined" : "-1"}}
  class="outline-none"
>
  {children}
</main>`}
        </pre>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-tertiary">
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5">
            Landmark:{" "}
            <code className="font-mono text-primary">main</code>
          </span>
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5">
            Skip target:{" "}
            <code className="font-mono text-primary">#{props.id}</code>
          </span>
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5">
            Focus via skip link:{" "}
            <code className="font-mono text-primary">
              {props.skipTabIndex ? "disabled" : "enabled"}
            </code>
          </span>
        </div>
      </div>
    </div>
  );
}

const mainContentPlayground: PlaygroundConfig = {
  componentName: "MainContent",
  importPath: "@/app/components/ui/MainContent",
  defaultChildren: undefined,
  controls: [
    {
      prop: "id",
      label: "ID",
      type: "text",
      defaultValue: "main-content",
    },
    {
      prop: "skipTabIndex",
      label: "Skip TabIndex",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => (
    <MainContentDemo
      id={props.id as string}
      skipTabIndex={props.skipTabIndex as boolean}
    />
  ),
};

export default mainContentPlayground;
