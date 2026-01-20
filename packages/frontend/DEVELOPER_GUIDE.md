# FundBrave Campaign System - Developer Guide

## Quick Start

### 1. Environment Setup

Create `.env.local` in `packages/frontend/`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 2. Start Development Environment

```bash
# Terminal 1: Start Hardhat node
cd packages/contracts
npm run node

# Terminal 2: Deploy contracts (in new terminal)
cd packages/contracts
npm run deploy:localhost

# Terminal 3: Start backend
cd packages/backend
npm run dev

# Terminal 4: Start frontend
cd packages/frontend
npm run dev
```

### 3. Configure MetaMask

1. Add Localhost Network:
   - Network Name: Localhost
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import test account (from Hardhat)
3. You should have test ETH and USDC

## Using the Hooks

### Fetch Campaigns

```typescript
import { useCampaigns } from '@/app/hooks';

function CampaignsComponent() {
  const { campaigns, isLoading, error, refetch } = useCampaigns({
    category: 'health-medical',
    sortBy: 'newest',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {campaigns.map(campaign => (
        <div key={campaign.id}>{campaign.title}</div>
      ))}
    </div>
  );
}
```

### Fetch Single Campaign

```typescript
import { useCampaign } from '@/app/hooks';

function CampaignDetail({ id }: { id: string }) {
  const { campaign, isLoading, error, refetch } = useCampaign(id);

  if (isLoading) return <div>Loading...</div>;
  if (!campaign) return <div>Not found</div>;

  return <div>{campaign.title}</div>;
}
```

### Create Campaign

```typescript
import { useCreateCampaign } from '@/app/hooks';
import { parseUSDC } from '@/app/lib/utils/blockchain';

function CreateCampaignForm() {
  const { createCampaign, isProcessing, isSuccess, hash, error } = useCreateCampaign();

  const handleSubmit = async () => {
    await createCampaign({
      title: "My Campaign",
      description: "Campaign description",
      goal: parseUSDC("1000"), // 1000 USDC
      duration: 30, // 30 days
      category: "health-medical",
      imageUrl: "https://...",
    });
  };

  return (
    <button onClick={handleSubmit} disabled={isProcessing}>
      {isProcessing ? 'Creating...' : 'Create Campaign'}
    </button>
  );
}
```

### Donate to Campaign

```typescript
import { useDonate } from '@/app/hooks';
import { parseUSDC } from '@/app/lib/utils/blockchain';

function DonateButton({ campaignAddress, campaignId }: { campaignAddress: Address, campaignId: string }) {
  const {
    donate,
    approveUSDC,
    isProcessing,
    needsApproval,
    usdcBalance,
    error
  } = useDonate(campaignAddress);

  const handleDonate = async () => {
    const amount = parseUSDC("10"); // 10 USDC

    // Approve if needed
    if (needsApproval) {
      await approveUSDC(amount);
      return;
    }

    // Donate
    await donate(amount, campaignId);
  };

  return (
    <div>
      <p>Balance: {formatUSDC(usdcBalance || 0n)} USDC</p>
      <button onClick={handleDonate} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : needsApproval ? 'Approve USDC' : 'Donate'}
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

### Stake to Campaign

```typescript
import { useStake } from '@/app/hooks';
import { parseUSDC, formatUSDC } from '@/app/lib/utils/blockchain';

