'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { parseUnits, formatUnits, maxUint256, Address } from 'viem'
import { ArrowRight, Coins, TrendingUp, Heart, Info, RefreshCw, Globe } from 'lucide-react'
import { useToastWithHelpers } from '@/app/components/ui/Toast'
import { TokenSelector } from './TokenSelector'
import { BridgeSelector, BridgeStatusBanner, SUPPORTED_CHAINS, type ChainInfo, type BridgeStatus } from './BridgeSelector'
import { PaymentMethodSelector, type PaymentMethod } from './PaymentMethodSelector'
import { OnRampWidget } from './OnRampWidget'
import { RAMP_FEATURES } from '@/app/lib/onramp-config'
import {
  FUNDRAISER_FACTORY_ABI,
  FUND_BRAVE_BRIDGE_ABI,
  MOCK_USDC_ABI,
  STAKING_POOL_ABI,
  WEALTH_BUILDING_DONATION_ABI,
} from '@/app/lib/contracts/abis'
import {
  CONTRACTS,
  SUPPORTED_TOKENS,
  type TokenInfo,
  formatUSDC,
  getExplorerUrl,
} from '@/app/lib/contracts/config'

type TransactionStatus = 'idle' | 'approving' | 'approved' | 'pending' | 'success' | 'error'

interface DonationTabsProps {
  campaignId: number
  stakingPoolAddress?: Address
  /** Called after a successful donation/stake/wealth-building tx to refresh parent stats */
  onDonationSuccess?: () => void
}

type TabType = 'donate' | 'wealth' | 'stake'

