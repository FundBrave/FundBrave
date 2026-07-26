# FundBrave MVP Plan — "Start Small, Scale Later"

**Version:** 1.0 · **Date:** 2026-07-22
**Decisions locked:** Privy embedded wallets · Safe 2-of-2 per campaign · Base + Ethereum + Polygon + Arbitrum · Fresh MVP packages inside this monorepo

---

## 1. Scope

### In scope
- Whitelisted signup via **email or Google** → Privy embedded EVM wallet (user-controlled, exportable, server never sees the key)
- Campaign creation: title, description, goal amount, category, optional deadline, photos + videos
- Per-campaign **Safe 2-of-2 smart account** (creator + root admin) as the donation wallet — same address on all 4 chains
- Public campaign listing with **search, filter, category**
- Donations via **WalletConnect**, **copy address**, or **QR code**, on any supported chain, in native token or allowlisted ERC-20s
- Backend **multi-chain donation detection** → convert to USD → display cumulative "total raised (USDC-equivalent)"
- **User dashboard**: my campaigns, raised totals, withdrawal requests, wallet, settings
- **Root admin dashboard**: whitelist management, campaign moderation, withdrawal co-approval
- **Withdrawals**: creator requests → both creator and admin sign the Safe transaction → funds move to creator wallet

### Explicitly out of scope (delete from MVP, keep in main branch)
Staking pools, ImpactDAO, wealth-building/stock purchases, FBT token + vesting + treasury, DAO voting/proposals, bridge/CCTP/Wormhole, social feed (posts/likes/reposts/hashtags), messenger, leaderboard, trending, AI service, community pages, endowments, milestones (v1.1 candidate), tips/impact previews.

---

## 2. What Exists Today → Reuse Map

The current monorepo is a full-featured platform. Roughly **30–40% ports directly** into the MVP.

| Existing asset | Location | MVP action |
|---|---|---|
| Email/password + Google OAuth + OTP + sessions | `backend/src/modules/auth` | **Adapt** — keep account auth; **replace** server-side wallet generation (`ethers.Wallet.createRandom` + AES-256-GCM storage in `auth.service.ts`) with Privy |
| Fundraiser CRUD + resolvers | `backend/src/modules/fundraisers` | **Adapt** — drop `onChainId`/`txHash`/staking fields; campaign creation becomes DB + Safe address, no factory contract |
| Donations module | `backend/src/modules/donations` | **Adapt** — donations come from transfer indexing, not contract events |
| Multi-chain provider config (Sepolia, Polygon, Arbitrum, Base, Base Sepolia) | `backend/src/modules/blockchain/config/deployments.ts`, `provider.service.ts` | **Reuse** — add Ethereum mainnet entry |
| Indexer skeleton (cron + per-chain providers + `BlockchainSync` checkpoints) | `backend/src/modules/blockchain/indexer.service.ts` | **Rewrite target** — watch Safe addresses for transfers instead of contract events |
| S3 upload (presigned URLs) | `backend/src/modules/upload` | **Reuse as-is** for photos/videos |
| Email (nodemailer/Resend) | `backend/src/modules/email` | **Reuse** — invites, receipts, withdrawal notifications |
| QR generation (`qrcode` dep) | backend | **Reuse** for donation QR |
| Campaign UI: `CampaignCard`, `CategorySidebar`, `MobileCategoryFilter`, `view/*`, `donate/*` (ChainSelector, CryptoSelector, WalletConnection, preset amounts) | `frontend/app/components/campaigns` | **Port** — drop `stake/*`, TipSlider, DonationImpactPreview |
| Auth pages + components | `frontend/app/auth`, `components/auth` | **Port** — rewire to Privy |
| Dashboards (creator/donor) | `frontend/app/dashboard` | **Port + trim** |
| UI kit, CVA variants, GSAP/Motion, globals.css | `frontend/app/components/ui` | **Reuse as-is** |
| wagmi/viem/RainbowKit setup | frontend deps | **Reuse** for donor WalletConnect flow |
| Prisma schema | `backend/prisma/schema.prisma` (60+ models) | **Rewrite** — MVP needs ~10 models (§5) |
| Solidity contracts (Fundraiser, factories, pools, adapters…) | `packages/contracts` | **Not needed** — Safe replaces all custody contracts. Keep package dormant |

