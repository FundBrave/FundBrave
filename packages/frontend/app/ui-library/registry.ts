import type {
  CategoryInfo,
  ComponentCategory,
  ComponentRegistryEntry,
} from "./types";

// =============================================================================
// Categories
// =============================================================================

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "base",
    label: "Base",
    description:
      "Foundational UI primitives: buttons, avatars, loading indicators, and layout building blocks.",
    icon: "Box",
  },
  {
    id: "form",
    label: "Form",
    description:
      "Input controls, validators, and specialized form fields for user data collection.",
    icon: "TextCursorInput",
  },
  {
    id: "data-display",
    label: "Data Display",
    description:
      "Components for presenting information, states, and feedback to the user.",
    icon: "LayoutList",
  },
  {
    id: "feedback",
    label: "Feedback & Overlays",
    description:
      "Modals, dialogs, tooltips, and other overlay-based interaction patterns.",
    icon: "MessageSquare",
  },
  {
    id: "social",
    label: "Social & Feed",
    description:
      "Post cards, comments, reactions, and community engagement components.",
    icon: "Users",
  },
  {
    id: "navigation",
    label: "Navigation",
    description:
      "Tab bars, breadcrumbs, pagination, and wayfinding components.",
    icon: "Navigation",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description:
      "Skip links, screen-reader utilities, focus management, and ARIA landmark components.",
    icon: "Accessibility",
  },
  {
    id: "icons",
    label: "Icons",
    description:
      "50+ custom SVG icons organized by category: action, navigation, form, social, and UI.",
    icon: "Shapes",
  },
];

// =============================================================================
// Component Registry
// =============================================================================

