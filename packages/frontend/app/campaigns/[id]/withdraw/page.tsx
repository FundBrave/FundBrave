'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ArrowLeft, Wallet, Shield, Clock } from 'lucide-react'
import { Address } from 'viem'
import { useToastWithHelpers } from '@/app/components/ui/Toast'
import { OffRampWidget } from '@/app/components/donation/OffRampWidget'
import { formatUSDC, shortenAddress, getExplorerUrl, CONTRACTS } from '@/app/lib/contracts/config'
import {
  FUNDRAISER_FACTORY_ABI,
  FUNDRAISER_ABI,
  MOCK_USDC_ABI,
} from '@/app/lib/contracts/abis'
import { RAMP_FEATURES } from '@/app/lib/onramp-config'

export default function WithdrawPage() {
  const params = useParams()
  const { address, isConnected } = useAccount()
  const toast = useToastWithHelpers()
  const campaignId = params?.id !== undefined ? Number(params.id) : -1

  // Get fundraiser address
  const { data: fundraiserAddress } = useReadContract({
    address: CONTRACTS.FACTORY_ADDRESS,
    abi: FUNDRAISER_FACTORY_ABI,
    functionName: 'getFundraiserById',
    args: [BigInt(campaignId)],
    query: { enabled: campaignId >= 0 },
  })

  // Get campaign details
  const { data: campaignName } = useReadContract({
    address: fundraiserAddress || undefined,
    abi: FUNDRAISER_ABI,
    functionName: 'name',
    query: { enabled: !!fundraiserAddress },
  })

  const { data: beneficiary } = useReadContract({
    address: fundraiserAddress || undefined,
    abi: FUNDRAISER_ABI,
    functionName: 'beneficiary',
    query: { enabled: !!fundraiserAddress },
  })

  const { data: totalDonations, refetch: refetchDonations } = useReadContract({
    address: fundraiserAddress || undefined,
    abi: FUNDRAISER_ABI,
    functionName: 'totalDonations',
    query: { enabled: !!fundraiserAddress, refetchInterval: 10000 },
  })

  const { data: goal } = useReadContract({
    address: fundraiserAddress || undefined,
    abi: FUNDRAISER_ABI,
    functionName: 'goal',
    query: { enabled: !!fundraiserAddress },
  })

  // Get USDC balance of the fundraiser contract
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.USDC_ADDRESS as Address,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: fundraiserAddress ? [fundraiserAddress] : undefined,
    query: { enabled: !!fundraiserAddress, refetchInterval: 10000 },
  })

  // Get beneficiary's USDC balance
  const { data: beneficiaryBalance } = useReadContract({
    address: CONTRACTS.USDC_ADDRESS as Address,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 },
  })

  // Withdraw function
  const { data: withdrawHash, writeContract: withdraw, isPending: isWithdrawing } = useWriteContract()
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  })

  useEffect(() => {
    if (isWithdrawSuccess && withdrawHash) {
      toast.success('Funds withdrawn to your wallet!')
      refetchBalance()
      refetchDonations()
    }
  }, [isWithdrawSuccess, withdrawHash, refetchBalance, refetchDonations, toast])

  // Get campaign owner (who can withdraw)
  const { data: campaignOwner } = useReadContract({
    address: fundraiserAddress || undefined,
    abi: FUNDRAISER_ABI,
    functionName: 'owner',
    query: { enabled: !!fundraiserAddress },
  })

  const handleWithdraw = () => {
    if (!fundraiserAddress) return
    withdraw({
      address: fundraiserAddress as Address,
      abi: FUNDRAISER_ABI,
      functionName: 'withdrawUSDT',
    })
  }

  // Check if connected user is the beneficiary OR the campaign owner
  const isBeneficiary = address && (
    (beneficiary && address.toLowerCase() === (beneficiary as string).toLowerCase()) ||
    (campaignOwner && address.toLowerCase() === (campaignOwner as string).toLowerCase())
  )
  const availableBalance = contractBalance ? (contractBalance as bigint) : 0n
  const walletBalance = beneficiaryBalance ? (beneficiaryBalance as bigint) : 0n
  const walletBalanceUsd = Number(walletBalance) / 1_000_000

  if (campaignId < 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Invalid campaign ID</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/campaigns/${campaignId}`}
              className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft size={20} />
              Back to Campaign
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Withdraw Funds</h1>
          {campaignName && (
            <p className="text-[var(--muted-foreground)] mt-1">{campaignName as string}</p>
          )}
        </div>

        {!isConnected ? (
          <div className="bg-[var(--card)] rounded-lg p-8 border border-white/10 text-center">
            <Wallet size={40} className="mx-auto text-[var(--muted-foreground)] mb-4" />
            <p className="text-[var(--muted-foreground)] mb-4">
              Connect your wallet to manage withdrawals
            </p>
            <ConnectButton />
          </div>
        ) : !isBeneficiary ? (
          <div className="bg-[var(--card)] rounded-lg p-8 border border-white/10 text-center">
            <Shield size={40} className="mx-auto text-red-400 mb-4" />
            <p className="text-[var(--muted-foreground)] mb-2">
              Only the campaign beneficiary can withdraw funds.
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Connected: {shortenAddress(address)}
              {beneficiary && (
                <><br />Beneficiary: {shortenAddress(beneficiary as string)}</>
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--card)] rounded-lg p-5 border border-white/10">
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Total Raised</p>
                <p className="text-xl font-bold mt-1">{totalDonations ? formatUSDC(totalDonations as bigint) : '$0.00'}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Goal: {goal ? formatUSDC(goal as bigint) : '—'}
                </p>
              </div>
              <div className="bg-[var(--card)] rounded-lg p-5 border border-white/10">
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">In Campaign</p>
                <p className="text-xl font-bold mt-1 text-blue-400">
                  {formatUSDC(availableBalance)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Available to withdraw</p>
              </div>
              <div className="bg-[var(--card)] rounded-lg p-5 border border-white/10">
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Your Wallet</p>
                <p className="text-xl font-bold mt-1 text-green-400">
                  {formatUSDC(walletBalance)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">USDC balance</p>
              </div>
            </div>

            {/* Step 1: Withdraw to Wallet */}
            <div className="bg-[var(--card)] rounded-lg p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Withdraw to Wallet</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Move USDC from campaign contract to your wallet</p>
                </div>
              </div>

              {availableBalance > 0n ? (
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || isWithdrawConfirming}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet size={18} />
                  {isWithdrawing || isWithdrawConfirming
                    ? 'Withdrawing...'
                    : `Withdraw ${formatUSDC(availableBalance)} to Wallet`
                  }
                </button>
              ) : (
                <div className="py-3 text-center text-sm text-[var(--muted-foreground)] bg-white/5 rounded-lg">
                  No funds available to withdraw from campaign
                </div>
              )}
            </div>

            {/* Step 2: Off-Ramp to Bank */}
            {RAMP_FEATURES.offRampEnabled && (
              <div className="bg-[var(--card)] rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Send to Bank Account</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">Convert USDC in your wallet to fiat currency</p>
                  </div>
                </div>

                {walletBalance > 0n ? (
                  <OffRampWidget
                    amount={walletBalanceUsd}
                    label="Sell USDC to Bank"
                  />
                ) : (
                  <div className="py-3 text-center text-sm text-[var(--muted-foreground)] bg-white/5 rounded-lg">
                    No USDC in your wallet. Complete step 1 first.
                  </div>
                )}

                <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <Clock size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-300">
                    Bank transfers typically take 1-3 business days. You may need to complete KYC verification on first use.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