function StakeButton({ stakingPoolAddress, campaignId }: { stakingPoolAddress: Address, campaignId: string }) {
  const {
    stake,
    approveUSDC,
    isProcessing,
    needsApproval,
    currentStake,
    error
  } = useStake(stakingPoolAddress);

  const handleStake = async () => {
    const amount = parseUSDC("100"); // 100 USDC

    if (needsApproval) {
      await approveUSDC(amount);
      return;
    }

    await stake(amount, campaignId);
  };

  return (
    <div>
      <p>Current Stake: {formatUSDC(currentStake || 0n)} USDC</p>
      <button onClick={handleDonate} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : needsApproval ? 'Approve USDC' : 'Stake'}
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

## Utility Functions

### Blockchain Formatting

```typescript
import {
  formatUSDC,
  parseUSDC,
  formatAddress,
  calculateProgress,
  calculateDaysLeft,
  formatCompactNumber,
} from '@/app/lib/utils/blockchain';

// Format USDC amount
const displayAmount = formatUSDC(1000000n); // "1.0"
const blockchainAmount = parseUSDC("1.5"); // 1500000n

// Format address
const shortAddress = formatAddress("0x1234...5678"); // "0x1234...5678"

// Calculate progress
const progress = calculateProgress("500000", "1000000"); // 50

// Calculate days left
const daysLeft = calculateDaysLeft("2024-12-31"); // number of days

// Format large numbers
const formatted = formatCompactNumber(1500000); // "1.5M"
```

### API Client

```typescript
import { apiClient } from '@/app/lib/api/client';

// Get campaigns
const response = await apiClient.getCampaigns({
  category: 'health-medical',
  sortBy: 'newest',
});

if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error);
}

// Get single campaign
const campaign = await apiClient.getCampaign('campaign-id');

// Create campaign (after blockchain tx)
const created = await apiClient.createCampaign({
  contractAddress: '0x...',
  title: 'Campaign Title',
  description: 'Description',
  goal: '1000000',
  deadline: '2024-12-31T00:00:00Z',
  category: 'health-medical',
  creator: '0x...',
  transactionHash: '0x...',
});
```

## Contract Addresses

Update these in `app/lib/contracts/config.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  fundraiserFactory: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE' as Address,
  fbtToken: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as Address,
  mockUsdc: '0x9A676e781A523b5d0C0e43731313A708CB607508' as Address,
};
```

## Type Definitions

### Campaign

```typescript
interface Campaign {
  id: string;
  contractAddress: Address;
  title: string;
  description: string;
  imageUrl?: string;
  category: CampaignCategory;
  goal: string; // BigInt as string
  amountRaised: string; // BigInt as string
  deadline: string; // ISO date string
  creator: Address;
  donorsCount: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Donation

```typescript
interface Donation {
  id: string;
  campaignId: string;
  donor: Address;
  amount: string; // BigInt as string
  token: Address;
  timestamp: string;
  transactionHash: string;
}
```

### Stake

```typescript
interface Stake {
  id: string;
  campaignId: string;
  staker: Address;
  amount: string; // BigInt as string
  timestamp: string;
  transactionHash: string;
  isActive: boolean;
}
```

## Error Handling

All hooks return error messages you can display:

```typescript
const { error } = useCampaigns();

if (error) {
  return <div className="text-red-500">{error}</div>;
}
```

Common errors:
- "Wallet not connected"
- "Insufficient USDC balance"
- "Please approve USDC first"
- "Wrong network"
- "Transaction rejected"
- "Failed to fetch campaigns"

## Testing

### Manual Testing Flow

1. **Create Campaign**
   - Go to http://localhost:3001/campaigns/create
   - Fill out form
   - Confirm transaction in MetaMask
   - Verify campaign appears on campaigns page

2. **Donate**
   - Go to campaign detail page
   - Click "Donate Now"
   - Enter amount
   - Approve USDC (first time only)
   - Confirm donation transaction
   - Verify amount updates on campaign page

3. **Stake**
   - Go to campaign detail page
   - Click "Stake to Earn Yield"
   - Enter amount
   - Approve USDC (first time only)
   - Confirm stake transaction
   - Verify stake recorded

### Check Blockchain State

```typescript
// Using wagmi hooks
import { useReadContract } from 'wagmi';
import { FUNDRAISER_ABI } from '@/app/lib/contracts/abis';

function CampaignBlockchainData({ address }: { address: Address }) {
  const { data: amountRaised } = useReadContract({
    address,
    abi: FUNDRAISER_ABI,
    functionName: 'amountRaised',
  });

  const { data: goal } = useReadContract({
    address,
    abi: FUNDRAISER_ABI,
    functionName: 'goal',
  });

  return (
    <div>
      <p>Raised: {formatUSDC(amountRaised || 0n)}</p>
      <p>Goal: {formatUSDC(goal || 0n)}</p>
    </div>
  );
}
```

## Debugging

### Check Wallet Connection

```typescript
import { useAccount } from 'wagmi';

function DebugWallet() {
  const { address, isConnected, chain } = useAccount();

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Address: {address}</p>
      <p>Chain ID: {chain?.id}</p>
      <p>Chain Name: {chain?.name}</p>
    </div>
  );
}
```

### Check Transaction Status

```typescript
import { useWaitForTransactionReceipt } from 'wagmi';

function TransactionStatus({ hash }: { hash: `0x${string}` }) {
  const { isLoading, isSuccess, error } = useWaitForTransactionReceipt({
    hash,
  });

  return (
    <div>
      {isLoading && <p>Confirming...</p>}
      {isSuccess && <p>Confirmed!</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Console Logging

Enable detailed logging:

```typescript
// In your component
useEffect(() => {
  console.log('Campaign data:', campaign);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);
}, [campaign, isLoading, error]);
```

## Common Issues

### "Wallet not connected"
- Ensure MetaMask is installed
- Click "Connect Wallet" button
- Approve connection in MetaMask

### "Wrong network"
- Switch to Localhost network in MetaMask
- Chain ID should be 31337

### "Insufficient balance"
- You need test USDC from Hardhat
- Check balance: `useReadContract` with `balanceOf`

### "Transaction rejected"
- User rejected in MetaMask
- Try again

### "Failed to fetch campaigns"
- Backend API not running
- Check http://localhost:3000/api/fundraisers
- Falls back to mock data

## Performance Tips

1. **Use React Query's caching**: wagmi uses TanStack Query internally
2. **Avoid unnecessary refetches**: Set `refetchOnWindowFocus: false`
3. **Lazy load images**: Use Next.js `Image` component
4. **Code split large components**: Use dynamic imports
5. **Memoize expensive calculations**: Use `useMemo`

## Security Considerations

1. **Never expose private keys**: Use environment variables
2. **Validate user input**: Check amounts, addresses, etc.
3. **Handle errors gracefully**: Don't expose sensitive error details
4. **Use HTTPS in production**: Update RPC URLs
5. **Implement rate limiting**: On API endpoints
6. **Sanitize user content**: For descriptions and comments

## Production Deployment

1. Update contract addresses for production network
2. Update RPC URLs to production endpoints
3. Update backend API URL
4. Configure proper environment variables
5. Enable error tracking (Sentry, etc.)
6. Set up monitoring and alerts
7. Perform security audit
8. Load test API endpoints
9. Optimize images and assets
10. Enable CDN for static assets

## Additional Resources

- [wagmi Documentation](https://wagmi.sh)
- [viem Documentation](https://viem.sh)
- [RainbowKit Documentation](https://rainbowkit.com)
- [Next.js Documentation](https://nextjs.org)
- [Hardhat Documentation](https://hardhat.org)

## Support

For questions or issues:
1. Check this guide first
2. Review the implementation summary (CAMPAIGN_SYSTEM_IMPLEMENTATION.md)
3. Check console for errors
4. Verify blockchain and backend are running
5. Check MetaMask network and account
