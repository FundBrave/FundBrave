import { CodeBlock } from "@/app/ui-library/_components";
import { EASE, DURATION, PAGE_TRANSITION } from "@/lib/constants/animation";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Animations — FundBrave UI Library",
  description:
    "Animation system constants, easing curves, and motion patterns used across FundBrave.",
};

// ---------------------------------------------------------------------------
// Page Component (Server Component)
// ---------------------------------------------------------------------------

export default function AnimationsPage() {
  return (
    <article className="mx-auto max-w-5xl space-y-12 py-8">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Animations
        </h1>
        <p className="text-lg leading-relaxed text-text-secondary max-w-2xl">
          FundBrave uses a dual animation system powered by{" "}
          <strong className="text-text-primary">GSAP</strong> for complex
          sequenced animations and{" "}
          <strong className="text-text-primary">Motion (Framer Motion)</strong>{" "}
          for declarative React-based animations. Shared constants ensure
          consistent motion language across the entire application.
        </p>
      </header>

      {/* Easing Curves */}
      <section className="space-y-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Easing Curves
        </h2>
        <p className="text-sm text-text-secondary">
          All easing curves are defined as cubic-bezier arrays and match the CSS
          custom properties in <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-primary-300">globals.css</code>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(EASE).map(([name, value]) => (
            <div
              key={name}
              className="rounded-xl border border-border-subtle bg-surface-elevated p-5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-semibold text-text-primary">
                  EASE.{name}
                </h3>
              </div>
              <code className="block text-xs font-mono text-primary-300">
                cubic-bezier({value.join(", ")})
              </code>
              <p className="text-xs text-text-tertiary">
                {name === "standard" && "Standard material design ease for general transitions."}
                {name === "snappy" && "Quick, responsive feel for micro-interactions."}
                {name === "fluid" && "Smooth, flowing motion for page transitions."}
                {name === "organic" && "Natural, organic movement for special effects."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Durations */}
      <section className="space-y-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Duration Scale
        </h2>
        <p className="text-sm text-text-secondary">
          A consistent timing scale ensures all animations feel coordinated. Durations
          are in seconds.
        </p>

        <div className="rounded-xl border border-border-subtle overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-white/[0.02]">
                <th className="px-4 py-3 font-semibold text-text-primary">
                  Token
                </th>
                <th className="px-4 py-3 font-semibold text-text-primary">
                  Value
                </th>
                <th className="px-4 py-3 font-semibold text-text-primary">
                  Use Case
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(DURATION).map(([name, value], index) => (
                <tr
                  key={name}
                  className={
                    index % 2 === 0
                      ? "bg-surface-elevated/50"
                      : "bg-transparent"
                  }
                >
                  <td className="px-4 py-3">
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-primary">
                      DURATION.{name}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-text-secondary">
                    {value}s
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {name === "quick" && "Micro-interactions (hover states, toggle feedback)"}
                    {name === "fast" && "Button presses, focus transitions"}
                    {name === "normal" && "Standard animations, fade in/out"}
                    {name === "medium" && "Modal entrances, panel slides"}
                    {name === "slow" && "Page transitions, complex sequences"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Import Example */}
      <section className="space-y-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Usage
        </h2>

        <CodeBlock
          title="Importing animation constants"
          language="typescript"
          code={`import { EASE, DURATION, PAGE_TRANSITION } from "@/lib/constants/animation";

// GSAP usage
gsap.to(element, {
  y: 0,
  opacity: 1,
  duration: DURATION.normal,
  ease: \`cubic-bezier(\${EASE.snappy.join(",")})\`,
});

// Motion (Framer Motion) usage
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: DURATION.normal,
    ease: EASE.snappy,
  }}
>
  Content
</motion.div>`}
          showLineNumbers
        />
      </section>

      {/* Page Transitions */}
      <section className="space-y-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Page Transition Presets
        </h2>
        <p className="text-sm text-text-secondary">
          Pre-configured transition objects for common page-level animations.
          Spread them directly onto Motion components.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PAGE_TRANSITION).map(([name, preset]) => (
            <div
              key={name}
              className="rounded-xl border border-border-subtle bg-surface-elevated p-5 space-y-3"
            >
              <h3 className="font-mono text-sm font-semibold text-text-primary">
                PAGE_TRANSITION.{name}
              </h3>
              <pre className="overflow-x-auto rounded-lg bg-[#1e1e2e] p-3 text-xs font-mono text-[#d4d4d4]">
                {JSON.stringify(preset, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        <CodeBlock
          title="Using page transition presets"
          language="tsx"
          code={`import { PAGE_TRANSITION } from "@/lib/constants/animation";

<motion.div {...PAGE_TRANSITION.fade}>
  <PageContent />
</motion.div>`}
        />
      </section>

      {/* Phase 3 Placeholder */}
      <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-3">
        <h2 className="font-display text-lg font-semibold text-amber-400">
          Animation Examples — Coming in Phase 3
        </h2>
        <p className="text-sm text-text-secondary max-w-lg mx-auto">
          Interactive animation examples demonstrating micro-interactions,
          page transitions, staggered reveals, scroll-based effects, and GSAP
          timeline compositions will be added in Phase 3 of the UI Library.
        </p>
      </section>
    </article>
  );
}