**Gaps found during review:** no admin/role field anywhere in the schema, no whitelist/invite concept, and `packages/frontend/docs/PRODUCT_SPEC.md` referenced by CLAUDE.md doesn't exist. All three are new builds.

---

## 3. Architecture

```
packages/
├── web/          # NEW Next.js 16 app (port components from frontend/)
├── api/          # NEW NestJS app (port modules from backend/)
├── frontend/     # existing full app (untouched, reference)
├── backend/      # existing full app (untouched, reference)
└── shared/       # trimmed shared types
```

```
                    ┌─────────────┐
  email/Google ───▶ │   Privy     │──▶ embedded wallet (user-controlled, exportable)
                    └─────┬───────┘
                          │ auth token
┌──────────┐        ┌─────▼───────┐        ┌──────────────────┐
│ Next.js  │ ─────▶ │  NestJS API │ ─────▶ │ Postgres (Prisma)│
│  (web)   │        │   (api)     │        └──────────────────┘
└────┬─────┘        └─────┬───────┘
     │ donate              │ watch Safe addresses (4 chains)
     ▼                     ▼
 WalletConnect      Moralis Streams (webhooks) + RPC polling fallback
 QR / copy addr            │
     │              price via CoinGecko ──▶ USD totals
     ▼
 Safe 2-of-2 per campaign (same address on Base/Eth/Polygon/Arbitrum)
     │
     └── withdraw: creator signs (Privy) + admin signs → execTransaction → creator wallet
```

### 3.1 Auth + user wallets — Privy
- Privy handles email OTP + Google OAuth and provisions a self-custodial embedded wallet per user. Keys are sharded (TEE/MPC); Privy and FundBrave never see the private key; users can **export the key** from the React SDK — satisfies "controlled only by the user."
- Free tier: 50K signatures + $1M monthly volume — more than enough for MVP.
- Backend verifies Privy access tokens (JWT) → maps to `User` row. Keep existing session/guard structure; delete password-hash, OTP, 2FA, and encrypted-key columns (Privy owns that surface).
- **Whitelist gate:** after Privy auth, API checks email against `WhitelistEntry`; non-whitelisted users see a "request access" screen. Admin adds/removes entries in the dashboard (optionally invite emails via existing email module).

### 3.2 Campaign wallets — Safe 2-of-2
- On campaign creation, compute a **counterfactual Safe address** (Safe Protocol Kit, CREATE2 with owners = [creatorWallet, rootAdminWallet], threshold = 2, fixed saltNonce = campaign UUID hash). Canonical Safe v1.4.1 factories exist on all 4 chains → **identical address on every chain, zero deployment gas up front**. Donations can arrive before the Safe is ever deployed.
- On first withdrawal per chain, deploy the Safe on that chain (platform relayer pays gas, ~cents on L2s), then `execTransaction` with both signatures.
- Neither creator nor admin can move funds alone — enforced cryptographically on-chain, not by policy.
- Root admin key: a dedicated admin EOA (hardware wallet recommended) whose address is config, not DB.

