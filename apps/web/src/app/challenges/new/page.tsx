"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge } from "@/lib/types";
import { dollarsToCents } from "@/lib/format";
import { ArrowLeftIcon, CheckIcon, LockIcon } from "@/components/icons";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import styles from "./new-challenge.module.css";

export default function NewChallengePage() {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [prizeDollars, setPrizeDollars] = useState(500);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(15);
  const [requiredHashtag, setRequiredHashtag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const challenge = await api.post<Challenge>("/challenges", {
        title,
        brief,
        prizePool: dollarsToCents(prizeDollars),
        checklistCriteria: { maxDurationSeconds: maxDurationSeconds || undefined, requiredHashtag: requiredHashtag || undefined },
      });
      router.push(`/challenges/${challenge.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The campaign draft couldn’t be created. Your copy is still here.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link href="/challenges" className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />All challenges</Link>
      <PageHeader eyebrow="Brand campaign" title="Build a brief creators want to enter." description="Start with the creative outcome, define a fair first-round constraint and set the prize. Funding happens after you review the draft." />
      {error && <Notice tone="danger" title="Draft not created">{error}</Notice>}

      <div className={styles.layout}>
        <form className={`card ${styles.formCard}`} onSubmit={onSubmit}>
          <section className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.number}>1</span><div><h2>Creative direction</h2><p>Tell creators what success should feel like, not exactly how to make it.</p></div></div>
            <div className="field"><label htmlFor="title">Challenge title</label><input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Streetwear in motion" maxLength={80} required /></div>
            <div className="field"><label htmlFor="brief">Creative brief</label><textarea id="brief" rows={6} value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Describe the audience, mood, product truth and the one idea creators should communicate…" required /></div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.number}>2</span><div><h2>Round-one rules</h2><p>Keep the teaser constraint simple enough to judge consistently.</p></div></div>
            <div className={styles.twoCol}>
              <div className="field"><label htmlFor="maxDuration">Maximum teaser length</label><input id="maxDuration" type="number" min={1} max={60} value={maxDurationSeconds} onChange={(event) => setMaxDurationSeconds(Number(event.target.value))} /><span className="subtle">Seconds · recommended 10–15</span></div>
              <div className="field"><label htmlFor="hashtag">Required hashtag</label><input id="hashtag" value={requiredHashtag} onChange={(event) => setRequiredHashtag(event.target.value)} placeholder="#perokiocreates" /><span className="subtle">Optional · include the # symbol</span></div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.number}>3</span><div><h2>Prize commitment</h2><p>The pool is not charged until the separate funding step.</p></div></div>
            <div className="field"><label htmlFor="prize">Winner prize in USD</label><input id="prize" type="number" min={1} step={1} value={prizeDollars} onChange={(event) => setPrizeDollars(Number(event.target.value))} required /></div>
          </section>

          <button type="submit" className="btn-block" disabled={busy}>{busy ? "Creating draft…" : "Create campaign draft"}</button>
        </form>

        <aside className={`card ${styles.previewCard}`}>
          <div className={styles.previewMedia}><span className={`badge ${styles.previewBadge}`}>Draft preview</span><span>Creative competition · blind voting</span></div>
          <span className="page-eyebrow">Creator view</span>
          <h2 className={styles.previewTitle}>{title || "Your challenge title"}</h2>
          <p className={styles.previewBrief}>{brief || "A focused brief helps creators understand the outcome while leaving room for original ideas."}</p>
          <div className={styles.previewPrize}><div><span>Winner prize</span><strong className="money">${Math.max(0, prizeDollars).toLocaleString()}</strong></div><span>{maxDurationSeconds || 0}s teaser</span></div>
          <div className={styles.nextSteps}>
            <div className={styles.nextStep}><CheckIcon width={15} height={15} aria-hidden />Draft remains private after creation</div>
            <div className={styles.nextStep}><LockIcon width={15} height={15} aria-hidden />Business verification precedes funding</div>
            <div className={styles.nextStep}><CheckIcon width={15} height={15} aria-hidden />Round 1 opens only after payment confirmation</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
