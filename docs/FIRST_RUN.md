# FundBrave — First Testnet Run (Base Sepolia)

Your `.env` files are already created with everything filled except the secrets.
Search each file for `>>> FILL <<<` and replace those values. Nothing here spends real money.

Wallets you'll use (three distinct addresses):
- **Creator** — your Privy embedded wallet, created automatically when you log in. No setup, no gas needed (it only signs).
- **Admin** — a wallet you control (MetaMask/etc.) whose address goes in `ROOT_ADMIN_ADDRESS`. It co-signs withdrawals off-chain, so **it needs no gas**.
- **Relayer** — a separate funded EOA whose private key goes in `RELAYER_PRIVATE_KEY`. It pays all on-chain gas. **This is the only wallet that needs Base Sepolia ETH.** It must NOT be the admin wallet.

---

## 1. Privy (5 min)
1. Create an app at https://dashboard.privy.io.
2. **Login methods:** enable **Email** (Google optional — email is enough to start).
3. **Embedded wallets:** enable, set "create on login" for users without wallets, chain type **EVM**.
4. **Allowed origins:** add `http://localhost:3000`.
5. Copy the **App ID** → `PRIVY_APP_ID` (api/.env) **and** `NEXT_PUBLIC_PRIVY_APP_ID` (web/.env.local).
6. Copy the **App Secret** → `PRIVY_APP_SECRET` (api/.env only).

## 2. Database (3 min)
1. Create a free Postgres at https://neon.tech (or Supabase).
2. Copy the connection string (Neon: include `?sslmode=require`) → `DATABASE_URL` in `packages/api/.env`.

## 3. WalletConnect
Paste your existing project id → `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `packages/web/.env.local`.

## 4. Wallets + gas
1. Put your admin wallet's **address** in `ROOT_ADMIN_ADDRESS`.
2. Put your relayer wallet's **private key** in `RELAYER_PRIVATE_KEY` (must differ from the admin wallet).
3. Fund the **relayer** with Base Sepolia ETH from a faucet (e.g. https://www.alchemy.com/faucets/base-sepolia or the Coinbase faucet). ~0.05 ETH is plenty.
4. Also grab a little Base Sepolia ETH in whatever wallet you'll **donate** from (it needs gas + the amount you donate).

---

## 5. Install & run (in your terminal, at the repo root)
```bash
npm install                       # first time only
npm run mvp:migrate               # creates the database schema
npm run mvp                       # starts API :4000 and web :3000
```
Check: open http://localhost:4000/health → should say `{"status":"ok","database":"up"}`.
If it says `database":"down"`, your `DATABASE_URL` is wrong.

Then open **http://localhost:3000**.

---

## 6. Walk the flow
1. **Sign in** → use your admin email (`okwuosahpaschal@gmail.com`). You'll get an email code. On first login you're auto-granted **ADMIN** — you'll see an "Admin" link in the header.
2. **Onboard** → pick a username.
3. **Create a campaign** → title, category, goal, description → add one image (this uses the local-disk upload fallback, no AWS needed) → **Publish**. A **campaign wallet (Safe) address** now appears on the campaign page — the same address works on every supported chain.
4. **Donate** → on the campaign page, "Pay with wallet" → connect a wallet with Base Sepolia ETH → pick **ETH** → send a small amount (e.g. 0.001). Or use the **Address / QR** tab and send from any wallet.
   - The donation appears within ~2 minutes (the indexer polls every 2 min and confirms after 3 blocks). Raised total updates automatically.
5. **Withdraw** (the 2-of-2 flow) →
   - Dashboard → your campaign → **Withdraw** → pick chain/token/amount → **Sign** (this pops your Privy embedded wallet). Status: "awaiting admin approval".
   - Go to **/admin → Withdrawals** → connect your **admin wallet** (WalletConnect) → **Approve & co-sign**.
   - The backend deploys the Safe (first withdrawal only, relayer pays gas) and executes. Status flips **APPROVED → EXECUTED** with a block-explorer link, and the funds land in your creator wallet.
6. Poke around **/admin**: Overview (stats), Campaigns (suspend/feature), Whitelist (invite a second email to test the gate).

---

## Troubleshooting
- **`database: down`** → fix `DATABASE_URL` (Neon needs `?sslmode=require`).
- **Login does nothing / console error about Privy** → App ID missing in `web/.env.local`, or `http://localhost:3000` not in Privy allowed origins.
- **Wallet tab hidden on the donate panel** → `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` not set.
- **Publish fails on image** → the local fallback needs `NODE_ENV=development` (already set in `.env`). Restart the API after editing `.env`.
- **Withdrawal stuck at APPROVED then FAILED** → relayer out of gas, or `ROOT_ADMIN_ADDRESS` doesn't match the wallet you co-signed with. The failure reason shows on the withdrawal.
- **Donation never appears** → confirm you sent to the exact Safe address on Base Sepolia (chain id 84532); check the API logs for the indexer poll.
- Any error you can't place — paste the API terminal output or browser console and I'll debug it.

When you're ready for real money, follow `docs/LAUNCH_CHECKLIST.md` §4.
