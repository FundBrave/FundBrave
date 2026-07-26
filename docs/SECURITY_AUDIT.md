# FundBrave MVP — Security Red-Team Audit

**Scope:** `packages/api` (NestJS) — auth, Safe custody, withdrawals, donations/indexing, uploads, admin.
**Method:** white-box source review (recon → data-flow tracing → adversarial verification).
**Date:** 2026-07-23 · **Reviewer:** automated red-team pass. Independent human/external audit still recommended before mainnet (see checklist).

---

## Application Profile

**Stack:** NestJS 11 + Prisma 6 + PostgreSQL; viem for EVM; Privy for auth + embedded wallets; Safe v1.4.1 multisig; Moralis Streams + RPC polling for donation detection; S3 presigned uploads; Resend email.

**Architecture:** Next.js web → REST API (`/api/*`) → Postgres. External: Privy (identity/JWKS), Moralis (webhook in), CoinGecko (price), chain RPCs (read + relayer writes), S3.

**Entry points (public):** `POST /api/auth/sync`, `GET /api/campaigns*`, `GET /api/donations/tokens`, `GET /api/campaigns/:id/{donations,breakdown,qr}`, `POST /api/webhooks/moralis`. **Authed:** users/campaigns/uploads/withdrawals. **Admin:** `/api/admin/*`.

**Auth model:** Privy ES256 JWT verified against Privy JWKS (issuer `privy.io`, audience = app id). `PrivyAuthGuard` attaches the DB user; `RegisteredGuard` requires a synced user; `AdminGuard` requires role ADMIN. Identity (email + embedded wallet) is fetched **server-to-server** from Privy, never trusted from the client.

**Trust boundaries:** anonymous → authenticated (Privy token) → registered (whitelist) → admin (env-seeded email). Relayer key + root admin address are server config, not DB.

**High-value targets:** campaign Safe balances (donated funds); the relayer key; the whitelist/admin role.

**Key paths:** `modules/safe/safe.service.ts`, `modules/withdrawals/withdrawals.service.ts`, `modules/donations/{donations,indexing,moralis-streams,webhooks.controller}.ts`, `modules/auth/*`.

---

## Findings

### [MEDIUM] Donation confirmation trusted block height without re-verifying the on-chain receipt

**Confidence:** HIGH · **CWE:** CWE-345 (Insufficient Verification of Data Authenticity) · **OWASP:** A08:2021 · **Location:** `modules/donations/donations.service.ts` (`confirmDonations`) — **FIXED**

**Description:** Webhook-sourced transfers are stored `DETECTED` and later promoted to `CONFIRMED` (incrementing `campaign.raisedUsd`). Previously promotion depended only on `blockNumber <= latest - confirmations`. It never re-checked that the transaction still existed and succeeded on-chain, so a tx delivered by the webhook but later dropped/replaced or orphaned by a reorg could still inflate a campaign's raised total.

**Data flow:** `POST /webhooks/moralis` → `recordTransfer` (DETECTED) → cron `confirmDonations` → `campaign.raisedUsd += amountUsd`.

**Attack scenario:** A reorg deeper than `DONATION_CONFIRMATIONS`, or a Moralis delivery of a pending/replaced tx, leaves a phantom donation that gets counted — inflating displayed totals and, downstream, the withdrawable perception (actual withdrawals are still balance-checked on-chain, so this is integrity/UX, not direct theft).

**Fix applied:** `confirmDonations` now takes the chain `PublicClient` and calls `isReceiptCanonical()` — it fetches the receipt, requires `status === 'success'`, and requires the receipt to be buried under `confirmations` blocks. Missing/reverted/orphaned txs stay `DETECTED` and are never counted. The RPC poller passes its client in.

**Mitigating factors:** poller-sourced ERC-20 donations already came from canonical `getLogs`; the confirmations threshold limited shallow reorgs.

---

### [LOW→resolved] Non-atomic admin approval could dispatch two executions

**Confidence:** MEDIUM · **CWE:** CWE-362 (Race Condition) · **Location:** `modules/withdrawals/withdrawals.service.ts` (`adminSign`) — **FIXED**

**Description:** `adminSign` read status, then wrote APPROVED, then fired `execute()`. Two concurrent admin submissions (double-click) could both pass the read and both trigger execution.

**Attack scenario:** Not attacker-reachable (admin-only), but a double-submit dispatched two `execTransaction`s. The second reverted on the Safe nonce (already consumed) and was marked FAILED — no double-spend, but noisy.

**Fix applied:** the transition is now an atomic conditional update (`updateMany where status = PENDING`); if it claims 0 rows the second caller is rejected. The on-chain nonce re-check in `execute()` remains as the ultimate guard.

---

### [LOW→resolved] Webhook signature compared non-constant-time

**Confidence:** MEDIUM · **CWE:** CWE-208 (Observable Timing Discrepancy) · **Location:** `modules/donations/moralis-streams.service.ts` (`verifySignature`) — **FIXED**

