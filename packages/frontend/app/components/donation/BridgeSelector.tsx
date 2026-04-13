'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe, Clock, Fuel, ExternalLink } from 'lucide-react'

// ============ Chain Definitions ============

export interface ChainInfo {
  id: number
  name: string
  shortName: string
  icon: string    // emoji or short text
  protocol: 'layerzero' | 'wormhole' | 'native'
  lzEid?: number  // LayerZero endpoint ID
  estimatedTime: string // e.g. "~2 min"
  estimatedFee: string  // e.g. "~$0.50"
  explorerUrl?: string
  rpcUrl?: string
  nativeCurrency: string
  enabled: boolean
}

export const SUPPORTED_CHAINS: ChainInfo[] = [
  {
    id: 84532,
    name: 'Base Sepolia',
    shortName: 'Base',
    icon: '🔵',
    protocol: 'native',
    estimatedTime: 'Instant',
    estimatedFee: 'Gas only',
    explorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: 'ETH',
    enabled: true,
  },
  {
    id: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    icon: '⟠',
    protocol: 'layerzero',
    lzEid: 30101,
    estimatedTime: '~5 min',
    estimatedFee: '~$2.00',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: 'ETH',
    enabled: true,
  },
  {
    id: 137,
    name: 'Polygon',
    shortName: 'MATIC',
    icon: '🟣',
    protocol: 'layerzero',
    lzEid: 30109,
    estimatedTime: '~3 min',
    estimatedFee: '~$0.10',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: 'MATIC',
    enabled: true,
  },
  {
    id: 42161,
    name: 'Arbitrum',
    shortName: 'ARB',
    icon: '🔷',
    protocol: 'layerzero',
    lzEid: 30110,
    estimatedTime: '~3 min',
    estimatedFee: '~$0.30',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: 'ETH',
    enabled: true,
  },
  {
    id: 10,
    name: 'Optimism',
    shortName: 'OP',
    icon: '🔴',
    protocol: 'layerzero',
    lzEid: 30111,
    estimatedTime: '~3 min',
    estimatedFee: '~$0.20',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: 'ETH',
    enabled: true,
  },
  {
    id: 30,
    name: 'RSK (Bitcoin)',
    shortName: 'RSK',
    icon: '₿',
    protocol: 'layerzero',
    lzEid: 30294,
    estimatedTime: '~5 min',
    estimatedFee: '~$0.50',
    explorerUrl: 'https://explorer.rsk.co',
    nativeCurrency: 'RBTC',
    enabled: true,
  },
  {
    id: 1399811149,
    name: 'Solana',
    shortName: 'SOL',
    icon: '◎',
    protocol: 'wormhole',
    estimatedTime: '~10 min',
    estimatedFee: '~$0.50',
    explorerUrl: 'https://solscan.io',
    nativeCurrency: 'SOL',
    enabled: true,
  },
]

// ============ Component ============

interface BridgeSelectorProps {
  selectedChain: ChainInfo
  onSelect: (chain: ChainInfo) => void
  compact?: boolean
}

export function BridgeSelector({ selectedChain, onSelect, compact = false }: BridgeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isNative = selectedChain.protocol === 'native'
  const isBridged = !isNative

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Chain Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition text-sm ${
          isBridged
            ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
            : 'border-white/10 bg-white/5 text-[var(--foreground)]'
        } hover:border-[var(--primary)]/50`}
      >
        <span className="text-base">{selectedChain.icon}</span>
        <span className="font-medium">{compact ? selectedChain.shortName : selectedChain.name}</span>
        {isBridged && (
          <span className="text-[10px] bg-orange-500/20 px-1.5 py-0.5 rounded-full font-semibold">
            BRIDGE
          </span>
        )}
        <ChevronDown size={14} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-72 bg-[var(--card)] border border-white/10 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <p className="text-xs text-[var(--muted-foreground)] font-medium px-2">
              Select Source Network
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {SUPPORTED_CHAINS.filter(c => c.enabled).map((chain) => {
              const isSelected = chain.id === selectedChain.id
              const isChainNative = chain.protocol === 'native'

              return (
                <button
                  key={chain.id}
                  onClick={() => {
                    onSelect(chain)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left ${
                    isSelected
                      ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-xl w-8 text-center">{chain.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {chain.name}
                      </span>
                      {isChainNative && (
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-semibold">
                          NATIVE
                        </span>
                      )}
                      {chain.protocol === 'layerzero' && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-semibold">
                          LayerZero
                        </span>
                      )}
                      {chain.protocol === 'wormhole' && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-semibold">
                          Wormhole
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                        <Clock size={10} />
                        {chain.estimatedTime}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                        <Fuel size={10} />
                        {chain.estimatedFee}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-[var(--primary)] rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer info */}
          <div className="p-2 border-t border-white/10">
            <p className="text-[10px] text-[var(--muted-foreground)] px-2">
              All tokens are bridged and converted to USDC on Base.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Bridge Status Component ============

export type BridgeStatus = 'idle' | 'bridging' | 'confirming' | 'swapping' | 'complete' | 'failed'

interface BridgeStatusBannerProps {
  status: BridgeStatus
  sourceChain: ChainInfo
  txHash?: string
}

export function BridgeStatusBanner({ status, sourceChain, txHash }: BridgeStatusBannerProps) {
  if (status === 'idle') return null

  const statusConfig = {
    bridging: {
      label: `Bridging from ${sourceChain.name}...`,
      color: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      pulse: true,
    },
    confirming: {
      label: 'Waiting for confirmations...',
      color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      pulse: true,
    },
    swapping: {
      label: 'Converting to USDC on Base...',
      color: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      pulse: true,
    },
    complete: {
      label: 'Bridge complete!',
      color: 'bg-green-500/10 border-green-500/30 text-green-400',
      pulse: false,
    },
    failed: {
      label: 'Bridge failed. Please try again.',
      color: 'bg-red-500/10 border-red-500/30 text-red-400',
      pulse: false,
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`p-3 rounded-lg border ${config.color}`}>
      <div className="flex items-center gap-2">
        {config.pulse && (
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
        )}
        <Globe size={14} />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
      {txHash && sourceChain.explorerUrl && (
        <a
          href={`${sourceChain.explorerUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 mt-1 text-xs underline opacity-75 hover:opacity-100"
        >
          View on Explorer <ExternalLink size={10} />
        </a>
      )}
    </div>
  )
}
