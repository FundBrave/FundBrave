"use client";

import { useState, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Actual UI components to demonstrate
import { Button } from "@/app/components/ui/button";
import { Avatar } from "@/app/components/ui/Avatar";
import { Spinner } from "@/app/components/ui/Spinner";
import { Toggle } from "@/app/components/ui/Toggle";
import { EmptyState } from "@/app/components/ui/EmptyState";
import {
  Badge,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Select,
} from "@/app/components/ui/primitives";

// Icons from the project icon system (for component demos)
import {
  Search as SearchIcon,
  Mail,
  Lock,
  Eye,
  Heart,
  Star,
} from "@/app/components/ui/icons";

// Lucide icons for EmptyState (expects LucideIcon type)
import { Rocket, Search } from "lucide-react";

// Internal showcase components
import { CodeBlock, ComponentPlayground } from "@/app/ui-library/_components";

// Playground configs
import { PLAYGROUND_REGISTRY } from "@/app/ui-library/playgrounds";

// Registry for fallback example lookup
import { getComponentBySlug } from "@/app/ui-library/registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LiveDemosProps {
  slug: string;
}

// ---------------------------------------------------------------------------
// Demo Wrapper — consistent styling for all demo sections
// ---------------------------------------------------------------------------

function DemoSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-surface-elevated p-6 space-y-4",
        className
      )}
    >
      <h3 className="text-sm font-medium uppercase tracking-wider text-text-tertiary">
        {title}
      </h3>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Button Demo
// ---------------------------------------------------------------------------

function ButtonDemo() {
  const [loading, setLoading] = useState(false);

  const handleLoadingToggle = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Variants */}
      <DemoSection title="Variants">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </DemoSection>

      {/* Sizes */}
      <DemoSection title="Sizes">
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="md">
          Medium
        </Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
        <Button variant="primary" size="xl">
          Extra Large
        </Button>
        <Button variant="primary" size="icon">
          <Heart className="h-5 w-5" />
        </Button>
      </DemoSection>

      {/* Loading State */}
      <DemoSection title="Loading State">
        <Button
          variant="primary"
          loading={loading}
          loadingText="Processing..."
          onClick={handleLoadingToggle}
        >
          Click to Load
        </Button>
        <Button variant="secondary" loading loadingText="Saving...">
          Always Loading
        </Button>
      </DemoSection>

      {/* Disabled State */}
      <DemoSection title="Disabled State">
        <Button variant="primary" disabled>
          Disabled Primary
        </Button>
        <Button variant="secondary" disabled>
          Disabled Secondary
        </Button>
        <Button variant="outline" disabled>
          Disabled Outline
        </Button>
      </DemoSection>

      {/* Full Width */}
      <DemoSection title="Full Width">
        <div className="w-full">
          <Button variant="primary" fullWidth>
            Full Width Button
          </Button>
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar Demo
// ---------------------------------------------------------------------------

