"use client";

/**
 * DonatePanel — the primary donation CTA on the campaign detail page.
 *
 * Two tabs:
 *  - "Pay with wallet": RainbowKit connect + wagmi send. Native transfers go
 *    through useSendTransaction, ERC-20s through useWriteContract(transfer).
 *  - "Address / QR": server-rendered EIP-681 QR + copyable vault address.
 *
 * Degraded mode (no NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID): the wallet tab is
 * hidden entirely — wagmi hooks are never mounted without WagmiProvider.
 *
 * All amount math uses viem's parseUnits — never float multiplication.
 */

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { erc20Abi, parseUnits } from "viem";
import { cn } from "@/lib/utils";
import { isWalletConfigured, WALLET_NOT_CONFIGURED_MESSAGE } from "@/lib/wagmi";
import { campaignKeys } from "@/hooks/useCampaigns";
import {
  donationKeys,
  explorerTxUrl,
  useDonationQr,
  useSupportedChains,
  type SupportedChain,
  type SupportedToken,
} from "@/hooks/useDonationData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  Wallet,
} from "@/components/ui/icons";
import { Copy, QrCode } from "lucide-react";

// ============================================================================
// Amount validation (client-side, before parseUnits)
// ============================================================================

/** Max decimals we accept for native-asset amounts (rule: ≤ 12). */
const NATIVE_MAX_DECIMALS = 12;

const STABLE_PRESETS = ["10", "25", "50", "100"] as const;

function isStablecoin(symbol: string): boolean {
  return /USD|DAI/i.test(symbol);
}

function maxDecimalsFor(token: SupportedToken): number {
  return token.address === null
    ? Math.min(NATIVE_MAX_DECIMALS, token.decimals)
    : token.decimals;
}

type AmountCheck = { ok: true } | { ok: false; error: string };

function validateAmount(raw: string, maxDecimals: number): AmountCheck {
  const amount = raw.trim();
  if (!amount) return { ok: false, error: "Enter an amount" };
  if (!/^\d*\.?\d*$/.test(amount) || amount === "." || /^\.?$/.test(amount)) {
    return { ok: false, error: "Enter a valid number" };
  }
  const frac = amount.split(".")[1] ?? "";
  if (frac.length > maxDecimals) {
    return {
      ok: false,
      error: `Use at most ${maxDecimals} decimal place${maxDecimals === 1 ? "" : "s"}`,
    };
  }
  // Display-only positivity check — the value sent on-chain comes from
  // parseUnits, never from this float.
  if (!(Number.parseFloat(amount) > 0)) {
    return { ok: false, error: "Amount must be greater than zero" };
  }
  return { ok: true };
}

/** Digits and a single dot only. */
function sanitizeAmountInput(value: string): string {
  const stripped = value.replace(/[^0-9.]/g, "");
  const firstDot = stripped.indexOf(".");
  if (firstDot === -1) return stripped;
  return (
    stripped.slice(0, firstDot + 1) +
    stripped.slice(firstDot + 1).replace(/\./g, "")
  );
}

// ============================================================================
// Shared chips + inputs
// ============================================================================

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
      {children}
    </span>
  );
}

