# FundBrave

Decentralized fundraising platform built with blockchain, DeFi, and AI.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: NestJS, Prisma, PostgreSQL
- **Contracts**: Hardhat, Solidity
- **AI Service**: Python ML

## Project Structure

```
packages/
├── frontend/    # Next.js App Router (app/ directory)
├── backend/     # NestJS API + Prisma ORM
├── contracts/   # Hardhat smart contracts
├── ai-service/  # Python ML service
└── shared/      # Shared types & utilities
```

## Key Commands

```bash
npm run dev          # Start all services
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run test         # Run tests
npm run type-check   # TypeScript validation
```

## Frontend Structure

```
app/
├── auth/            # Login, signup, password reset
├── campaigns/       # Campaign pages + donation flow
├── community/       # Social features
├── onboarding/      # User onboarding flow
├── profile/         # User profiles
├── components/      # Shared UI components
│   ├── ui/          # Base UI (Button, Input, Modal, etc.)
│   ├── auth/        # Auth-specific components
│   ├── campaigns/   # Campaign cards, stats, forms
│   ├── community/   # Posts, comments, social
│   ├── profile/     # Profile sections
│   └── onboarding/  # Onboarding steps
├── provider/        # Context providers
└── types/           # TypeScript interfaces
```

## Styling Conventions

- Use CSS variables from `globals.css` for colors
- Border standard: `border-white/10`
- Components use `class-variance-authority` for variants
- Animation: GSAP and Motion library

## Key Dependencies

- `lucide-react` - Icons
- `class-variance-authority` - Component variants
- `zod` - Schema validation
- `next-auth` - Authentication
- `canvas-confetti` - Celebration effects

## Agent Workflow

FundBrave uses a structured agent workflow for feature development:

### Implementation Flow

```
1. PPR (Plan)
   ↓
2. Senior Frontend Engineer (Implement)
   ↓
3. PPR (Product Review)
```

### Agent Responsibilities

| Agent | Role | Responsibilities |
|-------|------|------------------|
| **principal-product-architect (PPR)** | Plan + Review | Feature planning, UX specs, product reviews, design system health |
| **senior-frontend-engineer** | Implement + Technical Review | Own implementation, architecture decisions, code quality |
| **react-animation-architect** | Animation Implementation | GSAP/Motion animations, micro-interactions |
| **figma-css-implementer** | Design-to-Code | Pixel-perfect CSS from Figma specs |
| **api-integration** | Full-Stack Features | GraphQL queries, resolvers, type safety |
| **mobile-first-enforcer** | Quality Gate | Final mobile audit (must score 9.0+) |

### Workflow Rules

1. **PPR initiates** feature work by reading PRODUCT_SPEC.md and creating implementation plan
2. **Senior Frontend Engineer implements** the feature, making technical decisions
3. **PPR reviews** completed work for product/UX alignment
4. **Mobile-first-enforcer** runs final audit before merge

### When to Use Each Agent

- **New feature from spec** → PPR (plan) → Senior Frontend (implement) → PPR (review)
- **Bug fix** → react-nextjs-debugger
- **Animation work** → react-animation-architect
- **Figma implementation** → figma-css-implementer
- **API/GraphQL work** → api-integration
- **Code review only** → senior-frontend-engineer
- **Product/UX review** → principal-product-architect

### Product Specification

All features are documented in `packages/frontend/docs/PRODUCT_SPEC.md` (v2.1.0)
