"use client";

/**
 * WithdrawModal — creator side of the 2-of-2 withdrawal.
 *
 * 1. Pick chain + token + amount (balances read from the API; BigInt math).
 * 2. Create the request → sign the SafeTx typed data with the Privy embedded
 *    wallet → submit the signature. Then it waits for admin co-approval.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { truncateWalletAddress } from "@/lib/wallet";
import {
  AmountError,
  formatTokenAmount,
  parseTokenAmount,
  type ChainBalance,
  type CreateWithdrawalResponse,
  type TokenBalance,
} from "@/lib/withdrawals";
import {
  useCampaignBalances,
  useCreateWithdrawal,
  useSubmitCreatorSignature,
} from "@/hooks/useWithdrawals";
import { usePrivySignTypedData, SigningError } from "@/hooks/usePrivySignTypedData";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { AlertTriangle, CheckCircle2, Clock, Wallet } from "@/components/ui/icons";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  /** Creator wallet — funds are sent here. */
  destination: string | null;
}

type SelectableToken = TokenBalance & { chainId: number };

function tokensWithBalance(chain: ChainBalance): SelectableToken[] {
  const out: SelectableToken[] = [];
  if (BigInt(chain.native.balanceRaw || "0") > 0n) {
    out.push({
      address: null,
      symbol: chain.native.symbol,
      decimals: chain.native.decimals,
      balanceRaw: chain.native.balanceRaw,
      chainId: chain.chainId,
    });
  }
  for (const t of chain.tokens) {
    if (BigInt(t.balanceRaw || "0") > 0n) out.push({ ...t, chainId: chain.chainId });
  }
  return out;
}

