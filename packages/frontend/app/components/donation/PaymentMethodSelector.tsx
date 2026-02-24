'use client'

import { CreditCard, Wallet } from 'lucide-react'

export type PaymentMethod = 'crypto' | 'card'

interface PaymentMethodSelectorProps {
  selected: PaymentMethod
  onChange: (method: PaymentMethod) => void
  disabled?: boolean
}

export function PaymentMethodSelector({ selected, onChange, disabled }: PaymentMethodSelectorProps) {
  return (
    <div className="flex rounded-lg bg-white/5 p-0.5">
      <button
        onClick={() => onChange('crypto')}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition ${
          selected === 'crypto'
            ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        } disabled:opacity-50`}
      >
        <Wallet size={13} />
        Crypto
      </button>
      <button
        onClick={() => onChange('card')}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition ${
          selected === 'card'
            ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        } disabled:opacity-50`}
      >
        <CreditCard size={13} />
        Card
      </button>
    </div>
  )
}
