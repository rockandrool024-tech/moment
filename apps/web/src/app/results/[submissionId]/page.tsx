import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { PublicChallengeSummary, PublicTally, SubmissionWithOutcome } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { outcomeTone, OUTCOME_COPY } from "@/lib/outcome";
import { tierBadgeStyle, tierLabel } from "@/lib/tier";
import { Avatar } from "@/components/Avatar";
import { Celebration } from "@/components/Celebration";
import { OutcomeTicket } from "@/components/OutcomeTicket";
import { FilmIcon, ShareIcon } from "@/components/icons";
import styles from "./result.module.css";

async function load(submissionId: string) {
  return api.get<SubmissionWithOutcome>(`/submissions/${submissionId}`);
}

export async function generateMetadata({ params }: { params: { submissionId: string } }): Promise<Metadata> {
  const submission = await load(params.submissionId);
  const { headline, tagline } = OUTCOME_COPY[outcomeTone(submission)];
  return { title: `${headline} — ${submission.challenge.title} | Perokio`, description: tagline };
}

export default async function ResultPage({ params }: { params: { submissionId: string } }) {
  const submission = await load(params.submissionId);
  const tone = outcomeTone(submission);
  const { headline, tagline } = OUTCOME_COPY[tone];

  let liveVotes: number | null = null;
  let votingIsLive = false;
  if (tone === "pending" || tone === "advanced") {
    try {
      const summary = await api.get<PublicChallengeSummary>(`/public/challenges/${submission.challengeId}`);
      if (summary.currentRound?.type === "public_vote_final" && summary.currentRound.status === "open") {
        const tally = await api.get<PublicTally>(`/public/challenges/${submission.challengeId}/tally`);
        if (tally.visible) {
          liveVotes = tally.tallies.find((item) => item.submissionId === submission.id)?.votes ?? 0;
          votingIsLive = true;
        }
      }
    } catch { /* live tally is optional */ }
  }

  const ticketId = `PK-${submission.id.slice(0, 8).toUpperCase()}`;
  const payoutLabel = submission.isWinner ? formatCents(submission.challenge.prizePool) : "—";

  return (
    <div className={styles.page}>
      {tone === "winner" && <Celebration />}
      <header className={styles.top}><Link href="/" className="wordmark">PEROKIO</Link><Link href="/feed" className="btn secondary"><FilmIcon width={16} height={16} aria-hidden />Watch live</Link></header>
      <div className={styles.layout}>
        <main className={styles.copy}>
          <div className={styles.creator}>
            <Avatar userId={submission.creatorId} size={60} tier={submission.creatorTier} />
            <span className="badge badge-tier" style={tierBadgeStyle(submission.creatorTier) as React.CSSProperties}>{tierLabel(submission.creatorTier)}</span>
          </div>
          <span className="page-eyebrow">Verified campaign outcome</span>
          <h1>{headline}</h1>
          <p className={styles.tagline}>{tagline}</p>
          {votingIsLive && <div className={styles.liveVotes}><strong>{liveVotes}</strong><span>verified votes so far</span></div>}
          <section className={`card ${styles.campaign}`}>
            <div className={styles.campaignTop}><div><span className="page-eyebrow">Campaign</span><h2>{submission.challenge.title}</h2></div><span className={`${styles.pool} money`}>{formatCents(submission.challenge.prizePool)}</span></div>
            <p className="muted">{submission.phase === "teaser" ? "Teaser round entry" : "Full-content entry"} · result sourced from the live campaign record.</p>
          </section>
          <div className={styles.actions}>
            {votingIsLive ? <Link href={`/battle/${submission.challengeId}?rally=${submission.creatorReferralCode}`} className="btn"><ShareIcon width={16} height={16} aria-hidden />Rally a vote</Link> : <Link href={`/battle/${submission.challengeId}`} className="btn">Watch the battle</Link>}
            <Link href="/login" className="btn secondary">Join Perokio</Link>
          </div>
          <p className={styles.foot}>The ticket reveals on click or tap. It never relies on hover, and its outcome matches the server-side campaign result.</p>
        </main>
        <aside>
          <OutcomeTicket brandLabel={`${submission.challenge.title} · ${tone}`} outcome={headline} creator={`Entry ${submission.id.slice(0, 8)}`} tier={tierLabel(submission.creatorTier)} payout={payoutLabel} ticketId={ticketId} />
        </aside>
      </div>
    </div>
  );
}
