import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
    >
      {/* Wordmark */}
      <h1 className="font-display text-5xl font-bold tracking-tight sm:text-7xl">
        <span className="bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-purple-500)_50%,var(--color-soft-purple-500)_100%)] bg-clip-text text-transparent">
          FundBrave
        </span>
      </h1>

      {/* Tagline */}
      <p className="max-w-md text-lg text-text-secondary">
        Borderless fundraising, powered by crypto and owned by communities.
      </p>

      {/* Primary CTA */}
      <Button asChild size="lg">
        <Link href="/campaigns">Explore campaigns</Link>
      </Button>
    </main>
  );
}