function ChainChips({
  chains,
  selectedChainId,
  onSelect,
}: {
  chains: SupportedChain[];
  selectedChainId: number | null;
  onSelect: (chainId: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Network">
      {chains.map((chain) => {
        const active = chain.chainId === selectedChainId;
        return (
          <button
            key={chain.chainId}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(chain.chainId)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
              active
                ? "border-primary bg-primary/15 text-foreground"
                : "border-white/10 bg-surface-elevated text-text-secondary hover:bg-surface-overlay hover:text-foreground"
            )}
          >
            {chain.name}
            {chain.isTestnet && (
              <span className="ml-1 text-[10px] font-medium text-brave-amber">
                testnet
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TokenChips({
  tokens,
  selectedSymbol,
  onSelect,
}: {
  tokens: SupportedToken[];
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Token">
      {tokens.map((token) => {
        const active = token.symbol === selectedSymbol;
        return (
          <button
            key={token.symbol}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(token.symbol)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
              active
                ? "border-primary bg-primary/15 text-foreground"
                : "border-white/10 bg-surface-elevated text-text-secondary hover:bg-surface-overlay hover:text-foreground"
            )}
          >
            {token.symbol}
          </button>
        );
      })}
    </div>
  );
}

function AmountInput({
  amount,
  symbol,
  error,
  onChange,
  label = "Amount",
}: {
  amount: string;
  symbol: string;
  error: string | null;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <span className="relative block">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="0.00"
          value={amount}
          onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
          aria-invalid={!!error}
          className={cn(
            "h-12 w-full rounded-xl border bg-surface-elevated px-4 pr-20 text-base text-foreground placeholder:text-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
            error ? "border-destructive/60" : "border-white/10"
          )}
        />
        <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-text-tertiary">
          {symbol}
        </span>
      </span>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function CopyRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast(`${label} copied`, "success", 2000);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(`Could not copy the ${label.toLowerCase()}`, "error");
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-surface-elevated px-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold tracking-wide text-text-tertiary uppercase">
          {label}
        </span>
        <span
          className={cn(
            "block truncate text-xs text-text-secondary",
            mono && "font-mono"
          )}
          title={value}
        >
          {value}
        </span>
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label.toLowerCase()}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        {copied ? (
          <Check size={16} className="text-brave-mint" />
        ) : (
          <Copy size={16} />
        )}
      </button>
    </div>
  );
}

// ============================================================================
// Wallet tab (mounted only when WagmiProvider exists)
// ============================================================================

function WalletTab({
  campaignId,
  safeAddress,
  chains,
}: {
  campaignId: string;
  safeAddress: string;
  chains: SupportedChain[];
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, chain: accountChain } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();

  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  /** Snapshot of the chain a pending tx was sent on (for the explorer link). */
  const [txChainId, setTxChainId] = useState<number | null>(null);

  // Effective chain: explicit pick → wallet's chain (if supported) → first.
  const chain = useMemo<SupportedChain | null>(() => {
    const byId = (id: number | undefined) =>
      chains.find((c) => c.chainId === id);
    return (
      byId(selectedChainId ?? undefined) ??
      byId(accountChain?.id) ??
      chains[0] ??
      null
    );
  }, [chains, selectedChainId, accountChain?.id]);

  const token = useMemo<SupportedToken | null>(() => {
    if (!chain) return null;
    return (
      chain.tokens.find((t) => t.symbol === selectedSymbol) ??
      chain.tokens[0] ??
      null
    );
  }, [chain, selectedSymbol]);

  const {
    sendTransaction,
    data: nativeHash,
    isPending: nativeSending,
    error: nativeError,
    reset: resetNative,
  } = useSendTransaction();
  const {
    writeContract,
    data: erc20Hash,
    isPending: erc20Sending,
    error: erc20Error,
    reset: resetErc20,
  } = useWriteContract();

  const hash = nativeHash ?? erc20Hash;
  const {
    isLoading: confirming,
    isSuccess: receiptReady,
    isError: receiptError,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  const confirmedOk = receiptReady && receipt?.status === "success";
  const failedOnChain =
    receiptError || (receiptReady && receipt?.status === "reverted");
  const awaitingWallet = nativeSending || erc20Sending;

  // Surface wallet errors (rejection vs failure) as toasts, then reset so
  // the user can retry immediately.
  useEffect(() => {
    const err = nativeError ?? erc20Error;
    if (!err) return;
    const rejected = /rejected|denied|cancell?ed/i.test(err.message);
    showToast(
      rejected
        ? "Transaction cancelled in your wallet"
        : err.message.split("\n")[0] || "Transaction failed",
      "error",
      6000
    );
    resetNative();
    resetErc20();
  }, [nativeError, erc20Error, showToast, resetNative, resetErc20]);

  // On confirmation, nudge campaign totals + donation queries. The donation
  // itself appears once the API confirms the transfer (webhook/poller).
  useEffect(() => {
    if (!confirmedOk) return;
    void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    void queryClient.invalidateQueries({
      queryKey: donationKeys.lists(campaignId),
    });
    void queryClient.invalidateQueries({
      queryKey: donationKeys.breakdown(campaignId),
    });
  }, [confirmedOk, queryClient, campaignId]);

  const handleSelectChain = (chainId: number) => {
    setSelectedChainId(chainId);
    setSelectedSymbol(null);
    setAmountError(null);
    if (isConnected && accountChain?.id !== chainId) {
      switchChain({ chainId });
    }
  };

  const wrongChain = isConnected && chain && accountChain?.id !== chain.chainId;

  const handleDonate = () => {
    if (!chain || !token) return;
    const check = validateAmount(amount, maxDecimalsFor(token));
    if (!check.ok) {
      setAmountError(check.error);
      return;
    }
    setAmountError(null);

    let value: bigint;
    try {
      value = parseUnits(amount.trim(), token.decimals);
    } catch {
      setAmountError("Enter a valid amount");
      return;
    }
    if (value <= 0n) {
      setAmountError("Amount must be greater than zero");
      return;
    }

    const to = safeAddress as `0x${string}`;
    setTxChainId(chain.chainId);
    if (token.address === null) {
      sendTransaction({ to, value });
    } else {
      writeContract({
        address: token.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, value],
      });
    }
  };

  const handleReset = () => {
    resetNative();
    resetErc20();
    setAmount("");
    setAmountError(null);
    setTxChainId(null);
  };

  // ---- Success state -------------------------------------------------------
  if (hash && confirmedOk) {
    const txChain = chains.find((c) => c.chainId === txChainId) ?? undefined;
    const txUrl = explorerTxUrl(txChain, hash);
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 size={40} className="text-brave-mint" aria-hidden="true" />
        <p className="text-base font-semibold text-foreground">
          Thank you for your donation!
        </p>
        <p className="text-xs text-text-tertiary">
          It can take a minute or two for your donation to appear here.
        </p>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            View transaction
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
        <Button variant="outline" size="sm" onClick={handleReset}>
          Make another donation
        </Button>
      </div>
    );
  }

  // ---- Failed on-chain -----------------------------------------------------
  if (hash && failedOnChain) {
    const txChain = chains.find((c) => c.chainId === txChainId) ?? undefined;
    const txUrl = explorerTxUrl(txChain, hash);
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
        <p className="flex items-start gap-2 text-sm text-foreground">
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          The transaction failed on-chain. You have not been charged beyond gas
          fees.
        </p>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            View transaction
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
        <Button variant="outline" size="sm" onClick={handleReset}>
          Try again
        </Button>
      </div>
    );
  }

  // ---- Form ----------------------------------------------------------------
  return (
    <div className="flex flex-col gap-4">
      <ConnectButton.Custom>
        {({
          account,
          chain: rkChain,
          openConnectModal,
          openAccountModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== "loading";
          if (!ready) {
            return <Skeleton variant="rounded" className="h-12 w-full" />;
          }
          if (!account || !rkChain) {
            return (
              <Button fullWidth onClick={openConnectModal}>
                <Wallet size={18} aria-hidden="true" />
                Connect wallet
              </Button>
            );
          }
          return (
            <button
              type="button"
              onClick={openAccountModal}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-surface-elevated px-4 py-3 transition-colors hover:bg-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <span className="flex min-w-0 items-center gap-2 text-foreground">
                <Wallet size={16} className="shrink-0" aria-hidden="true" />
                <span className="truncate font-mono text-sm">
                  {account.displayName}
                </span>
              </span>
              <span className="shrink-0 text-xs text-text-tertiary">
                {rkChain.unsupported ? "Unsupported network" : rkChain.name}
              </span>
            </button>
          );
        }}
      </ConnectButton.Custom>

      {!isConnected ? (
        <p className="text-xs text-text-tertiary">
          Connect a wallet to donate directly, or use the Address / QR tab to
          send from an exchange or another wallet.
        </p>
      ) : !chain || !token ? (
        <p className="text-xs text-text-tertiary">
          No supported networks are configured yet. Please check back soon.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Network</FieldLabel>
            <ChainChips
              chains={chains}
              selectedChainId={chain.chainId}
              onSelect={handleSelectChain}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Token</FieldLabel>
            <TokenChips
              tokens={chain.tokens}
              selectedSymbol={token.symbol}
              onSelect={(symbol) => {
                setSelectedSymbol(symbol);
                setAmountError(null);
              }}
            />
          </div>

          {isStablecoin(token.symbol) && (
            <div className="grid grid-cols-4 gap-2">
              {STABLE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setAmountError(null);
                  }}
                  aria-pressed={amount === preset}
                  className={cn(
                    "h-11 rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                    amount === preset
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-white/10 bg-surface-elevated text-text-secondary hover:bg-surface-overlay hover:text-foreground"
                  )}
                >
                  ${preset}
                </button>
              ))}
            </div>
          )}

          <AmountInput
            amount={amount}
            symbol={token.symbol}
            error={amountError}
            onChange={(value) => {
              setAmount(value);
              if (amountError) setAmountError(null);
            }}
          />

          {wrongChain ? (
            <Button
              fullWidth
              onClick={() => switchChain({ chainId: chain.chainId })}
              loading={switching}
              loadingText="Switching network..."
            >
              Switch to {chain.name}
            </Button>
          ) : (
            <Button
              fullWidth
              onClick={handleDonate}
              loading={awaitingWallet || confirming}
              loadingText={
                awaitingWallet ? "Confirm in your wallet..." : "Confirming on-chain..."
              }
            >
              Donate {amount ? `${amount} ${token.symbol}` : "now"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Address / QR tab
// ============================================================================

function AddressTab({
  campaignId,
  safeAddress,
  chains,
}: {
  campaignId: string;
  safeAddress: string;
  chains: SupportedChain[];
}) {
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [debouncedAmount, setDebouncedAmount] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAmount(amount), 450);
    return () => clearTimeout(timer);
  }, [amount]);

  const chain = useMemo<SupportedChain | null>(
    () =>
      chains.find((c) => c.chainId === selectedChainId) ?? chains[0] ?? null,
    [chains, selectedChainId]
  );
  const token = useMemo<SupportedToken | null>(() => {
    if (!chain) return null;
    return (
      chain.tokens.find((t) => t.symbol === selectedSymbol) ??
      chain.tokens[0] ??
      null
    );
  }, [chain, selectedSymbol]);

  // Optional amount → base units for the EIP-681 URI. Invalid/empty input
  // simply omits the amount from the QR.
  const amountBaseUnits = useMemo<string | null>(() => {
    const trimmed = debouncedAmount.trim();
    if (!trimmed || !token) return null;
    if (!validateAmount(trimmed, maxDecimalsFor(token)).ok) return null;
    try {
      return parseUnits(trimmed, token.decimals).toString();
    } catch {
      return null;
    }
  }, [debouncedAmount, token]);

  const qrQuery = useDonationQr(campaignId, {
    chainId: chain?.chainId ?? null,
    tokenAddress: token?.address ?? null,
    amountBaseUnits,
  });

  if (!chain || !token) {
    return (
      <p className="text-xs text-text-tertiary">
        No supported networks are configured yet. Please check back soon.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Network</FieldLabel>
        <ChainChips
          chains={chains}
          selectedChainId={chain.chainId}
          onSelect={(chainId) => {
            setSelectedChainId(chainId);
            setSelectedSymbol(null);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Token</FieldLabel>
        <TokenChips
          tokens={chain.tokens}
          selectedSymbol={token.symbol}
          onSelect={setSelectedSymbol}
        />
      </div>

      <AmountInput
        amount={amount}
        symbol={token.symbol}
        error={null}
        onChange={setAmount}
        label="Amount (optional)"
      />

      {/* QR */}
      <div className="flex justify-center">
        {qrQuery.isLoading ? (
          <Skeleton variant="rounded" className="h-44 w-44" />
        ) : qrQuery.data ? (
          // eslint-disable-next-line @next/next/no-img-element -- PNG data URL from the API; next/image adds nothing here.
          <img
            src={qrQuery.data.dataUrl}
            alt={`Donation QR code for ${chain.name}`}
            width={176}
            height={176}
            className="h-44 w-44 rounded-xl bg-white p-2"
          />
        ) : (
          <div className="flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-elevated text-text-tertiary">
            <QrCode size={24} aria-hidden="true" />
            <span className="px-4 text-center text-xs">
              Could not load the QR code
            </span>
          </div>
        )}
      </div>

      <CopyRow label="Vault address" value={safeAddress} />
      {qrQuery.data?.uri && (
        <CopyRow label="Payment link (EIP-681)" value={qrQuery.data.uri} />
      )}

      <div className="flex items-start gap-2 rounded-xl border border-brave-amber/40 bg-brave-amber/10 p-3">
        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-brave-amber"
          aria-hidden="true"
        />
        <p className="text-xs leading-relaxed text-brave-amber">
          Send only the listed tokens on the listed networks. Assets sent on
          other networks may be unrecoverable.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Panel
// ============================================================================

export interface DonatePanelProps {
  /** Campaign ID (not slug) — donation endpoints are keyed by id. */
  campaignId: string;
  safeAddress: string;
  className?: string;
}

type DonateTab = "wallet" | "address";

export function DonatePanel({
  campaignId,
  safeAddress,
  className,
}: DonatePanelProps) {
  const [tab, setTab] = useState<DonateTab>(
    isWalletConfigured ? "wallet" : "address"
  );
  const chainsQuery = useSupportedChains();
  const chains = chainsQuery.data ?? [];

  return (
    <section
      aria-label="Donate to this campaign"
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-white/10 bg-surface-sunken p-4",
        className
      )}
    >
      {isWalletConfigured ? (
        <div
          role="tablist"
          aria-label="Donation method"
          className="flex rounded-xl border border-white/10 bg-surface-elevated p-1"
        >
          {(
            [
              { id: "wallet", label: "Pay with wallet" },
              { id: "address", label: "Address / QR" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                tab === id
                  ? "bg-surface-overlay text-foreground"
                  : "text-text-secondary hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            Send a donation
          </p>
          <p className="text-xs text-text-tertiary">
            {WALLET_NOT_CONFIGURED_MESSAGE}
          </p>
        </div>
      )}

      {chainsQuery.isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton variant="rounded" className="h-12 w-full" />
          <Skeleton variant="rounded" className="h-8 w-3/4" />
          <Skeleton variant="rounded" className="h-12 w-full" />
        </div>
      ) : chainsQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-text-secondary">
            Could not load donation options.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void chainsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : chains.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Donations are not configured yet. Please check back soon.
        </p>
      ) : tab === "wallet" && isWalletConfigured ? (
        <WalletTab
          campaignId={campaignId}
          safeAddress={safeAddress}
          chains={chains}
        />
      ) : (
        <AddressTab
          campaignId={campaignId}
          safeAddress={safeAddress}
          chains={chains}
        />
      )}
    </section>
  );
}

export default DonatePanel;