function AvatarDemo() {
  return (
    <div className="space-y-6">
      {/* Sizes */}
      <DemoSection title="Sizes">
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar alt="Small" fallback="SM" size="sm" />
            <span className="text-xs text-text-tertiary">sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar alt="Medium" fallback="MD" size="md" />
            <span className="text-xs text-text-tertiary">md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar alt="Large" fallback="LG" size="lg" />
            <span className="text-xs text-text-tertiary">lg</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar alt="Extra Large" fallback="XL" size="xl" />
            <span className="text-xs text-text-tertiary">xl</span>
          </div>
        </div>
      </DemoSection>

      {/* Gradient Border */}
      <DemoSection title="Gradient Border">
        <Avatar alt="Jane Doe" fallback="JD" size="lg" showGradientBorder />
        <Avatar alt="Alex Smith" fallback="AS" size="xl" showGradientBorder />
      </DemoSection>

      {/* Fallback */}
      <DemoSection title="Fallback Initials">
        <Avatar alt="Alice Brown" fallback="AB" size="lg" />
        <Avatar alt="Bob" size="lg" />
        <Avatar alt="Charlie Doe" fallback="CD" size="lg" />
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spinner Demo
// ---------------------------------------------------------------------------

function SpinnerDemo() {
  return (
    <div className="space-y-6">
      {/* Sizes */}
      <DemoSection title="Sizes">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="xs" />
            <span className="text-xs text-text-tertiary">xs</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs text-text-tertiary">sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <span className="text-xs text-text-tertiary">md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-xs text-text-tertiary">lg</span>
          </div>
        </div>
      </DemoSection>

      {/* Colors */}
      <DemoSection title="Colors">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" color="current" />
            <span className="text-xs text-text-tertiary">current</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" color="primary" />
            <span className="text-xs text-text-tertiary">primary</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg bg-primary-500 p-3">
            <Spinner size="md" color="white" />
            <span className="text-xs text-white/70">white</span>
          </div>
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge Demo
// ---------------------------------------------------------------------------

function BadgeDemo() {
  return (
    <div className="space-y-6">
      {/* Variants */}
      <DemoSection title="Variants">
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="outline">Outline</Badge>
      </DemoSection>

      {/* Sizes */}
      <DemoSection title="Sizes">
        <Badge variant="brand" size="sm">
          Small
        </Badge>
        <Badge variant="brand" size="md">
          Medium
        </Badge>
        <Badge variant="brand" size="lg">
          Large
        </Badge>
      </DemoSection>

      {/* Contextual Usage */}
      <DemoSection title="Contextual Usage">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-primary">Campaign Status:</span>
          <Badge variant="success">Active</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-primary">Donations:</span>
          <Badge variant="brand">42</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-primary">Deadline:</span>
          <Badge variant="warning">2 days left</Badge>
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card Demo
// ---------------------------------------------------------------------------

function CardDemo() {
  return (
    <div className="space-y-6">
      {/* Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="default">
          <CardHeader>
            <h4 className="font-semibold text-text-primary">Default Card</h4>
            <p className="text-sm text-text-secondary">
              Standard card with border
            </p>
          </CardHeader>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary">
              Card content goes here. This is the default variant with a subtle
              border.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="primary" size="sm">
              Action
            </Button>
          </CardFooter>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <h4 className="font-semibold text-text-primary">Elevated Card</h4>
            <p className="text-sm text-text-secondary">
              Card with shadow elevation
            </p>
          </CardHeader>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary">
              Elevated variant uses box-shadow instead of a visible border for a
              more prominent appearance.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              Learn More
            </Button>
          </CardFooter>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h4 className="font-semibold text-text-primary">Glass Card</h4>
            <p className="text-sm text-text-secondary">
              Frosted glass effect
            </p>
          </CardHeader>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary">
              Uses backdrop-blur and semi-transparent background for a frosted
              glass aesthetic.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm">
              Dismiss
            </Button>
          </CardFooter>
        </Card>

        <Card variant="interactive">
          <CardHeader>
            <h4 className="font-semibold text-text-primary">
              Interactive Card
            </h4>
            <p className="text-sm text-text-secondary">
              Hover for shadow effect
            </p>
          </CardHeader>
          <CardContent className="py-4">
            <p className="text-sm text-text-secondary">
              Interactive variant adds hover states with elevated shadow and
              emphasized border.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm">
              Select
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Padding variants */}
      <DemoSection title="Padding Variants">
        <div className="flex flex-wrap gap-4 w-full">
          <Card variant="default" padding="none" className="flex-1 min-w-[120px]">
            <div className="p-2 text-center text-xs text-text-tertiary">
              padding=none
            </div>
          </Card>
          <Card variant="default" padding="sm" className="flex-1 min-w-[120px]">
            <div className="text-center text-xs text-text-tertiary">
              padding=sm
            </div>
          </Card>
          <Card variant="default" padding="md" className="flex-1 min-w-[120px]">
            <div className="text-center text-xs text-text-tertiary">
              padding=md
            </div>
          </Card>
          <Card variant="default" padding="lg" className="flex-1 min-w-[120px]">
            <div className="text-center text-xs text-text-tertiary">
              padding=lg
            </div>
          </Card>
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Input Demo
// ---------------------------------------------------------------------------

function InputDemo() {
  return (
    <div className="space-y-6">
      {/* Variants */}
      <DemoSection title="Variants">
        <div className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Default</label>
            <Input variant="default" placeholder="Default input..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Filled</label>
            <Input variant="filled" placeholder="Filled input..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Ghost</label>
            <Input variant="ghost" placeholder="Ghost input..." />
          </div>
        </div>
      </DemoSection>

      {/* With Icons */}
      <DemoSection title="With Icons">
        <div className="w-full space-y-4">
          <Input
            variant="default"
            placeholder="Search..."
            startIcon={<SearchIcon className="h-4 w-4" />}
          />
          <Input
            variant="default"
            placeholder="Email address"
            startIcon={<Mail className="h-4 w-4" />}
          />
          <Input
            variant="default"
            type="password"
            placeholder="Password"
            startIcon={<Lock className="h-4 w-4" />}
            endIcon={<Eye className="h-4 w-4" />}
          />
        </div>
      </DemoSection>

      {/* Error State */}
      <DemoSection title="Error State">
        <div className="w-full">
          <Input
            variant="default"
            placeholder="Email"
            error
            errorMessage="Please enter a valid email address"
            id="demo-email"
          />
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Textarea Demo
// ---------------------------------------------------------------------------

function TextareaDemo() {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-6">
      {/* Variants */}
      <DemoSection title="Variants">
        <div className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Default</label>
            <Textarea variant="default" placeholder="Default textarea..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Filled</label>
            <Textarea variant="filled" placeholder="Filled textarea..." />
          </div>
        </div>
      </DemoSection>

      {/* Sizes */}
      <DemoSection title="Sizes">
        <div className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Small</label>
            <Textarea variant="default" size="sm" placeholder="Small textarea..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Medium (default)</label>
            <Textarea variant="default" size="md" placeholder="Medium textarea..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Large</label>
            <Textarea variant="default" size="lg" placeholder="Large textarea..." />
          </div>
        </div>
      </DemoSection>

      {/* Character Count */}
      <DemoSection title="Character Count">
        <div className="w-full">
          <Textarea
            variant="default"
            placeholder="Describe your campaign... (max 200 characters)"
            maxLength={200}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            id="demo-textarea-count"
          />
        </div>
      </DemoSection>

      {/* Error State */}
      <DemoSection title="Error State">
        <div className="w-full">
          <Textarea
            variant="default"
            placeholder="Description"
            error
            errorMessage="Description must be at least 50 characters"
            id="demo-textarea-error"
          />
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select Demo
// ---------------------------------------------------------------------------

function SelectDemo() {
  return (
    <div className="space-y-6">
      {/* Variants */}
      <DemoSection title="Variants">
        <div className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Default</label>
            <Select variant="default" placeholder="Choose a category">
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="environment">Environment</option>
              <option value="technology">Technology</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Filled</label>
            <Select variant="filled" placeholder="Choose a category">
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="environment">Environment</option>
              <option value="technology">Technology</option>
            </Select>
          </div>
        </div>
      </DemoSection>

      {/* Sizes */}
      <DemoSection title="Sizes">
        <div className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Small</label>
            <Select variant="default" size="sm" placeholder="Small select">
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Medium (default)</label>
            <Select variant="default" size="md" placeholder="Medium select">
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-text-tertiary">Large</label>
            <Select variant="default" size="lg" placeholder="Large select">
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
            </Select>
          </div>
        </div>
      </DemoSection>

      {/* Error State */}
      <DemoSection title="Error State">
        <div className="w-full">
          <Select
            variant="default"
            placeholder="Select a category"
            error
            errorMessage="Category is required"
            id="demo-select-error"
          >
            <option value="education">Education</option>
            <option value="health">Health</option>
          </Select>
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle Demo
// ---------------------------------------------------------------------------

function ToggleDemo() {
  const [toggles, setToggles] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true,
    publicProfile: false,
  });

  const handleToggle = useCallback(
    (key: keyof typeof toggles) => (checked: boolean) => {
      setToggles((prev) => ({ ...prev, [key]: checked }));
    },
    []
  );

  return (
    <div className="space-y-6">
      <DemoSection title="Interactive Toggles">
        <div className="w-full max-w-md space-y-4">
          <Toggle
            checked={toggles.notifications}
            onChange={handleToggle("notifications")}
            label="Email Notifications"
          />
          <Toggle
            checked={toggles.darkMode}
            onChange={handleToggle("darkMode")}
            label="Dark Mode"
            showIndicator
          />
          <Toggle
            checked={toggles.autoSave}
            onChange={handleToggle("autoSave")}
            label="Auto Save"
          />
          <Toggle
            checked={toggles.publicProfile}
            onChange={handleToggle("publicProfile")}
            label="Public Profile"
            showIndicator
          />
        </div>
      </DemoSection>

      <DemoSection title="Disabled State">
        <div className="w-full max-w-md space-y-4">
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Disabled (On)"
            disabled
          />
          <Toggle
            checked={false}
            onChange={() => {}}
            label="Disabled (Off)"
            disabled
          />
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState Demo
// ---------------------------------------------------------------------------

function EmptyStateDemo() {
  return (
    <div className="space-y-6">
      <DemoSection title="With Action">
        <div className="w-full">
          <EmptyState
            icon={Rocket}
            title="No campaigns yet"
            description="Create your first campaign to start raising funds for your cause."
            action={{
              label: "Create Campaign",
              onClick: () => {},
              variant: "primary",
            }}
          />
        </div>
      </DemoSection>

      <DemoSection title="Search Empty State">
        <div className="w-full">
          <EmptyState
            icon={Search}
            title="No results found"
            description="Try adjusting your search terms or filters to find what you are looking for."
            action={{
              label: "Clear Search",
              onClick: () => {},
              variant: "outline",
            }}
          />
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fallback Demo — for components without specific demos
// ---------------------------------------------------------------------------

function FallbackDemo({ slug }: { slug: string }) {
  const component = getComponentBySlug(slug);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-subtle bg-surface-elevated p-8 text-center">
        <div className="mb-3 inline-flex items-center justify-center rounded-full bg-white/[0.06] p-4">
          <Star className="h-8 w-8 text-text-tertiary" />
        </div>
        <p className="text-sm text-text-secondary">
          Live demo coming soon for{" "}
          <span className="font-medium text-text-primary">
            {component?.name ?? slug}
          </span>
          .
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          See the code examples below for usage patterns.
        </p>
      </div>

      {/* Show code examples as fallback */}
      {component?.examples?.map((example) => (
        <CodeBlock
          key={example.title}
          code={example.code}
          language="tsx"
          title={example.title}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo Registry — maps slugs to their demo components
// ---------------------------------------------------------------------------

const DEMO_REGISTRY: Record<string, () => ReactNode> = {
  button: () => <ButtonDemo />,
  avatar: () => <AvatarDemo />,
  spinner: () => <SpinnerDemo />,
  badge: () => <BadgeDemo />,
  card: () => <CardDemo />,
  input: () => <InputDemo />,
  textarea: () => <TextareaDemo />,
  select: () => <SelectDemo />,
  toggle: () => <ToggleDemo />,
  "empty-state": () => <EmptyStateDemo />,
};

// ---------------------------------------------------------------------------
// LiveDemos Component
// ---------------------------------------------------------------------------

export function LiveDemos({ slug }: LiveDemosProps) {
  const playgroundConfig = PLAYGROUND_REGISTRY[slug];
  const demoFactory = DEMO_REGISTRY[slug];

  return (
    <div className="space-y-8">
      {/* Interactive Playground */}
      {playgroundConfig && <ComponentPlayground config={playgroundConfig} />}

      {/* Additional Examples / Variant Galleries */}
      {demoFactory ? (
        <div className="space-y-4">
          {playgroundConfig && (
            <h3 className="font-display text-lg font-semibold text-text-primary">
              Additional Examples
            </h3>
          )}
          {demoFactory()}
        </div>
      ) : (
        !playgroundConfig && <FallbackDemo slug={slug} />
      )}
    </div>
  );
}
