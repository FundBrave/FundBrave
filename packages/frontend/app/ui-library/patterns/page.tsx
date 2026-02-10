import FormLayout from "./_patterns/FormLayout";
import CardGrid from "./_patterns/CardGrid";
import ErrorHandling from "./_patterns/ErrorHandling";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Patterns — FundBrave UI Library",
  description:
    "Composite UI patterns combining multiple components for common layouts and interactions.",
};

// ---------------------------------------------------------------------------
// Live pattern definitions
// ---------------------------------------------------------------------------

interface LivePattern {
  id: string;
  name: string;
  description: string;
  components: string[];
  element: React.ReactNode;
}

const LIVE_PATTERNS: LivePattern[] = [
  {
    id: "form-layout",
    name: "Form Layout",
    description:
      "Standardized form layouts with field grouping, inline validation, and responsive column configurations. Toggle between single-column and two-column arrangements to see how the same fields adapt.",
    components: ["Input", "Textarea", "Select", "Button"],
    element: <FormLayout />,
  },
  {
    id: "card-grid",
    name: "Card Grid",
    description:
      "Responsive grid system for rendering collections of cards with consistent spacing, loading skeletons, and empty states. Switch between loaded, skeleton, and empty views.",
    components: [
      "Card",
      "CardHeader",
      "CardContent",
      "CardFooter",
      "Badge",
      "Progress",
      "Button",
      "Skeleton",
      "EmptyState",
    ],
    element: <CardGrid />,
  },
  {
    id: "error-handling",
    name: "Error Handling",
    description:
      "Consistent error patterns for different contexts: inline field validation errors, page-level alert banners, and full-section error empty states with retry actions.",
    components: ["Input", "Alert", "EmptyState", "Button"],
    element: <ErrorHandling />,
  },
];

// ---------------------------------------------------------------------------
// Planned patterns still in the pipeline
// ---------------------------------------------------------------------------

interface PlannedPattern {
  name: string;
  description: string;
  components: string[];
}

const PLANNED_PATTERNS: PlannedPattern[] = [
  {
    name: "Modal Pattern",
    description:
      "Accessible modal dialog pattern with focus trapping, scroll locking, backdrop overlay, stacked modal support, and animated entrance/exit transitions. Includes confirmation dialog and form modal variants.",
    components: ["Dialog", "Button", "ModalBackdrop"],
  },
  {
    name: "Feed Layout",
    description:
      "Social feed pattern for rendering streams of posts, comments, and activity items with infinite scrolling, optimistic updates, real-time insertions, and contextual empty states.",
    components: [
      "PostCard",
      "CommentSection",
      "InfiniteCommentList",
      "Skeleton",
      "EmptyState",
    ],
  },
];

// ---------------------------------------------------------------------------
// Page Component (Server Component)
// ---------------------------------------------------------------------------

export default function PatternsPage() {
  return (
    <article className="mx-auto max-w-5xl space-y-12 py-8">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Patterns
        </h1>
        <p className="text-lg leading-relaxed text-text-secondary max-w-2xl">
          Composite UI patterns that combine multiple components to solve common
          layout and interaction challenges. These patterns codify the best
          practices used across FundBrave and serve as reference implementations
          for the team.
        </p>
      </header>

      {/* Live Pattern Sections */}
      {LIVE_PATTERNS.map((pattern) => (
        <section key={pattern.id} className="space-y-6">
          {/* Pattern header card */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-semibold text-text-primary">
                {pattern.name}
              </h2>
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium">
                Live
              </span>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary max-w-2xl">
              {pattern.description}
            </p>

            {/* Component dependency chips */}
            <div className="flex flex-wrap gap-1.5">
              {pattern.components.map((component) => (
                <span
                  key={component}
                  className="inline-flex items-center rounded-lg border border-border-subtle bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-primary-300"
                >
                  {component}
                </span>
              ))}
            </div>
          </div>

          {/* Live pattern demo */}
          {pattern.element}
        </section>
      ))}

      {/* Still-planned patterns */}
      {PLANNED_PATTERNS.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Planned Patterns
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLANNED_PATTERNS.map((pattern) => (
              <div
                key={pattern.name}
                className="rounded-xl border border-border-subtle bg-surface-elevated p-6 space-y-4"
              >
                {/* Pattern Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-text-primary">
                      {pattern.name}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-xs font-medium">
                      Planned
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed text-text-secondary">
                  {pattern.description}
                </p>

                {/* Component Dependencies */}
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Components Used
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pattern.components.map((component) => (
                      <span
                        key={component}
                        className="inline-flex items-center rounded-lg border border-border-subtle bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-primary-300"
                      >
                        {component}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
