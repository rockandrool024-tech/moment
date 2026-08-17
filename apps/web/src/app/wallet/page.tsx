"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { CoinsSummary, WalletSummary } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { CoinIcon, WalletIcon } from "@/components/icons";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Loading } from "@/components/Loading";
import { CountUp } from "@/components/CountUp";

// Cosmetic-only currency — never affects votes, entries, or the prize pool
// (see schema.prisma's CoinPurchase comment). Its own card, deliberately
// visually separate from the real-money earnings above it.
function CoinsCard() {
  const searchParams = useSearchParams();
  const coinsStatus = searchParams.get("coins"); // "success" | "cancelled", set by Coinbase's redirect
  const [coins, setCoins] = useState<CoinsSummary | null>(null);
  const [busyPackage, setBusyPackage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<CoinsSummary>("/users/me/coins").then(setCoins);
  }, []);

  async function buy(packageId: string) {
    setBusyPackage(packageId);
    setError(null);
    try {
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>("/users/me/coins/purchase", {
        packageId,
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setBusyPackage(null);
    }
  }

  return (
    <div className="card card-elevated" style={{ marginTop: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <CoinIcon width={20} height={20} aria-hidden style={{ color: "var(--accent)" }} />
        <strong>{coins ? <CountUp value={coins.coinBalance} /> : "…"} coins</strong>
      </div>
      <p className="muted" style={{ fontSize: "0.82rem", margin: "0 0 0.75rem" }}>
        Cosmetic only — coins never affect votes, entries, or prize money. Paid for with crypto via
        Coinbase Commerce.
      </p>

      {coinsStatus === "success" && (
        <p className="muted" style={{ fontSize: "0.82rem" }}>
          Payment received — coins land once the crypto payment confirms on-chain, usually within a
          few minutes.
        </p>
      )}
      {coinsStatus === "cancelled" && <p className="error">Checkout cancelled — no charge was made.</p>}
      {error && <p className="error">{error}</p>}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {coins?.packages.map((pkg) => (
          <button
            key={pkg.id}
            className="secondary"
            disabled={busyPackage !== null}
            onClick={() => buy(pkg.id)}
          >
            {busyPackage === pkg.id ? "Redirecting…" : `${pkg.label} — $${pkg.priceUsd}`}
          </button>
        ))}
      </div>
    </div>
  );
}

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
  return (
    <Suspense fallback={<Loading label="Loading wallet" />}>
      <WalletPageInner />
    </Suspense>
  );
}

function WalletPageInner() {
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

      <CoinsCard />

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
