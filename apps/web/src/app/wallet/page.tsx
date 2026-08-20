"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { CoinsSummary, WalletSummary } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { CoinIcon, LockIcon, RefreshIcon, WalletIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { CountUp } from "@/components/CountUp";
import { Notice } from "@/components/Notice";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { CardSkeletonList } from "@/components/Skeleton";
import styles from "./wallet.module.css";

const STATUS_LABEL: Record<string, string> = {
  pending: "Transfer pending",
  processing: "Transfer in progress",
  paid: "Paid",
  failed: "Needs attention",
};

const TYPE_COLOR: Record<string, string> = {
  winner: "var(--tier-2)",
  stipend: "var(--accent)",
  survivor_bonus: "var(--tier-0)",
  crowd_favourite: "var(--rally)",
  referral_bonus: "var(--tier-3)",
};

function CoinsCard() {
  const searchParams = useSearchParams();
  const coinsStatus = searchParams.get("coins");
  const [coins, setCoins] = useState<CoinsSummary | null>(null);
  const [busyPackage, setBusyPackage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<CoinsSummary>("/users/me/coins").then(setCoins).catch(() => setError("Your coin balance couldn’t be loaded."));
  }, []);

  async function buy(packageId: string) {
    setBusyPackage(packageId);
    setError(null);
    try {
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>("/users/me/coins/purchase", { packageId });
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout couldn’t start. No charge was made.");
      setBusyPackage(null);
    }
  }

  return (
    <section className={`card ${styles.coinsCard}`}>
      <div className={styles.coinsHead}>
        <div>
          <span className="page-eyebrow">Cosmetic currency</span>
          <div className={styles.coinsBalance}><CoinIcon width={22} height={22} aria-hidden />{coins ? <CountUp value={coins.coinBalance} /> : "—"} coins</div>
        </div>
        <span className="badge">No vote advantage</span>
      </div>
      <p className={styles.coinsCopy}>Coins customize your presence only. They never affect judging, entries, prize pools or creator payouts. Purchases use crypto checkout.</p>
      {coinsStatus === "success" && <Notice tone="info" title="Payment received">Coins appear after the network confirms the payment, usually within a few minutes.</Notice>}
      {coinsStatus === "cancelled" && <Notice tone="warning" title="Checkout cancelled">No charge was made.</Notice>}
      {error && <Notice tone="danger" title="Coins unavailable">{error}</Notice>}
      <div className={styles.packages}>
        {coins?.packages.map((pkg) => (
          <button key={pkg.id} className={`secondary ${styles.package}`} disabled={busyPackage !== null} onClick={() => void buy(pkg.id)}>
            <strong>{busyPackage === pkg.id ? "Opening checkout…" : pkg.label}</strong>
            <span>${pkg.priceUsd}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function WalletPage() {
  return <Suspense fallback={<CardSkeletonList count={3} />}><WalletPageInner /></Suspense>;
}

function WalletPageInner() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [tab, setTab] = useState<"earnings" | "coins">("earnings");
  const [error, setError] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    setWallet(null);
    setError(false);
    api.get<WalletSummary>("/users/me/wallet").then(setWallet).catch(() => setError(true));
  }, [requestKey]);

  return (
    <div>
      <PageHeader eyebrow="Wallet" title="Money you earned, clearly tracked." description="Prize earnings appear here the moment they are awarded. Pending transfers remain separate until the payout provider confirms settlement." />

      <div className={styles.tabs}>
        <SegmentedControl name="wallet-tab" aria-label="Wallet view" value={tab} onChange={setTab} options={[{ value: "earnings", label: "Earnings" }, { value: "coins", label: "Coins" }]} />
      </div>

      {error && <Notice tone="danger" title="Wallet unavailable" action={<button className="secondary" onClick={() => setRequestKey((key) => key + 1)}><RefreshIcon width={15} height={15} aria-hidden />Retry</button>}>We couldn’t load your balance. No payout data was changed.</Notice>}
      {!wallet && !error && <CardSkeletonList count={3} />}

      {wallet && tab === "earnings" && (
        <>
          <section className={styles.hero}>
            <div className={`card ${styles.balanceCard}`}>
              <span className={styles.balanceLabel}>Lifetime creator earnings</span>
              <span className={`${styles.balanceValue} money`}><CountUp value={wallet.lifetimeEarningsCents} format={(value) => formatCents(value)} /></span>
              <div className={styles.balanceMeta}>
                <div className={styles.balanceMetaItem}><strong>{formatCents(wallet.currentBalanceCents)}</strong><span>Paid out</span></div>
                <div className={styles.balanceMetaItem}><strong>{formatCents(wallet.pendingPayoutsCents)}</strong><span>Pending transfer</span></div>
              </div>
            </div>
            <div className={styles.explainer}>
              <span className={styles.explainerIcon}><LockIcon width={18} height={18} aria-hidden /></span>
              <div><strong>Prize and transfer are different states.</strong><span>Awarded money counts toward earnings immediately. It becomes paid only after the transfer settles.</span></div>
            </div>
          </section>

          <SectionHeader title="Payout history" description="Every prize, stipend and bonus in one place." />
          {wallet.payoutHistory.length === 0 ? (
            <EmptyState icon={<WalletIcon width={30} height={30} aria-hidden />} title="Nothing earned yet" body="Enter a funded challenge to start building your wallet." action={{ label: "Browse challenges", href: "/challenges" }} />
          ) : (
            <div className={styles.history}>
              {wallet.payoutHistory.map((payout, index) => (
                <article className={`card card-enter ${styles.historyRow}`} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }} key={payout.id}>
                  <span className={styles.typeIcon} style={{ ["--type-color" as string]: TYPE_COLOR[payout.type] ?? "var(--accent)" }}><WalletIcon width={18} height={18} aria-hidden /></span>
                  <div className={styles.historyCopy}><strong>{payout.challengeName}</strong><span>{payout.type.replaceAll("_", " ")} · {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(payout.createdAt))}</span></div>
                  <div className={styles.amount}><strong>{formatCents(payout.amount)}</strong><span>{STATUS_LABEL[payout.status] ?? payout.status}</span></div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {wallet && tab === "coins" && <CoinsCard />}
    </div>
  );
}
