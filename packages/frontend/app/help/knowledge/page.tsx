"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Sparkles, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RAGSearchPanel } from "@/app/components/ai/RAGSearchPanel";

// Suggested questions for users
const SUGGESTED_QUESTIONS = [
  "How do I create a campaign on FundBrave?",
  "What are the different donation models available?",
  "How does staking work on FundBrave?",
  "What is the FBT token and how do I earn it?",
  "How can I verify my campaign to build trust?",
  "What fees does FundBrave charge?",
  "How do I withdraw funds from my campaign?",
  "What is the Impact DAO and how can I participate?",
];

export default function KnowledgeSearchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {/* Back Link */}
          <Link
            href="/help"
            className={cn(
              "flex items-center gap-2 text-text-secondary hover:text-foreground",
              "transition-colors w-fit mb-4"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Help Center</span>
          </Link>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Knowledge Search</h1>
              <p className="text-text-secondary text-sm">
                Ask questions and get instant answers from our knowledge base
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* RAG Search Panel */}
        <RAGSearchPanel
          placeholder="What would you like to know about FundBrave?"
          showHistory={true}
          className="mb-8"
        />

        {/* Suggested Questions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-text-secondary" />
            <h2 className="text-lg font-semibold text-foreground">
              Suggested Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  // This would ideally trigger a search with this question
                  // For now, we'll just copy to clipboard or show in search
                  const searchInput = document.querySelector(
                    'input[type="text"]'
                  ) as HTMLInputElement;
                  if (searchInput) {
                    searchInput.value = question;
                    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
                    searchInput.focus();
                  }
                }}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl text-left",
                  "bg-surface-elevated border border-border-subtle",
                  "hover:border-primary/50 hover:bg-surface-sunken",
                  "transition-all duration-200"
                )}
              >
                <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{question}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Help Topics */}
        <div className="mt-12 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Popular Topics</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "Getting Started",
                description: "Learn the basics of FundBrave",
                icon: BookOpen,
                href: "/help#getting-started",
              },
              {
                title: "Campaigns",
                description: "Creating and managing campaigns",
                icon: Sparkles,
                href: "/help#campaigns",
              },
              {
                title: "Donations",
                description: "Understanding donation models",
                icon: HelpCircle,
                href: "/help#donations",
              },
            ].map((topic, index) => (
              <Link
                key={index}
                href={topic.href}
                className={cn(
                  "flex flex-col items-center p-6 rounded-xl text-center",
                  "bg-surface-elevated border border-border-subtle",
                  "hover:border-primary/50 hover:bg-surface-sunken",
                  "transition-all duration-200"
                )}
              >
                <topic.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {topic.title}
                </h3>
                <p className="text-xs text-text-secondary">{topic.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-4 rounded-xl bg-surface-sunken border border-border-subtle">
          <p className="text-xs text-text-tertiary text-center">
            AI responses are generated based on our knowledge base and may not always be
            accurate. For critical matters, please contact our support team directly.
          </p>
        </div>
      </div>
    </div>
  );
}
