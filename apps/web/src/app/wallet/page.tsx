"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { WalletSummary } from "@/lib/types";
import { formatCents } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  pending: "Earned — transfer pending",
  processing: "Transfer in progress",
  paid: "Paid",
  failed: "Failed — contact support",
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);

  useEffect(() => {
    api.get<WalletSummary>("/users/me/wallet").then(setWallet);
  }, []);

  if (!wallet) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1>Wallet</h1>

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
        <div key={p.id} className="card">
          <strong>{formatCents(p.amount)}</strong> — {p.type.replace("_", " ")}
          <div className="muted">{p.challengeName}</div>
          <span className="badge">{STATUS_LABEL[p.status] ?? p.status}</span>
        </div>
      ))}
    </div>
  );
}