### 3.3 Donation detection (multi-chain)
- **Primary: Moralis Streams** — one stream, all 4 chains, up to 1M watched addresses; webhook fires on native + ERC-20 transfers to any campaign Safe address, with enriched payloads (token symbol, decimals). Verify webhook signatures; require N confirmations before marking `CONFIRMED`.
- **Fallback/reconciliation:** cron job (reuse indexer skeleton + `BlockchainSync` checkpoints) polls token balances/transfer logs per chain per address to catch anything missed.
- **Token allowlist per chain** (USDC, USDT, DAI, WETH + native ETH/POL) — critical to prevent spam/scam tokens inflating "total raised." Non-allowlisted transfers are stored but excluded from totals.
- **USD valuation:** price at time of receipt via CoinGecko (cached in `TokenPrice`, 60s TTL). Each `Donation` stores `amountUsd` frozen at receipt; campaign `raisedUsd` = sum of confirmed donations. Display as "$X raised (USDC-equivalent)."
- Donor attribution: if the sending address belongs to a logged-in user's wallet → link `donorId`; otherwise anonymous address donation. Optional pre-donation "intent" record (user clicks donate while logged in) improves matching.

### 3.4 Donation UX (campaign page)
1. **WalletConnect / injected wallet** (wagmi + RainbowKit, already in the stack): pick chain → pick token → preset/custom amount → send tx directly to Safe address.
2. **Copy address** with prominent multi-chain notice ("same address on Base, Ethereum, Polygon, Arbitrum — send only listed tokens").
3. **QR code**: EIP-681 payment URI when chain+token selected (mobile wallets pre-fill), plain address QR otherwise.
- Show per-chain breakdown of raised funds + link every donation to a block explorer tx — on-chain transparency is the #1 trust feature on Giveth/Endaoment-class platforms.

### 3.5 Withdrawals
1. Creator opens dashboard → "Withdraw" → picks chain(s) + amount/tokens → signs the Safe transaction hash with their Privy wallet (client-side).
2. Admin sees pending request in admin dashboard → reviews → signs with admin wallet.
3. Relayer deploys Safe on that chain if not yet deployed, then submits `execTransaction` with both signatures → funds land in creator's wallet address.
4. Both parties notified by email; request states: `PENDING → APPROVED → EXECUTED / REJECTED / FAILED`.

### 3.6 Media
- Reuse S3 presigned-upload module. Images ≤10MB (webp-converted), videos ≤200MB MP4 (cap count: e.g. 8 photos + 2 videos per campaign). Serve via CloudFront. Basic server-side MIME validation.

---

## 4. MVP Feature Spec (condensed)

| Area | Requirements |
|---|---|
| Signup | Privy modal (email OTP / Google). Whitelist check. Short onboarding: username, display name, avatar |
| Campaign create | Multi-step form: basics (title ≤80, description rich-text ≤10k, category from fixed list, goal USD, optional deadline) → media → review → publish. Draft state supported |
| Campaign list | Grid of cards (image, title, category, progress bar, raised/goal, days left). Search (title/description, Postgres FTS), category filter, sort (newest, most raised, ending soon). Pagination |
| Campaign page | Gallery, story, raised total + per-chain/per-token breakdown, donor list (address or username, amount, time, explorer link), donate panel (§3.4), share buttons |
| User dashboard | My campaigns (stats, edit, updates), withdrawals (request + status), donations I made, wallet (address, QR, export key via Privy), settings |
| Admin dashboard | Whitelist CRUD + invites, campaign list (feature/hide/suspend), pending withdrawals (review + co-sign), platform stats, audit log |
| Notifications | Email only for MVP: invite, campaign published, donation received (daily digest), withdrawal status |

---

## 5. Data Model (new `api` Prisma schema, ~10 models)

