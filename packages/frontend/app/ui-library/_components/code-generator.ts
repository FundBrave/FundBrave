/**
 * Code Generator
 *
 * Generates formatted TSX code snippets for the ComponentPlayground.
 * Produces copy-pasteable import + JSX reflecting the current prop state.
 */

/**
 * Format a single prop for JSX output.
 *
 * - Boolean `true` renders as just the prop name: `loading`
 * - Boolean `false` renders as `loading={false}`
 * - Strings render in double quotes: `variant="primary"`
 * - Numbers render in braces: `delayMs={300}`
 */
function formatProp(name: string, value: unknown): string {
  if (typeof value === "boolean") {
    return value ? name : `${name}={false}`;
  }
  if (typeof value === "number") {
    return `${name}={${value}}`;
  }
  // Default to string
  return `${name}="${String(value)}"`;
}

export interface GenerateCodeSnippetOptions {
  /** Component display name, e.g. "Button" */
  componentName: string;
  /** Import path, e.g. "@/app/components/ui/button" */
  importPath: string;
  /** Current prop values from the playground controls */
  currentProps: Record<string, unknown>;
  /** Default prop values — props matching their default are excluded */
  defaultProps: Record<string, unknown>;
  /** Optional children text content */
  children?: string;
}

/**
 * Generates a formatted TSX code snippet string from the current playground
 * state. Only includes props that differ from their defaults.
 *
 * @example
 * ```
 * generateCodeSnippet({
 *   componentName: "Button",
 *   importPath: "@/app/components/ui/button",
 *   currentProps: { variant: "destructive", size: "lg", loading: true },
 *   defaultProps: { variant: "default", size: "md", loading: false },
 *   children: "Click me",
 * })
 * // =>
 * // import { Button } from "@/app/components/ui/button";
 * //
 * // <Button variant="destructive" size="lg" loading>
 * //   Click me
 * // </Button>
 * ```
 */
export function generateCodeSnippet({
  componentName,
  importPath,
  currentProps,
  defaultProps,
  children,
}: GenerateCodeSnippetOptions): string {
  const importLine = `import { ${componentName} } from "${importPath}";`;

  // Collect only props that differ from their defaults
  const changedProps: string[] = [];
  for (const [key, value] of Object.entries(currentProps)) {
    if (value !== defaultProps[key]) {
      changedProps.push(formatProp(key, value));
    }
  }

  const hasChildren = children !== undefined && children.length > 0;
  const isMultiline = changedProps.length >= 2;

  let jsx: string;

  if (changedProps.length === 0) {
    // No changed props
    if (hasChildren) {
      jsx = `<${componentName}>${children}</${componentName}>`;
    } else {
      jsx = `<${componentName} />`;
    }
  } else if (isMultiline) {
    // Multi-line format for 2+ props
    const propsBlock = changedProps.map((p) => `  ${p}`).join("\n");
    if (hasChildren) {
      jsx = `<${componentName}\n${propsBlock}\n>\n  ${children}\n</${componentName}>`;
    } else {
      jsx = `<${componentName}\n${propsBlock}\n/>`;
    }
  } else {
    // Single prop, single line
    const propsInline = changedProps.join(" ");
    if (hasChildren) {
      jsx = `<${componentName} ${propsInline}>${children}</${componentName}>`;
    } else {
      jsx = `<${componentName} ${propsInline} />`;
    }
  }

  return `${importLine}\n\n${jsx}`;
}