export function WithdrawModal({
  open,
  onClose,
  campaignId,
  campaignTitle,
  destination,
}: WithdrawModalProps) {
  const { showToast } = useToast();
  const balancesQuery = useCampaignBalances(campaignId, open);
  const createMutation = useCreateWithdrawal();
  const signMutation = useSubmitCreatorSignature();
  const { signSafeTx } = usePrivySignTypedData();

  const [chainId, setChainId] = useState<number | null>(null);
  const [tokenKey, setTokenKey] = useState<string | null>(null); // `${chainId}:${address ?? 'native'}`
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "signing" | "done">("form");
  const [created, setCreated] = useState<CreateWithdrawalResponse | null>(null);

  const chains = balancesQuery.data?.chains ?? [];
  const fundedChains = useMemo(
    () => chains.filter((c) => tokensWithBalance(c).length > 0),
    [chains]
  );
  const activeChain = fundedChains.find((c) => c.chainId === chainId) ?? null;
  const tokens = activeChain ? tokensWithBalance(activeChain) : [];
  const activeToken =
    tokens.find((t) => `${t.chainId}:${t.address ?? "native"}` === tokenKey) ?? null;

  const reset = () => {
    setChainId(null);
    setTokenKey(null);
    setAmount("");
    setAmountError(null);
    setStep("form");
    setCreated(null);
  };

  const handleClose = () => {
    if (createMutation.isPending || signMutation.isPending || step === "signing") return;
    reset();
    onClose();
  };

  const handleMax = () => {
    if (!activeToken) return;
    setAmount(formatTokenAmount(activeToken.balanceRaw, activeToken.decimals, activeToken.decimals));
    setAmountError(null);
  };

  const handleContinue = async () => {
    if (!activeChain || !activeToken) return;
    let amountRaw: bigint;
    try {
      amountRaw = parseTokenAmount(amount, activeToken.decimals);
    } catch (err) {
      setAmountError(err instanceof AmountError ? err.message : "Invalid amount");
      return;
    }
    if (amountRaw > BigInt(activeToken.balanceRaw)) {
      setAmountError("Amount exceeds the available balance");
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        campaignId,
        chainId: activeChain.chainId,
        tokenAddress: activeToken.address,
        amountRaw: amountRaw.toString(),
      });
      setCreated(res);
      setStep("signing");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not create the withdrawal";
      showToast(msg, "error", 7000);
    }
  };

  const handleSign = async () => {
    if (!created) return;
    try {
      const signature = await signSafeTx(created.typedData);
      await signMutation.mutateAsync({ id: created.withdrawal.id, signature });
      setStep("done");
    } catch (err) {
      const msg =
        err instanceof SigningError || err instanceof ApiError
          ? err.message
          : "Signing failed. Please try again.";
      showToast(msg, "error", 7000);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Withdraw from "${campaignTitle}"`}
      dismissible={step !== "signing" && !createMutation.isPending}
    >
      {step === "done" ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <CheckCircle2 size={48} className="text-brave-mint" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold text-foreground">
              Signed — awaiting admin approval
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Your withdrawal needs a second signature from the FundBrave admin.
              You&apos;ll get an email when the funds are on their way to your wallet.
            </p>
          </div>
          <Button onClick={handleClose} className="mt-2">
            Done
          </Button>
        </div>
      ) : step === "signing" && created ? (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-white/10 bg-surface-sunken p-4">
            <SummaryRow label="Amount" value={`${formatTokenAmount(created.withdrawal.amountRaw, activeToken?.decimals ?? 18)} ${created.withdrawal.tokenSymbol}`} />
            <SummaryRow label="Network" value={activeChain?.name ?? String(created.withdrawal.chainId)} />
            <SummaryRow label="To your wallet" value={truncateWalletAddress(created.withdrawal.toAddress)} mono />
          </div>
          <p className="text-sm text-text-secondary">
            Approve the signature request in your embedded wallet to authorize
            this withdrawal. It moves funds only after the admin co-signs.
          </p>
          <Button
            onClick={handleSign}
            loading={signMutation.isPending}
            loadingText="Submitting signature..."
          >
            <Wallet size={16} aria-hidden="true" />
            Sign withdrawal
          </Button>
        </div>
      ) : balancesQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : balancesQuery.isError ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <AlertTriangle size={32} className="text-brave-amber" aria-hidden="true" />
          <p className="text-sm text-text-secondary">
            We couldn&apos;t read your campaign balances right now.
          </p>
          <Button variant="outline" size="sm" onClick={() => balancesQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : fundedChains.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Clock size={32} className="text-text-tertiary" aria-hidden="true" />
          <p className="text-sm text-text-secondary">
            No withdrawable balance yet. Confirmed donations will appear here
            once they land in your campaign wallet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Chain */}
          <Field label="Network">
            <div className="flex flex-wrap gap-2">
              {fundedChains.map((c) => (
                <Chip
                  key={c.chainId}
                  active={c.chainId === chainId}
                  onClick={() => {
                    setChainId(c.chainId);
                    setTokenKey(null);
                    setAmount("");
                    setAmountError(null);
                  }}
                >
                  {c.name}
                </Chip>
              ))}
            </div>
          </Field>

          {/* Token */}
          {activeChain && (
            <Field label="Token">
              <div className="flex flex-wrap gap-2">
                {tokens.map((t) => {
                  const key = `${t.chainId}:${t.address ?? "native"}`;
                  return (
                    <Chip
                      key={key}
                      active={key === tokenKey}
                      onClick={() => {
                        setTokenKey(key);
                        setAmount("");
                        setAmountError(null);
                      }}
                    >
                      {t.symbol}
                      <span className="ml-1.5 text-xs text-text-tertiary">
                        {formatTokenAmount(t.balanceRaw, t.decimals)}
                      </span>
                    </Chip>
                  );
                })}
              </div>
            </Field>
          )}

          {/* Amount */}
          {activeToken && (
            <Field label="Amount">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border bg-surface-sunken px-3 py-2",
                  amountError ? "border-destructive/60" : "border-white/10"
                )}
              >
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError(null);
                  }}
                  placeholder="0.0"
                  className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-text-tertiary"
                  aria-label="Withdrawal amount"
                />
                <span className="shrink-0 text-sm font-medium text-text-secondary">
                  {activeToken.symbol}
                </span>
                <button
                  type="button"
                  onClick={handleMax}
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-brave-mint transition-colors hover:bg-brave-mint/10"
                >
                  Max
                </button>
              </div>
              {amountError ? (
                <p className="mt-1 text-xs text-destructive">{amountError}</p>
              ) : (
                <p className="mt-1 text-xs text-text-tertiary">
                  Available: {formatTokenAmount(activeToken.balanceRaw, activeToken.decimals)}{" "}
                  {activeToken.symbol}
                </p>
              )}
            </Field>
          )}

          {/* Destination */}
          <div className="rounded-xl border border-white/10 bg-surface-sunken px-4 py-3">
            <p className="text-xs text-text-tertiary">Funds go to your wallet</p>
            <p className="mt-0.5 truncate font-mono text-sm text-foreground">
              {destination ? truncateWalletAddress(destination) : "—"}
            </p>
          </div>

          <Button
            onClick={handleContinue}
            disabled={!activeToken || amount.trim() === ""}
            loading={createMutation.isPending}
            loadingText="Preparing..."
          >
            Continue
          </Button>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text-secondary">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        active
          ? "border-brave-mint/50 bg-brave-mint/10 text-brave-mint"
          : "border-white/10 bg-surface-sunken text-text-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={cn("text-sm font-medium text-foreground", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

export default WithdrawModal;