```prisma
enum Role { USER ADMIN }

model User {
  id            String  @id @default(uuid())
  privyDid      String  @unique        // Privy user id
  email         String  @unique
  walletAddress String  @unique        // Privy embedded wallet
  username      String? @unique
  displayName   String?
  avatarUrl     String?
  bio           String?
  role          Role    @default(USER)
  isSuspended   Boolean @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  campaigns     Campaign[]
  donations     Donation[]
}

model WhitelistEntry {
  id        String   @id @default(uuid())
  email     String   @unique
  invitedBy String?
  usedAt    DateTime?
  createdAt DateTime @default(now())
}

enum CampaignStatus { DRAFT ACTIVE COMPLETED SUSPENDED }

model Campaign {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  description String   @db.Text
  category    String
  goalUsd     Decimal  @db.Decimal(18, 2)
  raisedUsd   Decimal  @default(0) @db.Decimal(18, 2)  // denormalized
  deadline    DateTime?
  status      CampaignStatus @default(DRAFT)
  isFeatured  Boolean  @default(false)
  safeAddress String   @unique   // counterfactual, same on all chains
  safeSalt    String              // saltNonce used for CREATE2
  creatorId   String
  creator     User     @relation(fields: [creatorId], references: [id])
  media       CampaignMedia[]
  donations   Donation[]
  withdrawals WithdrawalRequest[]
  deployments SafeDeployment[]
  donorsCount Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([status, category])
}

model CampaignMedia {
  id         String @id @default(uuid())
  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  type       String   // IMAGE | VIDEO
  url        String
  order      Int      @default(0)
}

model SafeDeployment {         // which chains the Safe is actually deployed on
  id         String @id @default(uuid())
  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id])
  chainId    Int
  txHash     String
  deployedAt DateTime @default(now())
  @@unique([campaignId, chainId])
}

enum DonationStatus { DETECTED CONFIRMED EXCLUDED }   // EXCLUDED = non-allowlisted token

model Donation {
  id           String  @id @default(uuid())
  campaignId   String
  campaign     Campaign @relation(fields: [campaignId], references: [id])
  chainId      Int
  txHash       String
  logIndex     Int?
  tokenAddress String?           // null = native
  tokenSymbol  String
  amountRaw    String            // wei, as string
  amountUsd    Decimal @db.Decimal(18, 2)   // frozen at receipt
  priceUsd     Decimal @db.Decimal(18, 8)
  donorAddress String
  donorId      String?
  donor        User?   @relation(fields: [donorId], references: [id])
  status       DonationStatus @default(DETECTED)
  blockNumber  Int
  createdAt    DateTime @default(now())
  @@unique([chainId, txHash, logIndex])
  @@index([campaignId, status])
  @@index([donorAddress])
}

enum WithdrawalStatus { PENDING APPROVED EXECUTED REJECTED FAILED }

model WithdrawalRequest {
  id               String @id @default(uuid())
  campaignId       String
  campaign         Campaign @relation(fields: [campaignId], references: [id])
  chainId          Int
  tokenAddress     String?
  amountRaw        String
  toAddress        String            // creator wallet
  safeTxHash       String?
  creatorSignature String?
  adminSignature   String?
  execTxHash       String?
  status           WithdrawalStatus @default(PENDING)
  rejectionReason  String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model TokenPrice {              // price cache
  id        String @id @default(uuid())
  symbol    String
  usd       Decimal @db.Decimal(18, 8)
  fetchedAt DateTime @default(now())
  @@index([symbol, fetchedAt])
}

model ChainSyncState {          // per chain+address polling checkpoint (fallback indexer)
  id          String @id @default(uuid())
  chainId     Int
  lastBlock   Int
  updatedAt   DateTime @updatedAt
  @@unique([chainId])
}

model AdminAuditLog {
  id        String @id @default(uuid())
  adminId   String
  action    String
  targetId  String?
  metadata  Json?
  createdAt DateTime @default(now())
}
```

---

## 6. Build Phases

### Phase 0 — Scaffold (2–3 days)
Create `packages/web` (Next.js 16, port UI kit + globals.css + providers) and `packages/api` (NestJS, port config/prisma/common). New Prisma schema + migration. CI: lint/type-check/test wired into root scripts.

### Phase 1 — Auth + whitelist (3–5 days)
Privy React SDK in `web`; token verification guard in `api`; `User` upsert on first login; whitelist gate + request-access page; onboarding (username/avatar); admin role via env-seeded email.

