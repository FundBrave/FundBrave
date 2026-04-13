'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { type TokenInfo, SUPPORTED_TOKENS } from '@/app/lib/contracts/config'

interface TokenSelectorProps {
  selectedToken: TokenInfo
  onSelect: (token: TokenInfo) => void
  /** If true, only show tokens that have non-zero addresses configured */
  filterConfigured?: boolean
}

export function TokenSelector({ selectedToken, onSelect, filterConfigured = false }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const tokens = filterConfigured
    ? SUPPORTED_TOKENS.filter(
        (t) => t.isNative || t.address !== '0x0000000000000000000000000000000000000000'
      )
    : SUPPORTED_TOKENS

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition text-sm font-medium"
      >
        <TokenIcon symbol={selectedToken.symbol} />
        <span>{selectedToken.symbol}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-48 bg-[var(--card)] border border-white/10 rounded-lg shadow-lg overflow-hidden">
          {tokens.map((token) => (
            <button
              key={token.symbol}
              onClick={() => {
                onSelect(token)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/5 transition ${
                selectedToken.symbol === token.symbol
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                  : ''
              }`}
            >
              <TokenIcon symbol={token.symbol} />
              <div className="text-left">
                <p className="font-medium">{token.symbol}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{token.name}</p>
              </div>
              {selectedToken.symbol === token.symbol && (
                <span className="ml-auto text-[var(--primary)] text-xs">Selected</span>
              )}
            </button>
          ))}

          {/* Conversion note */}
          <div className="px-3 py-2 bg-white/5 border-t border-white/10">
            <p className="text-xs text-[var(--muted-foreground)]">
              Non-USDC tokens are auto-converted to USDC by the smart contract
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function TokenIcon({ symbol }: { symbol: string }) {
  const colors: Record<string, string> = {
    USDC: 'bg-blue-500',
    ETH: 'bg-indigo-500',
    DAI: 'bg-yellow-500',
    WETH: 'bg-purple-500',
  }
  const bg = colors[symbol] || 'bg-gray-500'

  return (
    <div className={`w-6 h-6 rounded-full ${bg} flex items-center justify-center text-white text-xs font-bold`}>
      {symbol.charAt(0)}
    </div>
  )
}
