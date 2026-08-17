"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { WalletSummary } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { WalletIcon } from "@/components/icons";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Loading } from "@/components/Loading";
import { CountUp } from "@/components/CountUp";

const STATUS_LABEL: Record<string, string> = {
  pending: "Earned — transfer pending",
  processing: "Transfer in progress",
  paid: "Paid",
  failed: "Failed — contact support",
};

// Reuses the shared --tier-N/--rally scale as a generic "type color," not a
// literal tier — same visual language (colored pill via --tier-color) as
// the tier badge, applied to payout type instead of creator tier.
const TYPE_COLOR: Record<string, string> = {
  winner: "var(--tier-2)", // gold
  stipend: "var(--accent)",
  survivor_bonus: "var(--tier-0)", // bronze — a consolation payout
  crowd_favourite: "var(--rally)",
  referral_bonus: "var(--tier-3)", // platinum
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);

  useEffect(() => {
    api.get<WalletSummary>("/users/me/wallet").then(setWallet);
  }, []);

  if (!wallet) return <Loading label="Loading wallet" />;

  return (
    <div>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <WalletIcon width={24} height={24} aria-hidden /> Wallet
      </h1>

      <StatCard
        label="Lifetime earnings"
        value={<CountUp value={wallet.lifetimeEarningsCents} format={(n) => formatCents(n)} />}
      />

      <div className="card" style={{ marginTop: "1rem" }}>
        <p>
          <strong>{formatCents(wallet.currentBalanceCents)}</strong> paid out
        </p>
        <p className="muted">
          {formatCents(wallet.pendingPayoutsCents)} pending transfer — shown as earned the moment
          it&rsquo;s won, even before Stripe settles it.
        </p>
      </div>

      <h2>History</h2>
      {wallet.payoutHistory.length === 0 && (
        <EmptyState
          icon={<WalletIcon width={30} height={30} aria-hidden />}
          title="Nothing earned yet"
          body="Enter a challenge to start building your wallet."
          action={{ label: "Browse challenges", href: "/challenges" }}
        />
      )}
      {wallet.payoutHistory.map((p, i) => (
        <div
          key={p.id}
          className="card card-elevated card-enter"
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
        >
          <strong>{formatCents(p.amount)}</strong>{" "}
          <span
            className="badge badge-tier"
            style={{ ["--tier-color" as string]: TYPE_COLOR[p.type] ?? "var(--muted)" }}
          >
            {p.type.replace("_", " ")}
          </span>
          <div className="muted">{p.challengeName}</div>
          <span className="badge">{STATUS_LABEL[p.status] ?? p.status}</span>
        </div>
      ))}
    </div>
  );
}
