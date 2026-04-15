# FundBrave Product Specification

**Version:** 2.1.0
**Last Updated:** January 10, 2026
**Status:** Living Document
**Authors:** Principal Product Architecture Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas](#2-user-personas)
3. [Feature Specifications](#3-feature-specifications)
   - 3.1 [Settings Page](#31-settings-page)
   - 3.2 [Wallet Management](#32-wallet-management)
   - 3.3 [Notifications System](#33-notifications-system)
   - 3.4 [Search & Discovery](#34-search--discovery)
   - 3.5 [Campaign Creation](#35-campaign-creation)
   - 3.6 [Bookmarks & Collections](#36-bookmarks--collections)
   - 3.7 [Enhanced Onboarding](#37-enhanced-onboarding)
   - 3.8 [Trust & Safety](#38-trust--safety)
   - 3.9 [Social Features](#39-social-features)
   - 3.10 [Mobile-First Patterns](#310-mobile-first-patterns)
   - 3.11 [Accessibility & i18n](#311-accessibility--i18n)
   - 3.12 [Component Specifications](#312-component-specifications)
   - 3.13 [404 Page Handling](#313-404-page-handling)
   - 3.14 [Donation + Staking Flow](#314-donation--staking-flow)
   - 3.15 [Web3 Chat](#315-web3-chat)
4. [User Flows](#4-user-flows)
5. [TypeScript Interfaces](#5-typescript-interfaces)
6. [Error Messages & Validation](#6-error-messages--validation)
7. [Animation Specifications](#7-animation-specifications)
8. [Competitive Analysis Summary](#8-competitive-analysis-summary)
9. [Implementation Priority Matrix](#9-implementation-priority-matrix)
10. [Open Questions](#10-open-questions)

---

## 1. Executive Summary

### 1.1 Product Vision

FundBrave is a decentralized fundraising platform that combines the trust mechanisms of blockchain technology with the engagement patterns of modern social platforms. Our mission is to democratize fundraising by removing intermediaries, reducing fees, and building transparent, community-driven campaigns.

### 1.2 Core Value Propositions

| Stakeholder | Value Proposition |
|-------------|-------------------|
| **Campaign Creators** | Lower fees (2-5% vs 8-15% traditional), global reach, transparent fund tracking, community engagement tools |
| **Donors** | Verifiable impact, direct creator connection, multi-chain flexibility, tax documentation |
| **Community** | Social discovery, trust signals, collective impact visualization |

### 1.3 Technical Foundation

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Animation:** GSAP + Motion library for micro-interactions
- **State:** React Context + Server Components where appropriate
- **Styling:** CSS Variables with oklch color space, class-variance-authority for variants
- **Authentication:** NextAuth.js with Web3 wallet integration

### 1.4 Design Principles

1. **Trust Through Transparency:** Every transaction visible, every fund movement trackable
2. **Progressive Disclosure:** Complex Web3 concepts revealed gradually
3. **Mobile-First, Desktop-Enhanced:** Touch-optimized with keyboard power-user features
4. **Emotional Design:** Celebrate milestones, acknowledge contributions, build community
5. **Performance is UX:** Sub-100ms interactions, optimistic updates, skeleton states

### 1.5 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Onboarding Completion | >75% | Users completing all steps |
| Campaign Creation | >60% | Started to published ratio |
| Donation Conversion | >8% | Visitors to donors |
| Return Donor Rate | >35% | Donors making 2+ donations |
| Mobile Usage | >55% | Sessions from mobile devices |
| Accessibility Score | 100 | Lighthouse accessibility audit |

---

## 2. User Personas

### 2.1 Persona: Maya - The First-Time Campaign Creator

**Demographics:**
- Age: 28
- Location: Austin, TX
- Tech Savvy: Moderate (uses Venmo, not crypto)
- Platform: Primarily mobile (iPhone)

**Background:**
Maya is a veterinary technician organizing emergency surgery funding for rescued animals at her local shelter. She has never used cryptocurrency but heard FundBrave has lower fees.

**Jobs to Be Done:**
1. Create a compelling campaign in under 15 minutes
2. Share campaign easily on Instagram and TikTok
3. Track donations without understanding blockchain
4. Withdraw funds to her bank account
5. Thank donors personally

**Pain Points:**
- Intimidated by crypto terminology
- Worried about legitimacy perception
- Needs mobile-friendly creation flow
- Concerned about tax implications

**Success Criteria:**
- Completes campaign setup on mobile
- Receives first donation within 48 hours
- Successfully withdraws to fiat

**Quote:** "I just want to help these animals. I don't care how the money gets here, as long as it does."

---

### 2.2 Persona: David - The Crypto-Native Power Donor

**Demographics:**
- Age: 34
- Location: Singapore
- Tech Savvy: Expert (DeFi user, multiple wallets)
- Platform: Desktop primary, mobile for quick actions

**Background:**
David is a software engineer who made early crypto investments. He prefers donating in crypto for tax efficiency and wants to support causes globally without currency conversion fees.

**Jobs to Be Done:**
1. Discover high-impact campaigns quickly
2. Donate from multiple wallets/chains
3. Track donation history and tax documentation
4. Verify campaign legitimacy before donating
5. Share successful campaigns with his network

**Pain Points:**
- Frustrated by platforms that don't support his preferred chains
- Wants detailed transaction history
- Needs ENS/wallet address display options
- Privacy concerns with donation visibility

**Success Criteria:**
- Multi-chain donation in under 60 seconds
- Exportable tax documentation
- Portfolio view of all donations

**Quote:** "I want to see exactly where my ETH goes. Show me the wallet, show me the transactions."

---

### 2.3 Persona: Sarah - The Community Organizer

**Demographics:**
- Age: 42
- Location: Chicago, IL
- Tech Savvy: Moderate
- Platform: Desktop for management, mobile for updates

**Background:**
Sarah runs a neighborhood mutual aid network. She creates multiple campaigns per year for different community needs and coordinates with a team of volunteers.

**Jobs to Be Done:**
1. Manage multiple active campaigns simultaneously
2. Delegate campaign management to team members
3. Send bulk updates to donors
4. Generate reports for community meetings
5. Build long-term donor relationships

**Pain Points:**
- Needs team collaboration features
- Wants recurring donation options
- Requires detailed analytics
- Needs offline capability for community events

**Success Criteria:**
- Dashboard showing all campaign metrics
- Team member invitation flow
- Exportable donor communications

**Quote:** "Our community trusts us because we show them every dollar. That transparency is everything."

---

### 2.4 Persona: Alex - The Skeptical First-Time Donor

**Demographics:**
- Age: 52
- Location: Denver, CO
- Tech Savvy: Low-Moderate
- Platform: Desktop (large screen preference)

**Background:**
Alex wants to support their niece's school fundraiser but has never used cryptocurrency and is suspicious of online giving after seeing news about fraud.

**Jobs to Be Done:**
1. Verify the campaign is legitimate
2. Donate without creating an account
3. Pay with credit card (not crypto)
4. Get a receipt for records
5. See that their donation was received

**Pain Points:**
- Doesn't understand or trust blockchain
- Wants human customer support option
- Needs clear fee disclosure
- Worries about data privacy

**Success Criteria:**
- Guest checkout donation
- Immediate email confirmation
- Visible verification badges on campaign

**Quote:** "I want to help, but I need to know this is real and my money actually gets there."

---

### 2.5 Persona: Jordan - The Social Impact Influencer

**Demographics:**
- Age: 25
- Location: Los Angeles, CA
- Tech Savvy: High (creator economy native)
- Platform: Mobile-first, multi-platform sharing

**Background:**
Jordan is a content creator with 50K followers who regularly promotes causes. They want tools to track their fundraising impact and showcase their philanthropic influence.

**Jobs to Be Done:**
1. Discover trending campaigns to amplify
2. Track referral impact ("I raised $X")
3. Create shareable content from campaign updates
4. Build a public giving portfolio
5. Earn recognition for fundraising efforts

**Pain Points:**
- Needs embeddable widgets for their website
- Wants attribution tracking for shared links
- Requires beautiful shareable graphics
- Needs leaderboard/gamification features

**Success Criteria:**
- Referral tracking dashboard
- Auto-generated share cards
- Public impact profile page

**Quote:** "My followers trust my recommendations. Show me campaigns worth amplifying."

---

## 3. Feature Specifications

### 3.1 Settings Page

The Settings page is the control center for user preferences, account management, and platform configuration.

#### 3.1.1 Information Architecture

```
/settings
  /profile          - Public profile information
  /account          - Email, password, connected accounts
  /wallet           - Wallet connections and preferences
  /notifications    - Notification preferences
  /privacy          - Privacy and data controls
  /appearance       - Theme, language, accessibility
  /billing          - Payment methods, invoices, tax docs
  /security         - 2FA, sessions, login history
  /advanced         - Developer options, data export
```

#### 3.1.2 Profile Settings Section

**Route:** `/settings/profile`

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `displayName` | text | 2-50 chars, no special chars except `-_` | Yes |
| `username` | text | 3-30 chars, lowercase alphanumeric + underscore, unique | Yes |
| `bio` | textarea | Max 280 chars | No |
| `avatarUrl` | image | JPG/PNG/GIF/WEBP, max 5MB, 400x400 min | No |
| `bannerUrl` | image | JPG/PNG/WEBP, max 10MB, 1500x500 min | No |
| `location` | text | Max 100 chars | No |
| `website` | url | Valid URL format | No |
| `socialLinks.twitter` | text | Valid Twitter handle | No |
| `socialLinks.instagram` | text | Valid Instagram handle | No |
| `socialLinks.linkedin` | url | Valid LinkedIn URL | No |
| `socialLinks.github` | text | Valid GitHub username | No |
| `isPublicProfile` | boolean | - | Yes (default: true) |
| `showDonationHistory` | boolean | - | Yes (default: false) |
| `showSupportedCampaigns` | boolean | - | Yes (default: true) |

**Component Structure:**
```
ProfileSettingsSection
  AvatarUploader
    - Drag/drop zone
    - Crop modal with aspect ratio lock
    - Preview states (uploading, success, error)
  BannerUploader
    - Wide format drag/drop
    - Position adjustment
  ProfileForm
    - FormInput (displayName)
    - FormInput (username) with availability check
    - FormTextarea (bio) with character counter
    - FormInput (location) with autocomplete
    - FormInput (website) with URL validation
  SocialLinksGroup
    - Platform icon + input pairs
    - Validation per platform
  VisibilityToggles
    - Toggle (isPublicProfile)
    - Toggle (showDonationHistory)
    - Toggle (showSupportedCampaigns)
  SaveButton
    - Loading state
    - Success toast
```

#### 3.1.3 Account Settings Section

**Route:** `/settings/account`

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `email` | email | Valid email, verified | Yes |
| `emailVerified` | boolean | Read-only | - |
| `password` | password | Min 8 chars, 1 upper, 1 lower, 1 number, 1 special | If email auth |
| `connectedAccounts` | array | OAuth providers | No |
| `accountStatus` | enum | active, suspended, deactivated | Read-only |
| `createdAt` | datetime | Read-only | - |
| `lastLoginAt` | datetime | Read-only | - |

**Email Change Flow:**
1. User enters new email
2. System sends verification to NEW email
3. User clicks verification link
4. Old email receives notification of change
5. 24-hour grace period to revert

**Password Change Flow:**
1. Enter current password (if password auth exists)
2. Enter new password with strength meter
3. Confirm new password
4. All sessions invalidated except current
5. Email notification sent

**Connected Accounts:**
- Google OAuth
- Apple OAuth
- Twitter/X OAuth
- Discord OAuth
- GitHub OAuth
- Wallet addresses (see Wallet section)

**Account Deletion:**
1. Click "Delete Account"
2. Modal explains consequences:
   - Active campaigns will be transferred or ended
   - Donation history anonymized but preserved for tax records
   - Cannot be undone after 30 days
3. Enter password to confirm
4. 30-day soft delete period
5. Email with reactivation link
6. Permanent deletion after 30 days

#### 3.1.4 Notification Settings Section

**Route:** `/settings/notifications`

See [Section 3.3 Notifications System](#33-notifications-system) for detailed notification types.

**Channel Configuration:**

| Channel | Options |
|---------|---------|
| Email | Instant, Daily Digest, Weekly Digest, Off |
| Push (Browser) | On/Off per category |
| Push (Mobile) | On/Off per category |
| In-App | Always on (can mark as read) |
| SMS | Critical only (optional, requires phone) |

**Notification Categories & Defaults:**

| Category | Email Default | Push Default |
|----------|---------------|--------------|
| Donations Received | Instant | On |
| Campaign Milestones | Instant | On |
| Comments & Replies | Daily Digest | Off |
| New Followers | Weekly Digest | Off |
| Campaign Updates (Following) | Instant | On |
| Security Alerts | Instant | On |
| Marketing | Off | Off |
| Product Updates | Weekly Digest | Off |

**Quiet Hours:**
- Enable quiet hours toggle
- Start time picker (default: 10:00 PM)
- End time picker (default: 7:00 AM)
- Timezone selector
- Override for critical security alerts

#### 3.1.5 Privacy Settings Section

**Route:** `/settings/privacy`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `profileVisibility` | enum | public | public, followers_only, private |
| `showInSearch` | boolean | true | Appear in platform search results |
| `showInLeaderboards` | boolean | true | Appear on donation leaderboards |
| `donationVisibility` | enum | campaign_only | public, campaign_only, private |
| `allowDMs` | enum | followers | everyone, followers, verified, none |
| `showOnlineStatus` | boolean | false | Show "Active now" indicator |
| `allowTagging` | enum | everyone | everyone, followers, none |
| `dataSharing.analytics` | boolean | true | Anonymous usage analytics |
| `dataSharing.personalization` | boolean | true | Recommendation personalization |
| `dataSharing.thirdParty` | boolean | false | Third-party integrations |

**Blocked Users:**
- List of blocked users with unblock action
- Search to add new blocks
- Block prevents: viewing profile, sending messages, commenting, following

**Data Export:**
- Request full data export (GDPR compliant)
- Processing time: up to 48 hours
- Download link sent via email
- Export includes: profile, donations, campaigns, messages, activity

#### 3.1.6 Appearance Settings Section

**Route:** `/settings/appearance`

| Setting | Type | Options | Default |
|---------|------|---------|---------|
| `theme` | enum | light, dark, system | system |
| `accentColor` | color | preset palette or custom hex | primary-500 |
| `fontSize` | enum | small, medium, large, x-large | medium |
| `reducedMotion` | boolean | - | system preference |
| `highContrast` | boolean | - | false |
| `language` | enum | [supported locales] | browser default |
| `currency` | enum | USD, EUR, GBP, etc. | USD |
| `cryptoDisplay` | enum | symbol, name, both | symbol |
| `dateFormat` | enum | MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD | locale default |
| `timeFormat` | enum | 12h, 24h | locale default |
| `numberFormat` | enum | 1,000.00 / 1.000,00 | locale default |

**Theme Preview:**
- Live preview panel showing theme changes
- Sample UI elements (buttons, cards, text)
- Transition animation between themes

#### 3.1.7 Billing Settings Section

**Route:** `/settings/billing`

**Payment Methods:**
| Field | Type | Notes |
|-------|------|-------|
| `savedCards` | array | Stripe-tokenized cards |
| `defaultPaymentMethod` | string | ID of default method |
| `billingAddress` | object | Required for cards |
| `taxId` | string | VAT/Tax ID for invoices |

**Card Object:**
```typescript
interface SavedCard {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  billingAddress: BillingAddress;
}
```

**Invoice History:**
- Paginated list of all transactions
- Filter by: date range, type (donation, withdrawal, fee)
- Download individual invoices (PDF)
- Download annual summary for taxes
- Export all transactions (CSV)

**Tax Documents:**
- Annual donation summaries
- Platform fee statements
- Campaign earnings reports
- 1099-K generation (US users over threshold)

#### 3.1.8 Security Settings Section

**Route:** `/settings/security`

**Two-Factor Authentication:**
| Method | Status | Priority |
|--------|--------|----------|
| Authenticator App | Recommended | Primary |
| SMS | Available | Backup |
| Hardware Key (WebAuthn) | Available | Primary |
| Backup Codes | Auto-generated | Emergency |

**2FA Setup Flow:**
1. Choose method
2. For Authenticator: Show QR code + manual entry key
3. Verify with code from device
4. Generate and display backup codes
5. Require storing backup codes acknowledgment

**Active Sessions:**
| Field | Display |
|-------|---------|
| Device | "Chrome on macOS" |
| Location | "San Francisco, CA" (IP-based) |
| IP Address | Partially masked |
| Last Active | Relative time |
| Current | Badge indicator |

**Actions:**
- Sign out individual session
- Sign out all other sessions
- Sign out everywhere (including current)

**Login History:**
- Last 50 login attempts
- Success/failure status
- IP address and location
- Device fingerprint
- Timestamp

**Security Recommendations:**
- Dynamic checklist based on account state
- Enable 2FA (if not enabled)
- Add recovery email (if not set)
- Review connected apps
- Update password (if older than 90 days)

#### 3.1.9 Advanced Settings Section

**Route:** `/settings/advanced`

**Developer Options:**
| Setting | Description |
|---------|-------------|
| API Keys | Generate/revoke API keys for integrations |
| Webhooks | Configure webhook endpoints |
| Test Mode | Enable test donations (development) |
| Debug Logs | Download recent debug logs |

**Data Management:**
| Action | Description |
|--------|-------------|
| Export All Data | GDPR-compliant full export |
| Clear Search History | Remove all search queries |
| Clear Watch History | Remove campaign view history |
| Reset Recommendations | Clear personalization data |

**Experimental Features:**
- Beta feature toggles (if enrolled in beta program)
- Feature flag overrides for testing

---

### 3.2 Wallet Management

The wallet system is central to FundBrave's value proposition, enabling multi-chain cryptocurrency donations while abstracting complexity for non-crypto users.

#### 3.2.1 Supported Wallets

**Browser Extension Wallets:**
| Wallet | Chains | Priority |
|--------|--------|----------|
| MetaMask | EVM chains | P0 |
| Coinbase Wallet | EVM chains | P0 |
| Rainbow | EVM chains | P1 |
| Trust Wallet | EVM + others | P1 |
| Phantom | Solana, Ethereum | P1 |
| Rabby | EVM chains | P2 |

**Mobile Wallets (WalletConnect):**
- All WalletConnect v2 compatible wallets
- Deep link support for mobile web

**Custodial Options:**
- Coinbase Pay integration
- MoonPay on-ramp

#### 3.2.2 Supported Chains & Tokens

**EVM Chains:**
| Chain | Chain ID | Native Token | Stablecoins |
|-------|----------|--------------|-------------|
| Ethereum Mainnet | 1 | ETH | USDC, USDT, DAI |
| Polygon | 137 | MATIC | USDC, USDT |
| Arbitrum One | 42161 | ETH | USDC, USDT |
| Optimism | 10 | ETH | USDC, USDT |
| Base | 8453 | ETH | USDC |
| Avalanche C-Chain | 43114 | AVAX | USDC, USDT |

**Non-EVM Chains (Phase 2):**
| Chain | Native Token | Stablecoins |
|-------|--------------|-------------|
| Solana | SOL | USDC |
| Bitcoin | BTC | - |

#### 3.2.3 Wallet Connection Flow

**Step 1: Initiate Connection**
```
User clicks "Connect Wallet"
  Show WalletSelectorModal
    - Detected wallets (installed) at top
    - Popular wallets section
    - "Show all wallets" expandable
    - "What is a wallet?" help link
```

**Step 2: Wallet Selection**
```
User selects wallet
  If installed:
    - Trigger wallet extension popup
    - Show "Waiting for wallet..." state
  If not installed:
    - Show install instructions
    - Deep link to wallet website
    - QR code for mobile (WalletConnect)
```

**Step 3: Account Selection**
```
Wallet popup appears
  User selects account(s) to connect
  User approves connection

FundBrave receives:
  - Account address(es)
  - Chain ID
  - Provider instance
```

**Step 4: Verification (Optional)**
```
If first-time connection:
  Request signature for verification
  Message: "Sign to verify wallet ownership on FundBrave\n\nNonce: {nonce}\nTimestamp: {timestamp}"
  Store verified wallet association
```

**Step 5: Success State**
```
Show success animation
Display connected wallet:
  - ENS name (if available) or truncated address
  - Chain indicator
  - Balance (native token)

Persist connection (localStorage + database)
```

#### 3.2.4 Multi-Wallet Management

**Wallet List View:**
```typescript
interface ConnectedWallet {
  id: string;
  address: string;
  ensName?: string;
  chainId: number;
  walletType: 'metamask' | 'coinbase' | 'walletconnect' | string;
  isVerified: boolean;
  isPrimary: boolean;
  label?: string; // User-defined nickname
  addedAt: Date;
  lastUsedAt: Date;
}
```

**Actions per Wallet:**
| Action | Description |
|--------|-------------|
| Set as Primary | Use for default transactions |
| Rename | Add custom label |
| View on Explorer | Link to blockchain explorer |
| Copy Address | Copy full address |
| Disconnect | Remove from account |
| Verify | Sign message to prove ownership |

**Primary Wallet:**
- Used for receiving campaign funds
- Used for default donation source
- Must be verified
- Visual indicator (star icon)

#### 3.2.5 Donation Transaction Flow

**Pre-Transaction:**
1. User enters donation amount (fiat or crypto)
2. Show real-time conversion rates
3. Display network fee estimate
4. Show total amount (donation + fee + platform tip)
5. Confirm selected wallet has sufficient balance

**Transaction Execution:**
```
1. Build transaction object
2. Request wallet signature
3. Show "Confirm in wallet" modal
4. Track pending transaction hash
5. Show "Transaction submitted" with explorer link
6. Poll for confirmation
7. Update UI on confirmation
8. Trigger confetti + success modal
9. Update campaign totals (optimistic + confirmed)
```

**Transaction States:**
| State | UI Treatment |
|-------|--------------|
| Building | Spinner, "Preparing transaction..." |
| Awaiting Signature | Wallet icon pulse, "Confirm in your wallet" |
| Pending | Progress bar, "Transaction submitted" + hash link |
| Confirming | Block count indicator, "Waiting for confirmations" |
| Confirmed | Checkmark, confetti, "Donation complete!" |
| Failed | Error icon, reason, retry button |
| Dropped | Warning, "Transaction dropped", retry button |

#### 3.2.6 Withdrawal Flow (Campaign Creators)

**Prerequisites:**
- Verified identity (KYC for amounts > $600)
- Verified wallet ownership
- Campaign has withdrawable balance

**Withdrawal Options:**
| Method | Speed | Fees | Min/Max |
|--------|-------|------|---------|
| Crypto (same chain) | Minutes | Network only | $1 / $100K |
| Crypto (bridge) | 10-30 min | Network + bridge | $50 / $50K |
| Fiat (Stripe) | 2-5 days | 1.5% | $25 / $10K |
| Fiat (Wire) | 1-3 days | $25 flat | $1K / $100K |

**Withdrawal Flow:**
1. Select campaign with available funds
2. Enter amount (max = available balance)
3. Select withdrawal method
4. For crypto: select destination address (from connected wallets or enter new)
5. For fiat: select/add bank account
6. Review fees and final amount
7. Confirm with 2FA
8. Track withdrawal status

**Withdrawal Statuses:**
| Status | Description |
|--------|-------------|
| Pending | Awaiting processing |
| Processing | Funds being moved |
| Completed | Funds delivered |
| Failed | Transaction failed (with reason) |
| Reversed | Returned due to issue |

#### 3.2.7 Transaction History

**View:** `/settings/wallet/history`

**Columns:**
| Column | Description |
|--------|-------------|
| Type | Donation In/Out, Withdrawal, Tip, Refund |
| Amount | Fiat value + crypto amount |
| Campaign | Link to campaign |
| From/To | Wallet address or "Bank Account" |
| Status | Confirmed, Pending, Failed |
| Date | Timestamp with relative + absolute |
| Actions | View on explorer, Download receipt |

**Filters:**
- Date range
- Transaction type
- Wallet address
- Status
- Amount range

**Export Options:**
- CSV download
- PDF statement
- Tax-ready format (TurboTax, etc.)

---

### 3.3 Notifications System

A comprehensive notification system that keeps users informed without overwhelming them.

#### 3.3.1 Notification Types

**Campaign Creator Notifications:**

| ID | Type | Title Template | Trigger |
|----|------|----------------|---------|
| NC01 | donation_received | "{name} donated ${amount}" | Donation confirmed |
| NC02 | donation_received_anonymous | "Anonymous donated ${amount}" | Anonymous donation |
| NC03 | milestone_reached | "You reached ${percent}% of your goal!" | 25%, 50%, 75%, 100% |
| NC04 | campaign_shared | "{name} shared your campaign" | Campaign shared |
| NC05 | comment_new | "{name} commented on your campaign" | New comment |
| NC06 | comment_reply | "{name} replied to your comment" | Reply to creator comment |
| NC07 | follower_new | "{name} started following you" | New follower |
| NC08 | campaign_featured | "Your campaign was featured!" | Staff feature |
| NC09 | withdrawal_complete | "Withdrawal of ${amount} complete" | Withdrawal confirmed |
| NC10 | campaign_ending | "Your campaign ends in {days} days" | 7, 3, 1 day before |
| NC11 | verification_approved | "Your campaign is now verified" | Verification complete |
| NC12 | verification_needed | "Additional verification required" | Verification request |

**Donor Notifications:**

| ID | Type | Title Template | Trigger |
|----|------|----------------|---------|
| ND01 | donation_confirmed | "Your ${amount} donation confirmed" | Transaction confirmed |
| ND02 | campaign_update | "{campaign} posted an update" | Creator posts update |
| ND03 | campaign_milestone | "{campaign} reached ${percent}%!" | Campaign milestone |
| ND04 | campaign_complete | "{campaign} reached its goal!" | 100% funded |
| ND05 | campaign_ending | "{campaign} ends in {days} days" | Following campaign ending |
| ND06 | receipt_ready | "Your donation receipt is ready" | Tax receipt generated |
| ND07 | refund_processed | "Refund of ${amount} processed" | Refund complete |
| ND08 | thank_you_message | "{creator} sent you a thank you" | Creator sends thanks |

**Social Notifications:**

| ID | Type | Title Template | Trigger |
|----|------|----------------|---------|
| NS01 | follow_new | "{name} started following you" | New follower |
| NS02 | mention | "{name} mentioned you" | @mention in comment/post |
| NS03 | post_like | "{name} liked your post" | Post liked |
| NS04 | post_comment | "{name} commented on your post" | New comment |
| NS05 | post_share | "{name} shared your post" | Post shared |
| NS06 | dm_received | "New message from {name}" | Direct message |
| NS07 | suggested_follow | "People you may know" | Weekly suggestion |

**System Notifications:**

| ID | Type | Title Template | Trigger |
|----|------|----------------|---------|
| SY01 | security_login | "New login from {device}" | Login from new device |
| SY02 | security_password | "Password changed successfully" | Password change |
| SY03 | security_2fa | "Two-factor authentication enabled" | 2FA enabled |
| SY04 | security_suspicious | "Suspicious activity detected" | Security alert |
| SY05 | account_verified | "Your account is now verified" | Verification complete |
| SY06 | tos_update | "Terms of Service updated" | ToS change |
| SY07 | feature_announcement | "New feature: {feature}" | Feature launch |
| SY08 | maintenance | "Scheduled maintenance: {date}" | Maintenance notice |

#### 3.3.2 Notification Data Structure

```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: 'campaign' | 'donation' | 'social' | 'system' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  groupId?: string; // For notification grouping
}

type NotificationType =
  | 'donation_received'
  | 'donation_confirmed'
  | 'milestone_reached'
  | 'campaign_update'
  | 'comment_new'
  | 'follow_new'
  | 'security_login'
  // ... all types from tables above
```

#### 3.3.3 Notification Grouping

**Grouping Rules:**
| Scenario | Grouping Behavior |
|----------|-------------------|
| Multiple donations < 1 hour | "5 people donated to your campaign" |
| Multiple likes < 1 hour | "{name} and 4 others liked your post" |
| Multiple followers < 1 day | "3 new followers this week" |
| Same campaign updates | Stack under campaign name |

**Grouped Notification:**
```typescript
interface GroupedNotification {
  id: string;
  groupId: string;
  type: NotificationType;
  title: string; // Aggregated title
  count: number;
  notifications: Notification[]; // Individual items
  latestAt: Date;
  isExpanded: boolean;
}
```

#### 3.3.4 Notification Center UI

**Header Bell Icon:**
- Badge count (unread notifications)
- Max display: "99+"
- Animate on new notification

**Dropdown Panel:**
```
NotificationCenter
  Header
    - "Notifications" title
    - "Mark all as read" action
    - Settings gear icon (link to settings)

  TabBar
    - All
    - Donations
    - Social
    - System

  NotificationList
    - Grouped by time (Today, Yesterday, This Week, Earlier)
    - Infinite scroll with virtualization
    - Pull to refresh (mobile)

  EmptyState
    - Illustration
    - "No notifications yet"
    - Contextual suggestion
```

**Individual Notification Item:**
```
NotificationItem
  Avatar/Icon (left)
  Content (center)
    - Title (bold, 1 line)
    - Body (regular, 2 lines max)
    - Timestamp (relative)
  Actions (right)
    - Primary action button (if actionUrl)
    - More menu (archive, turn off type)

  States:
    - Unread: Left border accent color
    - Read: No border
    - Hover: Background highlight
```

#### 3.3.5 Push Notification Implementation

**Web Push (Browser):**
- Request permission on meaningful trigger (not on load)
- Store subscription in database
- Use web-push library for server-side
- Payload: title, body, icon, badge, actions

**Mobile Push:**
- Expo notifications (React Native)
- FCM for Android
- APNs for iOS
- Deep links for notification tap

**Permission Request Timing:**
1. After first donation received
2. After following a campaign
3. After enabling in settings
4. Never on first visit

---

### 3.4 Search & Discovery

Enabling users to find relevant campaigns, creators, and content.

#### 3.4.1 Search Architecture

**Search Index Contents:**
| Entity | Indexed Fields | Boost |
|--------|----------------|-------|
| Campaign | title, description, tags, creator name | 1.0 |
| User | displayName, username, bio | 0.8 |
| Post | content, hashtags, author | 0.6 |
| Category | name, description | 0.5 |

**Search API:**
```typescript
interface SearchRequest {
  query: string;
  type?: 'all' | 'campaigns' | 'users' | 'posts';
  filters?: SearchFilters;
  sort?: SearchSort;
  page?: number;
  limit?: number;
}

interface SearchFilters {
  category?: string[];
  status?: ('active' | 'completed' | 'ending_soon')[];
  minRaised?: number;
  maxRaised?: number;
  minGoal?: number;
  maxGoal?: number;
  verified?: boolean;
  hasUpdates?: boolean;
  location?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

interface SearchSort {
  field: 'relevance' | 'recent' | 'popular' | 'ending_soon' | 'most_raised' | 'most_donors';
  direction: 'asc' | 'desc';
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  facets: SearchFacets;
  suggestions?: string[];
  didYouMean?: string;
}
```

#### 3.4.2 Search UI Components

**Global Search Bar:**
```
SearchBar (header)
  - Input with search icon
  - Keyboard shortcut hint (Cmd+K)
  - Clear button when has value
  - Debounced search (300ms)
```

**Search Modal (Cmd+K):**
```
SearchModal
  Input (auto-focused)

  RecentSearches (if no query)
    - Last 5 searches
    - Clear all action

  QuickFilters
    - Campaigns | People | Posts
    - Category chips (scrollable)

  SearchResults
    - Sectioned by type
    - 3 results per section
    - "See all {type}" link

  TrendingNow
    - Top 5 trending campaigns
    - Hashtag trends
```

**Search Results Page:**
```
/search?q={query}&type={type}&...filters

SearchResultsPage
  SearchHeader
    - Query display
    - Result count
    - Active filters

  FilterSidebar (desktop)
    - Category checkboxes
    - Status radio buttons
    - Funding range slider
    - Verified toggle
    - Date range picker
    - Clear all filters

  FilterSheet (mobile)
    - Bottom sheet with same filters
    - Apply button

  SortDropdown
    - Sort options

  ResultsGrid
    - Campaign cards (3-4 columns)
    - User cards (if people search)
    - Post cards (if posts search)

  Pagination
    - Load more button
    - Page numbers (desktop)
```

#### 3.4.3 Discovery Feed

**Route:** `/discover`

**Sections:**

1. **Trending Now**
   - Campaigns with highest velocity (donations/hour)
   - Carousel of 5-8 campaigns
   - Auto-advances every 5 seconds

2. **Ending Soon**
   - Active campaigns ending within 7 days
   - Sorted by end date
   - Urgency indicators

3. **Just Launched**
   - Campaigns created in last 48 hours
   - Sorted by creation date
   - "New" badge

4. **Staff Picks**
   - Manually curated campaigns
   - Featured badge
   - Curator note

5. **Categories**
   - Grid of category cards
   - Each links to category page
   - Campaign count per category

6. **Near You**
   - Location-based campaigns
   - Requires location permission
   - Fallback to IP-based

7. **From People You Follow**
   - Campaigns by followed users
   - Only if user follows someone

#### 3.4.4 Recommendation Engine

**Input Signals:**
| Signal | Weight | Description |
|--------|--------|-------------|
| Donation history | 0.3 | Categories and creators donated to |
| Browse history | 0.2 | Campaigns viewed |
| Follow graph | 0.2 | Who user follows |
| Similar users | 0.15 | Collaborative filtering |
| Explicit preferences | 0.15 | Category preferences from onboarding |

**Output:**
```typescript
interface Recommendation {
  campaignId: string;
  score: number;
  reason: RecommendationReason;
  reasonText: string; // "Because you donated to {similar campaign}"
}

type RecommendationReason =
  | 'similar_to_donated'
  | 'category_preference'
  | 'followed_creator'
  | 'similar_donors'
  | 'trending_in_category'
  | 'staff_pick';
```

#### 3.4.5 Category System

**Top-Level Categories:**
| ID | Name | Icon | Description |
|----|------|------|-------------|
| medical | Medical & Health | Heart | Medical bills, treatments, surgery |
| emergency | Emergency Relief | AlertTriangle | Disasters, urgent needs |
| education | Education | GraduationCap | Tuition, supplies, programs |
| community | Community | Users | Local projects, mutual aid |
| creative | Creative Projects | Palette | Art, music, film, writing |
| animals | Animals & Pets | PawPrint | Veterinary, rescue, shelters |
| environment | Environment | Leaf | Conservation, climate |
| nonprofit | Nonprofits | Building | Registered organizations |
| memorial | Memorials | Candle | Funerals, tributes |
| sports | Sports & Teams | Trophy | Teams, athletes, equipment |
| faith | Faith & Religion | Church | Religious organizations |
| travel | Travel & Adventure | Plane | Trips, missions |

**Subcategories Example (Medical):**
- Cancer Treatment
- Surgery & Transplants
- Mental Health
- Chronic Illness
- Accident Recovery
- Disability Support
- Fertility & IVF

---

### 3.5 Campaign Creation

A guided wizard for creating compelling fundraising campaigns.

#### 3.5.1 Campaign Creation Wizard

**Route:** `/campaigns/create`

**Step Overview:**
| Step | Name | Required Fields | Est. Time |
|------|------|-----------------|-----------|
| 1 | Basics | title, category, goal, duration | 2 min |
| 2 | Story | description, images, video | 5 min |
| 3 | Details | beneficiary, location, tags | 2 min |
| 4 | Review | - | 1 min |

**Progress Indicator:**
- Horizontal stepper on desktop
- Compact progress bar on mobile
- Step labels visible on desktop
- "Step X of 4" on mobile

#### 3.5.2 Step 1: Basics

**Fields:**

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `title` | text | 10-80 chars | Yes |
| `category` | select | From category list | Yes |
| `subcategory` | select | Based on category | No |
| `goalAmount` | currency | $100 - $10,000,000 | Yes |
| `currency` | select | USD, EUR, GBP | Yes |
| `duration` | select | 7, 14, 30, 60, 90 days or no limit | Yes |
| `customEndDate` | date | Future date if custom | If custom duration |

**Goal Amount UI:**
- Currency selector dropdown
- Number input with formatting
- Preset quick-select buttons ($1K, $5K, $10K, $25K)
- "What's a good goal?" help tooltip

**Duration UI:**
- Radio button group for presets
- Calendar picker for custom
- End date preview
- "Campaigns with deadlines raise 30% more" hint

#### 3.5.3 Step 2: Story

**Fields:**

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `description` | richtext | 100-10,000 chars | Yes |
| `coverImage` | image | JPG/PNG/WEBP, max 10MB | Yes |
| `gallery` | images | Up to 10 images | No |
| `videoUrl` | url | YouTube/Vimeo URL | No |
| `videoEmbed` | file | MP4, max 100MB | No |

**Rich Text Editor Features:**
- Bold, italic, underline
- Headings (H2, H3)
- Bullet and numbered lists
- Links
- Block quotes
- Image embedding (from gallery)
- Character count

**Cover Image:**
- Drag and drop zone
- Aspect ratio: 16:9
- Crop and position tool
- AI alt-text generation (optional)

**Story Tips Panel:**
```
StoryTipsPanel
  - "Start with why" - explain the cause
  - "Be specific" - exact use of funds
  - "Show don't tell" - use images
  - "Set milestones" - break down the goal
  - "Update regularly" - keep donors engaged
```

#### 3.5.4 Step 3: Details

**Fields:**

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `beneficiaryType` | select | self, individual, organization | Yes |
| `beneficiaryName` | text | 2-100 chars | If not self |
| `beneficiaryRelationship` | select | predefined options | If individual |
| `organizationTaxId` | text | Valid EIN format | If organization |
| `location` | location | City, State/Province, Country | Yes |
| `tags` | tags | 1-5 tags, 2-30 chars each | No |
| `allowComments` | boolean | - | Yes (default: true) |
| `allowAnonymousDonations` | boolean | - | Yes (default: true) |
| `showDonorNames` | boolean | - | Yes (default: true) |
| `showDonorAmounts` | boolean | - | Yes (default: true) |
| `receiveWallet` | wallet | From connected wallets | Yes |

**Beneficiary Type Options:**
| Type | Description | Additional Fields |
|------|-------------|-------------------|
| Self | Fundraising for yourself | None |
| Individual | Fundraising for someone else | Name, relationship |
| Organization | Fundraising for registered org | Name, tax ID, verification docs |

**Tags Input:**
- Typeahead with popular tags
- Create new tags
- Max 5 tags
- Character limit per tag

#### 3.5.5 Step 4: Review & Launch

**Review Sections:**

```
CampaignReview
  PreviewCard
    - Full campaign card as it will appear
    - Toggle desktop/mobile preview

  ChecklistSection
    - Cover image added
    - Story length adequate
    - Goal amount set
    - Wallet connected
    - Category selected

  EstimatesSection
    - "Based on similar campaigns..."
    - Average donation: $X
    - Estimated reach: X people
    - Suggested share strategy

  TermsAcknowledgment
    - Checkbox: "I confirm this campaign is truthful"
    - Checkbox: "I agree to FundBrave Terms of Service"
    - Checkbox: "I understand platform fees (X%)"

  LaunchActions
    - "Save as Draft" button
    - "Launch Campaign" button (primary)
```

**Post-Launch:**
1. Confetti animation
2. Success modal with share options
3. Redirect to campaign page
4. First-time creator tips modal

#### 3.5.6 Campaign Data Structure

```typescript
interface Campaign {
  // Core identification
  id: string;
  slug: string;
  status: CampaignStatus;

  // Basic info
  title: string;
  description: string; // HTML from rich text
  descriptionPlain: string; // Plain text excerpt
  category: CategoryId;
  subcategory?: SubcategoryId;
  tags: string[];

  // Media
  coverImageUrl: string;
  coverImageAlt?: string;
  galleryImages: CampaignImage[];
  videoUrl?: string;
  videoEmbedUrl?: string;

  // Funding
  goalAmount: number;
  currency: Currency;
  amountRaised: number;
  donorCount: number;

  // Timeline
  createdAt: Date;
  publishedAt?: Date;
  endsAt?: Date;
  updatedAt: Date;

  // Beneficiary
  beneficiaryType: 'self' | 'individual' | 'organization';
  beneficiaryName?: string;
  beneficiaryRelationship?: string;
  organizationTaxId?: string;

  // Location
  location: {
    city?: string;
    state?: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Settings
  allowComments: boolean;
  allowAnonymousDonations: boolean;
  showDonorNames: boolean;
  showDonorAmounts: boolean;

  // Blockchain
  receiveWalletAddress: string;
  contractAddress?: string;

  // Verification
  verificationStatus: VerificationStatus;
  verificationTier: VerificationTier;

  // Creator
  creatorId: string;
  creator: UserSummary;

  // Engagement
  viewCount: number;
  shareCount: number;
  commentCount: number;
  bookmarkCount: number;

  // Computed
  percentFunded: number;
  daysRemaining?: number;
  isActive: boolean;
  isFeatured: boolean;
}

type CampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'suspended';

type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';

type VerificationTier =
  | 'none'
  | 'basic'      // Email verified
  | 'identity'   // ID verified
  | 'enhanced';  // Full verification

interface CampaignImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt?: string;
  width: number;
  height: number;
  order: number;
}
```

---

### 3.6 Bookmarks & Collections

Allow users to save and organize campaigns for later.

#### 3.6.1 Bookmark System

**Bookmark Action:**
- Available on all campaign cards
- Single tap to bookmark/unbookmark
- Optimistic UI update
- Toast confirmation

**Bookmark Data:**
```typescript
interface Bookmark {
  id: string;
  userId: string;
  campaignId: string;
  collectionId?: string;
  note?: string;
  reminderAt?: Date;
  createdAt: Date;
}
```

#### 3.6.2 Collections

**Collection Types:**
| Type | Description | Default |
|------|-------------|---------|
| default | "Saved Campaigns" | Yes, cannot delete |
| custom | User-created | No |
| smart | Auto-populated by rules | No |

**Collection Data:**
```typescript
interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  isDefault: boolean;
  isSmart: boolean;
  smartRules?: SmartCollectionRules;
  campaignCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SmartCollectionRules {
  categories?: string[];
  minGoal?: number;
  maxGoal?: number;
  verifiedOnly?: boolean;
  endingSoon?: boolean;
}
```

**Collection Management:**
```
/profile/bookmarks
  CollectionsGrid
    - DefaultCollection (pinned)
    - CustomCollections
    - "+ Create Collection" card

  CollectionView
    Header
      - Collection name
      - Description
      - Campaign count
      - Edit/Delete actions
      - Share toggle

    CampaignsGrid
      - Bookmarked campaigns
      - Drag to reorder
      - Remove from collection
```

#### 3.6.3 Bookmark Actions

**Quick Actions:**
| Action | Description |
|--------|-------------|
| Add to Collection | Move/copy to specific collection |
| Add Note | Personal note about campaign |
| Set Reminder | Get notified before campaign ends |
| Share Bookmark | Share collection publicly |
| Remove | Unbookmark campaign |

**Reminder System:**
- "Remind me in 1 day"
- "Remind me in 3 days"
- "Remind me before it ends"
- Custom date/time
- Push notification when triggered

---

### 3.7 Enhanced Onboarding

A comprehensive onboarding flow that reduces time-to-value while respecting user autonomy.

#### 3.7.1 Onboarding Flow Overview

**Route:** `/onboarding`

| Step | Name | Required | Skip Option |
|------|------|----------|-------------|
| 1 | Welcome | Yes | No |
| 2 | Profile Details | Yes | Partial (name only) |
| 3 | Goals | Yes | No |
| 4 | Interests | No | Yes |
| 5 | Connect Wallet | No | Yes |
| 6 | Follow Suggestions | No | Yes |
| 7 | Verify Email | Yes | Defer |

**Progress Tracking:**
```typescript
interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  skippedSteps: number[];
  userData: Partial<OnboardingData>;
  startedAt: Date;
  completedAt?: Date;
}

interface OnboardingData {
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  userType: 'donor' | 'creator' | 'both';
  interests: string[];
  walletAddress?: string;
  followedUsers: string[];
  emailVerified: boolean;
}
```

#### 3.7.2 Step 1: Welcome

**Content:**
```
WelcomeStep
  AnimatedLogo
    - GSAP entrance animation
    - Brand gradient reveal

  WelcomeMessage
    - "Welcome to FundBrave"
    - "The future of fundraising is transparent, decentralized, and community-powered."

  ValueProps (3 cards)
    - "Lower Fees" - Keep more of what you raise
    - "Global Reach" - Accept donations worldwide
    - "Full Transparency" - Every transaction visible

  ContinueButton
    - "Let's get started"
```

#### 3.7.3 Step 2: Profile Details

**Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| displayName | text | Yes | 2-50 chars |
| username | text | Yes | 3-30 chars, unique, alphanumeric + underscore |
| avatar | image | No | JPG/PNG, max 5MB |
| bio | textarea | No | Max 160 chars |

**Username Selection:**
- Real-time availability check (debounced)
- Suggestions based on display name
- Show availability indicator (green check / red x)

**Avatar:**
- Default generated avatar (gradient + initials)
- Upload option
- Quick preset avatars

#### 3.7.4 Step 3: Goals

**Question:** "What brings you to FundBrave?"

**Options:**
```typescript
type UserGoal =
  | 'create_campaign'    // "I want to start a fundraiser"
  | 'donate'             // "I want to support causes"
  | 'both'               // "Both - I want to create and donate"
  | 'explore';           // "Just exploring for now"
```

**Adaptive Flow:**
- If `create_campaign`: Show campaign tips, prioritize creator features
- If `donate`: Show discovery, prioritize finding campaigns
- If `both`: Balanced experience
- If `explore`: Minimal friction, full skip options

#### 3.7.5 Step 4: Interests

**Content:**
```
InterestsStep
  Prompt
    - "Select topics you care about"
    - "We'll personalize your experience"

  CategoryGrid
    - All top-level categories
    - Multi-select with checkmarks
    - Animated selection state
    - Minimum: 0 (skippable)
    - Recommended: 3+

  SkipOption
    - "Skip for now"
```

#### 3.7.6 Step 5: Connect Wallet (Optional)

**Content:**
```
WalletStep
  Explanation
    - "Connect a wallet to donate with crypto"
    - "Lower fees, instant transfers, full transparency"

  BenefitsList
    - Multi-chain support
    - Track all donations
    - Earn on-chain badges

  WalletOptions
    - MetaMask (if detected)
    - Coinbase Wallet (if detected)
    - WalletConnect QR
    - "Show all options"

  SkipOption
    - "I'll use a card instead"
    - "Set up wallet later"
```

#### 3.7.7 Step 6: Follow Suggestions

**Content:**
```
FollowStep
  Prompt
    - "Discover creators and causes"
    - Based on selected interests

  SuggestionsList
    - 10-15 suggested accounts
    - Mix of: popular creators, trending campaigns, similar users
    - "Follow All" quick action

  UserCard
    - Avatar
    - Display name + verified badge
    - Bio excerpt
    - Follower count
    - Follow button

  SkipOption
    - "Skip for now"
```

#### 3.7.8 Step 7: Verify Email

**Content:**
```
VerifyEmailStep
  Prompt
    - "Verify your email to unlock all features"
    - Show email address (editable)

  Benefits
    - Create campaigns
    - Receive important notifications
    - Recover your account

  VerificationInput
    - 6-digit code input
    - Auto-advance on complete
    - Resend code option (with cooldown)

  Actions
    - "Verify" button
    - "Resend code"
    - "Change email"
    - "Do this later" (defer)
```

#### 3.7.9 Completion

**Content:**
```
CompletionStep
  SuccessAnimation
    - Confetti burst
    - Checkmark with brand gradient

  Message
    - "You're all set!"
    - Personalized based on goal:
      - Creator: "Ready to start your first campaign?"
      - Donor: "Discover campaigns to support"

  NextSteps
    - Primary CTA based on goal
    - Secondary: "Explore the platform"

  ProgressSummary
    - Steps completed
    - Features unlocked
```

---

### 3.8 Trust & Safety

Building and communicating trust is critical for a fundraising platform.

#### 3.8.1 Verification Tiers

| Tier | Name | Requirements | Badge | Limits |
|------|------|--------------|-------|--------|
| 0 | Unverified | Account created | None | $500/campaign |
| 1 | Basic | Email verified | Blue outline | $5,000/campaign |
| 2 | Identity | ID verification (Persona) | Blue filled | $50,000/campaign |
| 3 | Enhanced | ID + proof of cause | Gold | Unlimited |

**Verification Badge Component:**
```typescript
interface VerificationBadgeProps {
  tier: 0 | 1 | 2 | 3;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Badge Visuals:**
- Tier 0: No badge
- Tier 1: Checkmark outline (primary-400)
- Tier 2: Filled checkmark (primary-500)
- Tier 3: Shield with star (gold gradient)

#### 3.8.2 Campaign Verification

**Basic Verification (Tier 1):**
- Email verified
- Phone number verified (SMS)
- Account age > 24 hours

**Identity Verification (Tier 2):**
- Government ID scan (Persona integration)
- Selfie verification
- Address verification

**Enhanced Verification (Tier 3):**
- All Tier 2 requirements
- Documentation supporting cause:
  - Medical: Doctor's letter, hospital bills
  - Education: Enrollment letter
  - Nonprofit: 501(c)(3) documentation
  - Emergency: News articles, official reports
- Manual review by Trust & Safety team

#### 3.8.3 Trust Signals on Campaign Page

**Displayed Signals:**
```
CampaignTrustSignals
  VerificationBadge
    - Tier indicator
    - "Verified" or tier name
    - Tooltip with verification details

  CreatorInfo
    - Account age: "Member since {date}"
    - Previous campaigns: "{count} successful campaigns"
    - Total raised: "${amount} raised to date"

  TransparencySection
    - "All donations visible on blockchain"
    - Link to transaction explorer
    - Withdrawal history (if any)

  CommunitySignals
    - Donor count: "{count} supporters"
    - Share count: "Shared {count} times"
    - Update frequency: "{count} updates posted"
```

#### 3.8.4 Reporting System

**Report Reasons:**
| Category | Specific Reasons |
|----------|------------------|
| Fraud | Fake campaign, Misleading info, Funds misuse |
| Content | Hate speech, Harassment, Adult content |
| Spam | Duplicate campaign, Promotional spam |
| Legal | Copyright, Illegal activity |
| Other | Other concern (free text) |

**Report Flow:**
1. Click "Report" on campaign/user/content
2. Select reason category
3. Select specific reason
4. Add optional details
5. Submit report
6. Confirmation with ticket number

**Report Data:**
```typescript
interface Report {
  id: string;
  reporterId: string;
  targetType: 'campaign' | 'user' | 'comment' | 'post';
  targetId: string;
  category: ReportCategory;
  reason: string;
  details?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}
```

#### 3.8.5 Content Moderation

**Automated Checks:**
| Check | Trigger | Action |
|-------|---------|--------|
| Profanity filter | Campaign creation | Block + notify |
| Image moderation | Image upload | Flag for review |
| Spam detection | Rapid similar campaigns | Hold for review |
| Fraud patterns | Suspicious funding patterns | Flag for review |

**Manual Review Queue:**
- Trust & Safety dashboard
- Priority queue for reported content
- Escalation paths
- Appeal handling

#### 3.8.6 User Safety Features

**Blocking:**
- Block user from profile or content
- Blocked users cannot: view profile, comment, message, donate
- Manage blocks in Settings > Privacy

**Muting:**
- Hide user's content from feeds
- User not notified
- Can still interact if they find content directly

**Privacy Controls:**
- Control who can message
- Control donation visibility
- Control profile visibility
- Control tagging permissions

---

### 3.9 Social Features

Community engagement drives fundraising success.

#### 3.9.1 Follow System

**Follow Types:**
| Type | Description |
|------|-------------|
| User Follow | Follow another user |
| Campaign Follow | Follow campaign for updates |
| Category Follow | Follow category for discovery |

**Follow Data:**
```typescript
interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  followingType: 'user' | 'campaign' | 'category';
  createdAt: Date;
  notificationsEnabled: boolean;
}
```

**Follow Button States:**
| State | Label | Action |
|-------|-------|--------|
| Not Following | "Follow" | Create follow |
| Following | "Following" (checkmark) | Show menu |
| Hover (Following) | "Unfollow" | Confirm unfollow |
| Mutual | "Friends" | Show menu |

#### 3.9.2 Activity Feed

**Route:** `/` (home feed)

**Feed Algorithm Inputs:**
| Signal | Weight | Description |
|--------|--------|-------------|
| Following | 0.4 | Posts from followed users |
| Engagement | 0.25 | High engagement content |
| Recency | 0.2 | Recent content |
| Relevance | 0.15 | Based on interests |

**Feed Item Types:**
```typescript
type FeedItem =
  | { type: 'post'; post: Post }
  | { type: 'campaign_update'; update: CampaignUpdate }
  | { type: 'campaign_milestone'; campaign: Campaign; milestone: Milestone }
  | { type: 'donation_celebration'; donation: PublicDonation }
  | { type: 'new_campaign'; campaign: Campaign }
  | { type: 'suggested_campaign'; campaign: Campaign; reason: string };
```

#### 3.9.3 Posts & Comments

**Post Types:**
| Type | Content |
|------|---------|
| Text | Plain text, up to 500 chars |
| Image | Up to 4 images + optional text |
| Campaign Share | Campaign card + commentary |
| Update | Campaign update (creator only) |

**Post Data:**
```typescript
interface Post {
  id: string;
  authorId: string;
  author: UserSummary;
  type: PostType;
  content: string;
  images?: PostImage[];
  linkedCampaignId?: string;
  linkedCampaign?: CampaignSummary;
  visibility: 'public' | 'followers' | 'private';
  allowComments: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Comment {
  id: string;
  postId?: string;
  campaignId?: string;
  authorId: string;
  author: UserSummary;
  content: string;
  parentId?: string; // For nested replies
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.9.4 Engagement Actions

**Like:**
- Tap to like (optimistic)
- Heart icon animation
- Counter update

**Comment:**
- Inline comment input
- @mentions with autocomplete
- Nested replies (1 level)

**Share:**
- Share modal with options:
  - Copy link
  - Share to Twitter/X
  - Share to Facebook
  - Share to LinkedIn
  - Share to WhatsApp
  - Embed code

**Bookmark:**
- Save for later
- Add to collection
- Set reminder

#### 3.9.5 Direct Messages (Phase 2)

**Message Types:**
| Type | Description |
|------|-------------|
| Text | Plain text message |
| Image | Image with optional caption |
| Campaign | Campaign card share |
| Donation Thank You | Template for thanking donors |

**Message Data:**
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachments?: MessageAttachment[];
  isRead: boolean;
  createdAt: Date;
}

interface Conversation {
  id: string;
  participantIds: string[];
  participants: UserSummary[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 3.10 Mobile-First Patterns

Design patterns optimized for mobile usage.

#### 3.10.1 Responsive Breakpoints

```css
/* From globals.css */
--breakpoint-xs: 360px;   /* small phones */
--breakpoint-sm: 480px;   /* phones */
--breakpoint-md: 768px;   /* tablets */
--breakpoint-lg: 1024px;  /* small laptops */
--breakpoint-xl: 1280px;  /* desktops */
--breakpoint-2xl: 1536px; /* large desktops */
--breakpoint-3xl: 1920px; /* wide screens */
```

#### 3.10.2 Touch Targets

**Minimum Sizes:**
| Element | Min Size | Recommended |
|---------|----------|-------------|
| Buttons | 44x44px | 48x48px |
| Icons (tappable) | 44x44px | 48x48px |
| List items | 48px height | 56px height |
| Form inputs | 44px height | 48px height |

**Spacing:**
- Min space between targets: 8px
- Recommended: 12px

#### 3.10.3 Navigation Patterns

**Mobile Navigation:**
```
BottomNavBar (mobile only, < md)
  - Home (feed)
  - Search (discover)
  - Create (+ icon) - opens action sheet
  - Notifications
  - Profile

  States:
    - Active: filled icon + label
    - Inactive: outline icon only
    - Badge: notification count
```

**Desktop Navigation:**
```
TopNavBar (>= md)
  Left: Logo + primary nav
  Center: Search bar
  Right: Create button, notifications, profile dropdown
```

#### 3.10.4 Mobile-Specific Components

**Bottom Sheet:**
- Used for: filters, actions, confirmations
- Drag to dismiss
- Backdrop tap to close
- Height: auto (content) or fixed percentages

**Pull to Refresh:**
- On feed screens
- Custom branded refresh indicator
- Haptic feedback (native apps)

**Swipe Actions:**
- List items with swipe to reveal actions
- Swipe right: bookmark
- Swipe left: share

**FAB (Floating Action Button):**
- Create post/campaign shortcut
- Position: bottom-right, above nav
- Hide on scroll down, show on scroll up

#### 3.10.5 Mobile Form Patterns

**Input Focus:**
- Scroll input to visible area
- Keyboard-aware padding
- Clear button on filled inputs

**Form Steps:**
- One question per screen (mobile)
- Large touch targets
- Native keyboard types (email, number, etc.)

**Date/Time Pickers:**
- Use native pickers on mobile
- Custom pickers on desktop

---

### 3.11 Accessibility & i18n

#### 3.11.1 WCAG 2.2 AA Compliance

**Perceivable:**
| Requirement | Implementation |
|-------------|----------------|
| Text alternatives | All images have alt text |
| Captions | Video captions required |
| Color contrast | Min 4.5:1 for text, 3:1 for UI |
| Resize | Support 200% zoom without loss |
| Text spacing | Customizable via settings |

**Operable:**
| Requirement | Implementation |
|-------------|----------------|
| Keyboard access | All interactions keyboard-accessible |
| Skip links | Skip to main content link |
| Focus visible | Clear focus indicators |
| Timing | Adjustable timeouts |
| Seizure safe | No flashing > 3/second |

**Understandable:**
| Requirement | Implementation |
|-------------|----------------|
| Language | lang attribute on html |
| Input labels | All inputs labeled |
| Error identification | Clear error messages |
| Help text | Contextual help available |

**Robust:**
| Requirement | Implementation |
|-------------|----------------|
| Valid HTML | Semantic markup |
| ARIA | Proper ARIA roles and states |
| Name/Role/Value | Programmatic access |

#### 3.11.2 Accessibility Components

**Skip Link:**
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
>
  Skip to main content
</a>
```

**Focus Management:**
- Focus trap in modals
- Focus restoration on close
- Programmatic focus for dynamic content

**Screen Reader Announcements:**
```tsx
<div role="status" aria-live="polite" className="sr-only">
  {announcement}
</div>
```

#### 3.11.3 Internationalization

**Supported Languages (Phase 1):**
| Code | Language | Direction |
|------|----------|-----------|
| en | English | LTR |
| es | Spanish | LTR |
| fr | French | LTR |
| de | German | LTR |
| pt | Portuguese | LTR |
| zh | Chinese (Simplified) | LTR |

**Phase 2 Languages:**
| Code | Language | Direction |
|------|----------|-----------|
| ar | Arabic | RTL |
| he | Hebrew | RTL |
| ja | Japanese | LTR |
| ko | Korean | LTR |
| hi | Hindi | LTR |

**i18n Implementation:**
```typescript
// Translation file structure
{
  "common": {
    "donate": "Donate",
    "share": "Share",
    "follow": "Follow"
  },
  "campaign": {
    "goal": "Goal",
    "raised": "Raised",
    "donors": "{{count}} donor",
    "donors_plural": "{{count}} donors"
  },
  "validation": {
    "required": "This field is required",
    "minLength": "Must be at least {{min}} characters"
  }
}
```

**Number/Currency Formatting:**
```typescript
const formatCurrency = (amount: number, currency: string, locale: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Examples:
// formatCurrency(1234.56, 'USD', 'en-US') => "$1,234.56"
// formatCurrency(1234.56, 'EUR', 'de-DE') => "1.234,56 €"
```

**Date Formatting:**
```typescript
const formatDate = (date: Date, locale: string, format: 'short' | 'long') => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: format,
  }).format(date);
};
```

**RTL Support:**
- CSS logical properties (margin-inline-start, etc.)
- dir="rtl" on html element
- Mirrored icons where appropriate
- Bidirectional text handling

---

### 3.12 Component Specifications

Detailed specifications for key UI components.

#### 3.12.1 Button Component

**File:** `app/components/ui/button.tsx`

**Variants:**
| Variant | Use Case | Visual |
|---------|----------|--------|
| primary | Main CTAs | Brand gradient, white text |
| secondary | Secondary actions | Glass effect, bordered |
| tertiary | Subtle actions | Gradient text, no background |
| destructive | Delete/cancel | Red background |
| outline | Bordered option | Transparent, bordered |
| ghost | Minimal action | No background until hover |
| link | Inline link | Underline on hover |

**Sizes:**
| Size | Height | Padding | Font |
|------|--------|---------|------|
| sm | 44px | 18px horiz | 14px |
| md | 48px | 24px horiz | 16px |
| lg | 56px | 32px horiz | 16px |
| xl | 60px | 38px horiz | 16px |
| icon | 40x40px | 0 | - |

**States:**
- Default
- Hover (brightness increase)
- Active/Pressed (brightness decrease)
- Disabled (50% opacity)
- Loading (spinner + text)

#### 3.12.2 CampaignCard Component

**File:** `app/components/campaigns/CampaignCard.tsx`

**Props:**
```typescript
interface CampaignCardProps {
  campaign: Campaign;
  variant?: 'default' | 'compact' | 'featured';
  showCreator?: boolean;
  showProgress?: boolean;
  showActions?: boolean;
  onClick?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
}
```

**Structure:**
```
CampaignCard
  ImageContainer
    - Cover image (16:9 aspect)
    - Category badge (top-left)
    - Verification badge (top-right)
    - Bookmark button (top-right)

  Content
    CreatorRow
      - Avatar
      - Display name
      - Verified badge
      - Time ago

    Title
      - 2 lines max, ellipsis

    Description (default variant only)
      - 3 lines max, ellipsis

    ProgressSection
      - Progress bar with shimmer
      - Amount raised / Goal
      - Percentage

    MetaRow
      - Donor count
      - Days remaining
      - Share count

    ActionRow (if showActions)
      - Donate button
      - Share button
```

**Skeleton State:**
```
CampaignCardSkeleton
  - Same structure with animated placeholders
  - Use campaign-skeleton CSS class
  - Wave animation from left to right
```

#### 3.12.3 PostCard Component

**File:** `app/components/ui/post/PostCard.tsx`

**Props:**
```typescript
interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  showComments?: boolean;
}
```

**Structure:**
```
PostCard
  PostHeader
    - Avatar
    - Author name + verified badge
    - Username
    - Timestamp
    - More menu (edit, delete, report)

  PostContent
    - Text content
    - Image grid (if images)
    - Campaign card (if linked campaign)

  PostActions
    - Like button + count
    - Comment button + count
    - Share button + count
    - Bookmark button

  CommentSection (if expanded)
    - Comment input
    - Comment list
```

#### 3.12.4 FormInput Component

**File:** `app/components/auth/FormInput.tsx`

**Props:**
```typescript
interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showPasswordToggle?: boolean;
}
```

**States:**
| State | Border | Background | Label |
|-------|--------|------------|-------|
| Default | border-default | transparent | muted-foreground |
| Focus | ring (primary) | transparent | primary |
| Error | destructive | destructive/5 | destructive |
| Disabled | border-subtle | muted | muted-foreground |
| Filled | border-default | transparent | muted-foreground |

#### 3.12.5 Modal Component

**File:** To be created at `app/components/ui/Modal.tsx`

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}
```

**Sizes:**
| Size | Max Width |
|------|-----------|
| sm | 400px |
| md | 500px |
| lg | 640px |
| xl | 800px |
| full | 100% - 32px |

**Behavior:**
- Focus trap when open
- Scroll lock on body
- Escape to close (if enabled)
- Backdrop click to close (if enabled)
- Animated entrance (scale + fade)

#### 3.12.6 Toast Component

**File:** To be created at `app/components/ui/Toast.tsx`

**Types:**
```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number; // ms, default 5000
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Position:** Bottom-right (desktop), Bottom-center (mobile)

**Behavior:**
- Stack with newest on top
- Auto-dismiss after duration
- Pause timer on hover
- Swipe to dismiss (mobile)
- Max 3 visible at once

---

### 3.13 404 Page Handling

Contextual 404 error pages that maintain user trust and provide helpful navigation when resources are not found.

#### 3.13.1 Design Principles

1. **Context-Aware Messaging**: Different 404 pages for different resource types
2. **Branded Experience**: Maintain visual consistency with the platform
3. **Helpful Recovery**: Guide users to relevant content instead of dead ends
4. **Trust Preservation**: Reassure users the platform is functioning correctly

#### 3.13.2 404 Page Variants

**A. Campaign Not Found**

**Route:** `/campaigns/[id]` (when campaign doesn't exist)

**File:** `app/campaigns/[id]/not-found.tsx`

| Element | Specification |
|---------|---------------|
| **Illustration** | Custom SVG: Empty donation box or "searching" character |
| **Headline** | "Campaign Not Found" |
| **Subtext** | "This campaign may have ended, been removed, or the link might be incorrect." |
| **Primary CTA** | "Explore Active Campaigns" -> `/campaigns` |
| **Secondary CTA** | "Go Home" -> `/` |
| **Smart Suggestions** | Show 3 similar campaigns based on referrer context or trending |

**Component Structure:**
```
CampaignNotFound
  Container (centered, max-w-2xl)
    IllustrationSection
      - SVG illustration (200x200px, animated subtle float)
      - Uses brand gradient for accents

    ContentSection
      - Headline (text-2xl font-bold)
      - Subtext (text-muted-foreground)

    ActionSection
      - Button (primary) -> Explore Campaigns
      - Button (ghost) -> Go Home

    SuggestionsSection (optional)
      - "You might be interested in:"
      - CampaignCard x3 (compact variant)
```

**B. User/Profile Not Found**

**Route:** `/profile/[username]` (when user doesn't exist)

**File:** `app/profile/[username]/not-found.tsx`

| Element | Specification |
|---------|---------------|
| **Illustration** | Custom SVG: Friendly avatar silhouette with "?" |
| **Headline** | "User Not Found" |
| **Subtext** | "This profile doesn't exist or may have been deactivated." |
| **Primary CTA** | "Find People" -> `/community` |
| **Secondary CTA** | "Go Home" -> `/` |
| **Search Bar** | Quick username search inline |

**Component Structure:**
```
ProfileNotFound
  Container (centered, max-w-2xl)
    IllustrationSection
      - SVG illustration (180x180px)
      - Subtle pulse animation on "?" element

    ContentSection
      - Headline (text-2xl font-bold)
      - Subtext (text-muted-foreground)

    SearchSection
      - Inline search input: "Search for users..."
      - Search icon button

    ActionSection
      - Button (primary) -> Browse Community
      - Button (ghost) -> Go Home
```

**C. Generic Page Not Found**

**Route:** Any unmatched route

**File:** `app/not-found.tsx`

| Element | Specification |
|---------|---------------|
| **Illustration** | Custom SVG: Compass or "lost in space" theme |
| **Headline** | "Page Not Found" |
| **Subtext** | "The page you're looking for doesn't exist or has been moved." |
| **Primary CTA** | "Go Home" -> `/` |
| **Secondary Actions** | Quick links to key sections |
| **Search Bar** | Global search inline |

**Component Structure:**
```
GenericNotFound
  Container (centered, max-w-2xl)
    IllustrationSection
      - SVG illustration (220x220px)
      - Gentle rotation animation on compass element

    ContentSection
      - Headline (text-2xl font-bold)
      - Subtext (text-muted-foreground)

    SearchSection
      - Global search input
      - "Try searching for what you need"

    QuickLinksSection
      - Grid of icon + text links:
        - Browse Campaigns
        - Community
        - Create Campaign
        - Help Center

    ActionSection
      - Button (primary) -> Return Home
```

#### 3.13.3 Visual Specifications

**Color Palette:**
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `bg-background` | `bg-background` |
| Illustration Accent | `var(--primary-500)` | `var(--primary-400)` |
| Headline | `text-foreground` | `text-foreground` |
| Subtext | `text-muted-foreground` | `text-muted-foreground` |
| CTA Primary | Brand gradient | Brand gradient |
| CTA Secondary | `ghost` variant | `ghost` variant |

**Animation Specifications:**
| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Illustration Float | 3s | ease-in-out | On mount, infinite |
| Page Fade In | 300ms | ease-out | On mount |
| CTA Hover Scale | 150ms | ease-out | On hover |
| Search Focus Glow | 200ms | ease-out | On focus |

**Layout:**
- Container: `max-w-2xl mx-auto px-4 py-16`
- Illustration: `mb-8`
- Headline: `mb-2`
- Subtext: `mb-8`
- Actions: `flex gap-4 justify-center`
- Suggestions: `mt-12 pt-8 border-t border-white/10`

#### 3.13.4 TypeScript Interfaces

```typescript
interface NotFoundPageProps {
  variant: 'campaign' | 'profile' | 'generic';
  resourceId?: string;
  referrer?: string;
}

interface NotFoundSuggestion {
  type: 'campaign' | 'user' | 'page';
  id: string;
  title: string;
  thumbnail?: string;
  href: string;
}

interface NotFoundConfig {
  illustration: React.ReactNode;
  headline: string;
  subtext: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  showSearch?: boolean;
  suggestions?: NotFoundSuggestion[];
  quickLinks?: Array<{
    icon: LucideIcon;
    label: string;
    href: string;
  }>;
}
```

#### 3.13.5 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Focus Management** | Auto-focus primary CTA on page load |
| **Screen Reader** | Announce "Page not found" on mount via `aria-live` |
| **Keyboard Nav** | All actions reachable via Tab |
| **Alt Text** | Decorative illustrations use `aria-hidden="true"` |
| **Color Contrast** | All text meets WCAG AA (4.5:1 minimum) |

#### 3.13.6 Analytics Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `404_page_viewed` | Page mount | `{ variant, attempted_path, referrer }` |
| `404_cta_clicked` | CTA click | `{ variant, cta_type, destination }` |
| `404_search_submitted` | Search submit | `{ variant, query }` |
| `404_suggestion_clicked` | Suggestion click | `{ variant, suggestion_type, suggestion_id }` |

---

### 3.14 Donation + Staking Flow

A unified donation experience that allows donors to allocate funds between direct campaign support, personal yield-generating staking, and platform tips.

#### 3.14.1 Core Concept

The Donation + Staking Flow introduces a **three-way allocation model** where donors control how their contribution is distributed:

1. **Campaign**: Direct donation to the campaign creator
2. **Staking Pool**: Donor earns yield on staked portion (DeFi integration)
3. **FundBrave Tip**: Platform sustainability (minimum 2%, user can increase)

This model provides value to all stakeholders:
- **Donors**: Earn passive yield while supporting causes
- **Campaigns**: Receive direct funding
- **Platform**: Sustainable revenue model via tips

#### 3.14.2 Allocation Rules

**Fixed Constraints:**
| Constraint | Value | Notes |
|------------|-------|-------|
| FundBrave Tip Minimum | 2% | Cannot be reduced below this |
| FundBrave Tip Maximum | 25% | Soft cap for user-increased tips |
| Remaining Pool | 98% | Split between Campaign and Staking |
| Minimum Campaign | 0% | User can stake 100% of remaining |
| Minimum Staking | 0% | User can donate 100% of remaining |

**Allocation Examples:**

| Scenario | Campaign | Staking | FundBrave | Notes |
|----------|----------|---------|-----------|-------|
| Default | 79% | 19% | 2% | Balanced default |
| Generous Donor | 98% | 0% | 2% | Traditional donation |
| Yield-Focused | 0% | 98% | 2% | Maximum staking |
| Split Even | 49% | 49% | 2% | Equal distribution |
| Big Tipper | 78% | 17% | 5% | Extra platform support |
| Maximum Tip | 73% | 2% | 25% | Generous tip |

#### 3.14.3 User Interface Design

**Location:** Campaign donation modal/page

**Route:** `/campaigns/[id]` (donation flow within page)

**Component Structure:**
```
DonationStakingFlow
  DonationHeader
    - Campaign thumbnail
    - Campaign title (truncated)
    - Creator name + verified badge

  AmountSection
    - Amount input (large, prominent)
    - Currency selector (USD, ETH, USDC, etc.)
    - Quick amount buttons ($10, $25, $50, $100, Custom)
    - Fiat equivalent display

  AllocationSection
    AllocationHeader
      - "Choose how to allocate your donation"
      - Info tooltip with explanation

    AllocationSlider
      - Three-segment visual bar
      - Campaign segment (brand gradient)
      - Staking segment (green/yield color)
      - FundBrave segment (muted/gray)

    SliderControl
      - Draggable divider between Campaign/Staking
      - Touch-friendly (44px hit area)
      - Haptic feedback on mobile

    AllocationBreakdown
      Row: Campaign
        - Icon (Heart)
        - Label "To Campaign"
        - Percentage
        - Calculated amount

      Row: Staking
        - Icon (TrendingUp)
        - Label "To Staking (You earn yield)"
        - Percentage
        - Calculated amount
        - APY indicator badge

      Row: FundBrave
        - Icon (Sparkles)
        - Label "FundBrave Tip"
        - Percentage input (editable, min 2%)
        - Calculated amount
        - "Thank you!" micro-text when > 2%

  StakingInfoCard (collapsible)
    - "What is staking?"
    - Current APY display
    - "You can withdraw anytime"
    - Link to staking dashboard

  SummarySection
    - Total amount
    - Breakdown summary
    - Network fee estimate (if crypto)

  ActionSection
    - Primary: "Complete Donation" / "Connect Wallet"
    - Terms acceptance checkbox
    - Security badges
```

#### 3.14.4 Slider Interaction Design

**Visual Design:**
```
[====Campaign (79%)=====|==Staking (19%)==|=FB (2%)=]
                        ^
                   Draggable handle
```

**Behavior:**

| Interaction | Response |
|-------------|----------|
| Drag handle left | Decrease Campaign, Increase Staking |
| Drag handle right | Increase Campaign, Decrease Staking |
| Tap segment | Focus that allocation for keyboard input |
| Edit FundBrave tip | Recalculate available Campaign+Staking pool |
| Quick preset buttons | "All to Campaign", "Split 50/50", "All to Staking" |

**Animation:**
- Smooth segment width transitions (200ms ease-out)
- Handle glow effect while dragging
- Segment labels animate to new positions
- Calculated amounts update in real-time with number ticker effect

**Accessibility:**
- Keyboard: Arrow keys adjust by 1%, Shift+Arrow by 5%
- Screen reader: Announce current allocation on change
- ARIA: `role="slider"` with proper `aria-valuemin`, `aria-valuemax`, `aria-valuenow`

#### 3.14.5 TypeScript Interfaces

```typescript
// Core allocation types
interface DonationAllocation {
  campaignPercentage: number;    // 0-98 (when tip is 2%)
  stakingPercentage: number;     // 0-98 (when tip is 2%)
  platformTipPercentage: number; // 2-25 (minimum 2%)
}

interface DonationAllocationAmounts {
  campaignAmount: bigint;
  stakingAmount: bigint;
  platformTipAmount: bigint;
  totalAmount: bigint;
  currency: CurrencyCode;
}

// Staking pool info
interface StakingPoolInfo {
  poolAddress: string;
  currentApy: number;           // e.g., 5.2 for 5.2%
  totalStaked: bigint;
  userStakedBalance: bigint;
  minStakeDuration?: number;    // seconds, 0 if instant withdrawal
  withdrawalFee?: number;       // percentage
}

// Donation request with staking
interface DonationWithStakingRequest {
  campaignId: string;
  donorAddress: string;
  totalAmount: bigint;
  currency: CurrencyCode;
  allocation: DonationAllocation;
  paymentMethod: PaymentMethod;
  message?: string;
  isAnonymous: boolean;
}

// Donation receipt
interface DonationWithStakingReceipt {
  transactionId: string;
  campaignId: string;
  donorId: string;
  timestamp: Date;
  totalAmount: bigint;
  currency: CurrencyCode;
  allocation: DonationAllocationAmounts;
  stakingPosition?: {
    positionId: string;
    poolAddress: string;
    stakedAmount: bigint;
    entryApy: number;
    estimatedDailyYield: bigint;
  };
  transactionHashes: {
    campaign?: string;
    staking?: string;
    platformTip?: string;
  };
}

// Slider component props
interface AllocationSliderProps {
  value: DonationAllocation;
  onChange: (allocation: DonationAllocation) => void;
  totalAmount: bigint;
  currency: CurrencyCode;
  stakingPool: StakingPoolInfo;
  disabled?: boolean;
  showPresets?: boolean;
}

// Preset allocation configurations
type AllocationPreset = 'all-campaign' | 'balanced' | 'split-50-50' | 'all-staking' | 'custom';

interface AllocationPresetConfig {
  id: AllocationPreset;
  label: string;
  allocation: Omit<DonationAllocation, 'platformTipPercentage'>;
  description: string;
}

const ALLOCATION_PRESETS: AllocationPresetConfig[] = [
  {
    id: 'all-campaign',
    label: 'All to Campaign',
    allocation: { campaignPercentage: 98, stakingPercentage: 0 },
    description: '100% of your donation goes directly to the campaign',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    allocation: { campaignPercentage: 79, stakingPercentage: 19 },
    description: 'Support the campaign while earning some yield',
  },
  {
    id: 'split-50-50',
    label: 'Split 50/50',
    allocation: { campaignPercentage: 49, stakingPercentage: 49 },
    description: 'Equal split between campaign and staking',
  },
  {
    id: 'all-staking',
    label: 'All to Staking',
    allocation: { campaignPercentage: 0, stakingPercentage: 98 },
    description: 'Maximize your yield while tipping the platform',
  },
];

// Currency types
type CurrencyCode = 'USD' | 'ETH' | 'USDC' | 'USDT' | 'DAI' | 'MATIC';

type PaymentMethod =
  | { type: 'crypto'; walletAddress: string; chain: ChainId }
  | { type: 'card'; paymentIntentId: string }
  | { type: 'bank'; accountId: string };

type ChainId = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base';
```

#### 3.14.6 State Management

```typescript
// Donation flow state
interface DonationFlowState {
  step: 'amount' | 'allocation' | 'payment' | 'confirming' | 'success' | 'error';
  amount: bigint;
  currency: CurrencyCode;
  allocation: DonationAllocation;
  paymentMethod: PaymentMethod | null;
  message: string;
  isAnonymous: boolean;
  stakingPool: StakingPoolInfo | null;
  receipt: DonationWithStakingReceipt | null;
  error: DonationError | null;
}

// Reducer actions
type DonationFlowAction =
  | { type: 'SET_AMOUNT'; amount: bigint; currency: CurrencyCode }
  | { type: 'SET_ALLOCATION'; allocation: DonationAllocation }
  | { type: 'SET_PAYMENT_METHOD'; method: PaymentMethod }
  | { type: 'SET_MESSAGE'; message: string }
  | { type: 'SET_ANONYMOUS'; isAnonymous: boolean }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; receipt: DonationWithStakingReceipt }
  | { type: 'SUBMIT_ERROR'; error: DonationError }
  | { type: 'RESET' };
```

#### 3.14.7 Visual Specifications

**Color Coding:**
| Segment | Color | Meaning |
|---------|-------|---------|
| Campaign | Brand gradient (`var(--primary-500)` to `var(--primary-600)`) | Direct impact |
| Staking | Green gradient (`#10B981` to `#059669`) | Yield/growth |
| FundBrave | Muted (`var(--muted)`) | Platform support |

**Slider Dimensions:**
| Element | Size |
|---------|------|
| Track Height | 12px |
| Track Border Radius | 6px |
| Handle Width | 4px |
| Handle Height | 24px |
| Handle Hit Area | 44px x 44px |

**Typography:**
| Element | Style |
|---------|-------|
| Section Headers | `text-sm font-medium text-muted-foreground uppercase tracking-wide` |
| Allocation Labels | `text-base font-medium` |
| Percentages | `text-lg font-bold tabular-nums` |
| Amounts | `text-sm text-muted-foreground tabular-nums` |
| APY Badge | `text-xs font-medium bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full` |

#### 3.14.8 Smart Contract Integration

**Transaction Flow:**
```
1. User approves token spending (if ERC-20)
2. Single transaction to FundBrave Router contract:
   - Router splits funds according to allocation
   - Campaign portion -> Campaign wallet
   - Staking portion -> Staking pool contract (mint staking position NFT)
   - Platform tip -> FundBrave treasury

3. Events emitted:
   - DonationReceived(campaignId, donor, amount, allocation)
   - StakingPositionCreated(positionId, staker, amount, poolId)
```

**Gas Optimization:**
- Batch all transfers in single transaction via Router
- Use multicall pattern for complex operations
- Estimate gas upfront and show user

#### 3.14.9 Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Staking pool at capacity | Show warning, allow campaign-only donation |
| Low staking amount (< minimum) | Redirect full amount to campaign with message |
| Network congestion (high gas) | Show gas estimate, suggest waiting |
| Wallet disconnection mid-flow | Persist state, prompt reconnection |
| Transaction failure | Show retry option, preserve allocation settings |
| Price volatility (crypto) | Show live price, lock rate for 60 seconds |

#### 3.14.10 Analytics Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `donation_flow_started` | Modal open | `{ campaign_id, source }` |
| `donation_amount_entered` | Amount confirmed | `{ amount, currency }` |
| `allocation_changed` | Slider moved | `{ campaign_pct, staking_pct, tip_pct, preset_used }` |
| `allocation_preset_selected` | Preset button clicked | `{ preset_id }` |
| `staking_info_expanded` | Info card expanded | `{ }` |
| `donation_submitted` | Submit clicked | `{ total_amount, allocation, payment_method }` |
| `donation_completed` | Transaction confirmed | `{ receipt_id, tx_hashes }` |
| `donation_failed` | Transaction failed | `{ error_code, error_message }` |

#### 3.14.11 Future Considerations

**Community Pool Option:**
- Alternative to personal staking
- Funds community grants and matching
- Donors vote on grant allocation
- Lower individual yield, higher collective impact

**Yield Donation:**
- Option to auto-donate staking yield to campaigns
- Set up recurring donations from yield
- "Perpetual giving" feature

---

### 3.15 Web3 Chat

Decentralized peer-to-peer messaging that aligns with FundBrave's trustless, transparent ethos. Built on Waku and Codex from the Logos network stack, Web3 Chat gives users end-to-end encrypted direct messages without relying on centralized servers for transport or storage.

#### 3.15.1 Core Concept

Web3 Chat is the sole messaging transport for FundBrave's messenger (`/messenger`). All messages are sent peer-to-peer via Waku. When the P2P connection is unavailable, messages queue locally in IndexedDB and auto-flush on reconnect. There is no centralized server relay for chat.

**Technology Stack:**

| Layer | Technology | Role |
|-------|-----------|------|
| Transport | Waku (Logos) | P2P message relay via light nodes (Filter, LightPush, Store protocols) |
| Storage | Codex (Logos) | Decentralized file storage for attachments and chat history snapshots |
| Encryption | tweetnacl (nacl-box) | Curve25519-XSalsa20-Poly1305 end-to-end encryption |
| Local Persistence | IndexedDB | Encryption keys, conversation metadata, message cache |

**Value Proposition:**

| Stakeholder | Benefit |
|-------------|---------|
| **All Users** | Private, censorship-resistant messaging with no centralized message store |
| **Campaign Creators** | Direct, verifiable communication with donors without intermediary servers |
| **Crypto-Native Users** | Wallet-based identity and encryption — no separate credentials to manage |

#### 3.15.2 Encryption Setup

Users must establish an encryption identity before sending or receiving messages. Two paths are supported:

**Path A — Wallet Signature (Preferred):**
1. User visits `/chat` with a connected wallet
2. Prompted to sign a deterministic message (no transaction, no gas)
3. Signature is used to derive a Curve25519 keypair
4. Public key is published to a Waku handshake topic for peer discovery
5. Keypair is persisted in IndexedDB for future sessions

**Path B — Temporary Wallet (Fallback):**
1. If no wallet is connected, user can generate a temporary in-browser keypair
2. Temporary key enables chat but is not recoverable across devices
3. User is prompted to connect a wallet to upgrade to a persistent identity

**Key Exchange:**

| Step | Action |
|------|--------|
| 1 | Sender fetches recipient's public key from the Waku handshake topic |
| 2 | Shared secret derived via nacl-box key agreement (Curve25519) |
| 3 | All subsequent messages encrypted with the shared secret + per-message nonce |
| 4 | Recipient decrypts using the same derived shared secret |

#### 3.15.3 User Flows

**Starting a Conversation:**
1. User opens `/chat` and clicks "New Conversation"
2. Searches by FundBrave username or wallet address
3. System resolves peer identity (FundBrave profile, ENS name, or truncated address)
4. Encryption handshake completes automatically
5. "E2E Encrypted" badge appears in the chat header
6. User sends first message

**Sending a Message:**
```
Type message → Encrypt (nacl-box) → Sign (wallet) → Encode (protobuf) → Waku LightPush → P2P network
```

**Receiving a Message:**
```
Waku Filter subscription → Decode (protobuf) → Verify signature → Decrypt (nacl-box) → Render in UI
```

**File Attachments:**
1. User selects a file in the message input
2. File is encrypted client-side
3. Encrypted file uploads to Codex, returns a CID
4. CID is embedded in the Waku message
5. Recipient downloads from Codex via CID and decrypts locally

#### 3.15.4 Offline & Reconnection Behavior

There is no centralized fallback for chat messages. When the Waku P2P connection is unavailable, the system queues messages locally and reconnects automatically.

| Condition | Behavior |
|-----------|----------|
| Waku connected | Full P2P messaging with E2E encryption |
| Waku disconnected | `WakuDisconnectedBanner` appears with outbox count; messages queue in IndexedDB |
| Waku reconnected | Outbox auto-flushes queued messages FIFO; banner disappears |
| Codex unavailable | Chat continues without file attachment support; history snapshots skipped |
| Wallet not connected | Temporary keypair offered; chat functional but not recoverable across devices |

**Self-hosted nwaku relay node:** FundBrave deploys a dedicated nwaku relay node for improved reliability. The WakuProvider connects to this node first (via `NEXT_PUBLIC_NWAKU_MULTIADDR`), falling back to the public Waku fleet if the self-hosted node is unreachable.

**Typing indicators:** Delivered over Waku as ephemeral messages on a separate content topic per conversation. They are not stored in Waku Store and expire after 4 seconds of inactivity.

#### 3.15.5 Persistence Model

Chat history is preserved through a three-tier persistence strategy, ensuring messages survive across sessions, devices, and network disruptions.

**Tier 1 — Waku Store (Short-Term):**
- Waku's built-in Store protocol retains messages for approximately 7 days
- On reconnect, the client queries Waku Store to backfill recent messages
- No additional cost or configuration

**Tier 2 — Codex Snapshots (Medium-Term):**
- Every 50 messages (or when the user closes the tab), the client creates an encrypted snapshot
- Snapshot is uploaded to Codex and the CID is stored in IndexedDB
- On new device or cleared cache, snapshots can be restored if the user has their wallet (to re-derive decryption keys)

**Tier 3 — Encrypted Backend Archive (Long-Term):**
- Periodically, encrypted chat bundles are synced to the existing backend
- Backend stores only ciphertext — cannot read message contents without the user's keys
- Enables indefinite retention for compliance and user convenience

**Deduplication:**
Messages carry a unique ID. When loading from multiple tiers, the client merges and deduplicates by message ID to prevent duplicates.

#### 3.15.6 Architecture Constraints

| Decision | Rationale |
|----------|-----------|
| Route-scoped WakuProvider (`/chat` only) | Waku light node is resource-intensive; avoids loading it on unrelated pages |
| Codex as a stateless service (not a React provider) | HTTP client with no lifecycle — instantiated on demand, no global state |
| Wallet-derived encryption keys | Deterministic keypair from wallet signature eliminates separate key management |
| IndexedDB for local state | Conversations, keys, and snapshot indices persist across browser sessions without a server |
| 1-on-1 DMs only (Phase 1) | Group chat introduces key distribution complexity; scoped out for initial release |
| Protobuf message encoding | Compact binary format reduces bandwidth over the P2P relay network |
| No Socket.IO for chat | All chat messages go through Waku exclusively; Socket.IO remains for platform notifications only |
| Self-hosted nwaku relay | Docker-deployed relay node with static peer config for sub-second reconnection |
| Typing indicators over Waku | Ephemeral LightPush messages; not persisted in Store; separate content topic |

#### 3.15.7 UI Components

**Route:** `/chat` (three-column layout matching `/messenger`)

| Component | Purpose |
|-----------|---------|
| `Web3ChatSidebar` | Conversation list with peer avatars, last message preview, unread badges |
| `Web3ChatArea` | Active conversation: header, scrollable message list, input bar |
| `Web3MessageBubble` | Individual message with encryption lock icon and verification badge |
| `Web3MessageInput` | Text input with Codex file attachment button |
| `Web3EncryptionBadge` | Visual indicator of E2E encryption state (verified, pending, unavailable) |
| `Web3ConnectionStatus` | Waku node connection status widget (connected, connecting, disconnected) |
| `Web3PeerSearchModal` | Search by wallet address or FundBrave username to start a conversation |
| `Web3FileAttachment` | File preview card with Codex download link |
| `WakuDisconnectedBanner` | Offline notification with outbox count; auto-dismisses on reconnect |
| `Web3TypingIndicator` | Animated dots shown when a peer is composing a message |

**Navbar Integration:**
- Shield icon button added between Messages and Notifications in the global navbar
- Links to `/chat`
- Unread badge sourced from cached localStorage count (Waku node is not active outside `/chat`)

#### 3.15.8 Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Peer has no published public key | Show "Waiting for encryption setup" state; allow retry |
| IndexedDB unavailable (private browsing) | Fall back to in-memory storage with session-only persistence warning |
| Large file attachment (>50 MB) | Block upload with size limit message; suggest external sharing |
| Waku node fails to connect on load | Retry with exponential backoff; show fallback banner after 3 attempts |
| Wallet disconnected mid-conversation | Preserve session keys in memory; prompt reconnection for new conversations |
| Message signature verification fails | Display "Unverified" badge on message; do not suppress content |
| Typing indicator during disconnect | Typing indicators are best-effort; silently dropped when Waku is unavailable |
| All peers offline | Messages queue in outbox; outbox count shown in banner; auto-retry on reconnect |

#### 3.15.9 Privacy & Security

- **Zero-knowledge transport:** Waku relay nodes cannot read message contents (E2E encrypted)
- **No server-side plaintext:** Backend archive stores only ciphertext
- **Forward secrecy (future):** Per-session ephemeral keys can be layered on when Waku Noise protocol stabilizes
- **Key rotation:** Users can re-sign to generate a new keypair; old messages remain readable with the old shared secret cached locally
- **Blocked users:** Blocked addresses are filtered client-side; their messages are silently dropped

#### 3.15.10 Future Considerations

**Group Chat:**
- Extends the DM model with a shared group key distributed via Waku
- Admin-managed membership with invite links
- Requires key re-distribution when members are added or removed

**Campaign Chat Rooms:**
- Dedicated chat room per campaign for donor-creator communication
- Read-only announcements from campaign creator with open Q&A thread

**Voice Messages:**
- Record, encrypt, and upload to Codex
- Embed CID in Waku message with audio MIME type metadata

---

## 4. User Flows

### 4.1 First-Time Donor Flow

```
1. User lands on campaign page (via shared link)
   - View campaign details
   - See trust signals
   - See social proof (donors, shares)

2. User clicks "Donate"
   - Modal opens with donation form
   - Preset amounts shown
   - Custom amount input available

3. User selects amount ($50)
   - Amount validated
   - Platform tip slider shown
   - Total calculated and displayed

4. User without wallet clicks "Connect Wallet"
   - Wallet options shown
   - "Don't have a wallet?" option visible
   - User selects "Pay with Card"

5. Card payment flow
   - Stripe checkout embedded
   - Card details entered
   - Billing address if required

6. Payment processing
   - Loading state with message
   - Progress indicator

7. Success state
   - Confetti animation
   - "Thank you!" message
   - Share prompt
   - Account creation prompt

8. Optional: Create account
   - Pre-filled with payment email
   - Quick signup (name, password)
   - Or "Continue as guest"

9. Post-donation
   - Email confirmation sent
   - Receipt attached
   - Return to campaign page
```

### 4.2 Campaign Creation Flow

```
1. User clicks "Start Campaign"
   - If not logged in: redirect to login
   - If not verified: prompt email verification
   - If verified: open wizard

2. Step 1: Basics
   - Enter title
   - Select category
   - Set goal amount
   - Choose duration
   - Click "Continue"

3. Step 2: Story
   - Upload cover image
   - Write description
   - Add gallery images (optional)
   - Add video (optional)
   - Click "Continue"

4. Step 3: Details
   - Select beneficiary type
   - Add location
   - Add tags
   - Configure privacy settings
   - Select receiving wallet
   - Click "Continue"

5. Step 4: Review
   - Preview campaign
   - Review checklist
   - Accept terms
   - Click "Launch Campaign"

6. Post-launch
   - Success modal
   - Share prompts
   - "What's next" tips
   - Redirect to live campaign
```

### 4.3 Wallet Connection Flow

```
1. User clicks "Connect Wallet"
   - Wallet selector modal opens
   - Detected wallets shown first

2. User selects MetaMask
   - Modal shows "Waiting for MetaMask..."
   - MetaMask popup appears

3. In MetaMask
   - User selects account(s)
   - User clicks "Connect"
   - User signs verification message

4. Connection successful
   - Modal shows success
   - Wallet address displayed
   - Balance shown
   - Modal auto-closes after 2s

5. If MetaMask not installed
   - Show installation instructions
   - Link to MetaMask website
   - QR code for mobile
```

### 4.4 Search and Discover Flow

```
1. User opens search (Cmd+K or click)
   - Search modal opens
   - Recent searches shown
   - Trending topics shown

2. User types query "animal rescue"
   - Results appear as typing
   - Grouped by type (campaigns, users, posts)

3. User clicks "See all campaigns"
   - Navigate to /search?q=animal+rescue&type=campaigns
   - Full results page loads

4. User applies filters
   - Opens filter panel
   - Selects "Verified only"
   - Sets funding range $1K-$10K
   - Clicks "Apply"

5. User sorts by "Most Funded"
   - Results re-sort
   - URL updates with sort param

6. User clicks campaign
   - Navigate to campaign page
   - Back button returns to search
```

---

## 5. TypeScript Interfaces

### 5.1 Core User Types

```typescript
// User identity and profile
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;

  // Profile
  displayName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  website?: string;

  // Social links
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };

  // Verification
  verificationTier: VerificationTier;
  verificationStatus: VerificationStatus;

  // Stats
  followerCount: number;
  followingCount: number;
  campaignCount: number;
  totalRaised: number;
  totalDonated: number;

  // Settings
  isPublicProfile: boolean;
  showDonationHistory: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

// Lightweight user reference
interface UserSummary {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  verificationTier: VerificationTier;
  isFollowing?: boolean;
}

// Authentication session
interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
```

### 5.2 Campaign Types

```typescript
// Full campaign object
interface Campaign {
  id: string;
  slug: string;
  status: CampaignStatus;

  // Content
  title: string;
  description: string;
  descriptionPlain: string;
  category: string;
  subcategory?: string;
  tags: string[];

  // Media
  coverImageUrl: string;
  coverImageAlt?: string;
  galleryImages: CampaignImage[];
  videoUrl?: string;

  // Funding
  goalAmount: number;
  currency: string;
  amountRaised: number;
  donorCount: number;

  // Timeline
  createdAt: Date;
  publishedAt?: Date;
  endsAt?: Date;
  updatedAt: Date;

  // Beneficiary
  beneficiaryType: 'self' | 'individual' | 'organization';
  beneficiaryName?: string;

  // Location
  location: CampaignLocation;

  // Settings
  allowComments: boolean;
  allowAnonymousDonations: boolean;
  showDonorNames: boolean;
  showDonorAmounts: boolean;

  // Blockchain
  receiveWalletAddress: string;

  // Verification
  verificationStatus: VerificationStatus;
  verificationTier: VerificationTier;

  // Creator
  creatorId: string;
  creator: UserSummary;

  // Engagement
  viewCount: number;
  shareCount: number;
  commentCount: number;
  bookmarkCount: number;

  // Computed
  percentFunded: number;
  daysRemaining?: number;
  isActive: boolean;
  isFeatured: boolean;
}

type CampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'suspended';

interface CampaignLocation {
  city?: string;
  state?: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface CampaignImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt?: string;
  width: number;
  height: number;
  order: number;
}

// Campaign summary for lists/cards
interface CampaignSummary {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string;
  category: string;
  goalAmount: number;
  amountRaised: number;
  donorCount: number;
  percentFunded: number;
  daysRemaining?: number;
  creator: UserSummary;
  verificationTier: VerificationTier;
  isActive: boolean;
}
```

### 5.3 Donation Types

```typescript
// Donation record
interface Donation {
  id: string;
  campaignId: string;
  donorId?: string; // null for anonymous

  // Amount
  amount: number;
  currency: string;
  tipAmount: number;
  totalAmount: number;

  // Crypto details
  cryptoAmount?: number;
  cryptoCurrency?: CryptoType;
  exchangeRate?: number;

  // Transaction
  transactionHash?: string;
  chainId?: number;
  walletAddress?: string;

  // Payment (for card)
  stripePaymentId?: string;

  // Display
  isAnonymous: boolean;
  displayName?: string;
  message?: string;

  // Status
  status: DonationStatus;

  // Timestamps
  createdAt: Date;
  confirmedAt?: Date;
}

type DonationStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'failed'
  | 'refunded';

type CryptoType = 'ETH' | 'BTC' | 'USDC' | 'USDT' | 'MATIC' | 'SOL';

// Donation for display in lists
interface DonationDisplay {
  id: string;
  amount: number;
  currency: string;
  displayName: string;
  avatarUrl?: string;
  message?: string;
  isAnonymous: boolean;
  createdAt: Date;
}
```

### 5.4 Notification Types

```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Content
  title: string;
  body: string;
  imageUrl?: string;

  // Action
  actionUrl?: string;
  actionLabel?: string;

  // Metadata
  metadata: Record<string, unknown>;

  // State
  isRead: boolean;
  isArchived: boolean;

  // Grouping
  groupId?: string;

  // Timestamps
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

type NotificationCategory =
  | 'campaign'
  | 'donation'
  | 'social'
  | 'system'
  | 'security';

type NotificationType =
  | 'donation_received'
  | 'donation_confirmed'
  | 'milestone_reached'
  | 'campaign_update'
  | 'comment_new'
  | 'comment_reply'
  | 'follow_new'
  | 'mention'
  | 'security_login'
  | 'security_password'
  // ... etc
```

### 5.5 Settings Types

```typescript
interface UserSettings {
  // Profile
  profile: ProfileSettings;

  // Notifications
  notifications: NotificationSettings;

  // Privacy
  privacy: PrivacySettings;

  // Appearance
  appearance: AppearanceSettings;

  // Security
  security: SecuritySettings;
}

interface ProfileSettings {
  displayName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  website?: string;
  socialLinks: SocialLinks;
  isPublicProfile: boolean;
  showDonationHistory: boolean;
  showSupportedCampaigns: boolean;
}

interface NotificationSettings {
  email: {
    donations: EmailFrequency;
    milestones: EmailFrequency;
    comments: EmailFrequency;
    followers: EmailFrequency;
    updates: EmailFrequency;
    security: EmailFrequency;
    marketing: EmailFrequency;
    productUpdates: EmailFrequency;
  };
  push: {
    enabled: boolean;
    donations: boolean;
    milestones: boolean;
    comments: boolean;
    followers: boolean;
    updates: boolean;
    security: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "07:00"
    timezone: string;
  };
}

type EmailFrequency = 'instant' | 'daily' | 'weekly' | 'off';

interface PrivacySettings {
  profileVisibility: 'public' | 'followers_only' | 'private';
  showInSearch: boolean;
  showInLeaderboards: boolean;
  donationVisibility: 'public' | 'campaign_only' | 'private';
  allowDMs: 'everyone' | 'followers' | 'verified' | 'none';
  showOnlineStatus: boolean;
  allowTagging: 'everyone' | 'followers' | 'none';
  dataSharing: {
    analytics: boolean;
    personalization: boolean;
    thirdParty: boolean;
  };
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  reducedMotion: boolean;
  highContrast: boolean;
  language: string;
  currency: string;
  cryptoDisplay: 'symbol' | 'name' | 'both';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: string;
}

interface SecuritySettings {
  twoFactor: {
    enabled: boolean;
    method: 'authenticator' | 'sms' | 'hardware';
    backupCodesRemaining: number;
  };
  sessions: Session[];
  loginHistory: LoginAttempt[];
}
```

### 5.6 Wallet Types

```typescript
interface ConnectedWallet {
  id: string;
  address: string;
  ensName?: string;
  chainId: number;
  walletType: WalletType;
  isVerified: boolean;
  isPrimary: boolean;
  label?: string;
  addedAt: Date;
  lastUsedAt: Date;
}

type WalletType =
  | 'metamask'
  | 'coinbase'
  | 'rainbow'
  | 'trust'
  | 'phantom'
  | 'walletconnect'
  | 'other';

interface WalletTransaction {
  id: string;
  type: 'donation_in' | 'donation_out' | 'withdrawal' | 'tip' | 'refund';
  amount: number;
  currency: string;
  cryptoAmount?: number;
  cryptoCurrency?: CryptoType;
  campaignId?: string;
  campaignTitle?: string;
  fromAddress?: string;
  toAddress?: string;
  transactionHash?: string;
  chainId?: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  confirmedAt?: Date;
}

interface WithdrawalRequest {
  id: string;
  campaignId: string;
  amount: number;
  currency: string;
  method: 'crypto_same_chain' | 'crypto_bridge' | 'fiat_stripe' | 'fiat_wire';
  destinationAddress?: string;
  bankAccountId?: string;
  fees: number;
  netAmount: number;
  status: WithdrawalStatus;
  createdAt: Date;
  processedAt?: Date;
}

type WithdrawalStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'reversed';
```

---

## 6. Error Messages & Validation

### 6.1 Form Validation Rules

**Display Name:**
```typescript
const displayNameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores');
```

**Username:**
```typescript
const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
  .refine(async (val) => await checkUsernameAvailable(val), 'Username is already taken');
```

**Email:**
```typescript
const emailSchema = z.string()
  .email('Please enter a valid email address')
  .refine(async (val) => await checkEmailAvailable(val), 'An account with this email already exists');
```

**Password:**
```typescript
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
```

**Campaign Title:**
```typescript
const campaignTitleSchema = z.string()
  .min(10, 'Title must be at least 10 characters')
  .max(80, 'Title must be less than 80 characters')
  .refine((val) => !containsProfanity(val), 'Title contains inappropriate language');
```

**Campaign Description:**
```typescript
const campaignDescriptionSchema = z.string()
  .min(100, 'Description must be at least 100 characters to help donors understand your cause')
  .max(10000, 'Description must be less than 10,000 characters');
```

**Goal Amount:**
```typescript
const goalAmountSchema = z.number()
  .min(100, 'Minimum goal is $100')
  .max(10000000, 'Maximum goal is $10,000,000');
```

**Donation Amount:**
```typescript
const donationAmountSchema = z.number()
  .min(1, 'Minimum donation is $1')
  .max(1000000, 'Maximum single donation is $1,000,000');
```

### 6.2 API Error Responses

```typescript
interface APIError {
  code: string;
  message: string;
  details?: Record<string, string>;
  timestamp: string;
  requestId: string;
}

// Common error codes
const ERROR_CODES = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_EMAIL_NOT_VERIFIED: 'Please verify your email to continue',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',

  // Validation
  VALIDATION_FAILED: 'Please check your input and try again',
  VALIDATION_REQUIRED_FIELD: 'This field is required',
  VALIDATION_INVALID_FORMAT: 'Invalid format',

  // Campaign
  CAMPAIGN_NOT_FOUND: 'Campaign not found',
  CAMPAIGN_NOT_ACTIVE: 'This campaign is no longer accepting donations',
  CAMPAIGN_GOAL_EXCEEDED: 'This campaign has reached its funding goal',

  // Donation
  DONATION_FAILED: 'Donation could not be processed. Please try again.',
  DONATION_INSUFFICIENT_BALANCE: 'Insufficient balance in connected wallet',
  DONATION_TRANSACTION_REJECTED: 'Transaction was rejected',

  // Wallet
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  WALLET_WRONG_NETWORK: 'Please switch to a supported network',
  WALLET_SIGNATURE_REJECTED: 'Signature request was rejected',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment.',

  // Server
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;
```

### 6.3 User-Facing Error States

**Empty States:**
```typescript
const EMPTY_STATES = {
  campaigns: {
    title: 'No campaigns found',
    description: 'Try adjusting your search or filters',
    action: 'Clear filters',
  },
  donations: {
    title: 'No donations yet',
    description: 'Be the first to support this campaign!',
    action: 'Donate now',
  },
  notifications: {
    title: 'No notifications',
    description: 'When something happens, you\'ll see it here',
    action: null,
  },
  bookmarks: {
    title: 'No saved campaigns',
    description: 'Save campaigns to find them later',
    action: 'Discover campaigns',
  },
  searchResults: {
    title: 'No results found',
    description: 'Try different keywords or check your spelling',
    action: 'Clear search',
  },
};
```

**Loading States:**
```typescript
const LOADING_MESSAGES = {
  campaigns: 'Loading campaigns...',
  donation: 'Processing your donation...',
  wallet: 'Connecting wallet...',
  transaction: 'Waiting for confirmation...',
  upload: 'Uploading image...',
  save: 'Saving changes...',
};
```

---

## 7. Animation Specifications

### 7.1 Animation Tokens

From `globals.css`:
```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-snappy: cubic-bezier(0.2, 0, 0, 1);
--ease-fluid: cubic-bezier(0.3, 0, 0, 1);
--duration-quick: 120ms;
--duration-fast: 180ms;
--duration-base: 240ms;
--duration-slow: 360ms;
```

### 7.2 Micro-Interactions

**Button Press:**
```typescript
const buttonPress = {
  scale: 0.97,
  duration: 'var(--duration-quick)',
  ease: 'var(--ease-snappy)',
};
```

**Like Animation:**
```typescript
const likeAnimation = {
  // Heart icon sequence
  keyframes: [
    { scale: 1, color: 'currentColor' },
    { scale: 1.3, color: 'var(--destructive)' },
    { scale: 0.9, color: 'var(--destructive)' },
    { scale: 1, color: 'var(--destructive)' },
  ],
  duration: 'var(--duration-base)',
  ease: 'var(--ease-snappy)',
};
```

**Bookmark Animation:**
```typescript
const bookmarkAnimation = {
  keyframes: [
    { y: 0 },
    { y: -4 },
    { y: 0 },
  ],
  duration: 'var(--duration-fast)',
  ease: 'var(--ease-snappy)',
};
```

### 7.3 Page Transitions

**Route Change:**
```typescript
const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1],
  },
};
```

**Modal Enter:**
```typescript
const modalEnter = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
};
```

**Bottom Sheet:**
```typescript
const bottomSheet = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: {
    type: 'spring',
    damping: 30,
    stiffness: 300,
  },
};
```

### 7.4 Loading Animations

**Skeleton Shimmer:**
```css
@keyframes campaign-skeleton-wave {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.campaign-skeleton::before {
  animation: campaign-skeleton-wave 1.5s ease-in-out infinite;
}
```

**Progress Bar Shimmer:**
```css
@keyframes campaign-progress-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.campaign-progress-shimmer::after {
  animation: campaign-progress-shimmer 2s ease-in-out infinite;
}
```

**Spinner:**
```typescript
const spinnerAnimation = {
  animate: { rotate: 360 },
  transition: {
    duration: 1,
    ease: 'linear',
    repeat: Infinity,
  },
};
```

### 7.5 Celebration Animations

**Confetti (canvas-confetti):**
```typescript
const celebrationConfetti = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#450cf0', '#8762fa', '#cd82ff'],
};
```

**Milestone Reached:**
```typescript
const milestoneAnimation = {
  // Number counter animation
  counter: {
    from: previousValue,
    to: newValue,
    duration: 2,
    ease: 'power2.out',
  },
  // Badge entrance
  badge: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: 'spring', damping: 10 },
  },
};
```

### 7.6 Reduced Motion

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getAnimation = (animation: AnimationConfig) => {
  if (prefersReducedMotion) {
    return {
      ...animation,
      duration: 0,
      transition: { duration: 0 },
    };
  }
  return animation;
};
```

---

## 8. Competitive Analysis Summary

### 8.1 Platform Comparison

| Feature | FundBrave | GoFundMe | Kickstarter | Gitcoin |
|---------|-----------|----------|-------------|---------|
| **Fees** | 2-5% | 2.9% + $0.30 | 5% + 3-5% payment | 5% + gas |
| **Crypto Support** | Native | No | No | Native |
| **Multi-Chain** | Yes | No | No | Limited |
| **Social Features** | Rich | Basic | Updates only | Basic |
| **Verification** | Tiered | Basic | Project review | On-chain |
| **Mobile App** | PWA + Native | Native | Native | Web only |
| **Global** | Yes | Limited | Limited | Yes |

### 8.2 UX Benchmarks

**GoFundMe Strengths:**
- Extremely simple campaign creation (5 min)
- Strong trust signals (verified badge prominent)
- Excellent mobile experience
- Good social sharing

**GoFundMe Weaknesses:**
- Limited customization
- High fees for international
- No crypto support

**Kickstarter Strengths:**
- Project categories well-defined
- Community features (comments, updates)
- Milestone/reward system

**Kickstarter Weaknesses:**
- All-or-nothing model only
- Complex project requirements
- Limited campaign types

**Gitcoin Strengths:**
- Quadratic funding model
- Strong crypto community
- Grant matching

**Gitcoin Weaknesses:**
- Crypto-only (high barrier)
- Complex UX
- Web3 jargon heavy

### 8.3 Opportunity Areas

1. **Bridge Crypto-Fiat Gap:** Accept both with equal UX quality
2. **Richer Social Layer:** More engagement than competitors
3. **Better Creator Tools:** Analytics, updates, donor management
4. **Mobile-First Web3:** Make crypto donations mobile-friendly
5. **Trust at Scale:** Multi-tier verification system

---

## 9. Implementation Priority Matrix

### 9.1 Priority Levels

| Priority | Description | Timeline |
|----------|-------------|----------|
| P0 | Critical path, launch blocker | Week 1-2 |
| P1 | Important, high impact | Week 3-4 |
| P2 | Nice to have, medium impact | Month 2 |
| P3 | Future consideration | Month 3+ |

### 9.2 Feature Priorities

| Feature | Priority | Effort | Impact | Dependencies |
|---------|----------|--------|--------|--------------|
| **Settings - Profile** | P0 | M | High | Auth |
| **Settings - Account** | P0 | M | High | Auth |
| **Settings - Notifications** | P1 | L | Medium | Notifications |
| **Settings - Privacy** | P1 | M | Medium | - |
| **Settings - Appearance** | P2 | L | Low | - |
| **Settings - Billing** | P1 | H | High | Stripe |
| **Settings - Security** | P0 | H | Critical | Auth, 2FA |
| **Wallet - Basic Connect** | P0 | M | Critical | Web3 libs |
| **Wallet - Multi-wallet** | P1 | M | Medium | Basic connect |
| **Wallet - Transaction History** | P1 | M | Medium | Donations |
| **Wallet - Withdrawals** | P0 | H | Critical | KYC, Banking |
| **Notifications - In-app** | P0 | M | High | - |
| **Notifications - Email** | P0 | M | High | SendGrid |
| **Notifications - Push** | P1 | M | Medium | - |
| **Search - Basic** | P0 | M | High | Search index |
| **Search - Filters** | P1 | M | Medium | Basic search |
| **Search - Recommendations** | P2 | H | Medium | ML pipeline |
| **Campaign Creation** | P0 | H | Critical | - |
| **Campaign - Updates** | P0 | L | High | Campaigns |
| **Campaign - Verification** | P1 | H | High | KYC |
| **Bookmarks - Basic** | P1 | L | Medium | - |
| **Bookmarks - Collections** | P2 | M | Low | Basic bookmarks |
| **Onboarding** | P0 | M | High | Auth |
| **Trust - Verification Tiers** | P1 | H | High | KYC |
| **Trust - Reporting** | P1 | M | Medium | - |
| **Social - Follow** | P0 | L | High | - |
| **Social - Posts** | P1 | M | Medium | - |
| **Social - Comments** | P0 | M | High | - |
| **Social - DMs** | P3 | H | Low | - |
| **Mobile Optimization** | P0 | M | Critical | - |
| **Accessibility** | P0 | M | High | - |
| **i18n - English** | P0 | L | Critical | - |
| **i18n - Other Languages** | P2 | M | Medium | i18n framework |
| **404 Pages - Campaign Not Found** | P0 | L | High | Campaigns |
| **404 Pages - Profile Not Found** | P0 | L | High | Profiles |
| **404 Pages - Generic** | P0 | L | High | - |
| **Donation + Staking Flow** | P0 | H | Critical | Wallet, Smart Contracts |

### 9.3 Sprint Roadmap

**Sprint 1-2 (P0 - Core):**
- User authentication with NextAuth
- Basic profile settings
- Campaign creation wizard
- Campaign viewing/donation
- Basic wallet connection (MetaMask)
- Mobile responsive layouts
- Core accessibility
- 404 page handling (Campaign, Profile, Generic variants)
- Donation + Staking flow with allocation slider

**Sprint 3-4 (P0/P1 - Essential):**
- Notification system (in-app + email)
- Basic search functionality
- Follow system
- Comments on campaigns
- Security settings (2FA)
- Withdrawal flow (crypto)

**Sprint 5-6 (P1 - Enhancement):**
- Multi-wallet support
- Transaction history
- Search filters
- Privacy settings
- Campaign verification (basic)
- Bookmarks

**Sprint 7-8 (P2 - Polish):**
- Recommendation engine
- Collections
- Posts/social feed
- Appearance settings
- Additional languages
- Advanced analytics

---

## 10. Open Questions

### 10.1 Product Questions

| ID | Question | Status | Owner |
|----|----------|--------|-------|
| OQ-01 | What is the fee structure for different payment methods? | Open | Product |
| OQ-02 | Should campaigns have an "all-or-nothing" option like Kickstarter? | Open | Product |
| OQ-03 | How do we handle refunds for failed campaigns? | Open | Product/Legal |
| OQ-04 | What verification documents are required for Enhanced tier? | Open | Trust & Safety |
| OQ-05 | Should donors be able to request refunds? Under what conditions? | Open | Product/Legal |
| OQ-06 | How do we handle campaigns for minors? | Open | Legal |
| OQ-07 | What's the moderation policy for campaign content? | Open | Trust & Safety |
| OQ-08 | Should we implement matching funds/grants? | Open | Product |
| OQ-09 | How do we handle multi-currency campaigns? | Open | Product |
| OQ-10 | What's the dispute resolution process? | Open | Legal |

### 10.2 Technical Questions

| ID | Question | Status | Owner |
|----|----------|--------|-------|
| TQ-01 | Which search infrastructure? (Algolia vs Elasticsearch vs Typesense) | Open | Engineering |
| TQ-02 | How do we handle blockchain reorgs affecting donations? | Open | Engineering |
| TQ-03 | What's the caching strategy for campaign data? | Open | Engineering |
| TQ-04 | How do we ensure real-time updates across clients? | Open | Engineering |
| TQ-05 | What's the backup strategy for user data? | Open | Engineering |
| TQ-06 | How do we handle gas estimation for donations? | Open | Engineering |
| TQ-07 | What's the strategy for handling failed webhook deliveries? | Open | Engineering |
| TQ-08 | How do we scale image storage and CDN? | Open | Engineering |
| TQ-09 | What monitoring/alerting do we need for transactions? | Open | Engineering |
| TQ-10 | How do we handle schema migrations with active users? | Open | Engineering |

### 10.3 Business Questions

| ID | Question | Status | Owner |
|----|----------|--------|-------|
| BQ-01 | What regions are we launching in first? | Open | Business |
| BQ-02 | What's the revenue model for the platform tip? | Open | Business |
| BQ-03 | Do we need money transmitter licenses? In which states/countries? | Open | Legal |
| BQ-04 | What's the customer support model? (Chat, email, phone?) | Open | Operations |
| BQ-05 | How do we handle tax reporting for different jurisdictions? | Open | Legal/Finance |
| BQ-06 | What's the fraud prevention budget? | Open | Finance |
| BQ-07 | Do we need partnerships with specific wallets? | Open | Business Dev |
| BQ-08 | What's the marketing strategy for launch? | Open | Marketing |
| BQ-09 | How do we handle enterprise/nonprofit accounts? | Open | Business |
| BQ-10 | What's the SLA for platform availability? | Open | Operations |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Campaign** | A fundraising project created by a user |
| **Creator** | A user who creates campaigns |
| **Donor** | A user who makes donations |
| **Beneficiary** | The person/organization receiving campaign funds |
| **Verification Tier** | Level of identity/cause verification |
| **Wallet** | A cryptocurrency wallet address |
| **Chain** | A blockchain network (Ethereum, Polygon, etc.) |
| **Gas** | Transaction fee on blockchain networks |
| **ENS** | Ethereum Name Service (human-readable addresses) |
| **Milestone** | A campaign funding target (25%, 50%, etc.) |
| **Update** | A campaign progress post from creator |
| **Collection** | A user-created group of bookmarked campaigns |
| **Feed** | The personalized home timeline |
| **Discovery** | The explore/search section |

---

## Appendix B: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-01 | Product Team | Initial specification |
| 1.1.0 | 2025-12-15 | Product Team | Added wallet management details |
| 2.0.0 | 2026-01-08 | Principal Product Architect | Complete rewrite with full feature specs |
| 2.1.0 | 2026-01-10 | Principal Product Architect | Added 404 Page Handling (3.13) and Donation + Staking Flow (3.14) P0 features |

---

## Appendix C: Related Documents

- [CLAUDE.md](/CLAUDE.md) - Project setup and conventions
- [globals.css](/packages/frontend/app/globals.css) - Design tokens
- [types/donation.ts](/packages/frontend/types/donation.ts) - Existing donation types
- Backend API Specification (TBD)
- Smart Contract Documentation (TBD)
- Design System Figma (External)

---

## Appendix D: Broken Routes Audit

This section documents the results of a route audit performed to identify broken or invalid routes referenced throughout the codebase.

### D.1 Existing Pages (15 routes)

The following `page.tsx` files are currently implemented in the application:

| Route | File Location |
|-------|---------------|
| `/` | `app/page.tsx` |
| `/auth/login` | `app/auth/login/page.tsx` |
| `/auth/signup` | `app/auth/signup/page.tsx` |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` |
| `/campaigns` | `app/campaigns/page.tsx` |
| `/campaigns/[id]` | `app/campaigns/[id]/page.tsx` |
| `/campaigns/create` | `app/campaigns/create/page.tsx` |
| `/community` | `app/community/page.tsx` |
| `/messenger` | `app/messenger/page.tsx` |
| `/notifications` | `app/notifications/page.tsx` |
| `/onboarding` | `app/onboarding/page.tsx` |
| `/profile/[username]` | `app/profile/[username]/page.tsx` |
| `/settings` | `app/settings/page.tsx` |
| `/settings/profile` | `app/settings/profile/page.tsx` |
| `/leaderboard` | `app/leaderboard/page.tsx` |

### D.2 Invalid Routes Found

The following table documents broken routes that were discovered during the audit:

| Route | Referenced In | Line | Severity | Status |
|-------|---------------|------|----------|--------|
| `/forgot-password` | `auth/login/page.tsx` | 221 | Critical | Fixed |
| `/forgot-password` | `auth/signup/page.tsx` | 268 | Critical | Fixed |
| `/settings` | `Navbar.tsx` | 394, 561 | Critical | Fixed |
| `/settings/profile` | `profile/[username]/page.tsx` | 164 | High | Fixed |
| `/campaigns/create` | `Navbar.tsx` | 289, 542 | Critical | Fixed |
| `/profile` | `Navbar.tsx` | 380, 577 | High | Needs dynamic username |
| `/messages` | `Navbar.tsx` | 569 | Medium | Fixed (typo corrected to /messenger) |

### D.3 Severity Levels

| Severity | Description |
|----------|-------------|
| **Critical** | Core navigation broken; users cannot access essential features |
| **High** | Important feature inaccessible; workaround may exist |
| **Medium** | Minor inconvenience; feature accessible via alternative path |
| **Low** | Cosmetic or edge case issue |

### D.4 Recommendations

1. **Regular Route Audits**: Conduct route audits at the end of each sprint to catch broken links early in the development cycle.

2. **CI/CD Route Validation**: Add automated route validation to the CI/CD pipeline:
   - Extract all `href` values from Link components
   - Validate against existing `page.tsx` files
   - Fail builds on broken routes (with override for work-in-progress features)

3. **Routes Manifest File**: Create a centralized `routes.ts` manifest file:
   ```typescript
   // packages/frontend/lib/routes.ts
   export const ROUTES = {
     HOME: '/',
     AUTH: {
       LOGIN: '/auth/login',
       SIGNUP: '/auth/signup',
       FORGOT_PASSWORD: '/auth/forgot-password',
     },
     CAMPAIGNS: {
       LIST: '/campaigns',
       CREATE: '/campaigns/create',
       DETAIL: (id: string) => `/campaigns/${id}`,
     },
     PROFILE: (username: string) => `/profile/${username}`,
     SETTINGS: {
       ROOT: '/settings',
       PROFILE: '/settings/profile',
     },
     MESSENGER: '/messenger',
     NOTIFICATIONS: '/notifications',
     // ... etc
   } as const;
   ```

4. **Type-Safe Navigation**: Use the routes manifest with TypeScript for compile-time route validation.

5. **Link Component Wrapper**: Consider a custom Link wrapper that validates routes at development time.

---

*This document is maintained by the Product Architecture team. For questions or suggestions, please open an issue or reach out to the maintainers.*
