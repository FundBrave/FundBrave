import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';

// Governance Contract ABI
const GOVERNANCE_ABI = [
  {
    name: 'createProposal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'votingPeriod', type: 'uint256' },
    ],
    outputs: [{ name: 'proposalId', type: 'uint256' }],
  },
  {
    name: 'vote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'executeProposal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getProposal',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'proposer', type: 'address' },
      { name: 'votesFor', type: 'uint256' },
      { name: 'votesAgainst', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'executed', type: 'bool' },
      { name: 'passed', type: 'bool' },
    ],
  },
  {
    name: 'hasVoted',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'voter', type: 'address' },
    ],
    outputs: [{ name: 'voted', type: 'bool' }],
  },
  {
    name: 'getQuorum',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'quorum', type: 'uint256' }],
  },
  {
    name: 'getProposalCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'count', type: 'uint256' }],
  },
] as const;

export interface Proposal {
  title: string;
  description: string;
  proposer: `0x${string}`;
  votesFor: bigint;
  votesAgainst: bigint;
  deadline: bigint;
  executed: boolean;
  passed: boolean;
}

/**
 * Hook to get proposal details
 */
export function useProposal(proposalId: number, contractAddress: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: GOVERNANCE_ABI,
    functionName: 'getProposal',
    args: [BigInt(proposalId)],
  });

  const proposal = data
    ? {
        title: data[0],
        description: data[1],
        proposer: data[2],
        votesFor: data[3],
        votesAgainst: data[4],
        deadline: data[5],
        executed: data[6],
        passed: data[7],
      }
    : null;

  return {
    proposal,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check if user has voted on a proposal
 */
export function useHasVoted(
  proposalId: number,
  voter: `0x${string}` | undefined,
  contractAddress: `0x${string}`
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: GOVERNANCE_ABI,
    functionName: 'hasVoted',
    args: voter ? [BigInt(proposalId), voter] : undefined,
    query: {
      enabled: !!voter,
    },
  });

  return {
    hasVoted: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get quorum requirement
 */
export function useQuorum(contractAddress: `0x${string}`) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddress,
    abi: GOVERNANCE_ABI,
    functionName: 'getQuorum',
  });

  return {
    quorum: data || BigInt(0),
    isLoading,
    error,
  };
}

/**
 * Hook to get total proposal count
 */
export function useProposalCount(contractAddress: `0x${string}`) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddress,
    abi: GOVERNANCE_ABI,
    functionName: 'getProposalCount',
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

/**
 * Hook to create a proposal
 */
export function useCreateProposal(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createProposal = async (params: {
    title: string;
    description: string;
    votingPeriodDays: number;
  }) => {
    const votingPeriod = BigInt(params.votingPeriodDays * 24 * 60 * 60); // Convert to seconds

    writeContract({
      address: contractAddress,
      abi: GOVERNANCE_ABI,
      functionName: 'createProposal',
      args: [params.title, params.description, votingPeriod],
    });
  };

  return {
    createProposal,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to vote on a proposal
 */
export function useVote(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const vote = async (proposalId: number, support: boolean) => {
    writeContract({
      address: contractAddress,
      abi: GOVERNANCE_ABI,
      functionName: 'vote',
      args: [BigInt(proposalId), support],
    });
  };

  return {
    vote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to execute a passed proposal
 */
export function useExecuteProposal(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const executeProposal = async (proposalId: number) => {
    writeContract({
      address: contractAddress,
      abi: GOVERNANCE_ABI,
      functionName: 'executeProposal',
      args: [BigInt(proposalId)],
    });
  };

  return {
    executeProposal,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Convenience hook that combines proposal data and voting status
 */
export function useProposalWithVoteStatus(
  proposalId: number,
  voter: `0x${string}` | undefined,
  contractAddress: `0x${string}`
) {
  const { proposal, isLoading: proposalLoading, refetch: refetchProposal } = useProposal(proposalId, contractAddress);
  const { hasVoted, isLoading: voteLoading, refetch: refetchVote } = useHasVoted(proposalId, voter, contractAddress);
  const { quorum, isLoading: quorumLoading } = useQuorum(contractAddress);

  const totalVotes = proposal ? proposal.votesFor + proposal.votesAgainst : BigInt(0);
  const quorumReached = quorum > BigInt(0) && totalVotes >= quorum;
  const votesForPercent = totalVotes > BigInt(0)
    ? Number((proposal?.votesFor || BigInt(0)) * BigInt(100) / totalVotes)
    : 0;
  const votesAgainstPercent = totalVotes > BigInt(0)
    ? Number((proposal?.votesAgainst || BigInt(0)) * BigInt(100) / totalVotes)
    : 0;

  return {
    proposal,
    hasVoted,
    quorum,
    totalVotes,
    quorumReached,
    votesForPercent,
    votesAgainstPercent,
    isLoading: proposalLoading || voteLoading || quorumLoading,
    refetch: () => {
      refetchProposal();
      refetchVote();
    },
  };
}
