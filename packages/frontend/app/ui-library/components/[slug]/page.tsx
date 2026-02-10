import { notFound } from "next/navigation";
import {
  getComponentBySlug,
  COMPONENT_REGISTRY,
} from "@/app/ui-library/registry";
import {
  ComponentShowcase,
  PropsTable,
  CodeBlock,
} from "@/app/ui-library/_components";
import Link from "next/link";
import { LiveDemos } from "./LiveDemos";

// ---------------------------------------------------------------------------
// Static Params — generate a page for every component in the registry
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return COMPONENT_REGISTRY.map((component) => ({
    slug: component.slug,
  }));
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const component = getComponentBySlug(slug);
  if (!component) return { title: "Component Not Found" };

  return {
    title: `${component.name} — FundBrave UI Library`,
    description: component.description,
  };
}

// ---------------------------------------------------------------------------
// Page Component (Server Component)
// ---------------------------------------------------------------------------

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const component = getComponentBySlug(slug);

  if (!component) {
    notFound();
  }

  // Resolve related component entries for linking
  const relatedEntries = (component.relatedComponents ?? [])
    .map((relSlug) => getComponentBySlug(relSlug))
    .filter(Boolean);

  return (
    <ComponentShowcase
      name={component.name}
      description={component.description}
      status={component.status}
      importPath={component.importPath}
      accessibility={component.accessibility}
      designTokens={component.designTokens}
      guidelines={component.guidelines}
    >
      {/* -------------------------------------------------------------- */}
      {/*  Built Components                                               */}
      {/* -------------------------------------------------------------- */}
      {component.status === "built" && (
        <>
          {/* Live Demos (client component) */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              Live Demo
            </h2>
            <LiveDemos slug={slug} />
          </section>

          {/* Props Table */}
          {component.props && component.props.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-text-primary">
                Props
              </h2>
              <PropsTable props={component.props} />
            </section>
          )}

          {/* Code Examples */}
          {component.examples && component.examples.length > 0 && (
            <section className="space-y-6">
              <h2 className="font-display text-xl font-semibold text-text-primary">
                Examples
              </h2>
              {component.examples.map((example) => (
                <div key={example.title} className="space-y-2">
                  <h3 className="text-sm font-medium text-text-secondary">
                    {example.title}
                  </h3>
                  {example.description && (
                    <p className="text-sm text-text-tertiary">
                      {example.description}
                    </p>
                  )}
                  <CodeBlock
                    code={example.code}
                    language="tsx"
                    title={example.title}
                  />
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {/* -------------------------------------------------------------- */}
      {/*  Planned Components                                             */}
      {/* -------------------------------------------------------------- */}
      {component.status === "planned" && (
        <section className="space-y-6">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-amber-400">
              Coming Soon
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {component.description}
            </p>
            <p className="text-sm text-text-tertiary">
              This component is planned for a future release. Check back soon
              for updates.
            </p>
          </div>

          {/* Tags */}
          {component.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-secondary">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {component.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-lg border border-border-subtle bg-surface-elevated px-2.5 py-1 text-xs text-text-tertiary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* -------------------------------------------------------------- */}
      {/*  Related Components                                             */}
      {/* -------------------------------------------------------------- */}
      {relatedEntries.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Related Components
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {relatedEntries.map((related) =>
              related ? (
                <Link
                  key={related.slug}
                  href={`/ui-library/components/${related.slug}`}
                  className="group rounded-xl border border-border-subtle bg-surface-elevated p-4 space-y-1.5 transition-all duration-[var(--duration-fast)] hover:border-border-emphasis hover:shadow-[var(--shadow-elevated)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary group-hover:text-primary transition-colors">
                      {related.name}
                    </span>
                    <span
                      className={
                        related.status === "built"
                          ? "text-xs text-emerald-400"
                          : "text-xs text-amber-400"
                      }
                    >
                      {related.status === "built" ? "Built" : "Planned"}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary line-clamp-2">
                    {related.description}
                  </p>
                </Link>
              ) : null
            )}
          </div>
        </section>
      )}
    </ComponentShowcase>
  );
}