### Phase 2 — Campaigns (1 week)
Create flow (multi-step form, drafts, S3 media), counterfactual Safe address computation on publish, listing page (search/filter/category/sort, Postgres FTS), campaign detail page (minus live donation data).

### Phase 3 — Donations + indexing (1–1.5 weeks)
Moralis Streams integration (register addresses on publish, webhook endpoint + signature verification), token allowlist config, CoinGecko pricing + `TokenPrice` cache, donation confirmation + `raisedUsd` rollup, fallback polling cron, donate panel (WalletConnect via wagmi, copy address, QR/EIP-681), donor list with explorer links, testnet E2E (Base Sepolia + Sepolia — chain config already supports both).

### Phase 4 — Dashboards + withdrawals (1–1.5 weeks)
User dashboard (campaigns, donations, wallet, key export). Withdrawal flow: Safe Protocol Kit — creator signature via Privy signer, admin dashboard co-sign, relayer service (deploy-if-needed + exec), email notifications, full state machine.

### Phase 5 — Admin + hardening + launch (1 week)
Admin dashboard (whitelist, moderation, stats, audit log). Rate limiting (reuse throttler), helmet/CORS, webhook replay protection, media validation. Full testnet dress rehearsal → mainnet config flip (Base, Ethereum, Polygon, Arbitrum) with real-money smoke test. **Recommended: external review or at minimum the repo's `security-redteam` audit before mainnet.**

**Total: ~6–8 weeks** for one engineer + this agent workflow (PPR plan → senior-frontend implement → PPR review → mobile-first audit, per CLAUDE.md).

---

## 7. Best Practices Adopted from Research

1. **Never hold user keys server-side** — the industry pattern in 2026 is consumer embedded wallets (Privy/Dynamic) for users + policy-controlled signers only for platform/treasury operations. The existing AES-encrypted-key-in-Postgres design is a liability magnet; Privy removes it.
2. **Cryptographic co-approval over policy co-approval** — Safe's on-chain threshold beats a backend that "promises" to require two approvals.
3. **Counterfactual deployment** — compute addresses up front, deploy lazily per chain only when withdrawing; saves gas across 4 chains × N campaigns.
4. **Spam-token filtering** — allowlist valuation prevents worthless-token inflation of raised totals (a real attack on donation platforms).
5. **Webhooks + reconciliation polling** — never rely on a single detection path for money; Moralis Streams for latency, cron polling for completeness.
6. **Freeze USD value at receipt** — avoids totals fluctuating with market prices and simplifies receipts/accounting.
7. **Radical transparency** — per-donation explorer links and per-chain breakdowns are the differentiating trust features of Giveth/Endaoment-class platforms.
8. **Testnet-first dress rehearsal** — full E2E on Base Sepolia before any mainnet exposure.
9. **v1.1 candidates** (deliberately deferred): embeddable donation widget, email receipts w/ tax info, campaign updates feed, fiat on-ramp (Privy supports), auto-swap donations to USDC, milestones.

## 8. Risks & Open Questions

- **Privy vendor lock-in** — mitigated by user key export; acceptable for MVP.
- **Cross-chain address caveat** — Safe address is identical on the 4 supported chains, but donors sending on *unsupported* chains (e.g. BSC) send to an address you don't control there. UI must state supported chains loudly.
- **Admin key loss = frozen funds** (2-of-2 has no fallback). Use a hardware wallet + documented backup; consider 2-of-3 with a platform recovery key in cold storage as a v1.1 upgrade.
- **Compliance** — pooling and disbursing donated funds may have money-transmission/charity-law implications depending on jurisdiction. Not legal advice; consult a lawyer before mainnet.
- **Moralis pricing/limits** — free tier fine for MVP scale; reconciliation cron is the safety net if streams degrade.
- Open: fixed category list contents; per-campaign or global withdrawal minimums; whether donors need accounts at all (recommend: no login required to donate).
