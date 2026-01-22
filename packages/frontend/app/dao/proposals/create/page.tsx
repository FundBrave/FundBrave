"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/Spinner";
import { cn } from "@/lib/utils";

type ProposalCategory = "yield-allocation" | "parameter-change" | "treasury" | "general";

interface ProposalForm {
  title: string;
  description: string;
  category: ProposalCategory;
  currentValue: string;
  proposedValue: string;
  impact: string;
  timeline: string;
  votingPeriod: number; // in days
}

const CATEGORY_OPTIONS: Array<{ value: ProposalCategory; label: string; description: string }> = [
  {
    value: "yield-allocation",
    label: "Yield Allocation",
    description: "Change how platform yield is distributed among stakeholders",
  },
  {
    value: "parameter-change",
    label: "Parameter Change",
    description: "Modify platform parameters like fees, minimums, or timelock periods",
  },
  {
    value: "treasury",
    label: "Treasury Management",
    description: "Allocate treasury funds for grants, marketing, or development",
  },
  {
    value: "general",
    label: "General Governance",
    description: "Other governance decisions and platform improvements",
  },
];

export default function CreateProposalPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<ProposalForm>({
    title: "",
    description: "",
    category: "general",
    currentValue: "",
    proposedValue: "",
    impact: "",
    timeline: "",
    votingPeriod: 7,
  });

  const handleInputChange = (
    field: keyof ProposalForm,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (form.title.length < 10) errors.push("Title must be at least 10 characters");
    if (form.title.length > 100) errors.push("Title must be less than 100 characters");
    if (form.description.length < 50) errors.push("Description must be at least 50 characters");
    if (!form.currentValue.trim()) errors.push("Current value is required");
    if (!form.proposedValue.trim()) errors.push("Proposed value is required");
    if (!form.impact.trim()) errors.push("Impact analysis is required");
    if (!form.timeline.trim()) errors.push("Implementation timeline is required");
    if (form.votingPeriod < 3 || form.votingPeriod > 30) {
      errors.push("Voting period must be between 3 and 30 days");
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert("Please fix the following errors:\n\n" + errors.join("\n"));
      return;
    }

    setIsSubmitting(true);

    // Simulate proposal submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In real app: Call smart contract to create proposal
    // Then save to backend via GraphQL mutation

    alert("Proposal created successfully! It will be available for voting soon.");
    router.push("/dao/proposals");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to create proposals
            </p>
            <Button onClick={() => router.push("/auth")}>Connect Wallet</Button>
          </div>
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => setShowPreview(false)}
            className="text-text-secondary hover:text-foreground mb-6 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Edit
          </button>

          <h1 className="text-3xl font-bold text-foreground mb-8">Proposal Preview</h1>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label}
              </span>
              <span className="text-xs text-text-tertiary">
                Voting period: {form.votingPeriod} days
              </span>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-4">{form.title}</h2>

            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-text-secondary whitespace-pre-line">{form.description}</p>
            </div>

            <div className="space-y-4 border-t border-border-subtle pt-6">
              <div>
                <div className="text-sm font-medium text-text-tertiary mb-2">Current Value</div>
                <div className="bg-surface-sunken p-3 rounded-lg text-foreground font-mono text-sm">
                  {form.currentValue}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-text-tertiary mb-2">Proposed Value</div>
                <div className="bg-surface-sunken p-3 rounded-lg text-foreground font-mono text-sm">
                  {form.proposedValue}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-text-tertiary mb-2">Impact Analysis</div>
                <div className="text-foreground text-sm">{form.impact}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-text-tertiary mb-2">Implementation Timeline</div>
                <div className="text-foreground text-sm">{form.timeline}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setShowPreview(false)}
              variant="outline"
              className="flex-1"
            >
              Back to Edit
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Proposal"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => router.push("/dao/proposals")}
          className="text-text-secondary hover:text-foreground mb-6 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Proposals
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Proposal</h1>
          <p className="text-text-secondary">
            Submit a governance proposal for the FundBrave community to vote on
          </p>
        </div>

        {/* Requirements Notice */}
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Proposal Requirements</h3>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Minimum 1,000 FBT required to create proposals</li>
                <li>• Proposals require 100,000 FBT voting quorum to pass</li>
                <li>• Clear title and detailed description required</li>
                <li>• Technical details must be specific and actionable</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Basic Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Proposal Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Increase Staker Yield Allocation to 35%"
                  className="w-full px-4 py-3 bg-surface-sunken border border-border-subtle rounded-lg text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={100}
                />
                <div className="text-xs text-text-tertiary mt-1">
                  {form.title.length}/100 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleInputChange("category", option.value)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        form.category === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border-subtle hover:border-border-default bg-surface-sunken"
                      )}
                    >
                      <div className="font-medium text-foreground mb-1">{option.label}</div>
                      <div className="text-xs text-text-secondary">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Provide a detailed description of your proposal. Explain the rationale, expected impact, and any relevant context..."
                  className="w-full px-4 py-3 bg-surface-sunken border border-border-subtle rounded-lg text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={8}
                />
                <div className="text-xs text-text-tertiary mt-1">
                  {form.description.length} characters (minimum 50)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Voting Period (days) *
                </label>
                <input
                  type="number"
                  value={form.votingPeriod}
                  onChange={(e) => handleInputChange("votingPeriod", parseInt(e.target.value) || 7)}
                  min={3}
                  max={30}
                  className="w-full px-4 py-3 bg-surface-sunken border border-border-subtle rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="text-xs text-text-tertiary mt-1">
                  Must be between 3 and 30 days
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Technical Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Current Value *
                </label>
                <input
                  type="text"
                  value={form.currentValue}
                  onChange={(e) => handleInputChange("currentValue", e.target.value)}
                  placeholder="e.g., 30% to stakers, 20% to platform, 50% to creators"
                  className="w-full px-4 py-3 bg-surface-sunken border border-border-subtle rounded-lg text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Proposed Value *
                </label>
                <input
                  type="text"
                  value={form.proposedValue}
                  onChange={(e) => handleInputChange("proposedValue", e.target.value)}
                  placeholder="e.g., 35% to stakers, 15% to platform, 50% to creators"
                  className="w-full px-4 py-3 bg-surface-sunken border border-border-subtle rounded-lg text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Impact Analysis *
                </label>
                <textarea
                  value={form.impact}
                  onChange={(e) => handleInputChange("impact", e.target.value)}
                  placeholder="Describe the expected impact of this change. Who will be affected and how?"
                  className="w-full px-4 py-3 bg-surface-sunken border border-border-subtle rounded-lg text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Implementation Timeline *
                </label>
                <input
                  type="text"
                  value={form.timeline}
                  onChange={(e) => handleInputChange("timeline", e.target.value)}
                  placeholder="e.g., Implemented at next epoch start (7 days post-execution)"
                  className="w-full px-4 py-3 bg-surface-sunken border border-border-subtle rounded-lg text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Proposal
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
