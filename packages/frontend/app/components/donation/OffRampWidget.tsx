'use client'

import { useState, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { Banknote, ExternalLink, Loader2 } from 'lucide-react'
import { useToastWithHelpers } from '@/app/components/ui/Toast'
import { buildOnramperSellUrl, ONRAMPER_CONFIG } from '@/app/lib/onramp-config'

type OffRampStatus = 'idle' | 'pending' | 'complete'

interface OffRampWidgetProps {
  /** USDC amount to sell (in human-readable units, e.g., 100 = $100) */
  amount?: number
  /** Optional label for context */
  label?: string
}

export function OffRampWidget({ amount, label }: OffRampWidgetProps) {
  const { address } = useAccount()
  const toast = useToastWithHelpers()
  const [status, setStatus] = useState<OffRampStatus>('idle')
  const popupRef = useRef<Window | null>(null)

  const handleOpenOffRamp = useCallback(() => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!ONRAMPER_CONFIG.apiKey) {
      toast.error('Off-ramp not configured. Missing Onramper API key.')
      return
    }

    setStatus('pending')

    const url = buildOnramperSellUrl({
      walletAddress: address,
      amount: amount && amount > 0 ? amount : undefined,
    })

    const popup = window.open(
      url,
      'offramp-widget',
      'width=460,height=720,scrollbars=yes,resizable=yes'
    )
    popupRef.current = popup

    // Monitor popup closure
    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup)
        setStatus('idle')
        toast.info('Off-ramp window closed. Check your Onramper dashboard for transaction status.')
      }
    }, 1000)
  }, [address, amount, toast])

  if (!ONRAMPER_CONFIG.apiKey) {
    return null
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleOpenOffRamp}
        disabled={!address || status === 'pending'}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {status === 'pending' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Banknote size={16} />
            {label || 'Withdraw to Bank'}
            {amount && amount > 0 ? ` ($${amount})` : ''}
            <ExternalLink size={12} />
          </>
        )}
      </button>

      <p className="text-[10px] text-[var(--muted-foreground)] text-center">
        Powered by Onramper. Aggregates multiple providers. Settlement: 1-3 business days.
      </p>
    </div>
  )
}
