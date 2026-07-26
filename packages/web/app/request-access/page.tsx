"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Clock } from "@/components/ui/icons";

export default function RequestAccessPage() {
  const router = useRouter();
  const { status, privyEmail, logout } = useAuth();
  const [switching, setSwitching] = useState(false);

  // If they got whitelisted since (or land here by mistake), move them on.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleSwitchAccount = async () => {
    setSwitching(true);
    try {
      await logout();
      router.push("/auth/login");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <main
      id="main-content"
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-white/10 bg-surface-elevated p-8 sm:p-10">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(69,12,240,0.12)] text-purple-400"
        >
          <Clock size={28} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            You are on the list
          </h1>
          <p className="text-text-secondary">
            FundBrave is in an invite-only beta. Access is granted manually by
            the team — no action needed on your side. We will let you in soon.
          </p>
        </div>

        {privyEmail && (
          <p className="w-full truncate rounded-xl border border-white/10 bg-surface-sunken px-4 py-3 text-sm text-text-secondary">
            Signed in as{" "}
            <span className="font-medium text-foreground">{privyEmail}</span>
          </p>
        )}

        <Button
          variant="secondary"
          fullWidth
          onClick={handleSwitchAccount}
          loading={switching}
          loadingText="Signing out..."
        >
          Sign out / switch account
        </Button>
      </div>

      <p className="max-w-sm text-sm text-text-tertiary">
        Think you should already have access? Reach out to the FundBrave team
        with the email above.
      </p>
    </main>
  );
}