**Description:** The Moralis `x-signature` was compared with `===`. Replaced with a length guard + `crypto.timingSafeEqual`. Practical exploitability was low (the compared value is a keccak digest, not the secret), fixed as defense-in-depth.

---

### [LOW] Presigned uploads store client-declared content-type; bytes are unvalidated

**Confidence:** MEDIUM · **CWE:** CWE-434 (partial) · **OWASP:** A04:2021 · **Location:** `modules/upload/upload.service.ts` — **recommend hardening at serving layer**

**Description:** `presignUpload` validates `contentType` against an image/video allowlist and signs it into the PUT, and the object key is namespaced by server-side `userId` with a path-separator-free filename (no traversal). But the uploaded **bytes** aren't inspected — a user could PUT non-image bytes under an `image/*` content type.

**Why it's low:** the presigned PUT locks the Content-Type, so the object is served as `image/*`; browsers won't execute HTML/JS served as an image. Risk only materializes if content is served from the app's own origin without `X-Content-Type-Options: nosniff`.

**Proposed hardening (no code change required for MVP):** serve media from a dedicated bucket/CDN origin (not the app origin), set `X-Content-Type-Options: nosniff`, and optionally validate magic bytes in a post-upload step. Uploads are already auth-gated and rate-limited (30/min).

---

### [LOW] Reject-after-approve can desync DB status from chain

**Confidence:** MEDIUM · **CWE:** CWE-362 · **Location:** `modules/withdrawals/withdrawals.service.ts` (`adminReject`)

**Description:** `adminReject` accepts APPROVED requests. If an admin approves (execution runs async) then immediately rejects, the DB may read REJECTED while the on-chain tx already executed. **No fund impact** — withdrawals always pay the campaign creator's own wallet — but the record can misrepresent reality.

**Proposed fix (optional):** restrict reject to `PENDING` only, or guard with `updateMany where status = PENDING`.

---

### [INFO] Safe owner is pinned at publish time

**Confidence:** HIGH · **Location:** `modules/campaigns/campaigns.service.ts` (`publish`), `modules/safe/safe.service.ts`

The 2-of-2 owner set is `[creatorWalletAtPublish, rootAdmin]`. Withdrawal signatures are verified against the creator's **current** wallet. Privy embedded wallet addresses are stable, so these coincide; if a creator's wallet ever changed, execution would simply revert (signature not from an owner) — a failure, not a loss. Consider persisting the owner address on the campaign for auditability.

---

### [INFO] Token allowlist addresses require manual verification before mainnet

**Location:** `modules/donations/tokens.config.ts` (already flagged in-file)

A wrong token address means real donations are ignored (counted `EXCLUDED`) or a spoof token is counted. Verify every mainnet address against the issuer/explorer before enabling chains 1/8453/137/42161.

---

## Positive Observations

- **No private keys at rest.** Custody moved entirely to Privy embedded wallets; the API never stores or decrypts user keys.
- **Server-verified identity.** Email + wallet come from Privy server-to-server; the client cannot forge whitelist/admin identity.
- **Fund destination is server-pinned.** Withdrawals always pay `user.walletAddress`; neither the creator nor the admin can redirect funds elsewhere. The 2-of-2 threshold is enforced on-chain, and `execute()` re-checks the Safe nonce to prevent replay/double-spend.
- **Spam-token protection.** Only allowlisted tokens count toward totals; USD value is frozen at receipt.
- **Idempotent ingestion.** `@@unique([chainId, txHash, logIndex])` makes duplicate webhook/poller deliveries harmless.
- **Defense in depth at the edge.** `helmet`, CORS origin allowlist with credentials, global throttling (120/min) + stricter presign limits, signature-gated webhook, draft/suspended visibility controls, strict `ValidationPipe` (whitelist + forbidNonWhitelisted).

---

## Executive Summary

**Total findings:** 0 CRITICAL, 1 MEDIUM, 3 LOW, 2 INFO.
**Overall residual risk (after fixes):** LOW–MEDIUM for an MVP, contingent on the launch checklist (key management, token-address verification, external review).

### Top 3 risks
1. **Donation total integrity** under reorg/dropped-tx (MEDIUM) — *fixed* via on-chain receipt re-verification.
2. **Admin approval race** (LOW) — *fixed* via atomic status claim.
3. **Upload serving hygiene** (LOW) — serve media off-origin with `nosniff`.

### Immediate actions
1. ✅ Applied: receipt re-verification, atomic approval, constant-time webhook compare.
2. Serve uploaded media from a separate CDN origin with `X-Content-Type-Options: nosniff`.
3. Before mainnet: verify all token addresses, secure the relayer + root-admin keys (HSM/hardware), and commission an independent audit of `safe` + `withdrawals`.

### Core security property (verified)
An attacker — including a malicious campaign creator or the admin acting alone — cannot move campaign funds to an address they choose. Withdrawals require both owners' signatures on a transaction whose recipient is fixed server-side to the campaign creator's own wallet, enforced by the Safe on-chain.
