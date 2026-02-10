"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/app/components/ui/primitives/input";
import { Textarea } from "@/app/components/ui/primitives/textarea";
import { Select } from "@/app/components/ui/primitives/select";
import { Button } from "@/app/components/ui/button";
import { CodeBlock } from "@/app/ui-library/_components/CodeBlock";

// ---------------------------------------------------------------------------
// Layout mode type
// ---------------------------------------------------------------------------
type LayoutMode = "single" | "two-column";

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------
const SINGLE_COLUMN_CODE = `<form className="space-y-6 max-w-lg">
  {/* Campaign Title */}
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-text-primary">
      Campaign Title
    </label>
    <Input placeholder="Enter your campaign title" />
  </div>

  {/* Description */}
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-text-primary">
      Description
    </label>
    <Textarea
      placeholder="Describe your campaign..."
      maxLength={500}
    />
  </div>

  {/* Category */}
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-text-primary">
      Category
    </label>
    <Select placeholder="Select a category">
      <option value="education">Education</option>
      <option value="health">Health</option>
      <option value="environment">Environment</option>
      <option value="community">Community</option>
    </Select>
  </div>

  {/* Goal Amount */}
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-text-primary">
      Goal Amount (ETH)
    </label>
    <Input type="number" placeholder="0.00" />
  </div>

  <Button variant="primary" fullWidth>
    Create Campaign
  </Button>
</form>`;

const TWO_COLUMN_CODE = `<form className="space-y-6 max-w-2xl">
  {/* Two-column row */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="space-y-1.5">
      <label className="...">Campaign Title</label>
      <Input placeholder="Enter your campaign title" />
    </div>
    <div className="space-y-1.5">
      <label className="...">Category</label>
      <Select placeholder="Select a category">
        <option value="education">Education</option>
        <option value="health">Health</option>
      </Select>
    </div>
  </div>

  {/* Full-width field */}
  <div className="space-y-1.5">
    <label className="...">Description</label>
    <Textarea placeholder="Describe your campaign..." maxLength={500} />
  </div>

  {/* Two-column row */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="space-y-1.5">
      <label className="...">Goal Amount (ETH)</label>
      <Input type="number" placeholder="0.00" />
    </div>
    <div className="space-y-1.5">
      <label className="...">Duration (days)</label>
      <Input type="number" placeholder="30" />
    </div>
  </div>

  <div className="flex gap-3 justify-end">
    <Button variant="outline">Save Draft</Button>
    <Button variant="primary">Create Campaign</Button>
  </div>
</form>`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FormLayout() {
  const [layout, setLayout] = useState<LayoutMode>("single");

  return (
    <div className="space-y-8">
      {/* Layout toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary mr-1">Layout:</span>
        <button
          type="button"
          onClick={() => setLayout("single")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
            layout === "single"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-white/[0.04] text-text-tertiary border border-white/10 hover:text-text-secondary hover:bg-white/[0.06]"
          )}
        >
          Single Column
        </button>
        <button
          type="button"
          onClick={() => setLayout("two-column")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
            layout === "two-column"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-white/[0.04] text-text-tertiary border border-white/10 hover:text-text-secondary hover:bg-white/[0.06]"
          )}
        >
          Two Column
        </button>
      </div>

      {/* Live demo */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        {layout === "single" ? <SingleColumnForm /> : <TwoColumnForm />}
      </div>

      {/* Code snippet */}
      <CodeBlock
        code={layout === "single" ? SINGLE_COLUMN_CODE : TWO_COLUMN_CODE}
        language="tsx"
        title={
          layout === "single"
            ? "Single-column form layout"
            : "Two-column responsive form layout"
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single-column form
// ---------------------------------------------------------------------------
function SingleColumnForm() {
  return (
    <form
      className="space-y-6 max-w-lg"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="space-y-1.5">
        <label
          htmlFor="demo-title"
          className="text-sm font-medium text-text-primary"
        >
          Campaign Title
        </label>
        <Input id="demo-title" placeholder="Enter your campaign title" />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="demo-description"
          className="text-sm font-medium text-text-primary"
        >
          Description
        </label>
        <Textarea
          id="demo-description"
          placeholder="Describe your campaign and what you hope to achieve..."
          maxLength={500}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="demo-category"
          className="text-sm font-medium text-text-primary"
        >
          Category
        </label>
        <Select id="demo-category" placeholder="Select a category">
          <option value="education">Education</option>
          <option value="health">Health</option>
          <option value="environment">Environment</option>
          <option value="community">Community</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="demo-goal"
          className="text-sm font-medium text-text-primary"
        >
          Goal Amount (ETH)
        </label>
        <Input id="demo-goal" type="number" placeholder="0.00" />
      </div>

      <Button type="submit" variant="primary" fullWidth>
        Create Campaign
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Two-column form
// ---------------------------------------------------------------------------
function TwoColumnForm() {
  return (
    <form
      className="space-y-6 max-w-2xl"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="demo-tc-title"
            className="text-sm font-medium text-text-primary"
          >
            Campaign Title
          </label>
          <Input
            id="demo-tc-title"
            placeholder="Enter your campaign title"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="demo-tc-category"
            className="text-sm font-medium text-text-primary"
          >
            Category
          </label>
          <Select id="demo-tc-category" placeholder="Select a category">
            <option value="education">Education</option>
            <option value="health">Health</option>
            <option value="environment">Environment</option>
            <option value="community">Community</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="demo-tc-description"
          className="text-sm font-medium text-text-primary"
        >
          Description
        </label>
        <Textarea
          id="demo-tc-description"
          placeholder="Describe your campaign and what you hope to achieve..."
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="demo-tc-goal"
            className="text-sm font-medium text-text-primary"
          >
            Goal Amount (ETH)
          </label>
          <Input id="demo-tc-goal" type="number" placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="demo-tc-duration"
            className="text-sm font-medium text-text-primary"
          >
            Duration (days)
          </label>
          <Input id="demo-tc-duration" type="number" placeholder="30" />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline">
          Save Draft
        </Button>
        <Button type="submit" variant="primary">
          Create Campaign
        </Button>
      </div>
    </form>
  );
}
