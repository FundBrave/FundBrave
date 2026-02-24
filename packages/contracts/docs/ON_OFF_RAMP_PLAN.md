# FundBrave On-Ramp & Off-Ramp Implementation Plan

## Overview

Enable users to donate, wealth-build, and stake using bank cards (credit/debit), and allow fundraisers and users to withdraw crypto assets (USDC) to traditional bank accounts.

---

## Research Summary

### Provider Evaluation

| Provider | Base | USDC | On-Ramp | Off-Ramp | Fees | Integration | Coverage |
|----------|------|------|---------|----------|------|-------------|----------|
| **Coinbase Onramp** | Yes | Yes | Yes | Yes | **0% USDC** | SDK/Widget | 160+ countries |
| **Transak** | Yes | Yes | Yes | Yes (Stream) | ~1% | Widget/API/SDK | 185+ countries |
| **Ramp Network** | Yes | Yes | Yes | Yes | 0.49-2.9% | Widget/SDK | Global |
| **MoonPay** | Yes | Yes | Yes | Yes | 1-4.5% | Widget/API | 160+ countries |
| **Onramper** | Aggregator | Yes | Yes | Yes | Varies (best price routing) | Widget | 175+ (30+ providers) |
| **Alchemy Pay** | Yes | Yes | Yes | Indirect | 0% (campaign) | Widget/API | 173 countries |

### Recommended Stack

1. **Primary On-Ramp: Coinbase Onramp** — Zero fees on USDC, direct-to-contract deposits, best for user acquisition
2. **Primary Off-Ramp: Transak Stream** — Purpose-built crypto-to-fiat, direct to bank accounts, 185+ countries
3. **Fallback Aggregator: Onramper** — 30+ providers, smart routing, maximizes success rates

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────┐
│                    FundBrave Frontend                     │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Donation    │  │ Wealth Build │  │   Staking      │  │
│  │  Tab         │  │ Tab          │  │   Tab          │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
│         └────────┬────────┴──────┬────────────┘           │
│                  │               │                        │
│         ┌───────▼───────┐  ┌────▼──────────┐             │
│         │ PaymentMethod │  │  Withdrawal   │             │
│         │ Selector      │  │  Dashboard    │             │
│         └───────┬───────┘  └──────┬────────┘             │
│                 │                  │                      │
│    ┌────────────┼──────────┐      │                      │
│    │            │          │      │                      │
│ ┌──▼──┐  ┌─────▼────┐ ┌───▼──┐ ┌─▼──────────┐          │
│ │Crypto│  │Card/Fiat │ │Aggre-│ │ Off-Ramp   │          │
│ │Flow  │  │(Coinbase)│ │gator │ │ (Transak)  │          │
│ │(cur.)│  │          │ │      │ │            │          │
│ └──┬───┘  └────┬─────┘ └──┬───┘ └──┬─────────┘          │
└────┼───────────┼──────────┼────────┼─────────────────────┘
     │           │          │        │
     │    ┌──────▼──────┐ ┌─▼──────┐ │
     │    │ Coinbase    │ │Onramper│ │
     │    │ Onramp SDK  │ │Widget  │ │
     │    └──────┬──────┘ └──┬─────┘ │
     │           │           │       │
     │    ┌──────▼───────────▼──┐    │
     │    │  USDC on Base       │    │
     │    └──────────┬──────────┘    │
     │               │               │
     └───────┬───────┘               │
             │                       │
     ┌───────▼───────────────┐  ┌────▼──────────┐
     │  FundraiserFactory    │  │ Transak Stream │
     │  (donate/stake/WB)    │  │ (crypto→fiat)  │
     └───────────────────────┘  └───────────────┘
