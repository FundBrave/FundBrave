"use client";

import { useState, useCallback, useRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export interface CodeBlockTab {
  /** Label shown on the tab button */
  label: string;
  /** Code content for this tab */
  code: string;
  /** Language identifier for this tab */
  language?: string;
}

export interface CodeBlockProps {
  /** The source code string to display */
  code: string;
  /** Language identifier for syntax highlighting hints */
  language?: string;
  /** Optional title shown in a header bar above the code */
  title?: string;
  /** Whether to display line numbers on the left */
  showLineNumbers?: boolean;
  /** Additional className for the outer container */
  className?: string;
  /** Optional tabs for switching between multiple code snippets */
  tabs?: CodeBlockTab[];
}

/* -------------------------------------------------------------------------- */
/*  Lightweight regex-based syntax highlighting                                */
/* -------------------------------------------------------------------------- */

interface Token {
  type: "comment" | "string" | "keyword" | "type" | "number" | "punctuation" | "plain";
  value: string;
}

const KEYWORDS = new Set([
  // JS/TS
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "switch", "case", "break", "continue", "new", "this", "class", "extends",
  "import", "export", "from", "default", "async", "await", "try", "catch",
  "throw", "finally", "typeof", "instanceof", "in", "of", "yield", "void",
  "delete", "do", "with", "debugger", "super", "as", "type", "interface",
  "enum", "implements", "package", "private", "protected", "public", "static",
  // React / JSX
  "use", "client", "server",
  // Python
  "def", "print", "True", "False", "None", "and", "or", "not", "is", "lambda",
  // Solidity
  "pragma", "solidity", "contract", "mapping", "address", "uint256", "event",
  "emit", "modifier", "require", "payable", "external", "internal", "view",
  "pure", "memory", "storage", "calldata",
]);

const TYPE_KEYWORDS = new Set([
  "string", "number", "boolean", "any", "void", "never", "unknown", "null",
  "undefined", "object", "symbol", "bigint", "Array", "Promise", "Record",
  "Partial", "Required", "Readonly", "Pick", "Omit", "React", "ReactNode",
  "JSX", "HTMLElement", "HTMLDivElement", "HTMLButtonElement", "FC",
  "PropsWithChildren", "SetStateAction", "Dispatch",
]);

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let remaining = code;

  while (remaining.length > 0) {
    let matched = false;

    // Single-line comment  (// ...)
    const slComment = remaining.match(/^\/\/[^\n]*/);
    if (slComment) {
      tokens.push({ type: "comment", value: slComment[0] });
      remaining = remaining.slice(slComment[0].length);
      matched = true;
      continue;
    }

    // Multi-line comment  (/* ... */)
    const mlComment = remaining.match(/^\/\*[\s\S]*?\*\//);
    if (mlComment) {
      tokens.push({ type: "comment", value: mlComment[0] });
      remaining = remaining.slice(mlComment[0].length);
      matched = true;
      continue;
    }

    // Hash comment  (# ...)
    const hashComment = remaining.match(/^#[^\n]*/);
    if (hashComment) {
      tokens.push({ type: "comment", value: hashComment[0] });
      remaining = remaining.slice(hashComment[0].length);
      matched = true;
      continue;
    }

    // Template literal  (`...`)
    const templateLiteral = remaining.match(/^`[^`]*`/);
    if (templateLiteral) {
      tokens.push({ type: "string", value: templateLiteral[0] });
      remaining = remaining.slice(templateLiteral[0].length);
      matched = true;
      continue;
    }

    // Double-quoted string
    const dqString = remaining.match(/^"(?:[^"\\]|\\.)*"/);
    if (dqString) {
      tokens.push({ type: "string", value: dqString[0] });
      remaining = remaining.slice(dqString[0].length);
      matched = true;
      continue;
    }

    // Single-quoted string
    const sqString = remaining.match(/^'(?:[^'\\]|\\.)*'/);
    if (sqString) {
      tokens.push({ type: "string", value: sqString[0] });
      remaining = remaining.slice(sqString[0].length);
      matched = true;
      continue;
    }

    // Numbers
    const num = remaining.match(/^\b\d+(\.\d+)?\b/);
    if (num) {
      tokens.push({ type: "number", value: num[0] });
      remaining = remaining.slice(num[0].length);
      matched = true;
      continue;
    }

    // Words (identifiers / keywords)
    const word = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (word) {
      const w = word[0];
      if (KEYWORDS.has(w)) {
        tokens.push({ type: "keyword", value: w });
      } else if (TYPE_KEYWORDS.has(w)) {
        tokens.push({ type: "type", value: w });
      } else {
        tokens.push({ type: "plain", value: w });
      }
      remaining = remaining.slice(w.length);
      matched = true;
      continue;
    }

    // Punctuation (braces, parens, operators)
    const punct = remaining.match(/^[{}()[\];:.,<>=!&|?+\-*/^~@%]+/);
    if (punct) {
      tokens.push({ type: "punctuation", value: punct[0] });
      remaining = remaining.slice(punct[0].length);
      matched = true;
      continue;
    }

    // Whitespace / newlines -- keep them as plain
    if (!matched) {
      tokens.push({ type: "plain", value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

const TOKEN_COLORS: Record<Token["type"], string> = {
  comment: "text-[#6a9955]",       // green
  string: "text-[#ce9178]",        // orange-brown
  keyword: "text-[#c586c0]",       // purple-pink
  type: "text-[#4ec9b0]",          // teal
  number: "text-[#b5cea8]",        // light green
  punctuation: "text-[#d4d4d4]",   // light gray
  plain: "text-[#d4d4d4]",         // light gray
};

function HighlightedCode({ code }: { code: string }) {
  const tokens = tokenize(code);
  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={TOKEN_COLORS[token.type]}>
          {token.value}
        </span>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  CodeBlock Component                                                        */
/* -------------------------------------------------------------------------- */

/**
 * CodeBlock -- renders a code snippet with syntax highlighting, line numbers,
 * and a copy-to-clipboard button.
 *
 * Used throughout the UI Library pages for showing component usage examples.
 */
export function CodeBlock({
  code,
  language,
  title,
  showLineNumbers = false,
  className,
  tabs,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();

  // Resolve active code/language from tabs or direct props
  const activeCode = tabs ? tabs[activeTab]?.code ?? code : code;
  const activeLanguage = tabs
    ? tabs[activeTab]?.language ?? language
    : language;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement("textarea");
      textarea.value = activeCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [activeCode]);

  const lines = activeCode.split("\n");

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-[#1e1e2e] overflow-hidden",
        className
      )}
      role="region"
      aria-label={title ? undefined : "Code snippet"}
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Tab bar */}
      {tabs && tabs.length > 0 && (
        <div
          className="flex border-b border-white/10 bg-white/[0.02]"
          role="tablist"
          aria-label="Code examples"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={index === activeTab}
              aria-controls={`tabpanel-${titleId}-${index}`}
              onClick={() => {
                setActiveTab(index);
                setCopied(false);
              }}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-fast)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                index === activeTab
                  ? "text-white/90"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {tab.label}
              {/* Active indicator */}
              {index === activeTab && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--color-primary)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Title bar */}
      {title && (
        <div
          className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5"
        >
          <span
            id={titleId}
            className="text-sm font-medium text-white/70"
          >
            {title}
          </span>
          {activeLanguage && (
            <span className="text-xs text-white/40 uppercase tracking-wider">
              {activeLanguage}
            </span>
          )}
        </div>
      )}

      {/* Code area */}
      <div
        className="relative group"
        role={tabs ? "tabpanel" : undefined}
        id={tabs ? `tabpanel-${titleId}-${activeTab}` : undefined}
      >
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
            "text-xs font-medium transition-all duration-[var(--duration-fast)]",
            "bg-white/[0.06] text-white/60 hover:bg-white/[0.12] hover:text-white/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1e2e]",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            copied && "opacity-100"
          )}
          aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1 text-emerald-400"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Scrollable code region */}
        <div className="overflow-x-auto custom-scrollbar">
          <pre className="p-4 text-sm leading-relaxed">
            <code className="font-mono">
              {lines.map((line, i) => (
                <div key={i} className="flex">
                  {showLineNumbers && (
                    <span
                      className="mr-4 inline-block w-8 shrink-0 text-right text-white/25 select-none"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                  )}
                  <span className="flex-1">
                    <HighlightedCode code={line} />
                    {"\n"}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default CodeBlock;