export function DonationTabs({ campaignId, stakingPoolAddress: stakingPoolAddressProp, onDonationSuccess }: DonationTabsProps) {
  const { address } = useAccount()
  const toast = useToastWithHelpers()
  const [activeTab, setActiveTab] = useState<TabType>('donate')
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0]) // Default USDC
  const [status, setStatus] = useState<TransactionStatus>('idle')
  const [selectedChain, setSelectedChain] = useState<ChainInfo>(SUPPORTED_CHAINS[0]) // Default Base (native)
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>('idle')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('crypto')
  const [onRampComplete, setOnRampComplete] = useState(false)

  const isBridged = selectedChain.protocol !== 'native'
  const bridgeAddress = CONTRACTS.FUND_BRAVE_BRIDGE_ADDRESS

  // ============ Read Staking Pool Address from Contract (fallback if not in DB) ============
  const { data: onChainStakingPool } = useReadContract({
    address: CONTRACTS.FACTORY_ADDRESS,
    abi: FUNDRAISER_FACTORY_ABI,
    functionName: 'stakingPools',
    args: [BigInt(campaignId)],
    query: {
      enabled: !stakingPoolAddressProp, // Only read if not provided
    },
  })

  // Use prop if available, otherwise use on-chain data
  const stakingPoolAddress = stakingPoolAddressProp ||
    (onChainStakingPool && onChainStakingPool !== '0x0000000000000000000000000000000000000000'
      ? onChainStakingPool as Address
      : undefined)

  // ============ Token Balance ============
  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: selectedToken.isNative ? undefined : (selectedToken.address as Address),
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !selectedToken.isNative && selectedToken.address !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10000,
    },
  })

  const { data: ethBalance } = useBalance({
    address: address,
    query: {
      enabled: !!address && selectedToken.isNative,
      refetchInterval: 10000,
    },
  })

  // ============ Token Allowance (for ERC20s) ============
  const allowanceSpender = isBridged && bridgeAddress !== '0x0000000000000000000000000000000000000000'
    ? bridgeAddress
    : CONTRACTS.FACTORY_ADDRESS
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken.isNative ? undefined : (selectedToken.address as Address),
    abi: MOCK_USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, allowanceSpender] : undefined,
    query: {
      enabled: !!address && !selectedToken.isNative && selectedToken.address !== '0x0000000000000000000000000000000000000000',
    },
  })

  // ============ Staking Data ============
  const { data: stakerPrincipal, refetch: refetchPrincipal } = useReadContract({
    address: stakingPoolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'stakerPrincipal',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!stakingPoolAddress,
      refetchInterval: 5000,
    },
  })

  const { data: earnedUSDC, refetch: refetchEarned } = useReadContract({
    address: stakingPoolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'earnedUSDC',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!stakingPoolAddress,
      refetchInterval: 5000,
    },
  })

  const { data: claimableYield, refetch: refetchClaimable } = useReadContract({
    address: stakingPoolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'claimableYield',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!stakingPoolAddress,
      refetchInterval: 5000,
    },
  })

  const { data: totalStakedPrincipal } = useReadContract({
    address: stakingPoolAddress,
    abi: STAKING_POOL_ABI,
    functionName: 'totalStakedPrincipal',
    query: {
      enabled: !!stakingPoolAddress,
      refetchInterval: 10000,
    },
  })

  // ============ Wealth Building Data ============
  const { data: endowmentInfo, refetch: refetchEndowment } = useReadContract({
    address: CONTRACTS.WEALTH_BUILDING_ADDRESS,
    abi: WEALTH_BUILDING_DONATION_ABI,
    functionName: 'getEndowmentInfo',
    args: address ? [address, BigInt(campaignId)] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  })

  const { data: pendingYield, refetch: refetchPendingYield } = useReadContract({
    address: CONTRACTS.WEALTH_BUILDING_ADDRESS,
    abi: WEALTH_BUILDING_DONATION_ABI,
    functionName: 'getPendingYield',
    args: address ? [address, BigInt(campaignId)] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  })

  // ============ Write Contracts ============
  const { data: approveHash, writeContract: approve, isPending: isApproving } = useWriteContract()
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { data: txHash, writeContract: executeTx, isPending: isTxPending } = useWriteContract()
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const { data: claimHash, writeContract: claimRewards, isPending: isClaiming } = useWriteContract()
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  })

  const { data: harvestHash, writeContract: harvestYield, isPending: isHarvesting } = useWriteContract()
  const { isLoading: isHarvestConfirming, isSuccess: isHarvestSuccess } = useWaitForTransactionReceipt({
    hash: harvestHash,
  })

  const { data: unstakeHash, writeContract: unstakeWrite, isPending: isUnstaking } = useWriteContract()
  const { isLoading: isUnstakeConfirming, isSuccess: isUnstakeSuccess } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  })

  // Track processed tx hashes to prevent duplicate toast notifications
  // (wagmi's isSuccess stays true permanently after confirmation, causing re-fires)
  const processedTxHashes = useRef<Set<string>>(new Set())

  // ============ Computed Values ============
  // NOTE: These must be declared before effects and handlers that reference them,
  // because `const` has a temporal dead zone — dependency arrays are evaluated
  // at declaration time during the component body execution.
  const parsedAmount = (() => {
    try {
      if (!amount || isNaN(parseFloat(amount))) return 0n
      return parseUnits(amount, selectedToken.decimals)
    } catch {
      return 0n
    }
  })()

  const estimatedUSDC = (() => {
    if (selectedToken.symbol === 'USDC') return parsedAmount
    if (selectedToken.isNative) {
      // Mock rate: 1 ETH = 2000 USDC
      try {
        const ethValue = parseFloat(amount || '0')
        return BigInt(Math.floor(ethValue * 2000 * 1_000_000))
      } catch { return 0n }
    }
    // For 18-decimal tokens (DAI, WETH) at 1:1 ratio adjusted to 6 decimals
    try {
      const value = parseFloat(amount || '0')
      return BigInt(Math.floor(value * 1_000_000))
    } catch { return 0n }
  })()

  const displayBalance = selectedToken.isNative
    ? ethBalance ? formatUnits(ethBalance.value, 18) : '0'
    : tokenBalance !== undefined ? formatUnits(tokenBalance as bigint, selectedToken.decimals) : '0'

  const needsApproval = !selectedToken.isNative
    && parsedAmount > 0n
    && (allowance as bigint || 0n) < parsedAmount

  const isProcessing = isApproving || isApproveConfirming || isTxPending || isTxConfirming

  // ============ Handlers ============

  const handleApprove = useCallback(() => {
    if (!address || selectedToken.isNative) return
    setStatus('approving')
    const spender = isBridged && bridgeAddress !== '0x0000000000000000000000000000000000000000'
      ? bridgeAddress
      : CONTRACTS.FACTORY_ADDRESS
    // Approve max uint256 (standard DeFi pattern) so the user only needs to approve once.
    // This avoids stale-allowance issues when switching between donate/wealth/stake tabs.
    approve({
      address: selectedToken.address as Address,
      abi: MOCK_USDC_ABI,
      functionName: 'approve',
      args: [spender, maxUint256],
    })
  }, [address, selectedToken, approve, isBridged, bridgeAddress])

  const handleExecute = useCallback(() => {
    if (!address || parsedAmount === 0n) return
    setStatus('pending')

    const isNative = selectedToken.isNative
    const isUSDC = selectedToken.symbol === 'USDC'

    // ============ Cross-Chain Bridge Flow ============
    if (isBridged && bridgeAddress !== '0x0000000000000000000000000000000000000000') {
      setBridgeStatus('bridging')
      const actionId = activeTab === 'donate' ? 0 : activeTab === 'stake' ? 1 : 2
      const lzEid = selectedChain.lzEid

      if (selectedChain.protocol === 'layerzero' && lzEid) {
        try {
          if (isNative) {
            const lzFeeEstimate = parseUnits('0.01', 18)
            executeTx({
              address: bridgeAddress,
              abi: FUND_BRAVE_BRIDGE_ABI,
              functionName: 'sendCrossChainActionNative',
              args: [lzEid, BigInt(campaignId), actionId, parsedAmount],
              value: parsedAmount + lzFeeEstimate,
              gas: 1_000_000n,
            })
          } else {
            executeTx({
              address: bridgeAddress,
              abi: FUND_BRAVE_BRIDGE_ABI,
              functionName: 'sendCrossChainAction',
              args: [lzEid, BigInt(campaignId), actionId, selectedToken.address as Address, parsedAmount],
              value: parseUnits('0.01', 18),
              gas: 1_000_000n,
            })
          }
        } catch {
          toast.error('Bridge transaction failed. LayerZero pathway may not be configured for this testnet chain.')
          setStatus('idle')
          setBridgeStatus('failed')
          return
        }
      } else if (selectedChain.protocol === 'wormhole') {
        toast.info('Solana bridging requires a Solana wallet. This will be available in a future update.')
        setStatus('idle')
        setBridgeStatus('idle')
        return
      }
      return
    }

    // ============ Direct (Native Base) Flow ============
    // Gas limits set generously for first-time interactions with clone contracts
    // (all storage slots are cold on first donation, costing ~20k gas each)
    if (activeTab === 'donate') {
      if (isNative) {
        executeTx({
          address: CONTRACTS.FACTORY_ADDRESS,
          abi: FUNDRAISER_FACTORY_ABI,
          functionName: 'donateNative',
          args: [BigInt(campaignId)],
          value: parsedAmount,
          gas: 1_000_000n,
        })
      } else {
        executeTx({
          address: CONTRACTS.FACTORY_ADDRESS,
          abi: FUNDRAISER_FACTORY_ABI,
          functionName: 'donateERC20',
          args: [BigInt(campaignId), selectedToken.address as Address, parsedAmount],
          gas: 1_000_000n,
        })
      }
    } else if (activeTab === 'wealth') {
      if (isNative) {
        executeTx({
          address: CONTRACTS.FACTORY_ADDRESS,
          abi: FUNDRAISER_FACTORY_ABI,
          functionName: 'donateWealthBuildingNative',
          args: [BigInt(campaignId)],
          value: parsedAmount,
          gas: 1_500_000n,
        })
      } else if (isUSDC) {
        executeTx({
          address: CONTRACTS.FACTORY_ADDRESS,
          abi: FUNDRAISER_FACTORY_ABI,
          functionName: 'donateWealthBuilding',
          args: [BigInt(campaignId), parsedAmount],
          gas: 1_500_000n,
        })
      } else {
        executeTx({
          address: CONTRACTS.FACTORY_ADDRESS,
          abi: FUNDRAISER_FACTORY_ABI,
          functionName: 'donateWealthBuildingERC20',
          args: [BigInt(campaignId), selectedToken.address as Address, parsedAmount],
          gas: 1_500_000n,
        })
      }
    } else if (activeTab === 'stake') {
      if (isNative) {
        executeTx({
          address: CONTRACTS.FACTORY_ADDRESS,
          abi: FUNDRAISER_FACTORY_ABI,
          functionName: 'stakeNative',
          args: [BigInt(campaignId)],
          value: parsedAmount,
          gas: 1_200_000n,
        })
      } else {
        executeTx({
          address: CONTRACTS.FACTORY_ADDRESS,
          abi: FUNDRAISER_FACTORY_ABI,
          functionName: 'stakeERC20',
          args: [BigInt(campaignId), selectedToken.address as Address, parsedAmount],
          gas: 1_200_000n,
        })
      }
    }
  }, [address, parsedAmount, selectedToken, activeTab, campaignId, executeTx, isBridged, bridgeAddress, selectedChain, toast])

  const handleClaim = useCallback(() => {
    if (!stakingPoolAddress) return
    claimRewards({
      address: stakingPoolAddress,
      abi: STAKING_POOL_ABI,
      functionName: 'claimAllRewards',
    })
  }, [stakingPoolAddress, claimRewards])

  const handleHarvest = useCallback(() => {
    if (!stakingPoolAddress) return
    harvestYield({
      address: stakingPoolAddress,
      abi: STAKING_POOL_ABI,
      functionName: 'harvestAndDistribute',
    })
  }, [stakingPoolAddress, harvestYield])

  const handleUnstake = useCallback((unstakeAmount: bigint) => {
    if (!stakingPoolAddress || unstakeAmount === 0n) return
    unstakeWrite({
      address: stakingPoolAddress,
      abi: STAKING_POOL_ABI,
      functionName: 'unstake',
      args: [unstakeAmount],
      gas: 800_000n,
    })
  }, [stakingPoolAddress, unstakeWrite])

  const handleSubmit = () => {
    if (needsApproval) {
      handleApprove()
    } else {
      handleExecute()
    }
  }

  // ============ Effects ============

  // After approval, immediately execute the pending transaction
  // Since we approve maxUint256, we know allowance is sufficient — no need to
  // wait for refetchAllowance before executing.
  useEffect(() => {
    if (isApproveSuccess && approveHash && !processedTxHashes.current.has(approveHash)) {
      processedTxHashes.current.add(approveHash)
      toast.success('Token approved! Executing transaction...')
      refetchAllowance()
      setStatus('approved')
      // Execute immediately — don't wait for allowance refetch
      if (parsedAmount > 0n) {
        handleExecute()
      }
    }
  }, [isApproveSuccess, approveHash, refetchAllowance, toast, parsedAmount, handleExecute])

  // After TX success
  useEffect(() => {
    if (isTxSuccess && txHash && !processedTxHashes.current.has(txHash)) {
      processedTxHashes.current.add(txHash)
      const successMsg = isBridged ? 'Bridge transaction submitted!' : 'Transaction confirmed!'
      toast.success(successMsg)
      setStatus('success')
      setAmount('')
      if (isBridged) {
        setBridgeStatus('complete')
      }
      refetchTokenBalance()
      refetchPrincipal()
      refetchEarned()
      refetchClaimable()
      refetchEndowment()
      refetchPendingYield()
      // Notify parent to refresh on-chain campaign stats (raised amount, donors count)
      // Small delay ensures the new block state is available for RPC reads
      onDonationSuccess?.()
      setTimeout(() => onDonationSuccess?.(), 3000)
    }
  }, [isTxSuccess, txHash, refetchTokenBalance, refetchPrincipal, refetchEarned, refetchClaimable, refetchEndowment, refetchPendingYield, isBridged, toast, onDonationSuccess])

  // After claim success
  useEffect(() => {
    if (isClaimSuccess && claimHash && !processedTxHashes.current.has(claimHash)) {
      processedTxHashes.current.add(claimHash)
      toast.success('Rewards claimed!')
      refetchEarned()
      refetchClaimable()
      refetchTokenBalance()
    }
  }, [isClaimSuccess, claimHash, refetchEarned, refetchClaimable, refetchTokenBalance, toast])

  // After harvest success
  useEffect(() => {
    if (isHarvestSuccess && harvestHash && !processedTxHashes.current.has(harvestHash)) {
      processedTxHashes.current.add(harvestHash)
      toast.success('Yield harvested and distributed!')
      refetchEarned()
      refetchClaimable()
      refetchPendingYield()
    }
  }, [isHarvestSuccess, harvestHash, refetchEarned, refetchClaimable, refetchPendingYield, toast])

  // After unstake success
  useEffect(() => {
    if (isUnstakeSuccess && unstakeHash && !processedTxHashes.current.has(unstakeHash)) {
      processedTxHashes.current.add(unstakeHash)
      toast.success('Successfully unstaked! USDC returned to your wallet.')
      refetchPrincipal()
      refetchTokenBalance()
      refetchEarned()
      refetchClaimable()
    }
  }, [isUnstakeSuccess, unstakeHash, refetchPrincipal, refetchTokenBalance, refetchEarned, refetchClaimable, toast])

  // Reset status when switching tabs or chains, and refetch allowance for fresh data
  useEffect(() => {
    setStatus('idle')
    setAmount('')
    setBridgeStatus('idle')
    setOnRampComplete(false)
    refetchAllowance()
  }, [activeTab, selectedChain, refetchAllowance])

  // Fallback: if the immediate execute in the approval effect didn't fire
  // (e.g., race condition), this catches it once allowance refetches.
  useEffect(() => {
    if (status === 'approved' && !needsApproval && parsedAmount > 0n) {
      handleExecute()
    }
  }, [status, needsApproval, parsedAmount, handleExecute])

  // ============ Render ============

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'donate', label: 'Direct', icon: <Heart size={16} /> },
    { key: 'wealth', label: 'Wealth', icon: <TrendingUp size={16} /> },
    { key: 'stake', label: 'Stake', icon: <Coins size={16} /> },
  ]

  return (
    <div className="space-y-4">
      {/* Tab Headers */}
      <div className="flex rounded-lg bg-white/5 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition ${
              activeTab === tab.key
                ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Source Chain Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
          <Globe size={14} />
          <span>Source Network</span>
        </div>
        <BridgeSelector
          selectedChain={selectedChain}
          onSelect={setSelectedChain}
          compact
        />
      </div>

      {/* Bridge Info Banner */}
      {isBridged && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Globe size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-300">
              <p className="font-medium">Cross-chain via {selectedChain.protocol === 'layerzero' ? 'LayerZero' : 'Wormhole'}</p>
              <p className="mt-0.5">
                Tokens on {selectedChain.name} will be bridged to Base and converted to USDC.
                Est. time: {selectedChain.estimatedTime} | Bridge fee: {selectedChain.estimatedFee}
              </p>
              <p className="mt-1 text-orange-400 font-medium">
                ⚠ Testnet: Cross-chain bridging requires LayerZero peers on destination chains. This is a UI preview — bridge transactions may fail on single-chain testnet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bridge Status */}
      <BridgeStatusBanner status={bridgeStatus} sourceChain={selectedChain} />

      {/* Tab Description */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            {activeTab === 'donate' && 'Direct donation: 100% goes to the cause (minus 2% platform fee). Any token is auto-converted to USDC.'}
            {activeTab === 'wealth' && 'Wealth building: 80% direct to cause, 18% locked as permanent endowment earning Aave yield, 2% platform fee. Your 70% of yield converts to tokenized stocks.'}
            {activeTab === 'stake' && (
              <>
                Stake to generate yield via Aave. Default split: <strong>79% to cause</strong>, <strong>19% to you</strong>, 2% platform.
                {' '}On testnet, use &quot;Fast Forward Yield&quot; to simulate yield.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Payment Method Selector */}
      {RAMP_FEATURES.onRampEnabled && !isBridged && (
        <PaymentMethodSelector
          selected={paymentMethod}
          onChange={(method) => {
            setPaymentMethod(method)
            setOnRampComplete(false)
            setStatus('idle')
          }}
          disabled={isProcessing}
        />
      )}

      {/* Card Payment Flow (On-Ramp) */}
      {paymentMethod === 'card' && RAMP_FEATURES.onRampEnabled && !isBridged ? (
        <div className="space-y-3">
          {/* Amount Input for Card */}
          <div>
            <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-lg">$</span>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setStatus('idle')
                  setOnRampComplete(false)
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          {/* On-Ramp Widget */}
          <OnRampWidget
            amount={parseFloat(amount) || 0}
            onSuccess={(receivedAmount) => {
              setOnRampComplete(true)
              const usdcAmount = Number(receivedAmount) / 1_000_000
              setAmount(usdcAmount.toString())
              const usdcToken = SUPPORTED_TOKENS.find(t => t.symbol === 'USDC')
              if (usdcToken) setSelectedToken(usdcToken)
              toast.info(`${usdcAmount.toFixed(2)} USDC ready to ${activeTab === 'donate' ? 'donate' : activeTab === 'wealth' ? 'wealth build' : 'stake'}.`)
            }}
            onCancel={() => setOnRampComplete(false)}
          />

          {/* After on-ramp: show standard execute button */}
          {onRampComplete && parsedAmount > 0n && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-[var(--muted-foreground)] mb-2 text-center">
                USDC received — now complete the on-chain transaction:
              </p>
              <button
                onClick={handleSubmit}
                disabled={isProcessing || parsedAmount === 0n}
                className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing
                  ? status === 'approving' || isApproving || isApproveConfirming
                    ? `Approving USDC...`
                    : 'Confirming...'
                  : needsApproval
                  ? 'Approve USDC'
                  : activeTab === 'donate'
                  ? 'Complete Donation'
                  : activeTab === 'wealth'
                  ? 'Complete Wealth Build'
                  : 'Complete Stake'
                }
              </button>
            </div>
          )}
        </div>
      ) : (
      /* Crypto Payment Flow (existing) */
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--foreground)]">
            {activeTab === 'stake' ? 'Stake Amount' : 'Donation Amount'}
          </label>
          <TokenSelector
            selectedToken={selectedToken}
            onSelect={setSelectedToken}
            filterConfigured
          />
        </div>

        <div className="relative">
          <input
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setStatus('idle')
            }}
            placeholder={`0.00 ${selectedToken.symbol}`}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
          <button
            onClick={() => setAmount(displayBalance)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium"
          >
            MAX
          </button>
        </div>

        <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>Balance: {parseFloat(displayBalance).toFixed(selectedToken.decimals <= 6 ? 2 : 4)} {selectedToken.symbol}</span>
          {selectedToken.symbol !== 'USDC' && estimatedUSDC > 0n && (
            <span className="flex items-center gap-1">
              <ArrowRight size={10} />
              ~{formatUSDC(estimatedUSDC)} USDC
            </span>
          )}
        </div>
      </div>
      )}

      {/* Wealth Building Split Preview */}
      {activeTab === 'wealth' && estimatedUSDC > 0n && (
        <div className="p-3 bg-white/5 rounded-lg space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Direct to cause (80%)</span>
            <span className="font-medium">{formatUSDC((estimatedUSDC * 80n) / 100n)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Endowment (18%)</span>
            <span className="font-medium">{formatUSDC((estimatedUSDC * 18n) / 100n)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Platform fee (2%)</span>
            <span className="font-medium text-[var(--muted-foreground)]">{formatUSDC((estimatedUSDC * 2n) / 100n)}</span>
          </div>
        </div>
      )}

      {/* Action Button (crypto flow only — card flow has its own button above) */}
      {paymentMethod === 'crypto' && (
        <button
          onClick={handleSubmit}
          disabled={isProcessing || parsedAmount === 0n}
          className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing
            ? status === 'approving' || isApproving || isApproveConfirming
              ? `Approving ${selectedToken.symbol}...`
              : isBridged ? 'Bridging...' : 'Confirming...'
            : needsApproval
            ? `Approve ${selectedToken.symbol}`
            : isBridged
            ? `Bridge & ${activeTab === 'donate' ? 'Donate' : activeTab === 'wealth' ? 'Wealth Build' : 'Stake'} via ${selectedChain.shortName}`
            : activeTab === 'donate'
            ? `Donate ${selectedToken.symbol}`
            : activeTab === 'wealth'
            ? `Wealth Build with ${selectedToken.symbol}`
            : `Stake ${selectedToken.symbol}`
          }
        </button>
      )}

      {/* Status Messages */}
      {status === 'success' && (
        <p className="text-center text-sm text-green-400 font-medium">
          Transaction successful!
        </p>
      )}

      {/* ============ Staking Position & Yield ============ */}
      {activeTab === 'stake' && stakingPoolAddress && address && (
        <StakingPosition
          stakerPrincipal={stakerPrincipal as bigint | undefined}
          earnedUSDC={earnedUSDC as bigint | undefined}
          claimableYield={claimableYield as bigint | undefined}
          totalStaked={totalStakedPrincipal as bigint | undefined}
          onClaim={handleClaim}
          onHarvest={handleHarvest}
          onUnstake={handleUnstake}
          isClaiming={isClaiming || isClaimConfirming}
          isHarvesting={isHarvesting || isHarvestConfirming}
          isUnstaking={isUnstaking || isUnstakeConfirming}
        />
      )}

      {/* ============ Wealth Building Position ============ */}
      {activeTab === 'wealth' && address && (
        <WealthBuildingPosition
          endowmentInfo={endowmentInfo as any}
          pendingYield={pendingYield as any}
        />
      )}
    </div>
  )
}

