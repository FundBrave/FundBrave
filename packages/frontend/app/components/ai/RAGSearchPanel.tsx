"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Sparkles,
  Loader2,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
  X,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { useRAGSearch, getConfidenceLabel, getConfidenceColor } from "@/app/hooks/useRAGSearch";
import type { RAGQueryResponse } from "@/app/lib/ai-service";

// ============================================================================
// Types
// ============================================================================

export interface RAGSearchPanelProps {
  /** Initial query to search */
  initialQuery?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Categories to filter by */
  categories?: string[];
  /** Number of results to return */
  topK?: number;
  /** Callback when search is performed */
  onSearch?: (query: string, result: RAGQueryResponse) => void;
  /** Show search history */
  showHistory?: boolean;
  /** Optional class name */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

// ============================================================================
// Source Citation Component
// ============================================================================

function SourceCitation({
  source,
  index,
  isExpanded,
  onToggle,
}: {
  source: RAGQueryResponse["sources"][0];
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const category = (source.metadata?.category as string) || "General";
  const type = (source.metadata?.type as string) || "Document";
  const similarity = Math.round(source.similarity * 100);

  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-surface-sunken transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded bg-primary/20 text-primary text-xs font-bold">
            {index + 1}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">{category}</p>
            <p className="text-xs text-text-tertiary">{type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">{similarity}% match</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border-subtle"
          >
            <div className="p-3 bg-surface-sunken/50">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {source.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Search History Item
// ============================================================================

function SearchHistoryItem({
  query,
  onSelect,
  onRemove,
}: {
  query: string;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-sunken transition-colors text-left"
      >
        <Clock className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        <span className="text-sm text-text-secondary truncate">{query}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-surface-sunken transition-all"
        aria-label="Remove from history"
      >
        <X className="w-3.5 h-3.5 text-text-tertiary" />
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RAGSearchPanel({
  initialQuery = "",
  placeholder = "Ask anything about FundBrave...",
  categories,
  topK = 5,
  onSearch,
  showHistory = true,
  className,
  compact = false,
}: RAGSearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    search,
    isSearching,
    result,
    error,
    searchHistory,
    clearHistory,
    reset,
  } = useRAGSearch();

  // Focus input on mount
  useEffect(() => {
    if (!compact && inputRef.current) {
      inputRef.current.focus();
    }
  }, [compact]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    try {
      const searchResult = await search(query, categories?.[0], topK);
      onSearch?.(query, searchResult);
    } catch (err) {
      console.error("RAG search failed:", err);
    }
  }, [query, search, categories, topK, onSearch, isSearching]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  // Toggle source expansion
  const toggleSource = useCallback((index: number) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Copy answer to clipboard
  const copyAnswer = useCallback(async () => {
    if (!result?.answer) return;

    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [result]);

  // Select from history
  const selectFromHistory = useCallback((historicQuery: string) => {
    setQuery(historicQuery);
    reset();
  }, [reset]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl",
            "bg-surface-elevated border border-border-subtle",
            "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
            "transition-all duration-200"
          )}
        >
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={isSearching}
            className={cn(
              "flex-1 bg-transparent text-foreground placeholder:text-text-tertiary",
              "outline-none text-sm sm:text-base"
            )}
          />
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            size="sm"
            className="gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </Button>
        </div>

        {/* AI Badge */}
        <div className="absolute -top-2 left-4">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            AI Powered
          </span>
        </div>
      </div>

      {/* Search History */}
      {showHistory && searchHistory.length > 0 && !result && !isSearching && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-secondary">Recent Searches</p>
            <button
              onClick={clearHistory}
              className="text-xs text-text-tertiary hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {searchHistory.slice(0, 5).map((historicQuery, index) => (
              <SearchHistoryItem
                key={index}
                query={historicQuery}
                onSelect={() => selectFromHistory(historicQuery)}
                onRemove={() => {
                  // Remove from history would need hook update
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
        >
          <MessageSquare className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Answer Card */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle">
            {/* Answer Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI Answer</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Confidence Badge */}
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full bg-white/10",
                    getConfidenceColor(result.confidence)
                  )}
                >
                  {getConfidenceLabel(result.confidence)} confidence
                </span>
                {/* Copy Button */}
                <button
                  onClick={copyAnswer}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Copy answer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            {/* Answer Content */}
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </p>
            </div>

            {/* Context Used Indicator */}
            {result.context_used && (
              <div className="mt-3 pt-3 border-t border-border-subtle">
                <p className="text-xs text-text-tertiary flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Answer based on {result.sources.length} knowledge sources
                </p>
              </div>
            )}
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-text-secondary" />
                  Sources ({result.sources.length})
                </h3>
                <button
                  onClick={() =>
                    setExpandedSources((prev) =>
                      prev.size === result.sources.length
                        ? new Set()
                        : new Set(result.sources.map((_, i) => i))
                    )
                  }
                  className="text-xs text-primary hover:underline"
                >
                  {expandedSources.size === result.sources.length
                    ? "Collapse all"
                    : "Expand all"}
                </button>
              </div>

              <div className="space-y-2">
                {result.sources.map((source, index) => (
                  <SourceCitation
                    key={index}
                    source={source}
                    index={index}
                    isExpanded={expandedSources.has(index)}
                    onToggle={() => toggleSource(index)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* New Search Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                reset();
                inputRef.current?.focus();
              }}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              New Search
            </Button>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 space-y-4"
        >
          <div className="relative">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <p className="text-sm text-text-secondary">Searching knowledge base...</p>
        </motion.div>
      )}

      {/* Empty State */}
      {!result && !isSearching && !error && searchHistory.length === 0 && (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">
            Ask questions about FundBrave, campaigns, donations, or how things work.
          </p>
          <p className="text-xs text-text-tertiary mt-2">
            Powered by AI knowledge retrieval
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Compact Search Input
// ============================================================================

export function RAGSearchInput({
  onSearch,
  placeholder = "Ask AI...",
  className,
}: {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const { search, isSearching } = useRAGSearch();

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    try {
      await search(query);
      onSearch?.(query);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }, [query, search, onSearch, isSearching]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-surface-sunken border border-border-subtle",
        "focus-within:border-primary/50",
        "transition-colors",
        className
      )}
    >
      <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-text-tertiary outline-none"
      />
      {isSearching ? (
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      ) : (
        <Search className="w-4 h-4 text-text-tertiary" />
      )}
    </div>
  );
}

export default RAGSearchPanel;