```

### Smart Contract Layer

**No core contract changes needed.** The on-ramp providers handle the fiat-to-USDC conversion off-chain and deliver USDC to a wallet address. The existing contract flow (approve → donateERC20/stakeERC20/donateWealthBuilding) works as-is.

For **direct-to-contract deposits** (optional Phase 2 enhancement):

```solidity
// New: FiatRelayer.sol (optional, Phase 2)
// Receives USDC from on-ramp provider and routes to the correct action
contract FiatRelayer {
    FundraiserFactory public factory;
    IERC20 public usdc;

    struct PendingAction {
        address user;
        uint256 fundraiserId;
        uint256 amount;
        ActionType actionType; // DONATE, STAKE, WEALTH_BUILD
    }

    // On-ramp webhook calls this after USDC delivery
    function executeAction(bytes32 orderId, PendingAction calldata action) external;
}
```

### Frontend Components

```
packages/test-frontend/
├── components/
│   ├── OnRampWidget.tsx          # Coinbase Onramp embed
│   ├── OnRampAggregator.tsx      # Onramper fallback widget
│   ├── OffRampWidget.tsx         # Transak Stream embed
│   ├── PaymentMethodSelector.tsx # Card vs Crypto toggle
│   └── WithdrawalDashboard.tsx   # Fundraiser withdrawal UI
├── hooks/
│   ├── useOnRamp.ts              # On-ramp state management
│   ├── useOffRamp.ts             # Off-ramp state management
│   └── usePaymentMethod.ts       # Payment method preference
├── lib/
│   └── onramp-config.ts          # Provider configs, API keys
└── app/
    └── campaigns/
        └── [id]/
            └── withdraw/
                └── page.tsx       # Off-ramp withdrawal page
```

---

## Implementation Phases

### Phase 1: On-Ramp MVP (1-2 weeks)

**Goal:** Users can donate/wealth-build/stake with bank cards via Coinbase Onramp.

#### Step 1.1: Coinbase Onramp Integration

```tsx
// Install: npm install @coinbase/onramp-sdk
// Or use the hosted URL approach (simpler)

// OnRampWidget.tsx
interface OnRampProps {
  destinationAddress: string;    // User's wallet or contract
  amount: number;                // USD amount
  onSuccess: (txHash: string) => void;
  onFailure: (error: string) => void;
}

// Coinbase Onramp URL approach (simplest):
const coinbaseOnrampUrl = new URL("https://pay.coinbase.com/buy/select-asset");
coinbaseOnrampUrl.searchParams.set("appId", COINBASE_APP_ID);
coinbaseOnrampUrl.searchParams.set("destinationWallets", JSON.stringify([{
  address: userAddress,
  assets: ["USDC"],
  supportedNetworks: ["base"]
}]));
coinbaseOnrampUrl.searchParams.set("defaultAsset", "USDC");
coinbaseOnrampUrl.searchParams.set("defaultNetwork", "base");
coinbaseOnrampUrl.searchParams.set("presetFiatAmount", amount.toString());
```

#### Step 1.2: Payment Method Selector in DonationTabs

Update `DonationTabs.tsx` to add a "Pay with Card" option alongside the existing crypto flow:

```tsx
// Add to each tab (Donate, Wealth Build, Stake)
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setPaymentMethod('crypto')}
    className={paymentMethod === 'crypto' ? 'active' : ''}
  >
    💰 Pay with Crypto
  </button>
  <button
    onClick={() => setPaymentMethod('card')}
    className={paymentMethod === 'card' ? 'active' : ''}
  >
    💳 Pay with Card
  </button>
</div>

{paymentMethod === 'card' && (
  <OnRampWidget
    destinationAddress={address}
    amount={parseFloat(amount)}
    onSuccess={handleOnRampSuccess}
  />
)}
```

#### Step 1.3: Post-Purchase Flow

After the user buys USDC via card:
1. USDC arrives in their wallet
2. Show "USDC received! Complete your donation" prompt
3. Auto-populate the amount field
4. User approves and executes the on-chain transaction (same existing flow)

**Alternative (better UX):** Use Coinbase's `onrampToken` callback to auto-execute the contract call after USDC delivery.

#### Step 1.4: Env Configuration

```env
# .env.local additions
NEXT_PUBLIC_COINBASE_ONRAMP_APP_ID=your_app_id
NEXT_PUBLIC_ONRAMP_ENABLED=true
```

### Phase 2: Off-Ramp for Fundraisers (2-3 weeks)

**Goal:** Fundraisers can withdraw USDC to their bank accounts.

#### Step 2.1: Withdrawal Dashboard

Create `/campaigns/[id]/withdraw` page for campaign beneficiaries:

```tsx
// WithdrawalDashboard.tsx
// Shows: campaign balance, pending withdrawals, withdrawal history

