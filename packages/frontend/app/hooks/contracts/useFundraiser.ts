import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState } from 'react';

// Fundraiser Contract ABI (simplified - replace with actual ABI)
const FUNDRAISER_ABI = [
  {
    name: 'getFundraiserDetails',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'fundraiserId', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'beneficiary', type: 'address' },
      { name: 'goal', type: 'uint256' },
      { name: 'raised', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'createFundraiser',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'beneficiary', type: 'address' },
      { name: 'goal', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
      { name: 'metadataUri', type: 'string' },
    ],
    outputs: [{ name: 'fundraiserId', type: 'uint256' }],
  },
  {
    name: 'donate',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'fundraiserId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdrawFunds',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'fundraiserId', type: 'uint256' }],
    outputs: [],
  },
] as const;

export interface FundraiserDetails {
  creator: `0x${string}`;
  beneficiary: `0x${string}`;
  goal: bigint;
  raised: bigint;
  deadline: bigint;
  active: boolean;
}

/**
 * Hook to read fundraiser details
 */
export function useFundraiserDetails(fundraiserId: number, contractAddress: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: FUNDRAISER_ABI,
    functionName: 'getFundraiserDetails',
    args: [BigInt(fundraiserId)],
  });

  const fundraiser = data
    ? {
        creator: data[0],
        beneficiary: data[1],
        goal: data[2],
        raised: data[3],
        deadline: data[4],
        active: data[5],
      }
    : null;

  return {
    fundraiser,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to create a fundraiser
 */
export function useCreateFundraiser(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createFundraiser = async (params: {
    beneficiary: `0x${string}`;
    goalAmount: string; // in ETH
    durationDays: number;
    metadataUri: string;
  }) => {
    const goal = parseEther(params.goalAmount);
    const duration = BigInt(params.durationDays * 24 * 60 * 60); // Convert days to seconds

    writeContract({
      address: contractAddress,
      abi: FUNDRAISER_ABI,
      functionName: 'createFundraiser',
      args: [params.beneficiary, goal, duration, params.metadataUri],
    });
  };

  return {
    createFundraiser,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to donate to a fundraiser
 */
export function useDonate(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const donate = async (fundraiserId: number, amount: string) => {
    const value = parseEther(amount);

    writeContract({
      address: contractAddress,
      abi: FUNDRAISER_ABI,
      functionName: 'donate',
      args: [BigInt(fundraiserId)],
      value,
    });
  };

  return {
    donate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to withdraw fundraiser funds (creator only)
 */
export function useWithdrawFunds(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdrawFunds = async (fundraiserId: number) => {
    writeContract({
      address: contractAddress,
      abi: FUNDRAISER_ABI,
      functionName: 'withdrawFunds',
      args: [BigInt(fundraiserId)],
    });
  };

  return {
    withdrawFunds,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
