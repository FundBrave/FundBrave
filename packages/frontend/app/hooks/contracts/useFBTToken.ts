import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// FBT Token ABI (ERC20 + custom functions)
const FBT_TOKEN_ABI = [
  // Standard ERC20
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'supply', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'remaining', type: 'uint256' }],
  },
  // Custom FBT functions
  {
    name: 'getVotingPower',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'power', type: 'uint256' }],
  },
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'unstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const;

/**
 * Hook to get FBT balance
 */
export function useFBTBalance(address: `0x${string}` | undefined, contractAddress: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: FBT_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data || BigInt(0),
    balanceFormatted: data ? formatUnits(data, 18) : '0',
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get FBT total supply
 */
export function useFBTTotalSupply(contractAddress: `0x${string}`) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddress,
    abi: FBT_TOKEN_ABI,
    functionName: 'totalSupply',
  });

  return {
    totalSupply: data || BigInt(0),
    totalSupplyFormatted: data ? formatUnits(data, 18) : '0',
    isLoading,
    error,
  };
}

/**
 * Hook to get voting power
 */
export function useVotingPower(address: `0x${string}` | undefined, contractAddress: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: FBT_TOKEN_ABI,
    functionName: 'getVotingPower',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    votingPower: data || BigInt(0),
    votingPowerFormatted: data ? formatUnits(data, 18) : '0',
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to transfer FBT tokens
 */
export function useTransferFBT(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transfer = async (to: `0x${string}`, amount: string) => {
    const value = parseUnits(amount, 18);

    writeContract({
      address: contractAddress,
      abi: FBT_TOKEN_ABI,
      functionName: 'transfer',
      args: [to, value],
    });
  };

  return {
    transfer,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to approve FBT spending
 */
export function useApproveFBT(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (spender: `0x${string}`, amount: string) => {
    const value = parseUnits(amount, 18);

    writeContract({
      address: contractAddress,
      abi: FBT_TOKEN_ABI,
      functionName: 'approve',
      args: [spender, value],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to check FBT allowance
 */
export function useFBTAllowance(
  owner: `0x${string}` | undefined,
  spender: `0x${string}`,
  contractAddress: `0x${string}`
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: FBT_TOKEN_ABI,
    functionName: 'allowance',
    args: owner ? [owner, spender] : undefined,
    query: {
      enabled: !!owner,
    },
  });

  return {
    allowance: data || BigInt(0),
    allowanceFormatted: data ? formatUnits(data, 18) : '0',
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to stake FBT tokens
 */
export function useStakeFBT(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = async (amount: string) => {
    const value = parseUnits(amount, 18);

    writeContract({
      address: contractAddress,
      abi: FBT_TOKEN_ABI,
      functionName: 'stake',
      args: [value],
    });
  };

  return {
    stake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to unstake FBT tokens
 */
export function useUnstakeFBT(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unstake = async (amount: string) => {
    const value = parseUnits(amount, 18);

    writeContract({
      address: contractAddress,
      abi: FBT_TOKEN_ABI,
      functionName: 'unstake',
      args: [value],
    });
  };

  return {
    unstake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