interface WithdrawalDashboardProps {
  fundraiserId: number;
  beneficiaryAddress: string;
  availableBalance: bigint;
}

// Flow:
// 1. Beneficiary connects wallet
// 2. Shows available balance from campaign contract
// 3. Clicks "Withdraw to Bank"
// 4. Campaign contract sends USDC to beneficiary wallet
// 5. Opens Transak Stream widget for crypto-to-fiat
```

#### Step 2.2: Transak Stream Integration

```tsx
// Install: npm install @transak/transak-sdk
import transakSDK from '@transak/transak-sdk';

const transak = new transakSDK({
  apiKey: TRANSAK_API_KEY,
  environment: 'STAGING', // or 'PRODUCTION'
  cryptoCurrencyCode: 'USDC',
  network: 'base',
  defaultCryptoAmount: withdrawAmount,
  walletAddress: beneficiaryAddress,
  disableWalletAddressForm: true,
  isFeeCalculationHidden: false,
  // Off-ramp specific:
  exchangeScreenTitle: 'Withdraw to Bank',
  productsAvailed: 'SELL',  // Off-ramp only
});

transak.init();
```

#### Step 2.3: Withdrawal Contract Enhancement (Optional)

If needed, add a batched withdrawal function to the Fundraiser contract:

```solidity
// In Fundraiser.sol - add withdrawal tracking
mapping(address => uint256) public withdrawalHistory;

event WithdrawalInitiated(
    address indexed beneficiary,
    uint256 amount,
    string offRampProvider
);
```

### Phase 3: Aggregation & Optimization (3-4 weeks)

**Goal:** Maximize on-ramp success rates, add regional fallbacks.

#### Step 3.1: Onramper Aggregation Widget

```tsx
// Fallback when Coinbase Onramp fails or for unsupported regions
import { OnramperWidget } from '@onramper/widget';

<OnramperWidget
  apiKey={ONRAMPER_API_KEY}
  defaultCrypto="USDC_BASE"
  wallets={{ USDC_BASE: userAddress }}
  color={brandColor}
  onSuccess={handleOnRampSuccess}
  onClose={handleClose}
