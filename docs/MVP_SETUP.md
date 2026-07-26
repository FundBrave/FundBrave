# FundBrave MVP — Dev Setup

The MVP lives in two new workspaces, `packages/web` (Next.js 16, port 3000) and `packages/api` (NestJS + Prisma, port 4000). The original `packages/frontend` / `packages/backend` are untouched reference code.

## First run

```bash
# 1. Install workspace deps
npm install

# 2. Start Postgres (Docker)
npm run mvp:db

# 3. Configure the API
cp packages/api/.env.example packages/api/.env
# fill in keys as you get them — the app boots with placeholders,
# Privy/Moralis-dependent features stay disabled until real keys exist

# 4. Configure the web app
cp packages/web/.env.example packages/web/.env.local

# 5. Create the database schema
npm run mvp:migrate

# 6. Run both apps
npm run mvp
```

Health check: `http://localhost:4000/health` · Web: `http://localhost:3000`

## Scripts (root)

| Script | Does |
|---|---|
| `npm run mvp` | web + api in parallel |
| `npm run mvp:web` / `mvp:api` | one side only |
| `npm run mvp:db` | Postgres 16 via docker compose |
| `npm run mvp:migrate` | `prisma migrate dev` in packages/api |

## Environment defaults

Testnet-first: `ENABLED_CHAIN_IDS=84532,11155111` (Base Sepolia, Sepolia). At launch switch to `8453,1,137,42161` and set mainnet RPCs. See `packages/api/.env.example` for every variable with comments.

## Build phases (see MVP_PLAN.md)

- [x] Phase 0 — scaffold
- [x] Phase 1 — Privy auth + whitelist
- [x] Phase 2 — campaigns + media + Safe address computation
- [x] Phase 3 — donations + multi-chain indexing
- [x] Phase 4 — dashboards + 2-of-2 withdrawals
- [ ] Phase 5 — admin polish + hardening + launch

### Phase 4 env additions
- `RELAYER_PRIVATE_KEY` (api) — funds Safe deployment + execTransaction gas. A funded EOA, **not** a Safe owner. Withdrawals are disabled until set.
- `RESEND_API_KEY` (api) — optional; withdrawal/invite emails are skipped silently when unset.
- Admin co-signs with their **own** wallet via WalletConnect, so the admin needs `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (web) set and the `ROOT_ADMIN_ADDRESS` (api) must match the wallet they connect.

## Known gaps from scaffold

- Font files `public/fonts/{Gilgan,Montserrat-*}.woff2` referenced by globals.css don't exist anywhere in the repo (they 404 in the original frontend too). Source them or swap to next/font.
- `packages/api` has no tests yet (`jest --passWithNoTests`).
