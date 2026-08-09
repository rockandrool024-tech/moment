"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { WalletSummary } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { WalletIcon } from "@/components/icons";

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

  if (!wallet) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <WalletIcon width={24} height={24} aria-hidden /> Wallet
      </h1>

      <div className="card">
        <p style={{ fontSize: "2rem", margin: "0 0 0.25rem", fontWeight: 700 }}>
          {formatCents(wallet.lifetimeEarningsCents)}
        </p>
        <p className="muted" style={{ margin: 0 }}>
          lifetime earnings
        </p>
      </div>

      <div className="card">
        <p>
          <strong>{formatCents(wallet.currentBalanceCents)}</strong> paid out
        </p>
        <p className="muted">
          {formatCents(wallet.pendingPayoutsCents)} pending transfer — shown as earned the moment
          it&rsquo;s won, even before Stripe settles it.
        </p>
      </div>

      <h2>History</h2>
      {wallet.payoutHistory.length === 0 && <p className="muted">No payouts yet.</p>}
      {wallet.payoutHistory.map((p) => (
        <div key={p.id} className="card card-elevated">
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
