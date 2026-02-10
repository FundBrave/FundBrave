"use client";

import { useState, useMemo, useCallback, useId } from "react";
import { cn } from "@/lib/utils";
import type { PlaygroundConfig, PlaygroundControl } from "../types";
import { generateCodeSnippet } from "./code-generator";
import {
  InteractivePlayground,
  PlaygroundSelect,
  PlaygroundToggle,
  PlaygroundTextInput,
} from "./InteractivePlayground";

/* -------------------------------------------------------------------------- */
/*  PlaygroundNumberInput                                                      */
/* -------------------------------------------------------------------------- */

export interface PlaygroundNumberInputProps {
  /** Label for the input */
  label: string;
  /** Current value */
  value: number;
  /** Change callback */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
}

/**
 * A number input for the InteractivePlayground controls panel.
 * Matches the styling of PlaygroundTextInput with `type="number"` and
 * min/max/step support.
 */
export function PlaygroundNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: PlaygroundNumberInputProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-text-secondary"
      >
        {label}
      </label>
      <input
        type="number"
        id={id}
        value={value}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          if (!Number.isNaN(parsed)) {
            onChange(parsed);
          }
        }}
        min={min}
        max={max}
        step={step}
        className={cn(
          "w-full rounded-lg border border-border-subtle bg-surface-sunken",
          "px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        )}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ComponentPlayground                                                        */
/* -------------------------------------------------------------------------- */

export interface ComponentPlaygroundProps {
  /** Playground configuration describing the component and its controls */
  config: PlaygroundConfig;
  /** Optional title displayed in the playground header */
  title?: string;
  /** Additional className for the outer container */
  className?: string;
}

/**
 * Build a default state map from control definitions.
 */
function buildDefaultState(
  controls: PlaygroundControl[]
): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (const control of controls) {
    state[control.prop] = control.defaultValue;
  }
  return state;
}

/**
 * ComponentPlayground -- A fully interactive component playground that
 * generates controls from a `PlaygroundConfig`, renders a live preview,
 * and produces a reactive code snippet.
 *
 * Composes with the existing `InteractivePlayground` layout component.
 */
export function ComponentPlayground({
  config,
  title,
  className,
}: ComponentPlaygroundProps) {
  const defaultState = useMemo(
    () => buildDefaultState(config.controls),
    [config.controls]
  );

  const [propState, setPropState] = useState<Record<string, unknown>>(
    () => buildDefaultState(config.controls)
  );

  const updateProp = useCallback((prop: string, value: unknown) => {
    setPropState((prev) => ({ ...prev, [prop]: value }));
  }, []);

  // Generate code snippet reactively from current state
  const code = useMemo(
    () =>
      generateCodeSnippet({
        componentName: config.componentName,
        importPath: config.importPath,
        currentProps: propState,
        defaultProps: defaultState,
        children: config.defaultChildren,
      }),
    [config.componentName, config.importPath, config.defaultChildren, propState, defaultState]
  );

  // Render controls based on control definitions
  const controls = (
    <div className="space-y-3">
      {config.controls.map((control) => {
        const currentValue = propState[control.prop];

        switch (control.type) {
          case "select":
            return (
              <PlaygroundSelect
                key={control.prop}
                label={control.label}
                value={String(currentValue)}
                options={control.options ?? []}
                onChange={(val) => updateProp(control.prop, val)}
              />
            );

          case "toggle":
            return (
              <PlaygroundToggle
                key={control.prop}
                label={control.label}
                checked={Boolean(currentValue)}
                onChange={(val) => updateProp(control.prop, val)}
              />
            );

          case "text":
            return (
              <PlaygroundTextInput
                key={control.prop}
                label={control.label}
                value={String(currentValue)}
                onChange={(val) => updateProp(control.prop, val)}
                placeholder={`Enter ${control.label.toLowerCase()}...`}
              />
            );

          case "number":
            return (
              <PlaygroundNumberInput
                key={control.prop}
                label={control.label}
                value={Number(currentValue)}
                onChange={(val) => updateProp(control.prop, val)}
                min={control.min}
                max={control.max}
                step={control.step}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );

  return (
    <InteractivePlayground
      title={title ?? `${config.componentName} Playground`}
      controls={controls}
      code={code}
      className={className}
    >
      {config.renderPreview(propState)}
    </InteractivePlayground>
  );
}

export default ComponentPlayground;