export const COMPONENT_REGISTRY: ComponentRegistryEntry[] = [
  // ---------------------------------------------------------------------------
  // BASE (9 built, 1 planned)
  // ---------------------------------------------------------------------------
  {
    slug: "button",
    name: "Button",
    description:
      "Primary interactive element with multiple variants (primary gradient, secondary glass, tertiary, destructive, outline, ghost, link) and sizes. Supports loading states and asChild rendering.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/button",
    filePath: "app/components/ui/button.tsx",
    tags: [
      "button",
      "cta",
      "action",
      "gradient",
      "glass",
      "ghost",
      "link",
      "loading",
      "primary",
      "secondary",
      "destructive",
    ],
    props: [
      {
        name: "variant",
        type: '"primary" | "secondary" | "tertiary" | "destructive" | "outline" | "ghost" | "link"',
        required: false,
        defaultValue: '"primary"',
        description: "Visual style variant of the button.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "xl" | "icon"',
        required: false,
        defaultValue: '"md"',
        description: "Size preset controlling height and padding.",
      },
      {
        name: "loading",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description:
          "Shows a spinner and loading text, disabling interaction.",
      },
      {
        name: "loadingText",
        type: "string",
        required: false,
        defaultValue: '"Please wait..."',
        description: "Text displayed alongside the spinner while loading.",
      },
      {
        name: "fullWidth",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description: "Stretches button to fill its container width.",
      },
      {
        name: "asChild",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description:
          "Renders as a Slot, merging props onto the child element (useful for wrapping Next.js Link).",
      },
    ],
    examples: [
      {
        title: "Primary button",
        code: `<Button variant="primary" size="md">Donate Now</Button>`,
      },
      {
        title: "Loading state",
        code: `<Button loading loadingText="Processing...">Submit</Button>`,
      },
      {
        title: "As Link",
        description: "Wrapping a Next.js Link with button styling.",
        code: `<Button asChild variant="outline">\n  <Link href="/campaigns">Browse Campaigns</Link>\n</Button>`,
      },
    ],
    accessibility: [
      "Sets aria-busy during loading state",
      "Uses aria-live='polite' for loading announcements",
      "Disables pointer events when disabled or loading",
      "Focus-visible ring for keyboard navigation",
    ],
    relatedComponents: ["icon-button", "spinner"],
    designTokens: [
      "--color-primary",
      "--color-purple-500",
      "--color-soft-purple-500",
      "--duration-fast",
      "--ease-snappy",
    ],
    guidelines: [
      { type: "do", text: "Use primary variant for the main CTA on each page" },
      { type: "do", text: "Include loading state for async actions" },
      { type: "dont", text: "Don't use more than one primary button per section" },
      { type: "dont", text: "Don't use the link variant for navigation \u2014 use Next.js Link instead" },
    ],
  },
  {
    slug: "icon-button",
    name: "IconButton",
    description:
      "A compact, accessible button for single-icon actions. Wraps the base Button with enforced ariaLabel for screen-reader support.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/icon-button",
    filePath: "app/components/ui/icon-button.tsx",
    tags: ["button", "icon", "action", "compact", "accessible"],
    props: [
      {
        name: "ariaLabel",
        type: "string",
        required: true,
        description:
          "Accessible label for screen readers (required for icon-only buttons).",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "xl" | "icon"',
        required: false,
        defaultValue: '"icon"',
        description: "Size variant inherited from Button.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Close button",
        code: `import { X } from "@/app/components/ui/icons";\n\n<IconButton ariaLabel="Close">\n  <X className="w-5 h-5" />\n</IconButton>`,
      },
    ],
    accessibility: [
      "Requires ariaLabel prop (enforced by TypeScript)",
      "Sets both aria-label and title attributes",
      "Renders as ghost variant by default for minimal visual noise",
    ],
    relatedComponents: ["button"],
    designTokens: [],
  },
  {
    slug: "spinner",
    name: "Spinner",
    description:
      "Animated loading indicator using the Loader2 icon with configurable size and color.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/Spinner",
    filePath: "app/components/ui/Spinner.tsx",
    tags: ["spinner", "loading", "indicator", "animation"],
    props: [
      {
        name: "size",
        type: '"xs" | "sm" | "md" | "lg"',
        required: false,
        defaultValue: '"md"',
        description: "Size of the spinner.",
      },
      {
        name: "color",
        type: '"white" | "primary" | "current"',
        required: false,
        defaultValue: '"current"',
        description:
          "Color variant. 'current' inherits from the parent text color.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Default spinner",
        code: `<Spinner size="md" />`,
      },
      {
        title: "On gradient button",
        code: `<Spinner size="sm" color="white" />`,
      },
    ],
    accessibility: [
      "Uses CSS animation (animate-spin) which respects prefers-reduced-motion",
    ],
    relatedComponents: ["button"],
    designTokens: [],
  },
  {
    slug: "label",
    name: "Label",
    description:
      "Accessible form label built on Radix UI Label primitive. Supports disabled group state and peer-disabled styling.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/label",
    filePath: "app/components/ui/label.tsx",
    tags: ["label", "form", "accessible", "radix"],
    props: [
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
      {
        name: "htmlFor",
        type: "string",
        required: false,
        description: "ID of the associated form control.",
      },
    ],
    examples: [
      {
        title: "Basic label",
        code: `<Label htmlFor="email">Email address</Label>\n<input id="email" type="email" />`,
      },
    ],
    accessibility: [
      "Built on @radix-ui/react-label for proper label-input association",
      "Handles disabled state via group-data attribute",
    ],
    relatedComponents: [],
    designTokens: [],
  },
  {
    slug: "toggle",
    name: "Toggle",
    description:
      "Accessible switch component with optional label and on/off text indicator. Uses role='switch' and aria-checked.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/Toggle",
    filePath: "app/components/ui/Toggle.tsx",
    tags: ["toggle", "switch", "boolean", "setting", "preference"],
    props: [
      {
        name: "checked",
        type: "boolean",
        required: true,
        description: "Whether the toggle is on.",
      },
      {
        name: "onChange",
        type: "(checked: boolean) => void",
        required: true,
        description: "Callback fired when the toggle state changes.",
      },
      {
        name: "label",
        type: "string",
        required: false,
        description: "Optional visible label text.",
      },
      {
        name: "disabled",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description: "Disables the toggle.",
      },
      {
        name: "showIndicator",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description: 'Shows an "On"/"Off" text indicator.',
      },
    ],
    examples: [
      {
        title: "Basic toggle",
        code: `const [enabled, setEnabled] = useState(false);\n\n<Toggle\n  checked={enabled}\n  onChange={setEnabled}\n  label="Email notifications"\n/>`,
      },
    ],
    accessibility: [
      "Uses role='switch' with aria-checked",
      "Label association via aria-labelledby",
      "Focus ring with ring-offset for keyboard navigation",
    ],
    relatedComponents: [],
    designTokens: ["--color-primary-500", "--surface-sunken"],
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    description:
      "Placeholder loading indicator with multiple variants (text, circular, rectangular, rounded) and animation modes (pulse, wave, none). Includes pre-built composite skeletons for cards, posts, profiles, and more.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/Skeleton",
    filePath: "app/components/ui/Skeleton.tsx",
    tags: [
      "skeleton",
      "loading",
      "placeholder",
      "shimmer",
      "pulse",
      "card",
      "list",
    ],
    props: [
      {
        name: "variant",
        type: '"text" | "circular" | "rectangular" | "rounded"',
        required: false,
        defaultValue: '"rectangular"',
        description: "Shape variant of the skeleton.",
      },
      {
        name: "animation",
        type: '"pulse" | "wave" | "none"',
        required: false,
        defaultValue: '"pulse"',
        description: "Animation type for the loading indicator.",
      },
      {
        name: "width",
        type: "string | number",
        required: false,
        description: "Explicit width (px number or CSS string).",
      },
      {
        name: "height",
        type: "string | number",
        required: false,
        description: "Explicit height (px number or CSS string).",
      },
    ],
    examples: [
      {
        title: "Text skeleton lines",
        code: `<SkeletonText lines={3} />`,
      },
      {
        title: "Campaign card skeleton",
        code: `<SkeletonCampaignCard />`,
      },
    ],
    accessibility: [
      "All skeleton elements have aria-hidden='true' since they are decorative placeholders",
    ],
    relatedComponents: [],
    designTokens: ["--surface-elevated"],
  },
  {
    slug: "avatar",
    name: "Avatar",
    description:
      "User avatar with image loading, fallback initials, and optional gradient border. Uses Next.js Image for optimization.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/Avatar",
    filePath: "app/components/ui/Avatar.tsx",
    tags: [
      "avatar",
      "user",
      "profile",
      "image",
      "initials",
      "gradient",
    ],
    props: [
      {
        name: "src",
        type: "string",
        required: false,
        description: "Image URL for the avatar.",
      },
      {
        name: "alt",
        type: "string",
        required: true,
        description: "Alt text for the avatar image.",
      },
      {
        name: "fallback",
        type: "string",
        required: false,
        description:
          "Fallback text (initials) shown when image fails. Defaults to first char of alt.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "xl"',
        required: false,
        defaultValue: '"md"',
        description: "Size of the avatar.",
      },
      {
        name: "showGradientBorder",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description:
          "Wraps the avatar in a gradient border (primary to soft-purple).",
      },
    ],
    examples: [
      {
        title: "Avatar with image",
        code: `<Avatar src="/user.jpg" alt="Jane Doe" size="lg" />`,
      },
      {
        title: "Fallback initials",
        code: `<Avatar alt="Jane Doe" fallback="JD" />`,
      },
      {
        title: "Gradient border",
        code: `<Avatar src="/user.jpg" alt="Jane Doe" showGradientBorder />`,
      },
    ],
    accessibility: [
      "Uses role='img' with aria-label on the container",
      "Fallback initials ensure content is always visible",
    ],
    relatedComponents: ["skeleton"],
    designTokens: [
      "--color-primary-500",
      "--color-soft-purple-500",
      "--surface-sunken",
    ],
  },

  // Promoted from planned → built
  {
    slug: "badge",
    name: "Badge",
    description:
      "Small label/tag for status indicators, categories, and counts. Uses CVA for variant and size control with six semantic color variants.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/primitives/badge",
    filePath: "app/components/ui/primitives/badge.tsx",
    tags: ["badge", "status", "label", "count", "tag", "variant"],
    props: [
      {
        name: "variant",
        type: '"default" | "success" | "warning" | "destructive" | "brand" | "outline"',
        required: false,
        defaultValue: '"default"',
        description: "Semantic color variant of the badge.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        required: false,
        defaultValue: '"md"',
        description: "Size preset controlling padding and font size.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Badge variants",
        code: `<Badge variant="success">Active</Badge>\n<Badge variant="warning">2 days left</Badge>\n<Badge variant="destructive">Expired</Badge>`,
      },
      {
        title: "Badge sizes",
        code: `<Badge variant="brand" size="sm">Small</Badge>\n<Badge variant="brand" size="md">Medium</Badge>\n<Badge variant="brand" size="lg">Large</Badge>`,
      },
    ],
    accessibility: [
      "Renders as a <span> element — pair with visually hidden text if the badge conveys critical status",
    ],
    relatedComponents: [],
    designTokens: [
      "--surface-elevated",
      "--border-default",
      "--color-primary",
    ],
    guidelines: [
      { type: "do", text: "Use semantic variants (success, warning, destructive) for status indicators" },
      { type: "dont", text: "Don't put long text in badges \u2014 keep them to 2\u20133 words" },
      { type: "caution", text: "Ensure sufficient color contrast when using custom colors" },
    ],
  },
  {
    slug: "divider",
    name: "Divider",
    description:
      "Horizontal or vertical separator with optional label text for section breaks. Supports default, emphasis, and gradient variants with compound styling for each orientation.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/primitives",
    filePath: "app/components/ui/primitives/divider.tsx",
    tags: ["divider", "separator", "hr", "line", "gradient", "label"],
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        required: false,
        defaultValue: '"horizontal"',
        description: "Layout direction of the divider.",
      },
      {
        name: "variant",
        type: '"default" | "emphasis" | "gradient"',
        required: false,
        defaultValue: '"default"',
        description: "Visual style variant of the divider line.",
      },
      {
        name: "label",
        type: "string",
        required: false,
        description:
          "Text label centered on the divider (only rendered for horizontal orientation).",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Default horizontal divider",
        code: `<Divider />`,
      },
      {
        title: "Gradient divider",
        code: `<Divider variant="gradient" />`,
      },
      {
        title: "Divider with label",
        code: `<Divider label="OR" variant="emphasis" />`,
      },
      {
        title: "Vertical divider",
        code: `<div className="flex h-12 items-center gap-4">\n  <span>Left</span>\n  <Divider orientation="vertical" />\n  <span>Right</span>\n</div>`,
      },
    ],
    accessibility: [
      'Uses role="separator" for semantic meaning',
      "Sets aria-orientation to match the orientation prop",
      "Label text is visible to screen readers within the separator context",
    ],
    relatedComponents: [],
    designTokens: [
      "--border-subtle",
      "--border-emphasis",
      "--color-primary",
    ],
  },
  {
    slug: "card",
    name: "Card",
    description:
      "Versatile container with four variants (default, elevated, glass, interactive), composable sub-components (CardHeader, CardContent, CardFooter), and configurable padding.",
    category: "base",
    status: "built",
    importPath: "@/app/components/ui/primitives/card",
    filePath: "app/components/ui/primitives/card.tsx",
    tags: ["card", "container", "surface", "panel", "glass", "interactive"],
    props: [
      {
        name: "variant",
        type: '"default" | "elevated" | "glass" | "interactive"',
        required: false,
        defaultValue: '"default"',
        description: "Visual style variant of the card.",
      },
      {
        name: "padding",
        type: '"none" | "sm" | "md" | "lg"',
        required: false,
        defaultValue: '"md"',
        description: "Inner padding preset.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Card with composition",
        code: `<Card variant="default">\n  <CardHeader>\n    <h4 className="font-semibold">Campaign Stats</h4>\n  </CardHeader>\n  <CardContent className="py-4">\n    <p>Content goes here</p>\n  </CardContent>\n  <CardFooter>\n    <Button variant="primary" size="sm">View</Button>\n  </CardFooter>\n</Card>`,
      },
      {
        title: "Glass card",
        code: `<Card variant="glass" padding="lg">\n  <p>Frosted glass aesthetic</p>\n</Card>`,
      },
    ],
    accessibility: [
      "Uses semantic <div> elements — wrap with <article> or <section> when appropriate",
      "CardHeader and CardFooter use border separators for visual grouping",
    ],
    relatedComponents: ["button"],
    designTokens: [
      "--surface-elevated",
      "--border-subtle",
      "--border-emphasis",
      "--shadow-elevated",
      "--radius-xl",
    ],
    guidelines: [
      { type: "do", text: "Use the interactive variant for clickable cards" },
      { type: "do", text: "Keep card content concise and scannable" },
      { type: "dont", text: "Don't nest cards inside cards" },
      { type: "dont", text: "Don't use the glass variant on light backgrounds" },
    ],
  },

  // ---------------------------------------------------------------------------
  // FORM (12 built, 2 planned)
  // ---------------------------------------------------------------------------
  {
    slug: "form-fields",
    name: "FormFields",
    description:
      "Composite form field components including InputField, TextAreaField, SelectField, MediaActions, FieldError, and CharacterCount. Used in the CreatePost flow.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/form/FormFields",
    filePath: "app/components/ui/form/FormFields.tsx",
    tags: [
      "form",
      "input",
      "textarea",
      "select",
      "field",
      "validation",
      "character-count",
    ],
    props: [
      {
        name: "label",
        type: "string",
        required: false,
        description: "Field label text (InputField, TextAreaField).",
      },
      {
        name: "error",
        type: "string",
        required: false,
        description: "Validation error message displayed below the field.",
      },
      {
        name: "maxLength",
        type: "number",
        required: false,
        description:
          "Maximum character count (enables CharacterCount display).",
      },
    ],
    examples: [
      {
        title: "Input field with error",
        code: `<InputField\n  label="Title"\n  value={title}\n  onChange={setTitle}\n  error={errors.title}\n  maxLength={100}\n/>`,
      },
    ],
    accessibility: [
      "Uses animated FieldError with AnimatePresence for smooth validation messages",
      "CharacterCount provides live feedback with GSAP pulse at 90% capacity",
    ],
    relatedComponents: ["label"],
    designTokens: [],
  },
  {
    slug: "avatar-uploader",
    name: "AvatarUploader",
    description:
      "Drag-and-drop avatar image uploader with preview, cropping area, and file validation. Features camera icon overlay and animated state transitions.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/form/AvatarUploader",
    filePath: "app/components/ui/form/AvatarUploader.tsx",
    tags: [
      "avatar",
      "upload",
      "image",
      "file",
      "drag-drop",
      "preview",
      "crop",
    ],
    props: [
      {
        name: "value",
        type: "string | null",
        required: false,
        description: "Current avatar image URL or data URL.",
      },
      {
        name: "onChange",
        type: "(file: File | null) => void",
        required: true,
        description: "Callback when a file is selected or removed.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Basic uploader",
        code: `<AvatarUploader\n  value={avatarUrl}\n  onChange={handleAvatarChange}\n/>`,
      },
    ],
    accessibility: [
      "Uses motion/react AnimatePresence for smooth state transitions",
    ],
    relatedComponents: ["avatar"],
    designTokens: [],
  },
  {
    slug: "otp-input",
    name: "OTPInput",
    description:
      "Six-digit one-time password input with auto-advance, paste support, arrow key navigation, and numeric-only validation.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/form/OTPInput",
    filePath: "app/components/ui/form/OTPInput.tsx",
    tags: [
      "otp",
      "verification",
      "code",
      "pin",
      "digits",
      "two-factor",
    ],
    props: [
      {
        name: "length",
        type: "number",
        required: false,
        defaultValue: "6",
        description: "Number of OTP digits.",
      },
      {
        name: "value",
        type: "string",
        required: true,
        description: "Current OTP value.",
      },
      {
        name: "onChange",
        type: "(value: string) => void",
        required: true,
        description: "Callback when the OTP value changes.",
      },
      {
        name: "onComplete",
        type: "(value: string) => void",
        required: false,
        description: "Callback when all digits are entered.",
      },
      {
        name: "error",
        type: "string",
        required: false,
        description: "Error message displayed below the input.",
      },
      {
        name: "autoFocus",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description: "Auto-focus the first input on mount.",
      },
    ],
    examples: [
      {
        title: "Verification code",
        code: `<OTPInput\n  value={otp}\n  onChange={setOtp}\n  onComplete={handleVerify}\n  error={otpError}\n  autoFocus\n/>`,
      },
    ],
    accessibility: [
      "Each input has ARIA labels (e.g. 'Digit 1 of 6')",
      "Arrow key navigation between inputs",
      "Paste support for full code auto-fill",
      "Numeric-only input filtering",
    ],
    relatedComponents: [],
    designTokens: [],
  },
  {
    slug: "password-strength-meter",
    name: "PasswordStrengthMeter",
    description:
      "Visual password strength indicator with animated progress bar, color-coded levels, and a checklist of requirements (length, uppercase, lowercase, number, special char).",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/form/PasswordStrengthMeter",
    filePath: "app/components/ui/form/PasswordStrengthMeter.tsx",
    tags: [
      "password",
      "strength",
      "validation",
      "meter",
      "security",
      "requirements",
    ],
    props: [
      {
        name: "password",
        type: "string",
        required: true,
        description: "The password value to evaluate.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Password strength indicator",
        code: `<PasswordStrengthMeter password={password} />`,
      },
    ],
    accessibility: [
      "Color-coded with text labels (not color-only) for colorblind users",
      "AnimatePresence for smooth requirement list transitions",
    ],
    relatedComponents: [],
    designTokens: [],
  },
  {
    slug: "username-input",
    name: "UsernameInput",
    description:
      "Username input field with real-time availability checking, character validation, GSAP animations, and visual status feedback (available, taken, checking).",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/form/UsernameInput",
    filePath: "app/components/ui/form/UsernameInput.tsx",
    tags: [
      "username",
      "input",
      "validation",
      "availability",
      "realtime",
      "onboarding",
    ],
    props: [
      {
        name: "value",
        type: "string",
        required: true,
        description: "Current username value.",
      },
      {
        name: "onChange",
        type: "(value: string) => void",
        required: true,
        description: "Callback when the username changes.",
      },
      {
        name: "error",
        type: "string",
        required: false,
        description: "External validation error message.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Username with availability check",
        code: `<UsernameInput\n  value={username}\n  onChange={setUsername}\n  error={errors.username}\n/>`,
      },
    ],
    accessibility: [
      "Real-time validation feedback with visual status icons",
      "GSAP animations for status transitions",
    ],
    relatedComponents: ["label"],
    designTokens: [],
  },
  {
    slug: "wallet-address-input",
    name: "WalletAddressInput",
    description:
      "Specialized input for Ethereum wallet addresses with validation, auto-fill from connected wallet, ENS resolution support, and address truncation display.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/form/WalletAddressInput",
    filePath: "app/components/ui/form/WalletAddressInput.tsx",
    tags: [
      "wallet",
      "address",
      "ethereum",
      "web3",
      "ens",
      "blockchain",
      "input",
    ],
    props: [
      {
        name: "value",
        type: "string",
        required: true,
        description: "Current wallet address value.",
      },
      {
        name: "onChange",
        type: "(value: string) => void",
        required: true,
        description: "Callback when the address changes.",
      },
      {
        name: "error",
        type: "string",
        required: false,
        description: "Validation error message.",
      },
      {
        name: "isWalletConnected",
        type: "boolean",
        required: false,
        description: "Whether a wallet is connected (shows auto-fill button).",
      },
      {
        name: "connectedWalletAddress",
        type: "string",
        required: false,
        description: "Connected wallet address for auto-fill.",
      },
    ],
    examples: [
      {
        title: "Wallet input with auto-fill",
        code: `<WalletAddressInput\n  value={walletAddress}\n  onChange={setWalletAddress}\n  isWalletConnected={isConnected}\n  connectedWalletAddress={address}\n  error={errors.wallet}\n/>`,
      },
    ],
    accessibility: [
      "Visual validation states (empty, typing, valid, invalid, resolving)",
      "Spinner shown during ENS resolution",
    ],
    relatedComponents: ["spinner"],
    designTokens: [],
  },
  {
    slug: "social-links-group",
    name: "SocialLinksGroup",
    description:
      "Group of social media link inputs (Twitter/X, Instagram, LinkedIn, GitHub, personal website) with platform-specific icons and URL validation.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/form/SocialLinksGroup",
    filePath: "app/components/ui/form/SocialLinksGroup.tsx",
    tags: [
      "social",
      "links",
      "twitter",
      "instagram",
      "linkedin",
      "github",
      "website",
      "onboarding",
    ],
    props: [
      {
        name: "values",
        type: "Record<string, string>",
        required: true,
        description: "Map of platform IDs to URL values.",
      },
      {
        name: "onChange",
        type: "(platform: string, value: string) => void",
        required: true,
        description: "Callback when a link value changes.",
      },
      {
        name: "errors",
        type: "Record<string, string>",
        required: false,
        description: "Map of platform IDs to error messages.",
      },
    ],
    examples: [
      {
        title: "Social links onboarding",
        code: `<SocialLinksGroup\n  values={socialLinks}\n  onChange={handleSocialChange}\n  errors={socialErrors}\n/>`,
      },
    ],
    accessibility: [
      "Each input has platform-specific labels and icons",
      "GSAP animations for interactive feedback",
    ],
    relatedComponents: [],
    designTokens: [],
  },
  {
    slug: "calendar",
    name: "Calendar",
    description:
      "Date picker calendar built on react-day-picker with custom styling, keyboard navigation, and support for dropdown year/month selection.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/calendar",
    filePath: "app/components/ui/calendar.tsx",
    tags: [
      "calendar",
      "date",
      "picker",
      "day-picker",
      "scheduling",
    ],
    props: [
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
      {
        name: "showOutsideDays",
        type: "boolean",
        required: false,
        defaultValue: "true",
        description: "Show days from adjacent months.",
      },
      {
        name: "selected",
        type: "Date | Date[]",
        required: false,
        description: "Currently selected date(s).",
      },
      {
        name: "onSelect",
        type: "(date: Date | undefined) => void",
        required: false,
        description: "Callback when a date is selected.",
      },
    ],
    examples: [
      {
        title: "Basic calendar",
        code: `<Calendar\n  selected={selectedDate}\n  onSelect={setSelectedDate}\n  mode="single"\n/>`,
      },
    ],
    accessibility: [
      "Full keyboard navigation via react-day-picker",
      "Custom 44px minimum touch targets on nav buttons",
    ],
    relatedComponents: ["date-picker"],
    designTokens: ["--color-primary", "--color-muted"],
  },
  {
    slug: "date-picker",
    name: "DatePicker",
    description:
      "Popover-based date picker that combines a trigger button with the Calendar component. Supports min/max dates and dropdown year range.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/date-picker",
    filePath: "app/components/ui/date-picker.tsx",
    tags: ["date", "picker", "popover", "input", "form"],
    props: [
      {
        name: "value",
        type: "Date",
        required: false,
        description: "Currently selected date.",
      },
      {
        name: "onChange",
        type: "(date: Date | undefined) => void",
        required: false,
        description: "Callback when a date is selected.",
      },
      {
        name: "placeholder",
        type: "string",
        required: false,
        defaultValue: '"Pick a date"',
        description: "Placeholder text when no date is selected.",
      },
      {
        name: "minDate",
        type: "Date",
        required: false,
        description: "Earliest selectable date.",
      },
      {
        name: "maxDate",
        type: "Date",
        required: false,
        description: "Latest selectable date.",
      },
    ],
    examples: [
      {
        title: "Date of birth picker",
        code: `<DatePicker\n  value={dateOfBirth}\n  onChange={setDateOfBirth}\n  placeholder="Select your date of birth"\n  maxDate={new Date()}\n/>`,
      },
    ],
    accessibility: [
      "Closes on outside click and Escape key",
      "CalendarIcon in trigger for visual affordance",
    ],
    relatedComponents: ["calendar"],
    designTokens: [],
  },

  // Promoted from planned → built
  {
    slug: "input",
    name: "Input",
    description:
      "Text input primitive with three variants (default, filled, ghost), start/end icon slots, error state with accessible error message, and CVA-driven sizing.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/primitives/input",
    filePath: "app/components/ui/primitives/input.tsx",
    tags: ["input", "text", "form", "field", "icon"],
    props: [
      {
        name: "variant",
        type: '"default" | "filled" | "ghost"',
        required: false,
        defaultValue: '"default"',
        description: "Visual style variant of the input.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        required: false,
        defaultValue: '"md"',
        description: "Size preset controlling height and padding.",
      },
      {
        name: "startIcon",
        type: "React.ReactNode",
        required: false,
        description: "Icon rendered at the start (left) of the input.",
      },
      {
        name: "endIcon",
        type: "React.ReactNode",
        required: false,
        description: "Icon rendered at the end (right) of the input.",
      },
      {
        name: "error",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description: "Whether the input is in an error state.",
      },
      {
        name: "errorMessage",
        type: "string",
        required: false,
        description: "Error message displayed below the input.",
      },
    ],
    examples: [
      {
        title: "Default input with icons",
        code: `import { Mail, Eye } from "@/app/components/ui/icons";\n\n<Input\n  variant="default"\n  placeholder="Email address"\n  startIcon={<Mail className="h-4 w-4" />}\n  endIcon={<Eye className="h-4 w-4" />}\n/>`,
      },
      {
        title: "Error state",
        code: `<Input\n  variant="default"\n  placeholder="Email"\n  error\n  errorMessage="Please enter a valid email"\n  id="email"\n/>`,
      },
    ],
    accessibility: [
      "Sets aria-invalid when error prop is true",
      "Links error message via aria-describedby",
      "Error message uses role='alert' for screen-reader announcements",
      "Icon slots use aria-hidden='true'",
    ],
    relatedComponents: ["label", "textarea", "select"],
    designTokens: [
      "--border-default",
      "--surface-sunken",
      "--color-primary",
      "--text-tertiary",
      "--text-secondary",
    ],
    guidelines: [
      { type: "do", text: "Always pair with a label for accessibility" },
      { type: "do", text: "Show clear error messages below the input" },
      { type: "dont", text: "Don't use placeholder text as a substitute for labels" },
      { type: "caution", text: "Ghost variant has low contrast \u2014 use only in contexts with clear boundaries" },
    ],
  },
  {
    slug: "textarea",
    name: "Textarea",
    description:
      "Multi-line text input with two variants (default, filled), built-in character counter, error state, and accessible error messaging.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/primitives/textarea",
    filePath: "app/components/ui/primitives/textarea.tsx",
    tags: ["textarea", "multiline", "text", "form", "character-count"],
    props: [
      {
        name: "variant",
        type: '"default" | "filled"',
        required: false,
        defaultValue: '"default"',
        description: "Visual style variant of the textarea.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        required: false,
        defaultValue: '"md"',
        description: "Size preset controlling min-height and padding.",
      },
      {
        name: "error",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description: "Whether the textarea is in an error state.",
      },
      {
        name: "errorMessage",
        type: "string",
        required: false,
        description: "Error message displayed below the textarea.",
      },
      {
        name: "maxLength",
        type: "number",
        required: false,
        description: "Maximum character count. Displays a live counter when provided.",
      },
    ],
    examples: [
      {
        title: "Textarea with character count",
        code: `<Textarea\n  variant="default"\n  placeholder="Describe your campaign..."\n  maxLength={500}\n  value={description}\n  onChange={(e) => setDescription(e.target.value)}\n  id="description"\n/>`,
      },
      {
        title: "Error state",
        code: `<Textarea\n  variant="filled"\n  error\n  errorMessage="Description is required"\n  id="desc"\n/>`,
      },
    ],
    accessibility: [
      "Sets aria-invalid when error prop is true",
      "Links error message via aria-describedby",
      "Character counter uses aria-live='polite' for screen-reader updates",
    ],
    relatedComponents: ["input", "label"],
    designTokens: [
      "--border-default",
      "--surface-sunken",
      "--color-primary",
      "--text-tertiary",
    ],
  },
  {
    slug: "select",
    name: "Select",
    description:
      "Native HTML select wrapper with consistent styling, two variants (default, filled), a placeholder option, error state, and a custom chevron indicator.",
    category: "form",
    status: "built",
    importPath: "@/app/components/ui/primitives/select",
    filePath: "app/components/ui/primitives/select.tsx",
    tags: ["select", "dropdown", "options", "form", "native"],
    props: [
      {
        name: "variant",
        type: '"default" | "filled"',
        required: false,
        defaultValue: '"default"',
        description: "Visual style variant of the select.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        required: false,
        defaultValue: '"md"',
        description: "Size preset controlling height and padding.",
      },
      {
        name: "error",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description: "Whether the select is in an error state.",
      },
      {
        name: "errorMessage",
        type: "string",
        required: false,
        description: "Error message displayed below the select.",
      },
      {
        name: "placeholder",
        type: "string",
        required: false,
        description: "Placeholder text shown as a disabled first option.",
      },
    ],
    examples: [
      {
        title: "Select with placeholder",
        code: `<Select placeholder="Choose a category">\n  <option value="education">Education</option>\n  <option value="health">Health</option>\n  <option value="environment">Environment</option>\n</Select>`,
      },
      {
        title: "Error state",
        code: `<Select\n  placeholder="Select category"\n  error\n  errorMessage="Category is required"\n  id="category"\n/>`,
      },
    ],
    accessibility: [
      "Sets aria-invalid when error prop is true",
      "Links error message via aria-describedby",
      "Uses native <select> for full keyboard and screen-reader support",
      "Custom chevron is rendered via CSS background-image (no extra DOM)",
    ],
    relatedComponents: ["input", "label"],
    designTokens: [
      "--border-default",
      "--surface-sunken",
      "--color-primary",
    ],
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    description:
      "Accessible checkbox with indeterminate state and label association.",
    category: "form",
    status: "planned",
    importPath: "@/app/components/ui/Checkbox",
    filePath: "app/components/ui/Checkbox.tsx",
    tags: ["checkbox", "toggle", "boolean", "form"],
  },
  {
    slug: "radio",
    name: "Radio",
    description:
      "Radio button group with accessible keyboard navigation and custom styling.",
    category: "form",
    status: "planned",
    importPath: "@/app/components/ui/Radio",
    filePath: "app/components/ui/Radio.tsx",
    tags: ["radio", "option", "group", "form"],
  },

  // ---------------------------------------------------------------------------
  // DATA DISPLAY (4 built, 3 planned)
  // ---------------------------------------------------------------------------
  {
    slug: "empty-state",
    name: "EmptyState",
    description:
      "Contextual empty state with icon, title, description, and optional actions. Includes 15+ pre-built variants for campaigns, donations, posts, followers, notifications, and more.",
    category: "data-display",
    status: "built",
    importPath: "@/app/components/ui/EmptyState",
    filePath: "app/components/ui/EmptyState.tsx",
    tags: [
      "empty",
      "state",
      "placeholder",
      "no-data",
      "zero-state",
      "illustration",
    ],
    props: [
      {
        name: "icon",
        type: "LucideIcon",
        required: false,
        defaultValue: "Inbox",
        description: "Lucide icon component displayed above the title.",
      },
      {
        name: "title",
        type: "string",
        required: true,
        description: "Main heading text.",
      },
      {
        name: "description",
        type: "string",
        required: true,
        description: "Supporting description text.",
      },
      {
        name: "action",
        type: "{ label: string; onClick: () => void; variant?: ButtonVariant }",
        required: false,
        description: "Primary call-to-action button configuration.",
      },
      {
        name: "secondaryAction",
        type: "{ label: string; onClick: () => void }",
        required: false,
        description: "Secondary action button (outline variant).",
      },
    ],
    examples: [
      {
        title: "Custom empty state",
        code: `import { Search } from "lucide-react";\n\n<EmptyState\n  icon={Search}\n  title="No results found"\n  description="Try different search terms."\n  action={{ label: "Clear search", onClick: handleClear }}\n/>`,
      },
      {
        title: "Pre-built variant",
        code: `<EmptyStateCampaigns onCreate={handleCreate} />`,
      },
    ],
    accessibility: [
      "Icon has implicit aria-hidden through className-based rendering",
      "Action buttons use the accessible Button component",
    ],
    relatedComponents: ["button"],
    designTokens: ["--surface-elevated", "--border-subtle", "--text-tertiary"],
  },
  {
    slug: "success-card",
    name: "SuccessCard",
    description:
      "Animated success confirmation card with checkmark SVG, motion/react animations, and GSAP sequenced effects. Used after donations and withdrawals.",
    category: "data-display",
    status: "built",
    importPath: "@/app/components/ui/SuccessCard",
    filePath: "app/components/ui/SuccessCard.tsx",
    tags: [
      "success",
      "confirmation",
      "card",
      "animation",
      "checkmark",
      "celebration",
    ],
    props: [
      {
        name: "title",
        type: "string",
        required: false,
        defaultValue: '"Success!"',
        description: "Heading text.",
      },
      {
        name: "message",
        type: "string",
        required: false,
        description: "Body message describing the successful action.",
      },
      {
        name: "buttonText",
        type: "string",
        required: false,
        defaultValue: '"Close"',
        description: "Action button label.",
      },
      {
        name: "onButtonClick",
        type: "() => void",
        required: false,
        description: "Callback when the action button is clicked.",
      },
      {
        name: "showAnimation",
        type: "boolean",
        required: false,
        defaultValue: "true",
        description: "Whether to show entrance and checkmark animations.",
      },
    ],
    examples: [
      {
        title: "Donation success",
        code: `<SuccessCard\n  title="Donation Sent!"\n  message="Your 50 USDC donation has been sent successfully."\n  buttonText="View Campaign"\n  onButtonClick={() => router.push("/campaigns/123")}\n/>`,
      },
    ],
    accessibility: [
      "Uses motion/react useAnimate for performant animations",
      "Respects prefers-reduced-motion via global CSS",
    ],
    relatedComponents: ["button"],
    designTokens: ["--color-purple"],
  },
  {
    slug: "not-found-page",
    name: "NotFoundPage",
    description:
      "Reusable 404 page component with variants (generic, campaign, profile), animated illustration, primary/secondary CTAs, and quick navigation links. Auto-focuses primary CTA on mount.",
    category: "data-display",
    status: "built",
    importPath: "@/app/components/ui/NotFoundPage",
    filePath: "app/components/ui/NotFoundPage.tsx",
    tags: [
      "404",
      "not-found",
      "error",
      "page",
      "navigation",
      "illustration",
    ],
    props: [
      {
        name: "variant",
        type: '"generic" | "campaign" | "profile"',
        required: false,
        defaultValue: '"generic"',
        description: "Contextual variant for the 404 page.",
      },
      {
        name: "illustration",
        type: "React.ReactNode",
        required: true,
        description: "Illustration component to display.",
      },
      {
        name: "headline",
        type: "string",
        required: true,
        description: "Main heading text.",
      },
      {
        name: "subtext",
        type: "string",
        required: true,
        description: "Supporting message text.",
      },
      {
        name: "primaryAction",
        type: "{ label: string; href: string; icon?: IconName }",
        required: true,
        description: "Primary call-to-action link.",
      },
      {
        name: "quickLinks",
        type: "QuickLink[]",
        required: false,
        description: "Optional quick navigation links.",
      },
    ],
    examples: [
      {
        title: "Generic 404",
        code: `<NotFoundPage\n  illustration={<NotFoundIllustration />}\n  headline="Page not found"\n  subtext="The page you're looking for doesn't exist."\n  primaryAction={{ label: "Go Home", href: "/", icon: "home" }}\n  quickLinks={[\n    { icon: "search", label: "Search", href: "/search" },\n    { icon: "compass", label: "Explore", href: "/campaigns" },\n  ]}\n/>`,
      },
    ],
    accessibility: [
      "aria-labelledby links heading to main landmark",
      "Screen reader live region announces 404 status",
      "Auto-focuses primary CTA with delay for animation completion",
      "44px minimum touch targets on all interactive elements",
      "Quick links navigation uses nav landmark with aria-label",
    ],
    relatedComponents: ["button"],
    designTokens: ["--surface-elevated", "--text-secondary"],
  },
  {
    slug: "toast",
    name: "Toast",
    description:
      "Toast notification system with context provider, animated entrance/exit, four types (success, error, warning, info), auto-dismiss, and screen-reader announcements.",
    category: "data-display",
    status: "built",
    importPath: "@/app/components/ui/Toast",
    filePath: "app/components/ui/Toast.tsx",
    tags: [
      "toast",
      "notification",
      "alert",
      "snackbar",
      "message",
      "feedback",
    ],
    props: [
      {
        name: "message",
        type: "string",
        required: true,
        description: "Toast message text.",
      },
      {
        name: "type",
        type: '"success" | "error" | "info" | "warning"',
        required: false,
        defaultValue: '"info"',
        description: "Visual and semantic type of the toast.",
      },
      {
        name: "duration",
        type: "number",
        required: false,
        defaultValue: "5000",
        description: "Auto-dismiss duration in milliseconds.",
      },
    ],
    examples: [
      {
        title: "Using the toast hook",
        code: `const { showToast } = useToast();\n\nshowToast("Campaign created!", "success");`,
      },
      {
        title: "With helper methods",
        code: `const toast = useToastWithHelpers();\n\ntoast.success("Donation sent!");\ntoast.error("Transaction failed");`,
      },
    ],
    accessibility: [
      "aria-live='polite' container for non-critical toasts",
      "aria-live='assertive' for error toasts",
      "Creates temporary screen-reader-only announcement element",
      "Dismiss button with accessible label",
    ],
    relatedComponents: [],
    designTokens: ["--z-toast", "--color-destructive"],
  },

  // Planned data display components
  {
    slug: "progress",
    name: "Progress",
    description:
      "Determinate and indeterminate progress bar with variant colors, three sizes, optional percentage label, and animated indeterminate state. Uses CVA for track and bar styling.",
    category: "data-display",
    status: "built",
    importPath: "@/app/components/ui/primitives",
    filePath: "app/components/ui/primitives/progress.tsx",
    tags: ["progress", "bar", "loading", "percentage", "indeterminate"],
    props: [
      {
        name: "value",
        type: "number",
        required: true,
        description: "Current progress value (0 to max).",
      },
      {
        name: "max",
        type: "number",
        required: false,
        defaultValue: "100",
        description: "Maximum value for the progress bar.",
      },
      {
        name: "variant",
        type: '"default" | "success" | "warning" | "info"',
        required: false,
        defaultValue: '"default"',
        description:
          "Color variant of the progress bar fill.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        required: false,
        defaultValue: '"md"',
        description: "Height of the progress track.",
      },
      {
        name: "showLabel",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description:
          "Show percentage label (inside the bar for lg size, beside the bar otherwise).",
      },
      {
        name: "indeterminate",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description: "Animated indeterminate loading state.",
      },
      {
        name: "label",
        type: "string",
        required: false,
        description: "Accessible label for the progress bar (aria-label).",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes for the track element.",
      },
    ],
    examples: [
      {
        title: "Basic progress bar",
        code: `<Progress value={65} />`,
      },
      {
        title: "Progress with label",
        code: `<Progress value={42} showLabel size="lg" variant="success" />`,
      },
      {
        title: "Indeterminate progress",
        code: `<Progress value={0} indeterminate label="Loading data..." />`,
      },
      {
        title: "Size variants",
        code: `<Progress value={70} size="sm" />\n<Progress value={70} size="md" />\n<Progress value={70} size="lg" />`,
      },
    ],
    accessibility: [
      'Uses role="progressbar" with aria-valuenow, aria-valuemin, and aria-valuemax',
      "aria-valuenow is omitted during indeterminate state",
      "Supports aria-label for screen-reader context",
    ],
    relatedComponents: ["spinner"],
    designTokens: [
      "--surface-sunken",
      "--color-primary",
      "--purple-500",
      "--color-success",
      "--color-warning",
      "--color-info",
    ],
  },
  {
    slug: "table",
    name: "Table",
    description:
      "Responsive data table with sorting, pagination, and row selection.",
    category: "data-display",
    status: "planned",
    importPath: "@/app/components/ui/Table",
    filePath: "app/components/ui/Table.tsx",
    tags: ["table", "data", "grid", "sortable"],
  },
  {
    slug: "stepper",
    name: "Stepper",
    description:
      "Multi-step progress indicator for wizards and onboarding flows.",
    category: "data-display",
    status: "planned",
    importPath: "@/app/components/ui/Stepper",
    filePath: "app/components/ui/Stepper.tsx",
    tags: ["stepper", "steps", "wizard", "progress", "onboarding"],
  },

  // ---------------------------------------------------------------------------
  // FEEDBACK & OVERLAYS (4 built, 6 planned)
  // ---------------------------------------------------------------------------
  {
    slug: "add-reminder-modal",
    name: "AddReminderModal",
    description:
      "Modal overlay for adding campaign reminders to calendar providers (Apple, Google, Outlook, Yahoo). Features focus trapping, scroll lock, and calendar event generation.",
    category: "feedback",
    status: "built",
    importPath: "@/app/components/ui/AddReminderModal",
    filePath: "app/components/ui/AddReminderModal.tsx",
    tags: [
      "modal",
      "reminder",
      "calendar",
      "campaign",
      "notification",
      "overlay",
    ],
    props: [
      {
        name: "isOpen",
        type: "boolean",
        required: true,
        description: "Controls modal visibility.",
      },
      {
        name: "onClose",
        type: "() => void",
        required: true,
        description: "Callback to close the modal.",
      },
      {
        name: "campaignTitle",
        type: "string",
        required: true,
        description: "Campaign title for the reminder event.",
      },
      {
        name: "campaignEndDate",
        type: "Date",
        required: true,
        description:
          "Campaign end date (reminder is set for 1 day before).",
      },
      {
        name: "onReminderSet",
        type: "(provider: string) => void",
        required: false,
        description: "Callback when a reminder is successfully set.",
      },
    ],
    examples: [
      {
        title: "Campaign reminder modal",
        code: `<AddReminderModal\n  isOpen={showReminder}\n  onClose={() => setShowReminder(false)}\n  campaignTitle="Save the Rainforest"\n  campaignEndDate={new Date("2025-12-31")}\n  onReminderSet={(provider) => toast.success(\`Added to \${provider}\`)}\n/>`,
      },
    ],
    accessibility: [
      "Focus trapping within modal (trapFocus utility)",
      "Scroll lock via react-remove-scroll",
      "Close on Escape key",
    ],
    relatedComponents: ["modal-backdrop"],
    designTokens: [],
  },
  {
    slug: "share-campaign-modal",
    name: "ShareCampaignModal",
    description:
      "Social sharing modal with network buttons (Twitter/X, Facebook, WhatsApp, Telegram, LinkedIn, Email), copy-to-clipboard URL, and animated transitions.",
    category: "feedback",
    status: "built",
    importPath: "@/app/components/ui/ShareCampaignModal",
    filePath: "app/components/ui/ShareCampaignModal.tsx",
    tags: [
      "modal",
      "share",
      "social",
      "campaign",
      "clipboard",
      "overlay",
    ],
    props: [
      {
        name: "isOpen",
        type: "boolean",
        required: true,
        description: "Controls modal visibility.",
      },
      {
        name: "onClose",
        type: "() => void",
        required: true,
        description: "Callback to close the modal.",
      },
      {
        name: "campaignUrl",
        type: "string",
        required: false,
        description: "URL to share.",
      },
      {
        name: "campaignTitle",
        type: "string",
        required: false,
        description: "Title for the shared content.",
      },
      {
        name: "onShare",
        type: "(network: string) => void",
        required: false,
        description: "Callback when content is shared to a network.",
      },
    ],
    examples: [
      {
        title: "Share campaign",
        code: `<ShareCampaignModal\n  isOpen={showShare}\n  onClose={() => setShowShare(false)}\n  campaignUrl="https://fundbrave.com/campaigns/abc"\n  campaignTitle="Help Build a School"\n/>`,
      },
    ],
    accessibility: [
      "Focus trapping within modal",
      "AnimatePresence for smooth open/close transitions",
    ],
    relatedComponents: ["modal-backdrop"],
    designTokens: [],
  },
  {
    slug: "create-post",
    name: "CreatePost",
    description:
      "Full-featured post creation dialog with text input, image upload, audience selection, campaign update mode, and tab navigation between post types.",
    category: "feedback",
    status: "built",
    importPath: "@/app/components/ui/CreatePost/CreatePost",
    filePath: "app/components/ui/CreatePost/CreatePost.tsx",
    tags: [
      "modal",
      "post",
      "create",
      "editor",
      "image",
      "audience",
      "campaign",
    ],
    props: [
      {
        name: "isOpen",
        type: "boolean",
        required: true,
        description: "Controls the dialog visibility.",
      },
      {
        name: "onClose",
        type: "() => void",
        required: true,
        description: "Callback to close the dialog.",
      },
      {
        name: "onSubmit",
        type: "(data: PostData) => void",
        required: false,
        description: "Callback when a post is submitted.",
      },
    ],
    examples: [
      {
        title: "Create post dialog",
        code: `<CreatePost\n  isOpen={showCreatePost}\n  onClose={() => setShowCreatePost(false)}\n  onSubmit={handlePostSubmit}\n/>`,
      },
    ],
    accessibility: [
      "Modal-based with scroll lock and focus trap",
      "Tab navigation between post and campaign-update modes",
    ],
    relatedComponents: ["form-fields", "tab-navigation", "modal-backdrop"],
    designTokens: [],
  },
  {
    slug: "modal-backdrop",
    name: "ModalBackdrop",
    description:
      "Shared modal backdrop pattern used across AddReminderModal, ShareCampaignModal, and CreatePost. Not a standalone file; the pattern is implemented inline in each modal.",
    category: "feedback",
    status: "built",
    importPath: "@/app/components/ui/AddReminderModal",
    filePath: "app/components/ui/AddReminderModal.tsx",
    tags: ["modal", "backdrop", "overlay", "pattern"],
    props: [
      {
        name: "isOpen",
        type: "boolean",
        required: true,
        description: "Whether the backdrop is visible.",
      },
      {
        name: "onClose",
        type: "() => void",
        required: true,
        description: "Callback when the backdrop is clicked.",
      },
    ],
    examples: [
      {
        title: "Backdrop usage pattern",
        description:
          "This is a shared pattern, not a standalone component. Each modal implements its own backdrop.",
        code: `{isOpen && (\n  <div\n    className="fixed inset-0 z-modal bg-black/50 backdrop-blur-sm"\n    onClick={onClose}\n    aria-hidden="true"\n  />\n)}`,
      },
    ],
    accessibility: [
      "Uses aria-hidden since the backdrop itself is not interactive content",
      "Click handler delegates to onClose for closing the parent modal",
    ],
    relatedComponents: [
      "add-reminder-modal",
      "share-campaign-modal",
      "create-post",
    ],
    designTokens: ["--z-modal"],
  },

  // Planned feedback components
  {
    slug: "dialog",
    name: "Dialog",
    description:
      "Generic accessible dialog/modal with focus trap, scroll lock, and configurable size.",
    category: "feedback",
    status: "planned",
    importPath: "@/app/components/ui/Dialog",
    filePath: "app/components/ui/Dialog.tsx",
    tags: ["dialog", "modal", "overlay", "accessible"],
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    description:
      "Lightweight, accessible tooltip with four placement sides, configurable hover delay, smooth fade animation, and directional arrow. Uses local state instead of Radix.",
    category: "feedback",
    status: "built",
    importPath: "@/app/components/ui/primitives",
    filePath: "app/components/ui/primitives/tooltip.tsx",
    tags: ["tooltip", "hover", "hint", "help", "accessible"],
    props: [
      {
        name: "content",
        type: "string",
        required: true,
        description: "Tooltip text content displayed on hover.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        required: true,
        description: "The trigger element that activates the tooltip.",
      },
      {
        name: "side",
        type: '"top" | "right" | "bottom" | "left"',
        required: false,
        defaultValue: '"top"',
        description: "Which side the tooltip appears on relative to the trigger.",
      },
      {
        name: "delayMs",
        type: "number",
        required: false,
        defaultValue: "200",
        description: "Delay in milliseconds before showing the tooltip.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional class names for the tooltip wrapper.",
      },
    ],
    examples: [
      {
        title: "Basic tooltip",
        code: `<Tooltip content="Save your changes">\n  <Button variant="primary">Save</Button>\n</Tooltip>`,
      },
      {
        title: "Tooltip placement",
        code: `<Tooltip content="Top" side="top">\n  <span>Hover me</span>\n</Tooltip>\n\n<Tooltip content="Right" side="right">\n  <span>Hover me</span>\n</Tooltip>`,
      },
      {
        title: "Custom delay",
        code: `<Tooltip content="Shows after 500ms" delayMs={500}>\n  <Button variant="ghost">Slow tooltip</Button>\n</Tooltip>`,
      },
    ],
    accessibility: [
      'Uses role="tooltip" with dynamic aria-describedby linking',
      "Tooltip is shown on both hover and focus for keyboard access",
      "Dismissed on blur/mouse-leave with timer cleanup on unmount",
      "Arrow element uses aria-hidden to avoid screen-reader noise",
    ],
    relatedComponents: ["popover"],
    designTokens: [
      "--z-tooltip",
      "--radius-sm",
      "--duration-fast",
      "--ease-snappy",
    ],
  },
  {
    slug: "popover",
    name: "Popover",
    description:
      "Click-triggered floating content panel with smart positioning.",
    category: "feedback",
    status: "planned",
    importPath: "@/app/components/ui/Popover",
    filePath: "app/components/ui/Popover.tsx",
    tags: ["popover", "floating", "panel", "dropdown"],
  },
  {
    slug: "sheet",
    name: "Sheet",
    description:
      "Side-panel overlay (bottom on mobile, right on desktop) for secondary actions.",
    category: "feedback",
    status: "planned",
    importPath: "@/app/components/ui/Sheet",
    filePath: "app/components/ui/Sheet.tsx",
    tags: ["sheet", "panel", "drawer", "side", "mobile"],
  },
  {
    slug: "alert",
    name: "Alert",
    description:
      "Contextual alert banner with variant-appropriate icons (info, success, warning, destructive), optional title, close button, and semantic ARIA roles. Uses CVA for color theming.",
    category: "feedback",
    status: "built",
    importPath: "@/app/components/ui/primitives",
    filePath: "app/components/ui/primitives/alert.tsx",
    tags: ["alert", "banner", "info", "warning", "error", "success", "closable"],
    props: [
      {
        name: "variant",
        type: '"info" | "success" | "warning" | "destructive"',
        required: false,
        defaultValue: '"info"',
        description: "Semantic color variant determining icon, border, and background.",
      },
      {
        name: "title",
        type: "string",
        required: false,
        description: "Bold title text rendered above the description.",
      },
      {
        name: "icon",
        type: "React.ReactNode",
        required: false,
        description: "Custom icon to override the default variant icon.",
      },
      {
        name: "onClose",
        type: "() => void",
        required: false,
        description: "Callback when the close button is clicked. Renders a dismiss button when provided.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        required: true,
        description: "Alert body content / description.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Info alert",
        code: `<Alert variant="info" title="Heads up">\n  Your campaign will be reviewed within 24 hours.\n</Alert>`,
      },
      {
        title: "Destructive alert with close",
        code: `<Alert\n  variant="destructive"\n  title="Transaction Failed"\n  onClose={() => setVisible(false)}\n>\n  The network rejected the transaction. Please try again.\n</Alert>`,
      },
      {
        title: "Success alert",
        code: `<Alert variant="success">\n  Your donation was processed successfully!\n</Alert>`,
      },
    ],
    accessibility: [
      'Uses role="alert" for destructive and warning variants (assertive announcements)',
      'Uses role="status" for info and success variants (polite announcements)',
      'Close button has aria-label="Dismiss alert"',
      "Icon uses aria-hidden to avoid screen-reader duplication",
    ],
    relatedComponents: [],
    designTokens: [
      "--color-info",
      "--color-success",
      "--color-warning",
      "--radius-lg",
      "--radius-sm",
      "--duration-fast",
    ],
    guidelines: [
      { type: "do", text: "Use the appropriate variant to match the severity of the message" },
      { type: "do", text: "Keep alert messages actionable \u2014 tell users what to do next" },
      { type: "dont", text: "Don't stack multiple alerts of the same type" },
    ],
  },
  {
    slug: "dropdown",
    name: "Dropdown",
    description:
      "Accessible dropdown menu with keyboard navigation, grouping, and sub-menus.",
    category: "feedback",
    status: "planned",
    importPath: "@/app/components/ui/Dropdown",
    filePath: "app/components/ui/Dropdown.tsx",
    tags: ["dropdown", "menu", "actions", "context-menu"],
  },

  // ---------------------------------------------------------------------------
  // SOCIAL & FEED (14 built)
  // ---------------------------------------------------------------------------
  {
    slug: "post-card",
    name: "PostCard",
    description:
      "Unified post component with variants (default, liked, community). Composes PostHeader, PostContent, PostImageGrid, PostActionBar, and CommentSection.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/post/PostCard",
    filePath: "app/components/ui/post/PostCard.tsx",
    tags: [
      "post",
      "card",
      "feed",
      "social",
      "community",
      "profile",
    ],
    props: [
      {
        name: "post",
        type: "Post",
        required: true,
        description: "Post data object.",
      },
      {
        name: "variant",
        type: '"default" | "liked" | "community"',
        required: false,
        defaultValue: '"default"',
        description: "Display variant determining visible features.",
      },
      {
        name: "onLike",
        type: "() => void",
        required: false,
        description: "Callback when the post is liked.",
      },
      {
        name: "onComment",
        type: "() => void",
        required: false,
        description: "Callback when the comment action is triggered.",
      },
      {
        name: "onShare",
        type: "() => void",
        required: false,
        description: "Callback when the share action is triggered.",
      },
    ],
    examples: [
      {
        title: "Default post card",
        code: `<PostCard\n  post={postData}\n  variant="default"\n  onLike={handleLike}\n  onComment={handleComment}\n  onShare={handleShare}\n/>`,
      },
    ],
    accessibility: [
      "Composes accessible sub-components",
      "Click handlers for post navigation",
    ],
    relatedComponents: [
      "post-header",
      "post-content",
      "post-image-grid",
      "post-action-bar",
      "comment-section",
    ],
    designTokens: [],
  },
  {
    slug: "post-header",
    name: "PostHeader",
    description:
      "Post author header with avatar, display name, verified badge, timestamp, and optional menu/follow button.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/post/PostHeader",
    filePath: "app/components/ui/post/PostHeader.tsx",
    tags: ["post", "header", "author", "avatar", "timestamp"],
    props: [
      {
        name: "author",
        type: "PostAuthor",
        required: true,
        description: "Author information including name, avatar, and verified status.",
      },
      {
        name: "timestamp",
        type: "string",
        required: true,
        description: "Relative or absolute timestamp display.",
      },
      {
        name: "onAuthorClick",
        type: "() => void",
        required: false,
        description: "Callback when the author name/avatar is clicked.",
      },
    ],
    examples: [
      {
        title: "Post header",
        code: `<PostHeader\n  author={{ name: "Jane", avatar: "/jane.jpg", isVerified: true }}\n  timestamp="2 hours ago"\n/>`,
      },
    ],
    relatedComponents: ["avatar", "verified-badge"],
    designTokens: [],
  },
  {
    slug: "post-content",
    name: "PostContent",
    description:
      "Post body text with truncation, expand/collapse toggle, and rich text rendering support.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/post/PostContent",
    filePath: "app/components/ui/post/PostContent.tsx",
    tags: ["post", "content", "text", "truncate", "expand"],
    props: [
      {
        name: "content",
        type: "string",
        required: true,
        description: "Post body text content.",
      },
      {
        name: "maxLines",
        type: "number",
        required: false,
        description: "Maximum lines before truncation.",
      },
    ],
    examples: [
      {
        title: "Post content",
        code: `<PostContent\n  content="Lorem ipsum dolor sit amet..."\n  maxLines={4}\n/>`,
      },
    ],
    relatedComponents: ["post-card"],
    designTokens: [],
  },
  {
    slug: "post-image-grid",
    name: "PostImageGrid",
    description:
      "Responsive image grid for post attachments. Supports 1-4+ images with adaptive layouts and lightbox triggers.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/post/PostImageGrid",
    filePath: "app/components/ui/post/PostImageGrid.tsx",
    tags: ["post", "image", "grid", "gallery", "photos"],
    props: [
      {
        name: "images",
        type: "PostImage[]",
        required: true,
        description: "Array of image objects with src and alt.",
      },
      {
        name: "onImageClick",
        type: "(index: number) => void",
        required: false,
        description: "Callback when an image is clicked.",
      },
    ],
    examples: [
      {
        title: "Image grid",
        code: `<PostImageGrid\n  images={[\n    { src: "/img1.jpg", alt: "Photo 1" },\n    { src: "/img2.jpg", alt: "Photo 2" },\n  ]}\n  onImageClick={(i) => openLightbox(i)}\n/>`,
      },
    ],
    relatedComponents: ["post-card"],
    designTokens: [],
  },
  {
    slug: "post-actions",
    name: "PostActions",
    description:
      "Individual post action button (like, comment, share, repost, bookmark) with count display and toggled state.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/post/PostActions",
    filePath: "app/components/ui/post/PostActions.tsx",
    tags: ["post", "action", "like", "share", "bookmark", "repost"],
    props: [
      {
        name: "type",
        type: '"like" | "comment" | "share" | "repost" | "bookmark"',
        required: true,
        description: "Type of action button.",
      },
      {
        name: "count",
        type: "number",
        required: false,
        description: "Count displayed next to the action.",
      },
      {
        name: "active",
        type: "boolean",
        required: false,
        description: "Whether the action is in active/toggled state.",
      },
    ],
    examples: [
      {
        title: "Like action",
        code: `<PostActions type="like" count={42} active={isLiked} />`,
      },
    ],
    relatedComponents: ["post-action-bar"],
    designTokens: [],
  },
  {
    slug: "post-action-bar",
    name: "PostActionBar",
    description:
      "Horizontal bar containing all post action buttons (like, comment, share, repost, bookmark) with consistent spacing.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/post/PostActionBar",
    filePath: "app/components/ui/post/PostActionBar.tsx",
    tags: ["post", "actions", "bar", "toolbar"],
    props: [
      {
        name: "post",
        type: "Post",
        required: true,
        description: "Post data for computing action states and counts.",
      },
      {
        name: "onLike",
        type: "() => void",
        required: false,
        description: "Like action handler.",
      },
      {
        name: "onComment",
        type: "() => void",
        required: false,
        description: "Comment action handler.",
      },
      {
        name: "onShare",
        type: "() => void",
        required: false,
        description: "Share action handler.",
      },
    ],
    examples: [
      {
        title: "Action bar",
        code: `<PostActionBar\n  post={postData}\n  onLike={handleLike}\n  onComment={handleComment}\n  onShare={handleShare}\n/>`,
      },
    ],
    relatedComponents: ["post-actions", "post-card"],
    designTokens: [],
  },
  {
    slug: "post-indicator",
    name: "PostIndicator",
    description:
      'Status indicator for post cards showing contextual labels (e.g. "You liked this" for liked variant).',
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/post/PostIndicator",
    filePath: "app/components/ui/post/PostIndicator.tsx",
    tags: ["post", "indicator", "status", "label"],
    props: [
      {
        name: "type",
        type: '"liked" | "reposted" | "pinned"',
        required: true,
        description: "Type of indicator to display.",
      },
    ],
    examples: [
      {
        title: "Liked indicator",
        code: `<PostIndicator type="liked" />`,
      },
    ],
    relatedComponents: ["post-card"],
    designTokens: [],
  },
  {
    slug: "verified-badge",
    name: "VerifiedBadge",
    description:
      "Verification checkmark badge for verified users, displayed alongside usernames.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/post/VerifiedBadge",
    filePath: "app/components/ui/post/VerifiedBadge.tsx",
    tags: ["verified", "badge", "checkmark", "trust"],
    props: [
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Verified badge",
        code: `<span className="flex items-center gap-1">\n  Jane Doe <VerifiedBadge />\n</span>`,
      },
    ],
    relatedComponents: ["post-header"],
    designTokens: ["--color-primary"],
  },
  {
    slug: "comment-card",
    name: "CommentCard",
    description:
      "Individual comment display with author avatar, name, timestamp, content, like button, and reply action.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/comments/CommentCard",
    filePath: "app/components/ui/comments/CommentCard.tsx",
    tags: ["comment", "card", "reply", "like", "social"],
    props: [
      {
        name: "comment",
        type: "Comment",
        required: true,
        description: "Comment data object.",
      },
      {
        name: "onLike",
        type: "() => void",
        required: false,
        description: "Like action handler.",
      },
      {
        name: "onReply",
        type: "() => void",
        required: false,
        description: "Reply action handler.",
      },
    ],
    examples: [
      {
        title: "Comment card",
        code: `<CommentCard\n  comment={commentData}\n  onLike={handleLikeComment}\n  onReply={handleReply}\n/>`,
      },
    ],
    relatedComponents: ["avatar", "comment-thread"],
    designTokens: [],
  },
  {
    slug: "comment-input",
    name: "CommentInput",
    description:
      "Text input for writing comments with submit button, character limit, and optional mention support.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/comments/CommentInput",
    filePath: "app/components/ui/comments/CommentInput.tsx",
    tags: ["comment", "input", "text", "submit", "reply"],
    props: [
      {
        name: "onSubmit",
        type: "(text: string) => void",
        required: true,
        description: "Callback when a comment is submitted.",
      },
      {
        name: "placeholder",
        type: "string",
        required: false,
        description: "Input placeholder text.",
      },
      {
        name: "disabled",
        type: "boolean",
        required: false,
        description: "Disables the input.",
      },
    ],
    examples: [
      {
        title: "Comment input",
        code: `<CommentInput\n  onSubmit={handleAddComment}\n  placeholder="Write a comment..."\n/>`,
      },
    ],
    relatedComponents: ["comment-section"],
    designTokens: [],
  },
  {
    slug: "comment-section",
    name: "CommentSection",
    description:
      "Complete comment section with header, input, thread list, and load-more functionality. Orchestrates CommentCard, CommentInput, and CommentThread.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/comments/CommentSection",
    filePath: "app/components/ui/comments/CommentSection.tsx",
    tags: ["comment", "section", "list", "thread", "discussion"],
    props: [
      {
        name: "comments",
        type: "Comment[]",
        required: true,
        description: "Array of comment data objects.",
      },
      {
        name: "onAddComment",
        type: "(text: string) => void",
        required: true,
        description: "Callback when a new comment is submitted.",
      },
      {
        name: "totalCount",
        type: "number",
        required: false,
        description: "Total comment count for display.",
      },
    ],
    examples: [
      {
        title: "Comment section",
        code: `<CommentSection\n  comments={comments}\n  onAddComment={handleAddComment}\n  totalCount={42}\n/>`,
      },
    ],
    relatedComponents: [
      "comment-card",
      "comment-input",
      "comment-thread",
    ],
    designTokens: [],
  },
  {
    slug: "comment-thread",
    name: "CommentThread",
    description:
      "Threaded/nested comment display with indentation, collapse toggle, and visual thread connector lines.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/comments/CommentThread",
    filePath: "app/components/ui/comments/CommentThread.tsx",
    tags: ["comment", "thread", "nested", "replies", "collapse"],
    props: [
      {
        name: "comment",
        type: "Comment",
        required: true,
        description: "Root comment with nested replies.",
      },
      {
        name: "depth",
        type: "number",
        required: false,
        defaultValue: "0",
        description: "Current nesting depth for indentation.",
      },
    ],
    examples: [
      {
        title: "Threaded comments",
        code: `<CommentThread comment={rootComment} depth={0} />`,
      },
    ],
    relatedComponents: ["comment-card", "comment-section"],
    designTokens: [],
  },
  {
    slug: "infinite-comment-list",
    name: "InfiniteCommentList",
    description:
      "Paginated comment list with infinite scroll loading, intersection observer, and loading skeletons.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/comments/InfiniteCommentList",
    filePath: "app/components/ui/comments/InfiniteCommentList.tsx",
    tags: [
      "comment",
      "infinite",
      "scroll",
      "pagination",
      "lazy-load",
    ],
    props: [
      {
        name: "comments",
        type: "Comment[]",
        required: true,
        description: "Currently loaded comments.",
      },
      {
        name: "hasMore",
        type: "boolean",
        required: true,
        description: "Whether more comments can be loaded.",
      },
      {
        name: "onLoadMore",
        type: "() => void",
        required: true,
        description: "Callback to load the next page of comments.",
      },
    ],
    examples: [
      {
        title: "Infinite comment list",
        code: `<InfiniteCommentList\n  comments={comments}\n  hasMore={hasNextPage}\n  onLoadMore={fetchNextPage}\n/>`,
      },
    ],
    relatedComponents: ["comment-card", "skeleton"],
    designTokens: [],
  },
  {
    slug: "sticky-comment-input",
    name: "StickyCommentInput",
    description:
      "Fixed-position comment input that sticks to the bottom of the viewport on mobile for easy access while scrolling.",
    category: "social",
    status: "built",
    importPath: "@/app/components/ui/comments/StickyCommentInput",
    filePath: "app/components/ui/comments/StickyCommentInput.tsx",
    tags: [
      "comment",
      "input",
      "sticky",
      "mobile",
      "fixed",
      "bottom",
    ],
    props: [
      {
        name: "onSubmit",
        type: "(text: string) => void",
        required: true,
        description: "Callback when a comment is submitted.",
      },
      {
        name: "placeholder",
        type: "string",
        required: false,
        description: "Input placeholder text.",
      },
    ],
    examples: [
      {
        title: "Sticky comment input",
        code: `<StickyCommentInput\n  onSubmit={handleSubmit}\n  placeholder="Add a comment..."\n/>`,
      },
    ],
    relatedComponents: ["comment-input"],
    designTokens: [],
  },

  // ---------------------------------------------------------------------------
  // NAVIGATION (1 built, 3 planned)
  // ---------------------------------------------------------------------------
  {
    slug: "tab-navigation",
    name: "TabNavigation",
    description:
      "Animated tab navigation with gradient indicator bar, used in the CreatePost dialog for switching between post and campaign-update modes.",
    category: "navigation",
    status: "built",
    importPath: "@/app/components/ui/TabNavigation",
    filePath: "app/components/ui/TabNavigation.tsx",
    tags: ["tabs", "navigation", "indicator", "animated", "gradient"],
    props: [
      {
        name: "activeTab",
        type: "PostType",
        required: true,
        description: "Currently active tab identifier.",
      },
      {
        name: "onTabChange",
        type: "(tab: PostType) => void",
        required: true,
        description: "Callback when a tab is selected.",
      },
    ],
    examples: [
      {
        title: "Tab navigation",
        code: `<TabNavigation\n  activeTab={activeTab}\n  onTabChange={setActiveTab}\n/>`,
      },
    ],
    accessibility: [
      "Uses motion/react spring animation for smooth indicator transitions",
    ],
    relatedComponents: ["create-post"],
    designTokens: [],
  },

  // Planned navigation components
  {
    slug: "tabs",
    name: "Tabs",
    description:
      "Generic accessible tab component with keyboard navigation, panel association, and customizable styling.",
    category: "navigation",
    status: "planned",
    importPath: "@/app/components/ui/Tabs",
    filePath: "app/components/ui/Tabs.tsx",
    tags: ["tabs", "tablist", "tabpanel", "navigation"],
  },
  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    description:
      "Breadcrumb navigation showing the current page hierarchy with separator and home link.",
    category: "navigation",
    status: "planned",
    importPath: "@/app/components/ui/Breadcrumb",
    filePath: "app/components/ui/Breadcrumb.tsx",
    tags: ["breadcrumb", "navigation", "hierarchy", "path"],
  },
  {
    slug: "pagination",
    name: "Pagination",
    description:
      "Page navigation with previous/next buttons, page numbers, and ellipsis for large datasets.",
    category: "navigation",
    status: "planned",
    importPath: "@/app/components/ui/Pagination",
    filePath: "app/components/ui/Pagination.tsx",
    tags: ["pagination", "pages", "navigation", "list"],
  },

  // ---------------------------------------------------------------------------
  // ACCESSIBILITY (5 built)
  // ---------------------------------------------------------------------------
  {
    slug: "skip-link",
    name: "SkipLink",
    description:
      "Visually hidden link that becomes visible on focus, allowing keyboard users to skip repeated navigation and jump directly to main content.",
    category: "accessibility",
    status: "built",
    importPath: "@/app/components/ui/SkipLink",
    filePath: "app/components/ui/SkipLink.tsx",
    tags: [
      "skip",
      "link",
      "a11y",
      "keyboard",
      "navigation",
      "wcag",
    ],
    props: [
      {
        name: "href",
        type: "string",
        required: false,
        defaultValue: '"#main-content"',
        description: "Target element ID to skip to.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        required: false,
        defaultValue: '"Skip to main content"',
        description: "Link text.",
      },
    ],
    examples: [
      {
        title: "Skip link",
        code: `<SkipLink href="#main-content">Skip to main content</SkipLink>`,
      },
      {
        title: "Multiple skip links",
        code: `<SkipLinks links={[\n  { href: "#main-content", label: "Skip to content" },\n  { href: "#search", label: "Skip to search" },\n]} />`,
      },
    ],
    accessibility: [
      "WCAG 2.4.1 Bypass Blocks compliance",
      "Visible on keyboard focus, hidden otherwise",
      "Uses sr-only / not-sr-only pattern",
    ],
    relatedComponents: ["main-content"],
    designTokens: ["--color-primary"],
  },
  {
    slug: "visually-hidden",
    name: "VisuallyHidden",
    description:
      "Renders content that is visually hidden but accessible to screen readers. Essential for providing accessible names, descriptions, and announcements.",
    category: "accessibility",
    status: "built",
    importPath: "@/app/components/ui/VisuallyHidden",
    filePath: "app/components/ui/VisuallyHidden.tsx",
    tags: ["sr-only", "screen-reader", "hidden", "a11y", "accessible"],
    props: [
      {
        name: "children",
        type: "React.ReactNode",
        required: true,
        description: "Content visible only to screen readers.",
      },
      {
        name: "as",
        type: "keyof JSX.IntrinsicElements",
        required: false,
        defaultValue: '"span"',
        description: "HTML element to render.",
      },
    ],
    examples: [
      {
        title: "Screen reader text",
        code: `<button>\n  <HeartIcon />\n  <VisuallyHidden>Like this post</VisuallyHidden>\n</button>`,
      },
    ],
    accessibility: [
      "Uses CSS clip-rect technique for hiding",
      "Maintains DOM presence for screen readers",
    ],
    relatedComponents: ["live-region"],
    designTokens: [],
  },
  {
    slug: "live-region",
    name: "LiveRegion",
    description:
      "ARIA live region component for announcing dynamic content changes to screen readers. Supports polite and assertive modes.",
    category: "accessibility",
    status: "built",
    importPath: "@/app/components/ui/VisuallyHidden",
    filePath: "app/components/ui/VisuallyHidden.tsx",
    tags: [
      "live-region",
      "aria-live",
      "announcement",
      "a11y",
      "dynamic",
    ],
    props: [
      {
        name: "children",
        type: "React.ReactNode",
        required: true,
        description: "Content to announce.",
      },
      {
        name: "priority",
        type: '"polite" | "assertive"',
        required: false,
        defaultValue: '"polite"',
        description:
          "Announcement priority. 'assertive' interrupts current speech.",
      },
      {
        name: "visible",
        type: "boolean",
        required: false,
        defaultValue: "false",
        description: "Whether the region content is visually visible.",
      },
    ],
    examples: [
      {
        title: "Status announcement",
        code: `<LiveRegion priority="polite">\n  {isLoading ? "Loading comments..." : \`\${count} comments loaded\`}\n</LiveRegion>`,
      },
    ],
    accessibility: [
      "Uses aria-live and aria-atomic for proper announcement behavior",
      "Polite mode waits for current speech to finish",
      "Assertive mode interrupts immediately for urgent updates",
    ],
    relatedComponents: ["visually-hidden"],
    designTokens: [],
  },
  {
    slug: "main-content",
    name: "MainContent",
    description:
      "Semantic main landmark wrapper with configurable id for skip-link targets. Ensures proper document structure for screen readers.",
    category: "accessibility",
    status: "built",
    importPath: "@/app/components/ui/MainContent",
    filePath: "app/components/ui/MainContent.tsx",
    tags: ["main", "landmark", "semantic", "a11y", "structure"],
    props: [
      {
        name: "id",
        type: "string",
        required: false,
        defaultValue: '"main-content"',
        description: "ID for skip-link targeting.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        required: true,
        description: "Page content.",
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "Main content landmark",
        code: `<MainContent id="main-content">\n  <h1>Campaign Details</h1>\n  {/* page content */}\n</MainContent>`,
      },
    ],
    accessibility: [
      "Renders semantic <main> element",
      "Provides skip-link target via id",
      "Supports role and aria-label overrides",
    ],
    relatedComponents: ["skip-link", "content-section"],
    designTokens: [],
  },
  {
    slug: "content-section",
    name: "ContentSection",
    description:
      "Semantic section landmark with accessible heading association via aria-labelledby. Used for grouping related content within a page.",
    category: "accessibility",
    status: "built",
    importPath: "@/app/components/ui/MainContent",
    filePath: "app/components/ui/MainContent.tsx",
    tags: ["section", "landmark", "semantic", "a11y", "group"],
    props: [
      {
        name: "children",
        type: "React.ReactNode",
        required: true,
        description: "Section content.",
      },
      {
        name: "label",
        type: "string",
        required: false,
        description: "Accessible name via aria-label.",
      },
      {
        name: "labelledBy",
        type: "string",
        required: false,
        description:
          "ID of the heading element to associate via aria-labelledby.",
      },
    ],
    examples: [
      {
        title: "Content section",
        code: `<ContentSection label="Campaign statistics">\n  <h2 id="stats-heading">Statistics</h2>\n  {/* stats content */}\n</ContentSection>`,
      },
    ],
    accessibility: [
      "Renders semantic <section> element",
      "Supports aria-label and aria-labelledby for accessible naming",
    ],
    relatedComponents: ["main-content"],
    designTokens: [],
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Retrieve a single component entry by its slug.
 * Returns undefined if no component matches.
 */
export function getComponentBySlug(
  slug: string
): ComponentRegistryEntry | undefined {
  return COMPONENT_REGISTRY.find((c) => c.slug === slug);
}

/**
 * Get all components within a given category.
 */
export function getComponentsByCategory(
  category: ComponentCategory
): ComponentRegistryEntry[] {
  return COMPONENT_REGISTRY.filter((c) => c.category === category);
}

/**
 * Get all components with status "built".
 */
export function getBuiltComponents(): ComponentRegistryEntry[] {
  return COMPONENT_REGISTRY.filter((c) => c.status === "built");
}

/**
 * Get all components with status "planned".
 */
export function getPlannedComponents(): ComponentRegistryEntry[] {
  return COMPONENT_REGISTRY.filter((c) => c.status === "planned");
}

/**
 * Search components by fuzzy-matching a query string against
 * name, description, tags, and category fields.
 *
 * Matching is case-insensitive and supports partial matches.
 * Results are ranked by relevance:
 *   1. Exact name match
 *   2. Name starts with query
 *   3. Name contains query
 *   4. Tag exact match
 *   5. Category match
 *   6. Description contains query
 */
export function searchComponents(
  query: string
): ComponentRegistryEntry[] {
  if (!query.trim()) return COMPONENT_REGISTRY;

  const normalizedQuery = query.toLowerCase().trim();
  const tokens = normalizedQuery.split(/\s+/);

  type ScoredEntry = {
    entry: ComponentRegistryEntry;
    score: number;
  };

  const scored: ScoredEntry[] = COMPONENT_REGISTRY.map((entry) => {
    const name = entry.name.toLowerCase();
    const slug = entry.slug.toLowerCase();
    const description = entry.description.toLowerCase();
    const category = entry.category.toLowerCase();
    const tags = entry.tags.map((t) => t.toLowerCase());

    let score = 0;

    // Exact name or slug match (highest priority)
    if (name === normalizedQuery || slug === normalizedQuery) {
      score += 100;
    }
    // Name starts with query
    else if (name.startsWith(normalizedQuery) || slug.startsWith(normalizedQuery)) {
      score += 80;
    }
    // Name contains query
    else if (name.includes(normalizedQuery) || slug.includes(normalizedQuery)) {
      score += 60;
    }

    // Tag exact match
    if (tags.includes(normalizedQuery)) {
      score += 50;
    }

    // Category match
    if (category === normalizedQuery || category.includes(normalizedQuery)) {
      score += 40;
    }

    // Check individual tokens against tags and description
    for (const token of tokens) {
      if (token.length < 2) continue;

      // Tag partial match
      const tagMatch = tags.some(
        (tag) => tag.includes(token) || token.includes(tag)
      );
      if (tagMatch) score += 20;

      // Description contains token
      if (description.includes(token)) score += 10;

      // Name contains token
      if (name.includes(token)) score += 15;
    }

    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}
