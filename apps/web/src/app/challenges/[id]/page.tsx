"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, FundingResult, Round, Submission } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { previewCrowdFavourite, previewSurvivorBonusPool } from "@/lib/pricing-preview";
import { useAuth } from "@/lib/auth-context";
import { StripeFundForm } from "@/components/StripeFundForm";
import { RatingForm } from "@/components/RatingForm";
import { TrustStatsMini } from "@/components/TrustStatsMini";
import { Sheet } from "@/components/Sheet";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { CardSkeleton } from "@/components/Skeleton";
import { JourneyProgress, JourneyStage } from "@/components/JourneyProgress";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  LockIcon,
  PlayIcon,
  VerifiedIcon,
} from "@/components/icons";
import styles from "./challenge-detail.module.css";

interface RatingRow { rateeId: string; }

function friendlyLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim();
}

function friendlyValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Required" : "Optional";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  return "See brief for details";
}

function roundLabel(round: Round) {
  if (round.type === "peer_vote_teaser") return "Blind teaser vote";
  if (round.type === "peer_vote_narrow") return "Full-content vote";
  return "Public final";
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [funding, setFunding] = useState<FundingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [finalists, setFinalists] = useState<Submission[]>([]);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());
  const [wizardStatus, setWizardStatus] = useState<string | null>(null);
  const [showPreviewBreakdown, setShowPreviewBreakdown] = useState(false);
  const [showConfirmBreakdown, setShowConfirmBreakdown] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, r] = await Promise.all([
        api.get<Challenge>(`/challenges/${id}`),
        api.get<Round[]>(`/challenges/${id}/rounds`),
      ]);
      setChallenge(c);
      setRounds(r);
      if (c.status === "resolved") {
        const [subs, mine] = await Promise.all([
          api.get<Submission[]>(`/submissions?challengeId=${id}&phase=full_content`),
          user ? api.get<RatingRow[]>(`/challenges/${id}/ratings/mine`) : Promise.resolve([]),
        ]);
        setFinalists(subs.filter((s) => s.status === "advanced"));
        setRatedIds(new Set(mine.map((r) => r.rateeId)));
      }
    } catch {
      setError("We couldn’t load this challenge. Check your connection and try again.");
    }
  }, [id, user]);

  useEffect(() => { void load(); }, [load]);

  const isOwner = Boolean(user && challenge && user.id === challenge.sellerId);
  const needsKyb = Boolean(isOwner && !user?.kybVerified);

  async function fund() {
    setError(null);
    setBusy(true);
    try {
      setFunding(await api.post<FundingResult>(`/challenges/${id}/fund`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Funding couldn’t start. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function requestKyb() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/users/me/request-kyb");
      setWizardStatus("Verification request sent. We’ll notify you when it is reviewed.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification couldn’t be requested. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function openNextRound() {
    setError(null);
    setBusy(true);
    try {
      await api.post(`/challenges/${id}/rounds/auto`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The next round couldn’t open yet.");
    } finally {
      setBusy(false);
    }
  }

  async function afterFundingConfirmed() {
    setFunding(null);
    setWizardStatus("Confirming the secured prize…");
    for (let attempt = 0; attempt < 8; attempt++) {
      const fresh = await api.get<Challenge>(`/challenges/${id}`);
      if (fresh.status === "funded") {
        setWizardStatus("Opening round 1…");
        try { await api.post(`/challenges/${id}/rounds/auto`); } catch { /* server remains authoritative */ }
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    setWizardStatus(null);
    await load();
  }

  if (!challenge) {
    return (
      <div>
        <Link href="/challenges" className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />All challenges</Link>
        {error ? <Notice tone="danger" title="Challenge unavailable" action={<button className="secondary" onClick={() => void load()}>Retry</button>}>{error}</Notice> : <CardSkeleton media />}
      </div>
    );
  }

  const canOpenNextRound = isOwner && rounds.length < 3 && ((rounds.length === 0 && challenge.status === "funded") || (rounds.length > 0 && rounds[rounds.length - 1].status === "revealed"));
  const criteria = Object.entries(challenge.checklistCriteria ?? {});
  const isLive = challenge.status.includes("_open") || challenge.status === "funded";
  const journeyStages: JourneyStage[] = [
    { id: "discover", label: "Discover", description: "Find a brief that fits your voice.", status: "completed" },
    { id: "claim", label: "Enter", description: isLive ? "Claim your place in this opportunity." : "This opportunity opens after funding.", status: isLive ? "current" : "locked", actionLabel: isLive ? "Start your story" : undefined, href: isLive ? `/challenges/${challenge.id}/submit` : undefined },
    { id: "teaser", label: "First teaser", description: "Make a strong first impression in 15 seconds.", status: "locked" },
    { id: "review", label: "Blind review", description: "Verified peers judge the work, not the follower count.", status: "locked" },
    { id: "advance", label: "Advance", description: "Reach the money round and keep moving.", status: "locked", reward: "Survivor reward" },
    { id: "full-video", label: "Full video", description: "Turn the teaser into the finished piece.", status: "locked" },
    { id: "final-vote", label: "Final vote", description: "The final work meets the reveal moment.", status: "locked" },
    { id: "reward", label: "Reward", description: "Payout, rating and your next opportunity.", status: "locked" },
  ];

  return (
    <div>
      <Link href="/challenges" className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />All challenges</Link>

      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <span className={isLive ? "badge badge-live" : "badge"}>{challenge.status.replaceAll("_", " ")}</span>
          <span className={styles.heroTrust}><VerifiedIcon width={15} height={15} aria-hidden />Prize secured before launch</span>
        </div>
        <div className={styles.heroBody}>
          <h1>{challenge.title}</h1>
          <div className={styles.heroMeta}>
            <p>Creative competition · blind voting protects the quality score from follower counts.</p>
            <div className={`${styles.heroPrize} money`}>{formatCents(challenge.prizePool)}</div>
          </div>
        </div>
      </section>

      <div className={styles.statusRow}>
        <span className="chip"><LockIcon width={14} height={14} aria-hidden />Escrow protected</span>
        <span className="chip">Up to 3 rounds</span>
        <span className="chip">Blind peer vote</span>
      </div>

      {!isOwner && <JourneyProgress
        stages={journeyStages}
        title="Your path through this opportunity"
        summary="Every milestone is visible. Your supporters can add momentum, but only the work decides the quality result."
        className={styles.journey}
      />}

      {isOwner && (
        <div className={styles.ownerActions}>
          <Link href={`/challenges/${challenge.id}/analytics`} className="btn secondary">Campaign analytics</Link>
          <Link href={`/challenges/${challenge.id}/invite`} className="btn secondary">Invite creators</Link>
        </div>
      )}

      {error && <Notice tone="danger" title="Action needs attention">{error}</Notice>}
      {wizardStatus && <Notice tone="info" title="Campaign setup">{wizardStatus}</Notice>}

      <div className={styles.layout}>
        <main className={styles.mainColumn}>
          <section className={`card ${styles.sectionCard}`}>
            <span className="page-eyebrow">The brief</span>
            <h2>What to create</h2>
            <p className={styles.brief}>{challenge.brief}</p>
            <div className={styles.checklist}>
              {(criteria.length ? criteria : [["submission", "Follow the creative direction above"]]).map(([key, value]) => (
                <div className={styles.checkItem} key={key}>
                  <span className={styles.checkIcon}><CheckIcon width={16} height={16} aria-hidden /></span>
                  <div><strong>{friendlyLabel(key)}</strong><span>{friendlyValue(value)}</span></div>
                </div>
              ))}
            </div>
          </section>

          <section className={`card ${styles.sectionCard}`}>
            <span className="page-eyebrow">Competition path</span>
            <h2>Rounds</h2>
            {rounds.length === 0 ? (
              <EmptyState icon={<PlayIcon width={28} height={28} aria-hidden />} title="Round 1 hasn’t opened" body="The first blind vote opens after the prize is funded and the campaign is ready." />
            ) : (
              <div className={styles.rounds}>
                {rounds.map((round) => (
                  <Link className={styles.roundLink} key={round.id} href={`/rounds/${round.id}`}>
                    <span className={styles.roundNumber}>{round.roundNumber}</span>
                    <span className={styles.roundCopy}><strong>{roundLabel(round)}</strong><span>{round.status} · advances {round.advanceCount}</span></span>
                    <ChevronRightIcon width={18} height={18} aria-hidden />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {challenge.status === "resolved" && user && (
            <section className={`card ${styles.sectionCard}`}>
              <span className="page-eyebrow">Close the loop</span>
              <h2>Rate the experience</h2>
              <div className={styles.rateGrid}>
                {isOwner && finalists.map((finalist) => <RatingForm key={finalist.id} challengeId={challenge.id} rateeId={finalist.creatorId} label={`creator (entry ${finalist.id.slice(0, 8)})`} alreadyRated={ratedIds.has(finalist.creatorId)} />)}
                {!isOwner && <RatingForm challengeId={challenge.id} rateeId={challenge.sellerId} label="the brand" alreadyRated={ratedIds.has(challenge.sellerId)} />}
              </div>
              <h3>Brand trust</h3>
              <TrustStatsMini userId={challenge.sellerId} />
            </section>
          )}
        </main>

        <aside className={styles.sideColumn}>
          <section className={`card ${styles.prizeCard}`}>
            <span className={styles.prizeLabel}>Winner prize</span>
            <div className={`${styles.prizeValue} money`}>{formatCents(challenge.prizePool)}</div>
            <div className={styles.trustLine}><LockIcon width={17} height={17} aria-hidden />The pool is kept separate from platform funds.</div>
            <button className="secondary btn-block" onClick={() => setShowPreviewBreakdown(true)}>See every payout</button>
          </section>

          <section className={`card ${styles.actionCard}`}>
            {!isOwner ? (
              <>
                <span className="page-eyebrow">Ready to enter?</span>
                <h2>Start with your strongest idea.</h2>
                <p>Check the requirements before upload. Your first submission is a short teaser.</p>
                <Link href={`/challenges/${challenge.id}/submit`} className="btn btn-block">Enter challenge</Link>
              </>
            ) : (
              <>
                <span className="page-eyebrow">Brand controls</span>
                <h2>Move the campaign forward.</h2>
                {needsKyb && challenge.status === "draft" && <Notice tone="warning" title="Verify the business">Business verification is required before the prize can be funded.</Notice>}
                {needsKyb && challenge.status === "draft" && <button className="secondary btn-block" onClick={requestKyb} disabled={busy}>{busy ? "Requesting…" : "Request verification"}</button>}
                {!needsKyb && challenge.status === "draft" && !funding && <button className="btn-block" onClick={fund} disabled={busy}>{busy ? "Preparing payment…" : "Secure the prize"}</button>}
                {canOpenNextRound && <button className="btn-block" onClick={openNextRound} disabled={busy}>{busy ? "Opening…" : `Open round ${rounds.length + 1}`}</button>}
                {!canOpenNextRound && challenge.status !== "draft" && <p>The next campaign action appears here as soon as the current round is revealed.</p>}
              </>
            )}
          </section>

          {funding && (
            <section className={`card ${styles.fundingCard}`}>
              <span className="page-eyebrow">Secure checkout</span>
              <h2>Confirm funding</h2>
              <span className={`${styles.total} money`}>{formatCents(funding.breakdown.totalCharge)}</span>
              <p className="muted">This includes the prize, creator payouts and platform fee.</p>
              <button type="button" className="secondary btn-block" onClick={() => setShowConfirmBreakdown(true)}>Review charge</button>
              <StripeFundForm clientSecret={funding.clientSecret} onDone={() => void afterFundingConfirmed()} />
            </section>
          )}
        </aside>
      </div>

      {showPreviewBreakdown && (
        <Sheet title="What creators can earn" onClose={() => setShowPreviewBreakdown(false)} footer={<button className="btn-block" onClick={() => setShowPreviewBreakdown(false)}>Done</button>}>
          <dl className={styles.breakdownList}>
            <div className={styles.breakdownRow}><dt>Winner</dt><dd>{formatCents(challenge.prizePool)}</dd></div>
            <div className={styles.breakdownRow}><dt>Finalist pool</dt><dd>{formatCents(challenge.stipendPool)}</dd></div>
            <div className={styles.breakdownRow}><dt>Round-2 survivor pool</dt><dd>{formatCents(previewSurvivorBonusPool(challenge.prizePool))}</dd></div>
            <div className={styles.breakdownRow}><dt>Crowd favourite</dt><dd>{formatCents(previewCrowdFavourite(challenge.prizePool))}</dd></div>
            <div className={styles.breakdownRow}><dt>Platform fee</dt><dd>{(challenge.takeRateBps / 100).toFixed(1)}%</dd></div>
          </dl>
        </Sheet>
      )}

      {funding && showConfirmBreakdown && (
        <Sheet title="Charge breakdown" onClose={() => setShowConfirmBreakdown(false)} footer={<button className="btn-block" onClick={() => setShowConfirmBreakdown(false)}>Looks right</button>}>
          <dl className={styles.breakdownList}>
            <div className={styles.breakdownRow}><dt>Prize pool</dt><dd>{formatCents(funding.breakdown.prizePool)}</dd></div>
            <div className={styles.breakdownRow}><dt>Finalist stipends</dt><dd>{formatCents(funding.breakdown.stipendPool)}</dd></div>
            <div className={styles.breakdownRow}><dt>Survivor bonus</dt><dd>{formatCents(funding.breakdown.survivorBonusPool)}</dd></div>
            <div className={styles.breakdownRow}><dt>Platform fee</dt><dd>{formatCents(funding.breakdown.platformFee)}</dd></div>
            <div className={styles.breakdownRow}><dt>Total charge</dt><dd>{formatCents(funding.breakdown.totalCharge)}</dd></div>
          </dl>
        </Sheet>
      )}
    </div>
  );
}
