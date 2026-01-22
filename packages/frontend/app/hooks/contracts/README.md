# FundBrave Contract Hooks

Type-safe React hooks for interacting with FundBrave smart contracts using wagmi v2 and viem.

## Overview

This directory contains all contract interaction hooks for the FundBrave platform:

- **useFundraiser** - Campaign creation, donations, withdrawals
- **useFBTToken** - FBT token operations (transfer, approve, stake)
- **useStakingPools** - Staking operations and rewards
- **useGovernance** - DAO proposals and voting

All hooks follow wagmi v2 patterns and provide:
- ✅ Type-safe contract interactions
- ✅ Automatic transaction status tracking
- ✅ Error handling
- ✅ Loading states
- ✅ Transaction confirmation waiting

## Installation

These hooks are already included in the project and use:
- `wagmi` v2.x
- `viem` for ABI encoding/decoding
- `@tanstack/react-query` (via wagmi)

## Usage Examples

### Fundraiser Operations

#### Get fundraiser details
```tsx
import { useFundraiserDetails, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';

function CampaignPage({ campaignId }: { campaignId: number }) {
  const { fundraiser, isLoading, error } = useFundraiserDetails(
    campaignId,
    CONTRACT_ADDRESSES.FUNDRAISER
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!fundraiser) return <div>Fundraiser not found</div>;

  return (
    <div>
      <h1>Goal: {formatEther(fundraiser.goal)} ETH</h1>
      <p>Raised: {formatEther(fundraiser.raised)} ETH</p>
      <p>Active: {fundraiser.active ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

#### Create a fundraiser
```tsx
import { useCreateFundraiser, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';

function CreateCampaign() {
  const { createFundraiser, isPending, isConfirming, isSuccess, error } =
    useCreateFundraiser(CONTRACT_ADDRESSES.FUNDRAISER);

  const handleSubmit = async (data: FormData) => {
    await createFundraiser({
      beneficiary: '0x...',
      goalAmount: '10', // 10 ETH
      durationDays: 30,
      metadataUri: 'ipfs://...',
    });
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={isPending || isConfirming}
    >
      {isPending ? 'Waiting for wallet...' :
       isConfirming ? 'Confirming...' :
       isSuccess ? 'Created!' :
       'Create Campaign'}
    </button>
  );
}
```

#### Donate to a fundraiser
```tsx
import { useDonate, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';

function DonateButton({ campaignId }: { campaignId: number }) {
  const { donate, isPending, isConfirming, isSuccess, hash } =
    useDonate(CONTRACT_ADDRESSES.FUNDRAISER);

  const handleDonate = async () => {
    await donate(campaignId, '0.5'); // Donate 0.5 ETH
  };

  return (
    <>
      <button onClick={handleDonate} disabled={isPending || isConfirming}>
        Donate 0.5 ETH
      </button>
      {isConfirming && <p>Confirming transaction...</p>}
      {isSuccess && <p>Donation successful! Hash: {hash}</p>}
    </>
  );
}
```

### FBT Token Operations

#### Check FBT balance
```tsx
import { useFBTBalance, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';
import { useAccount } from 'wagmi';

function TokenBalance() {
  const { address } = useAccount();
  const { balanceFormatted, isLoading } = useFBTBalance(
    address,
    CONTRACT_ADDRESSES.FBT_TOKEN
  );

  return (
    <div>
      {isLoading ? 'Loading...' : `${balanceFormatted} FBT`}
    </div>
  );
}
```

#### Transfer FBT tokens
```tsx
import { useTransferFBT, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';

function TransferTokens() {
  const { transfer, isPending, isSuccess } =
    useTransferFBT(CONTRACT_ADDRESSES.FBT_TOKEN);

  const handleTransfer = async () => {
    await transfer('0x...', '100'); // Transfer 100 FBT
  };

  return (
    <button onClick={handleTransfer} disabled={isPending}>
      {isPending ? 'Transferring...' : isSuccess ? 'Sent!' : 'Transfer'}
    </button>
  );
}
```

#### Approve FBT spending
```tsx
import { useApproveFBT, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';

function ApproveSpending() {
  const { approve, isPending, isConfirming, isSuccess } =
    useApproveFBT(CONTRACT_ADDRESSES.FBT_TOKEN);

  const handleApprove = async () => {
    await approve(
      CONTRACT_ADDRESSES.GLOBAL_STAKING_POOL,
      '1000' // Approve 1000 FBT for staking
    );
  };

  return (
    <button onClick={handleApprove} disabled={isPending || isConfirming}>
      Approve Staking
    </button>
  );
}
```

### Staking Operations

#### View staking data
```tsx
import { useStakingPoolData, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';
import { useAccount } from 'wagmi';

function StakingDashboard() {
  const { address } = useAccount();
  const {
    stakedFormatted,
    rewardsFormatted,
    totalStakedFormatted,
    apyPercent,
    isLoading,
  } = useStakingPoolData(address, CONTRACT_ADDRESSES.GLOBAL_STAKING_POOL);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Your Staked: {stakedFormatted} FBT</p>
      <p>Pending Rewards: {rewardsFormatted} FBT</p>
      <p>Total Pool: {totalStakedFormatted} FBT</p>
      <p>APY: {apyPercent}%</p>
    </div>
  );
}
```

#### Stake tokens
```tsx
import { useStake, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';

function StakeButton() {
  const { stake, isPending, isConfirming, isSuccess } =
    useStake(CONTRACT_ADDRESSES.GLOBAL_STAKING_POOL);

  const handleStake = async () => {
    await stake('500'); // Stake 500 FBT
  };

  return (
    <button onClick={handleStake} disabled={isPending || isConfirming}>
      {isPending ? 'Waiting...' :
       isConfirming ? 'Confirming...' :
       isSuccess ? 'Staked!' :
       'Stake 500 FBT'}
    </button>
  );
}
```

#### Claim rewards
```tsx
import { useClaimRewards, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';

function ClaimButton() {
  const { claimRewards, isPending, isSuccess } =
    useClaimRewards(CONTRACT_ADDRESSES.GLOBAL_STAKING_POOL);

  return (
    <button onClick={claimRewards} disabled={isPending}>
      {isPending ? 'Claiming...' : isSuccess ? 'Claimed!' : 'Claim Rewards'}
    </button>
  );
}
```

### Governance Operations

#### View proposal with voting status
```tsx
import { useProposalWithVoteStatus, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';
import { useAccount } from 'wagmi';

function ProposalDetails({ proposalId }: { proposalId: number }) {
  const { address } = useAccount();
  const {
    proposal,
    hasVoted,
    quorumReached,
    votesForPercent,
    votesAgainstPercent,
    isLoading,
  } = useProposalWithVoteStatus(
    proposalId,
    address,
    CONTRACT_ADDRESSES.GOVERNANCE
  );

  if (isLoading) return <div>Loading...</div>;
  if (!proposal) return <div>Proposal not found</div>;

  return (
    <div>
      <h2>{proposal.title}</h2>
      <p>{proposal.description}</p>
      <p>For: {votesForPercent}%</p>
      <p>Against: {votesAgainstPercent}%</p>
      <p>Quorum: {quorumReached ? 'Reached' : 'Not reached'}</p>
      {hasVoted && <p>You have already voted</p>}
    </div>
  );
}
```

#### Vote on proposal
```tsx
import { useVote, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';

function VoteButtons({ proposalId }: { proposalId: number }) {
  const { vote, isPending, isConfirming, isSuccess } =
    useVote(CONTRACT_ADDRESSES.GOVERNANCE);

  const handleVote = async (support: boolean) => {
    await vote(proposalId, support);
  };

  return (
    <div>
      <button
        onClick={() => handleVote(true)}
        disabled={isPending || isConfirming}
      >
        Vote For
      </button>
      <button
        onClick={() => handleVote(false)}
        disabled={isPending || isConfirming}
      >
        Vote Against
      </button>
      {isConfirming && <p>Confirming your vote...</p>}
      {isSuccess && <p>Vote recorded!</p>}
    </div>
  );
}
```

#### Create proposal
```tsx
import { useCreateProposal, CONTRACT_ADDRESSES } from '@/app/hooks/contracts';

function CreateProposalForm() {
  const { createProposal, isPending, isSuccess } =
    useCreateProposal(CONTRACT_ADDRESSES.GOVERNANCE);

  const handleSubmit = async (formData: any) => {
    await createProposal({
      title: formData.title,
      description: formData.description,
      votingPeriodDays: 7,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : isSuccess ? 'Created!' : 'Create Proposal'}
      </button>
    </form>
  );
}
```

## Configuration

### Contract Addresses

Contract addresses are exported from `index.ts` and vary by network:

```tsx
import { getContractAddresses } from '@/app/hooks/contracts';
import { useChainId } from 'wagmi';

function MyComponent() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  // Use addresses.FUNDRAISER, addresses.FBT_TOKEN, etc.
}
```

**Supported Networks:**
- Mainnet (chainId: 1)
- Sepolia Testnet (chainId: 11155111)
- Local Development (chainId: 31337 or 1337)

### Updating Contract Addresses

Edit `index.ts` and replace placeholder addresses with deployed contract addresses:

```ts
export const CONTRACT_ADDRESSES = {
  FUNDRAISER: '0xYourDeployedAddress' as `0x${string}`,
  // ...
};
```

## Hook Return Values

All write hooks (mutations) return:
- `write` / `writeAsync` - Function to execute the transaction
- `hash` - Transaction hash (after sending)
- `isPending` - Waiting for user to confirm in wallet
- `isConfirming` - Transaction submitted, waiting for confirmation
- `isSuccess` - Transaction confirmed successfully
- `error` - Error object if transaction fails

All read hooks return:
- `data` - Contract return value
- `isLoading` - Loading state
- `error` - Error object if call fails
- `refetch` - Function to manually refetch data

## Error Handling

```tsx
const { donate, error } = useDonate(CONTRACT_ADDRESSES.FUNDRAISER);

if (error) {
  // Handle specific error types
  if (error.message.includes('insufficient funds')) {
    console.log('Not enough ETH');
  } else if (error.message.includes('user rejected')) {
    console.log('User cancelled transaction');
  } else {
    console.log('Transaction failed:', error.message);
  }
}
```

## Testing

All hooks can be tested using wagmi's testing utilities:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { wrapper } from '@/test/wagmi-wrapper';
import { useFBTBalance } from '@/app/hooks/contracts';

test('fetches FBT balance', async () => {
  const { result } = renderHook(
    () => useFBTBalance('0x...', CONTRACT_ADDRESSES.FBT_TOKEN),
    { wrapper }
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.balanceFormatted).toBe('1000');
});
```

## Best Practices

1. **Always check wallet connection** before calling write functions
2. **Handle all three states**: pending, confirming, success
3. **Provide user feedback** during long-running transactions
4. **Use refetch** to update data after mutations
5. **Show transaction hashes** for user verification
6. **Handle errors gracefully** with user-friendly messages
7. **Use TypeScript** for type-safe contract interactions

## ABIs

Contract ABIs are included inline in each hook file. For production:

1. Generate ABIs from compiled contracts
2. Store in a separate `abis/` directory
3. Import and use the generated ABIs
4. Keep ABIs in sync with deployed contracts

## Additional Resources

- [wagmi Documentation](https://wagmi.sh/)
- [viem Documentation](https://viem.sh/)
- [Ethereum JSON-RPC](https://ethereum.org/en/developers/docs/apis/json-rpc/)
- [Contract Deployment Guide](../../contracts/README.md)
