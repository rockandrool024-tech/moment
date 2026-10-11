"use client";

import { useState } from "react";
import { CoinIcon, LockIcon, TrendingUpIcon, WalletIcon } from "@/components/icons";
import { StatCard } from "@/components/StatCard";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import styles from "./wallet-moment.module.css";

interface EarningsBreakdown {
  id: string;
  source: "views" | "voting_accuracy" | "referral" | "creator_reward";
  amount: number;
  storyTitle?: string;
  timestamp: string;
}

interface UserWallet {
  totalParrotPoints: number;
  availableCashout: number;
  pendingCashout: number;
  lifetimeEarned: number;
  accuracy: number;
  level: number;
}

const mockEarnings: EarningsBreakdown[] = [
  {
    id: "1",
    source: "views",
    amount: 145,
    storyTitle: "Urban Fashion Drop",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    source: "voting_accuracy",
    amount: 5,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    source: "referral",
    amount: 50,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    source: "creator_reward",
    amount: 25,
    storyTitle: "Chill Lo-Fi Beats",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function WalletMomentPage() {
  const [tab, setTab] = useState<"points" | "cashout">("points");
  const [wallet] = useState<UserWallet>({
    totalParrotPoints: 225,
    availableCashout: 15.25,
    pendingCashout: 0,
    lifetimeEarned: 487,
    accuracy: 68,
    level: 3,
  });

  const sourceLabel: Record<string, string> = {
    views: "Video views",
    voting_accuracy: "Correct predictions",
    referral: "Friend referral",
    creator_reward: "Creator reward pool",
  };

  const sourceIcon: Record<string, string> = {
    views: "📺",
    voting_accuracy: "✓",
    referral: "🎁",
    creator_reward: "💰",
  };

  return (
    <div>
      <PageHeader
        eyebrow="Wallet"
        title="Your parrot points earnings"
        description="Track your points from video views, voting accuracy, referrals, and creator rewards. Convert to USD on your schedule."
      />

      <div className={styles.statsHero}>
        <StatCard
          label="Available parrot points"
          value={wallet.totalParrotPoints}
          verdict={{ text: `$${wallet.availableCashout} USD`, tone: "good" }}
        />
        <StatCard label="Voting accuracy" value={`${wallet.accuracy}%`} />
        <StatCard label="Level" value={wallet.level} />
        <StatCard
          label="Lifetime earned"
          value={wallet.lifetimeEarned}
          verdict={{ text: "All time", tone: "neutral" }}
        />
      </div>

      <div className={styles.tabs}>
        <SegmentedControl
          name="wallet-tab"
          aria-label="Wallet view"
          value={tab}
          onChange={setTab}
          options={[
            { value: "points", label: "Parrot Points" },
            { value: "cashout", label: "Cash out" },
          ]}
        />
      </div>

      {tab === "points" && (
        <>
          <section className={`card ${styles.pointsExplainer}`}>
            <h2>How you earn parrot points</h2>
            <div className={styles.earningsList}>
              <div className={styles.earningItem}>
                <div className={styles.earningIcon}>📺</div>
                <div>
                  <strong>0.1 point per view</strong>
                  <span>From all platforms (TikTok, Instagram, Facebook, app)</span>
                </div>
                <div className={styles.earningAmount}>+145 pts</div>
              </div>

              <div className={styles.earningItem}>
                <div className={styles.earningIcon}>✓</div>
                <div>
                  <strong>+5 points for correct prediction</strong>
                  <span>When your vote matches the final virality outcome</span>
                </div>
                <div className={styles.earningAmount}>+15 pts</div>
              </div>

              <div className={styles.earningItem}>
                <div className={styles.earningIcon}>+10</div>
                <div>
                  <strong>+10 points per vote</strong>
                  <span>Participation bonus for voting on any story</span>
                </div>
                <div className={styles.earningAmount}>+40 pts</div>
              </div>

              <div className={styles.earningItem}>
                <div className={styles.earningIcon}>🎁</div>
                <div>
                  <strong>+50 points per referral</strong>
                  <span>When your friend signs up via your referral link</span>
                </div>
                <div className={styles.earningAmount}>+50 pts</div>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ marginBottom: "1rem" }}>Earnings history</h2>
            <div className={styles.historyList}>
              {mockEarnings.map((earning) => (
                <article key={earning.id} className={`card ${styles.historyRow}`}>
                  <div className={styles.historyIcon}>{sourceIcon[earning.source]}</div>
                  <div className={styles.historyCopy}>
                    <strong>{sourceLabel[earning.source]}</strong>
                    {earning.storyTitle && <span>&quot;{earning.storyTitle}&quot;</span>}
                    <span className="muted">
                      {new Intl.DateTimeFormat(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(earning.timestamp))}
                    </span>
                  </div>
                  <div className={styles.historyAmount}>+{earning.amount}</div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "cashout" && (
        <>
          <section className={`card ${styles.cashoutCard}`}>
            <div className={styles.cashoutTop}>
              <div>
                <span className="page-eyebrow">Ready to cash out</span>
                <div className={styles.cashoutAmount}>
                  <CoinIcon width={32} height={32} aria-hidden />
                  {wallet.totalParrotPoints} points = ${wallet.availableCashout} USD
                </div>
              </div>
              <button className="btn">Cash out now</button>
            </div>

            <div className={styles.cashoutInfo}>
              <div>
                <strong>Exchange rate</strong>
                <span>1 point = $0.01 USD</span>
              </div>
              <div>
                <strong>Processing time</strong>
                <span>2-3 business days</span>
              </div>
              <div>
                <strong>Minimum cashout</strong>
                <span>$1 USD (100 points)</span>
              </div>
            </div>
          </section>

          <section className={`card ${styles.bankCard}`}>
            <span className="page-eyebrow">Connected accounts</span>
            <h3>Payout methods</h3>

            <div className={styles.bankInfo}>
              <div className={styles.bankMethod}>
                <div className={styles.bankIcon}>🏦</div>
                <div>
                  <strong>Direct bank transfer</strong>
                  <span>Available in 150+ countries</span>
                </div>
              </div>

              <div className={styles.bankMethod}>
                <div className={styles.bankIcon}>💳</div>
                <div>
                  <strong>Debit card</strong>
                  <span>US & Europe</span>
                </div>
              </div>

              <div className={styles.bankMethod}>
                <div className={styles.bankIcon}>₿</div>
                <div>
                  <strong>Crypto wallet</strong>
                  <span>Bitcoin, Ethereum, USDC</span>
                </div>
              </div>
            </div>

            <button className="secondary btn-block" style={{ marginTop: "1rem" }}>
              + Add payout method
            </button>
          </section>

          <Notice tone="info" title="Your payouts are safe">
            <p>
              All withdrawals are instant, fees-free, and go directly to your account. We partner with Stripe &
              Wise for secure transfers.
            </p>
          </Notice>
        </>
      )}
    </div>
  );
}
