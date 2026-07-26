# FundBrave MVP — Launch Checklist

Work top-to-bottom. Nothing here touches real money until the **Mainnet cutover** section.

## 1. Accounts & keys (get these first)
- [ ] **Privy** app created → `PRIVY_APP_ID`, `PRIVY_APP_SECRET` (api) + `NEXT_PUBLIC_PRIVY_APP_ID` (web). Enable email + Google login; enable EVM embedded wallets.
- [ ] **WalletConnect Cloud** project → `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (web).
- [ ] **Moralis** Streams API key + webhook secret → `MORALIS_API_KEY`, `MORALIS_STREAM_SECRET`, and a public `WEBHOOK_BASE_URL` (ngrok/cloudflared in dev; real domain in prod).
- [ ] **Relayer EOA** created and funded with gas on each enabled chain → `RELAYER_PRIVATE_KEY`. **Not** a Safe owner; only pays deploy/exec gas.
- [ ] **Root admin wallet** (hardware wallet strongly recommended) → its address in `ROOT_ADMIN_ADDRESS` (api); its email in `ROOT_ADMIN_EMAIL`. This wallet co-signs every withdrawal — losing it freezes all campaign funds (2-of-2 has no recovery).
- [ ] **AWS S3** bucket + IAM creds → `AWS_*`, `S3_BUCKET`, optional `S3_PUBLIC_URL` (CDN).
- [ ] **Resend** API key → `RESEND_API_KEY`, `EMAIL_FROM` (optional; emails skip silently if unset).
- [ ] Store all secrets in a manager (not committed). Rotate the relayer key if ever exposed.

## 2. Local end-to-end on testnets (default config)
- [ ] `npm install` at repo root; `cp packages/api/.env.example packages/api/.env` and fill; `cp packages/web/.env.example packages/web/.env.local`.
- [ ] `npm run mvp:db` → `npm run mvp:migrate` (creates schema incl. the phase-4 `nonce`/`deployTxHash` columns).
- [ ] `npm run mvp` → API `:4000/health` green, web `:3000` loads.
- [ ] Sign up with your `ROOT_ADMIN_EMAIL` → confirm you land with ADMIN (Admin link in header).
- [ ] Whitelist a second test email; confirm a non-whitelisted email hits the request-access gate.
- [ ] Create → publish a campaign (Base Sepolia). Confirm a Safe address appears and is identical if you check another supported chain.
- [ ] Donate test USDC/ETH via the wallet tab **and** via the QR/address tab. Confirm it appears as a donation and `raisedUsd` rises after `DONATION_CONFIRMATIONS` blocks.
- [ ] Request a withdrawal → sign with the embedded wallet → co-sign in `/admin` with the root admin wallet → confirm the Safe deploys on first withdrawal and funds land in the creator wallet; status flips to EXECUTED with an explorer link.
- [ ] Try to reject/suspend/feature from `/admin`; confirm audit-log rows via `GET /api/admin/audit-logs`.

## 3. Security & hardening
- [ ] Read `docs/SECURITY_AUDIT.md`. The MEDIUM + both LOW code findings are fixed; complete the two ops items:
  - [ ] Serve S3 media from a CDN origin (not the app origin) with `X-Content-Type-Options: nosniff`.
  - [ ] Commission an **independent** review of `packages/api/src/modules/{safe,withdrawals}` before real funds.
- [ ] Set a strict `CORS_ORIGIN` to your real web domain.
- [ ] Put the API behind HTTPS; verify the Moralis webhook signature check rejects a tampered body (flip a byte → expect 401).
- [ ] Confirm rate limits are sane for expected traffic (global 120/min; presign 30/min).
- [ ] Back up the Postgres database; set up automated backups.

## 4. Mainnet cutover (real money — do last)
- [ ] **Verify every token address** in `packages/api/src/modules/donations/tokens.config.ts` for chains 1 / 8453 / 137 / 42161 against the issuer + block explorer.
- [ ] Set `ENABLED_CHAIN_IDS=8453,1,137,42161` and `DEFAULT_CHAIN_ID=8453`; set paid/reliable mainnet RPCs (`*_RPC_URL`).
- [ ] Fund the relayer with mainnet gas on each chain; set an alert on low balance.
- [ ] Re-register the Moralis stream against mainnet chains (restarting the API with mainnet config re-syncs addresses).
- [ ] Do one **small real-money smoke test**: tiny donation → full 2-of-2 withdrawal on Base mainnet, end to end, before announcing.
- [ ] Legal: pooling and disbursing donated funds may trigger money-transmission / charity regulations depending on jurisdiction. Get counsel before public launch. *(Not legal advice.)*

## 5. Operations
- [ ] Monitoring/alerting on: API health, relayer balance, failed withdrawals (`status = FAILED`), webhook error rate, indexer lag (`ChainSyncState.lastBlock` vs head).
- [ ] Runbook for a stuck/failed withdrawal (re-request is safe — each binds to a fresh Safe nonce).
- [ ] Decide the recovery story for the 2-of-2 admin key (consider migrating to a 2-of-3 with a cold recovery key post-MVP).