// ============ Sub-components ============

function StakingPosition({
  stakerPrincipal,
  earnedUSDC,
  claimableYield,
  totalStaked,
  onClaim,
  onHarvest,
  onUnstake,
  isClaiming,
  isHarvesting,
  isUnstaking,
}: {
  stakerPrincipal?: bigint
  earnedUSDC?: bigint
  claimableYield?: bigint
  totalStaked?: bigint
  onClaim: () => void
  onHarvest: () => void
  onUnstake: (amount: bigint) => void
  isClaiming: boolean
  isHarvesting: boolean
  isUnstaking: boolean
}) {
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [showUnstake, setShowUnstake] = useState(false)

  const hasPosition = stakerPrincipal && stakerPrincipal > 0n
  const hasClaimable = (earnedUSDC && earnedUSDC > 0n) || (claimableYield && claimableYield > 0n)

  // Don't render at all if no position — keeps the UI clean per-campaign
  if (!hasPosition) return null

  const parsedUnstakeAmount = (() => {
    try {
      if (!unstakeAmount || isNaN(parseFloat(unstakeAmount))) return 0n
      return parseUnits(unstakeAmount, 6) // USDC decimals
    } catch {
      return 0n
    }
  })()

  const canUnstake = parsedUnstakeAmount > 0n && parsedUnstakeAmount <= stakerPrincipal!

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
      <h4 className="text-sm font-semibold text-foreground">Your Position in This Campaign</h4>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-white/5 rounded-lg">
          <p className="text-xs text-[var(--muted-foreground)]">Staked</p>
          <p className="text-sm font-semibold">{formatUSDC(stakerPrincipal!)}</p>
        </div>
        <div className="p-2.5 bg-white/5 rounded-lg">
          <p className="text-xs text-[var(--muted-foreground)]">Pool Total</p>
          <p className="text-sm font-semibold">{totalStaked ? formatUSDC(totalStaked) : '$0.00'}</p>
        </div>
        <div className="p-2.5 bg-green-500/10 rounded-lg">
          <p className="text-xs text-[var(--muted-foreground)]">Earned (USDC)</p>
          <p className="text-sm font-semibold text-green-400">
            {earnedUSDC ? formatUSDC(earnedUSDC) : '$0.00'}
          </p>
        </div>
        <div className="p-2.5 bg-blue-500/10 rounded-lg">
          <p className="text-xs text-[var(--muted-foreground)]">Claimable</p>
          <p className="text-sm font-semibold text-blue-400">
            {claimableYield ? formatUSDC(claimableYield) : '$0.00'}
          </p>
        </div>
      </div>

      {/* Yield split info */}
      <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-xs text-yellow-300">
          <strong>Yield Split:</strong> 79% to cause, 19% to you, 2% platform.
          On testnet, yield only increases when &quot;Fast Forward Yield&quot; is clicked (MockAavePool doesn&apos;t auto-accrue like real Aave).
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onHarvest}
          disabled={isHarvesting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={isHarvesting ? 'animate-spin' : ''} />
          {isHarvesting ? 'Harvesting...' : 'Harvest Yield'}
        </button>
        <button
          onClick={onClaim}
          disabled={isClaiming || !hasClaimable}
          className="flex-1 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClaiming ? 'Claiming...' : 'Claim Rewards'}
        </button>
      </div>

      {/* Unstake Section */}
      <div className="pt-2 border-t border-white/5">
        {!showUnstake ? (
          <button
            onClick={() => setShowUnstake(true)}
            className="w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium rounded-lg transition"
          >
            Unstake
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Amount (USDC)"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/50"
              />
              <button
                onClick={() => {
                  if (stakerPrincipal) {
                    setUnstakeAmount(formatUnits(stakerPrincipal, 6))
                  }
                }}
                className="px-2 py-2 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-md transition font-medium"
              >
                MAX
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowUnstake(false)
                  setUnstakeAmount('')
                }}
                className="flex-1 py-2 text-sm text-[var(--muted-foreground)] hover:text-foreground bg-white/5 hover:bg-white/10 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (canUnstake) {
                    onUnstake(parsedUnstakeAmount)
                  }
                }}
                disabled={!canUnstake || isUnstaking}
                className="flex-1 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUnstaking ? 'Unstaking...' : `Unstake ${unstakeAmount || '0'} USDC`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function WealthBuildingPosition({
  endowmentInfo,
  pendingYield,
}: {
  endowmentInfo?: {
    principal: bigint
    lifetimeYield: bigint
    causeYieldPaid: bigint
    donorStockValue: bigint
    lastHarvestTime: bigint
  }
  pendingYield?: [bigint, bigint] // [causeYield, donorYield]
}) {
  const hasEndowment = endowmentInfo && endowmentInfo.principal > 0n

  // Don't render at all if no endowment for this campaign
  if (!hasEndowment) return null

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
      <h4 className="text-sm font-semibold text-foreground">Your Endowment in This Campaign</h4>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-white/5 rounded-lg">
          <p className="text-xs text-[var(--muted-foreground)]">Endowment</p>
          <p className="text-sm font-semibold">{formatUSDC(endowmentInfo!.principal)}</p>
        </div>
        <div className="p-2.5 bg-white/5 rounded-lg">
          <p className="text-xs text-[var(--muted-foreground)]">Lifetime Yield</p>
          <p className="text-sm font-semibold">{formatUSDC(endowmentInfo!.lifetimeYield)}</p>
        </div>
        <div className="p-2.5 bg-green-500/10 rounded-lg">
          <p className="text-xs text-[var(--muted-foreground)]">Cause Yield Paid</p>
          <p className="text-sm font-semibold text-green-400">
            {formatUSDC(endowmentInfo!.causeYieldPaid)}
          </p>
        </div>
        <div className="p-2.5 bg-purple-500/10 rounded-lg">
          <p className="text-xs text-[var(--muted-foreground)]">Stock Value</p>
          <p className="text-sm font-semibold text-purple-400">
            {formatUSDC(endowmentInfo!.donorStockValue)}
          </p>
        </div>
        {pendingYield && (pendingYield[0] > 0n || pendingYield[1] > 0n) && (
          <>
            <div className="p-2.5 bg-yellow-500/10 rounded-lg">
              <p className="text-xs text-[var(--muted-foreground)]">Pending (Cause)</p>
              <p className="text-sm font-semibold text-yellow-400">
                {formatUSDC(pendingYield[0])}
              </p>
            </div>
            <div className="p-2.5 bg-yellow-500/10 rounded-lg">
              <p className="text-xs text-[var(--muted-foreground)]">Pending (You)</p>
              <p className="text-sm font-semibold text-yellow-400">
                {formatUSDC(pendingYield[1])}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
