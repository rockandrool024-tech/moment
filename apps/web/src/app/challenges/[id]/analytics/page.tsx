"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, ChallengeAnalytics } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeftIcon, FilmIcon, RefreshIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { CardSkeletonList } from "@/components/Skeleton";
import styles from "./analytics.module.css";

const PHASE_LABEL: Record<string, string> = { teaser: "Teaser submissions", full_content: "Full-content entries" };
const ROUND_TYPE_LABEL: Record<string, string> = { peer_vote_teaser: "Blind teaser vote", peer_vote_narrow: "Blind full-content vote", public_vote_final: "Public final" };

export default function ChallengeAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [analytics, setAnalytics] = useState<ChallengeAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setAnalytics(null);
    try {
      const campaign = await api.get<Challenge>(`/challenges/${id}`);
      setChallenge(campaign);
      setAnalytics(await api.get<ChallengeAnalytics>(`/challenges/${id}/analytics`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Campaign analytics couldn’t be loaded.");
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const summary = useMemo(() => {
    const submitted = analytics?.phases.reduce((total, phase) => total + phase.submitted, 0) ?? 0;
    const advanced = analytics?.phases.reduce((total, phase) => total + phase.advanced, 0) ?? 0;
    const votes = analytics?.rounds.reduce((total, round) => total + round.votes, 0) ?? 0;
    const paid = analytics?.payouts.reduce((total, payout) => total + payout.totalAmount, 0) ?? 0;
    return { submitted, advanced, votes, paid, conversion: submitted ? Math.round((advanced / submitted) * 100) : 0 };
  }, [analytics]);

  if (authLoading || (!challenge && !error)) return <CardSkeletonList count={4} />;
  if (challenge && (!user || user.id !== challenge.sellerId)) return <Notice tone="danger" title="Owner access only">Campaign analytics include private performance and payout information.</Notice>;

  return (
    <div>
      <Link href={`/challenges/${id}`} className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />Back to campaign</Link>
      <PageHeader eyebrow={challenge?.status.replaceAll("_", " ") ?? "Campaign"} title={`${challenge?.title ?? "Campaign"} analytics`} description="Track entry quality, vote participation and payout distribution. Each metric maps to an action the campaign owner can take." actions={<button className="secondary" onClick={() => void load()}><RefreshIcon width={16} height={16} aria-hidden />Refresh</button>} />

      {error && <Notice tone="danger" title="Analytics unavailable" action={<button className="secondary" onClick={() => void load()}>Try again</button>}>{error}</Notice>}

      {analytics && (
        <>
          <section className={styles.kpis} aria-label="Campaign summary">
            <div className={`card ${styles.kpi}`}><span>Total entries</span><strong>{summary.submitted}</strong></div>
            <div className={`card ${styles.kpi}`}><span>Advancement rate</span><strong>{summary.conversion}%</strong></div>
            <div className={`card ${styles.kpi}`}><span>Verified votes</span><strong>{summary.votes}</strong></div>
            <div className={`card ${styles.kpi}`}><span>Payouts issued</span><strong>{formatCents(summary.paid)}</strong></div>
          </section>

          <div className={styles.insight}>
            <strong>{summary.submitted === 0 ? "Invite creators to activate the funnel." : summary.conversion < 20 ? "The brief may be eliminating too many entries." : "The campaign has a healthy quality funnel."}</strong>
            <span>{summary.submitted === 0 ? "Share the invite link and explain the first-round format." : summary.conversion < 20 ? "Review checklist strictness before the next campaign; published rules cannot be changed mid-round." : "Keep watching vote volume so each round has enough signal."}</span>
          </div>

          <div className={styles.layout}>
            <main>
              <section className={`card ${styles.panel}`}>
                <SectionHeader title="Submission funnel" description="Advanced, pending and eliminated entries by phase." />
                {analytics.phases.length === 0 ? <EmptyState icon={<FilmIcon width={28} height={28} aria-hidden />} title="No entries yet" body="The funnel begins once a creator submits a teaser." /> : (
                  <div className={styles.funnel}>
                    {analytics.phases.map((phase) => {
                      const total = Math.max(phase.submitted, 1);
                      return (
                        <div className={styles.phase} key={phase.phase}>
                          <div className={styles.phaseHead}><strong>{PHASE_LABEL[phase.phase] ?? phase.phase}</strong><span>{phase.submitted} submitted</span></div>
                          <div className={styles.bar} aria-label={`${phase.advanced} advanced, ${phase.pending} pending, ${phase.eliminated} eliminated`}>
                            <span className={styles.segmentAdvanced} style={{ width: `${(phase.advanced / total) * 100}%` }} />
                            <span className={styles.segmentPending} style={{ width: `${(phase.pending / total) * 100}%` }} />
                            <span className={styles.segmentEliminated} style={{ width: `${(phase.eliminated / total) * 100}%` }} />
                          </div>
                          <div className={styles.legend}>
                            <span><i className={styles.dot} style={{ ["--dot-color" as string]: "var(--accent)" }} />{phase.advanced} advanced</span>
                            <span><i className={styles.dot} style={{ ["--dot-color" as string]: "var(--warning)" }} />{phase.pending} pending</span>
                            <span><i className={styles.dot} style={{ ["--dot-color" as string]: "var(--danger)" }} />{phase.eliminated} eliminated</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </main>

            <aside>
              <section className={`card ${styles.panel}`}>
                <SectionHeader title="Vote activity" description="Verified choices recorded per round." />
                {analytics.rounds.length === 0 ? <p className="muted">No round has opened yet.</p> : <div className={styles.rows}>{analytics.rounds.map((round) => <div className={styles.row} key={round.roundId}><div className={styles.rowCopy}><strong>Round {round.roundNumber}</strong><span>{ROUND_TYPE_LABEL[round.type] ?? round.type}</span></div><span className={styles.rowValue}>{round.votes}</span></div>)}</div>}
              </section>

              <section className={`card ${styles.panel}`}>
                <SectionHeader title="Payout distribution" description="Awarded amounts by payout type." />
                {analytics.payouts.length === 0 ? <p className="muted">No payouts have been issued.</p> : <div className={styles.rows}>{analytics.payouts.map((payout) => <div className={styles.row} key={payout.type}><div className={styles.rowCopy}><strong>{payout.type.replaceAll("_", " ")}</strong><span>{payout.count} payout{payout.count === 1 ? "" : "s"}</span></div><span className={`${styles.rowValue} money`}>{formatCents(payout.totalAmount)}</span></div>)}</div>}
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