/>
```

#### Step 3.2: Smart Provider Routing

```tsx
// usePaymentMethod.ts
function selectBestProvider(userRegion: string): 'coinbase' | 'onramper' | 'ramp' {
  // Coinbase: Best for US/EU (zero fees)
  if (['US', 'EU', 'UK', 'CA'].includes(userRegion)) return 'coinbase';
  // Ramp: Best for Africa/LATAM
  if (['NG', 'KE', 'GH', 'ZA', 'BR', 'MX'].includes(userRegion)) return 'ramp';
  // Onramper: Fallback aggregator
  return 'onramper';
}
```

#### Step 3.3: Analytics & Monitoring

Track on-ramp/off-ramp metrics:
- Conversion rate per provider
- Average time to complete
- Failure reasons
- Regional success rates

---

## Key Implementation Details

### 1. Coinbase Onramp SDK Setup

```bash
# Register at https://portal.cdp.coinbase.com/
# Create an Onramp project
# Get your App ID and Partner ID
```

**Integration approach:** Popup window (recommended for simplicity)

```tsx
const openCoinbaseOnramp = (params: {
  address: string;
  amount: number;
}) => {
  const url = `https://pay.coinbase.com/buy/select-asset?` +
    `appId=${APP_ID}&` +
    `addresses={"${params.address}":["base"]}&` +
    `assets=["USDC"]&` +
    `presetFiatAmount=${params.amount}&` +
    `defaultPaymentMethod=CARD`;

  window.open(url, 'coinbase-onramp', 'width=460,height=700');
};
```

**Webhook for completion detection:**
```ts
// Listen for postMessage from Coinbase popup
window.addEventListener('message', (event) => {
  if (event.origin === 'https://pay.coinbase.com') {
    if (event.data.eventName === 'purchase_completed') {
      // USDC now in user's wallet, prompt contract interaction
      handleOnRampComplete(event.data);
    }
  }
});
```

### 2. Transak Off-Ramp Setup

```bash
# Register at https://dashboard.transak.com/
# Get API key for STAGING and PRODUCTION
# Configure webhooks for transaction status updates
```

### 3. Security Considerations

- **Never store API secrets on the frontend** — use environment variables for App IDs only
- **Webhook validation** — if using server-side callbacks, verify webhook signatures
- **Rate limiting** — limit on-ramp attempts per user per day
- **Amount limits** — match provider limits (typically $50-$50,000 per transaction)
- **KYC delegation** — providers handle all KYC/AML; FundBrave doesn't touch user identity data

### 4. UX Best Practices

- Show fee breakdown before payment (Coinbase = $0 for USDC)
- Display estimated delivery time (typically 1-5 minutes for on-ramp)
- Provide clear error messages for failed purchases
- Allow users to save their preferred payment method
- Show on-chain confirmation after USDC arrives

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `components/OnRampWidget.tsx` | Coinbase Onramp popup/embed |
| `components/OffRampWidget.tsx` | Transak Stream embed |
| `components/PaymentMethodSelector.tsx` | Card vs Crypto toggle |
| `components/WithdrawalDashboard.tsx` | Fundraiser withdrawal UI |
| `hooks/useOnRamp.ts` | On-ramp state and event handling |
| `hooks/useOffRamp.ts` | Off-ramp state management |
| `lib/onramp-config.ts` | Provider configs |

### Modified Files
| File | Changes |
|------|---------|
| `DonationTabs.tsx` | Add PaymentMethodSelector, OnRampWidget integration |
| `.env.local` | Add Coinbase App ID, Transak API key, feature flags |

### Optional Contract Changes (Phase 2)
| File | Changes |
|------|---------|
| `FiatRelayer.sol` (new) | Direct-to-contract deposit relay |
| `Fundraiser.sol` | Withdrawal tracking events |

---

## Cost Analysis

### For Users (On-Ramp: $100 Donation)
| Provider | Fee | User Pays | Cause Gets |
|----------|-----|-----------|------------|
| **Coinbase** | $0 | $100 | $80 (wealth-build) |
| **Transak** | ~$1 | $101 | $80 |
| **MoonPay** | ~$4.50 | $104.50 | $80 |

### For Fundraisers (Off-Ramp: $1000 Withdrawal)
| Provider | Fee | Received in Bank |
|----------|-----|------------------|
| **Transak** | ~$10 (1%) | ~$990 |
| **Ramp** | ~$5-29 | ~$971-995 |

---

## Timeline

| Week | Milestone |
|------|-----------|
| **Week 1** | Coinbase Onramp integration, PaymentMethodSelector |
| **Week 2** | Testing, error handling, env setup |
| **Week 3** | Transak Stream off-ramp, WithdrawalDashboard |
| **Week 4** | Onramper aggregation fallback |
| **Week 5** | Analytics, monitoring, production hardening |

---

## Environment Variables

```env
# On-Ramp
NEXT_PUBLIC_COINBASE_ONRAMP_APP_ID=        # From Coinbase Developer Platform
NEXT_PUBLIC_ONRAMPER_API_KEY=              # From Onramper dashboard
NEXT_PUBLIC_ONRAMP_ENABLED=true            # Feature flag

# Off-Ramp
NEXT_PUBLIC_TRANSAK_API_KEY=               # From Transak dashboard
NEXT_PUBLIC_TRANSAK_ENVIRONMENT=STAGING    # STAGING or PRODUCTION
NEXT_PUBLIC_OFFRAMP_ENABLED=true           # Feature flag
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Provider downtime | Multi-provider strategy (Coinbase + Onramper fallback) |
| KYC rejection | Clear user guidance, alternative providers via aggregator |
| Regulatory changes | Provider handles compliance; FundBrave is a facilitator only |
| Slow settlement (off-ramp) | Set clear expectations (1-3 business days) |
| Chargebacks | Providers absorb chargeback risk as Merchant of Record |
| Regional availability | Onramper aggregation covers 175+ countries |
