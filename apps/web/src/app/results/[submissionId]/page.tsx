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
import { BrandMark } from "@/components/BrandMark";
import { SharePanel } from "@/components/SharePanel";
import { JourneyStage } from "@/components/JourneyProgress";
import { JourneyTaskbar } from "@/components/JourneyTaskbar";
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
  const resultJourney: JourneyStage[] = [
    { id: "discover", label: "Discover", description: "Opportunity found.", status: "completed" },
    { id: "claim", label: "Enter", description: "Your place was confirmed.", status: "completed" },
    { id: "teaser", label: "First teaser", description: "Your first cut was submitted.", status: "completed" },
    { id: "review", label: "Blind review", description: "The work was judged on its own merit.", status: "completed" },
    { id: "advance", label: "Advance", description: "The round outcome is recorded.", status: tone === "knockout" ? "retry" : "completed" },
    { id: "full-video", label: "Full video", description: "Your finished piece is on record.", status: submission.phase === "full_content" || tone === "winner" ? "completed" : "current" },
    { id: "final-vote", label: "Final vote", description: "The reveal is decided by the campaign state.", status: tone === "winner" || tone === "knockout" ? "completed" : votingIsLive ? "current" : "review" },
    { id: "reward", label: "Reward", description: "Payout, rating and your next opportunity.", status: tone === "winner" ? "completed" : tone === "knockout" ? "retry" : "locked", actionLabel: tone === "winner" ? "Share the result" : undefined, href: tone === "winner" ? `/results/${submission.id}` : undefined },
  ];

  return (
    <div className={styles.page}>
      {tone === "winner" && <Celebration />}
      <header className={styles.top}><Link href="/" className="wordmark" aria-label="Perokio home"><BrandMark /></Link><Link href="/feed" className="btn secondary"><FilmIcon width={16} height={16} aria-hidden />Watch live</Link></header>
      <div className={styles.layout}>
        <main className={styles.copy}>
          <div className={styles.creator}>
            <Avatar userId={submission.creatorId} size={60} tier={submission.creatorTier} />
            <span className="badge badge-tier" style={tierBadgeStyle(submission.creatorTier) as React.CSSProperties}>{tierLabel(submission.creatorTier)}</span>
          </div>
          <span className="page-eyebrow">Verified campaign outcome</span>
          <h1>{headline}</h1>
          <p className={styles.tagline}>{tagline}</p>
          <JourneyTaskbar
            journey={resultJourney}
            mode={tone === "winner" ? "completion" : "focus"}
            activeContext={{ id: submission.id, kind: "challenge", title: submission.challenge.title, status: tone === "winner" ? "completed" : tone === "knockout" ? "blocked" : votingIsLive ? "active" : "waiting" }}
            nextAction={tone === "winner" ? { label: "Share the result", href: `/results/${submission.id}?rally=${submission.creatorReferralCode}`, tone: "primary" } : votingIsLive ? { label: "Rally this creator", href: `/battle/${submission.challengeId}?rally=${submission.creatorReferralCode}`, tone: "primary" } : { label: "Watch the battle", href: `/battle/${submission.challengeId}`, tone: "secondary" }}
          />
          {votingIsLive && <div className={styles.liveVotes}><strong>{liveVotes}</strong><span>verified votes so far</span></div>}
          <section className={`card ${styles.campaign}`}>
            <div className={styles.campaignTop}><div><span className="page-eyebrow">Campaign</span><h2>{submission.challenge.title}</h2></div><span className={`${styles.pool} money`}>{formatCents(submission.challenge.prizePool)}</span></div>
            <p className="muted">{submission.phase === "teaser" ? "Teaser round entry" : "Full-content entry"} · result sourced from the live campaign record.</p>
          </section>
          <div className={styles.actions}>
            {votingIsLive ? <Link href={`/battle/${submission.challengeId}?rally=${submission.creatorReferralCode}`} className="btn"><ShareIcon width={16} height={16} aria-hidden />Rally a vote</Link> : <Link href={`/battle/${submission.challengeId}`} className="btn">Watch the battle</Link>}
            <Link href="/login" className="btn secondary">Join Perokio</Link>
          </div>
          <SharePanel
            href={votingIsLive ? `/battle/${submission.challengeId}?rally=${submission.creatorReferralCode}` : `/results/${submission.id}?rally=${submission.creatorReferralCode}`}
            title={`${headline} — ${submission.challenge.title}`}
            message={votingIsLive ? `Watch this live Perokio battle: ${submission.challenge.title}` : `See the verified Perokio result: ${submission.challenge.title}`}
            label={votingIsLive ? "Rally this creator" : "Share this result"}
          />
          <p className={styles.foot}>The ticket reveals on click or tap. It never relies on hover, and its outcome matches the server-side campaign result.</p>
        </main>
        <aside>
          <OutcomeTicket brandLabel={`${submission.challenge.title} · ${tone}`} outcome={headline} creator={`Entry ${submission.id.slice(0, 8)}`} tier={tierLabel(submission.creatorTier)} payout={payoutLabel} ticketId={ticketId} />
        </aside>
      </div>
    </div>
  );
}
