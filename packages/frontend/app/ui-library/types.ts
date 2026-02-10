import type React from "react";

export type ComponentCategory =
  | "base"
  | "form"
  | "data-display"
  | "feedback"
  | "social"
  | "navigation"
  | "accessibility"
  | "icons";

export type ComponentStatus = "built" | "planned";

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

export interface ComponentExample {
  title: string;
  description?: string;
  code: string;
}

export interface ComponentRegistryEntry {
  slug: string;
  name: string;
  description: string;
  category: ComponentCategory;
  status: ComponentStatus;
  importPath: string;
  filePath: string;
  tags: string[];
  props?: PropDefinition[];
  examples?: ComponentExample[];
  accessibility?: string[];
  relatedComponents?: string[];
  designTokens?: string[];
  guidelines?: UsageGuideline[];
}

export interface CategoryInfo {
  id: ComponentCategory;
  label: string;
  description: string;
  icon: string; // lucide icon name
}

/* -------------------------------------------------------------------------- */
/*  Playground types                                                           */
/* -------------------------------------------------------------------------- */

export type PlaygroundControlType = "select" | "toggle" | "text" | "number";

export interface PlaygroundControl {
  /** Prop name on the component */
  prop: string;
  /** Human-readable label for the control */
  label: string;
  /** Control widget type */
  type: PlaygroundControlType;
  /** Available options for 'select' type */
  options?: string[];
  /** Default value for the control */
  defaultValue: string | boolean | number;
  /** Minimum value for 'number' type */
  min?: number;
  /** Maximum value for 'number' type */
  max?: number;
  /** Step increment for 'number' type */
  step?: number;
}

export interface PlaygroundConfig {
  /** Component display name, e.g. "Button" */
  componentName: string;
  /** Import path, e.g. "@/app/components/ui/button" */
  importPath: string;
  /** Default text content for children */
  defaultChildren?: string;
  /** Control definitions */
  controls: PlaygroundControl[];
  /** Render function that receives current props and returns a live preview */
  renderPreview: (props: Record<string, unknown>) => React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/*  Usage guidelines types                                                     */
/* -------------------------------------------------------------------------- */

export interface UsageGuideline {
  type: "do" | "dont" | "caution";
  text: string;
}
