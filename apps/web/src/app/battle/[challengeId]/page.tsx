import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { PublicChallengeSummary, PublicTally } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { RallyCapture } from "@/components/RallyCapture";
import { BrandMark } from "@/components/BrandMark";
import { CheckIcon, FilmIcon, LockIcon, VoteCheckIcon } from "@/components/icons";
import styles from "./battle.module.css";

async function loadSummary(challengeId: string) {
  return api.get<PublicChallengeSummary>(`/public/challenges/${challengeId}`);
}

export async function generateMetadata({ params }: { params: { challengeId: string } }): Promise<Metadata> {
  const summary = await loadSummary(params.challengeId);
  return { title: `${summary.title} — ${formatCents(summary.prizePool)} on the line | Perokio`, description: summary.brief };
}

export default async function BattlePage({ params, searchParams }: { params: { challengeId: string }; searchParams: { rally?: string } }) {
  const summary = await loadSummary(params.challengeId);
  const tally = summary.currentRound ? await api.get<PublicTally>(`/public/challenges/${params.challengeId}/tally`) : null;
  const maxVotes = Math.max(...(tally?.tallies.map((item) => item.votes) ?? [1]), 1);

  return (
    <div className={styles.page}>
      <RallyCapture code={searchParams.rally} />
      <header className={styles.top}><Link href="/" className="wordmark" aria-label="Perokio home"><BrandMark /></Link><Link href="/feed" className="btn secondary"><FilmIcon width={16} height={16} aria-hidden />Watch live</Link></header>
      <section className={styles.hero}>
        <div className={styles.heroBadges}><span className="badge badge-live">Live battle</span><span className="badge">{summary.status.replaceAll("_", " ")}</span></div>
        <div className={styles.heroCopy}><h1>{summary.title}</h1><div className={styles.heroBottom}><p>{summary.brief}</p><div className={`${styles.prize} money`}>{formatCents(summary.prizePool)}</div></div></div>
      </section>

      <div className={styles.layout}>
        <main>
          <section className={`card ${styles.round}`}>
            {summary.currentRound ? (
              <>
                <div className={styles.roundHead}><div><span className="page-eyebrow">Current round</span><h2>Round {summary.currentRound.roundNumber}</h2><p className="muted">{summary.currentRound.type.replaceAll("_", " ")}</p></div><span className={summary.currentRound.status === "open" ? "badge badge-live" : "badge"}>{summary.currentRound.status}</span></div>
                {tally?.visible ? (
                  <div className={styles.tally}>
                    <h3>Live public tally</h3>
                    {tally.tallies.length === 0 && <p className="muted">No verified votes yet.</p>}
                    {tally.tallies.map((item, index) => <div className={styles.tallyRow} key={item.submissionId}><div className={styles.tallyCopy}><span>Finalist {index + 1}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${(item.votes / maxVotes) * 100}%` }} /></div></div><span className={styles.tallyVotes}>{item.votes}</span></div>)}
                  </div>
                ) : (
                  <div className={styles.blind}><div><span className={styles.blindIcon}><LockIcon width={23} height={23} aria-hidden /></span><strong>Results stay blind until the round closes.</strong><p>Hidden tallies keep every vote independent and protect the creators from momentum bias.</p></div></div>
                )}
              </>
            ) : (
              <div className={styles.blind}><div><span className={styles.blindIcon}><VoteCheckIcon width={23} height={23} aria-hidden /></span><strong>The next round is being prepared.</strong><p>Return when voting opens to compare the work.</p></div></div>
            )}
          </section>
        </main>

        <aside>
          <section className={`card ${styles.voteCard}`}>
            <span className="page-eyebrow">Join the jury</span>
            <h2>Judge the work, not the following.</h2>
            <p className="muted">A verified account protects one-person-one-vote and unlocks your voting history.</p>
            <div className={styles.trust}>
              <div className={styles.trustItem}><CheckIcon width={16} height={16} aria-hidden />Creator names stay hidden while you vote</div>
              <div className={styles.trustItem}><CheckIcon width={16} height={16} aria-hidden />A short watch gate protects vote quality</div>
              <div className={styles.trustItem}><CheckIcon width={16} height={16} aria-hidden />Joining and watching are free</div>
            </div>
            {summary.currentRound ? <Link href={`/login?returnTo=/rounds/${summary.currentRound.id}`} className="btn btn-block">Verify and vote</Link> : <Link href="/feed" className="btn btn-block">Watch creator work</Link>}
          </section>
        </aside>
      </div>
      <p className={styles.foot}>Prize status and votes are sourced from the live campaign. Reported external social metrics never affect the result.</p>
    </div>
  );
}
