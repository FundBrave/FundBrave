'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits, Address } from 'viem'
import { CreditCard, ExternalLink, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useToastWithHelpers } from '@/app/components/ui/Toast'
import { buildOnramperBuyUrl, ONRAMPER_CONFIG } from '@/app/lib/onramp-config'
import { CONTRACTS } from '@/app/lib/contracts/config'
import { MOCK_USDC_ABI } from '@/app/lib/contracts/abis'

type OnRampStatus = 'idle' | 'pending' | 'success' | 'error'

interface OnRampWidgetProps {
  /** USD amount the user wants to buy */
  amount: number
  /** Callback when USDC has been received in wallet */
  onSuccess?: (usdcAmount: bigint) => void
  /** Callback when user cancels or error occurs */
  onCancel?: () => void
}

export function OnRampWidget({ amount, onSuccess, onCancel }: OnRampWidgetProps) {
  const { address } = useAccount()
  const toast = useToastWithHelpers()
  const [status, setStatus] = useState<OnRampStatus>('idle')
  const [previousBalance, setPreviousBalance] = useState<bigint | null>(null)
  const popupRef = useRef<Window | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track USDC balance to detect when on-ramp completes
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.USDC_ADDRESS as Address,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: status === 'pending' ? 3000 : false, // Poll every 3s while pending
    },
  })

  // Detect balance increase (on-ramp completion)
  useEffect(() => {
    if (status !== 'pending' || previousBalance === null || !usdcBalance) return

    const currentBalance = usdcBalance as bigint
    if (currentBalance > previousBalance) {
      const received = currentBalance - previousBalance
      setStatus('success')
      toast.success(`Received ${formatUnits(received, 6)} USDC!`)
      onSuccess?.(received)

      // Clean up
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [usdcBalance, previousBalance, status, onSuccess, toast])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  const handleOpenOnRamp = useCallback(() => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    // Snapshot current balance before opening on-ramp
    setPreviousBalance((usdcBalance as bigint) || 0n)
    setStatus('pending')

    const url = buildOnramperBuyUrl({
      walletAddress: address,
      amount: amount > 0 ? amount : undefined,
    })

    // Open in popup
    const popup = window.open(
      url,
      'onramp-widget',
      'width=460,height=720,scrollbars=yes,resizable=yes'
    )
    popupRef.current = popup

    // Monitor popup closure
    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup)
        // Refetch balance one final time after popup closes
        setTimeout(() => {
          refetchBalance()
        }, 2000)
      }
    }, 1000)
    pollIntervalRef.current = checkPopup
  }, [address, amount, usdcBalance, refetchBalance, toast])

  const handleCancel = () => {
    setStatus('idle')
    setPreviousBalance(null)
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    onCancel?.()
  }

  if (!ONRAMPER_CONFIG.apiKey) {
    return (
      <div className="p-3 bg-white/5 rounded-lg">
        <p className="text-xs text-[var(--muted-foreground)] text-center">
          Card payments not configured. Set NEXT_PUBLIC_ONRAMPER_API_KEY.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Status Display */}
      {status === 'pending' && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="text-yellow-400 animate-spin" />
            <p className="text-xs text-yellow-300 font-medium">
              Waiting for USDC to arrive in your wallet...
            </p>
          </div>
          <p className="text-xs text-yellow-400 mt-1">
            Complete the purchase in the Onramper popup.
            This usually takes 1-5 minutes.
          </p>
          <button
            onClick={handleCancel}
            className="mt-2 text-xs text-yellow-400 hover:text-yellow-200 underline"
          >
            Cancel
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <p className="text-xs text-green-300 font-medium">
              USDC received! You can now complete your transaction below.
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" />
            <p className="text-xs text-red-300 font-medium">
              Payment failed or was cancelled. Please try again.
            </p>
          </div>
        </div>
      )}

      {/* Buy Button */}
      {status === 'idle' && (
        <button
          onClick={handleOpenOnRamp}
          disabled={!address}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CreditCard size={18} />
          Buy {amount > 0 ? `$${amount}` : ''} USDC with Card
          <ExternalLink size={14} />
        </button>
      )}

      {/* Info */}
      <p className="text-[10px] text-[var(--muted-foreground)] text-center">
        Powered by Onramper. Aggregates 100+ providers for the best rates. KYC may be required.
      </p>
    </div>
  )
}
