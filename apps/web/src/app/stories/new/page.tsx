"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Story } from "@/lib/types";
import { ArrowLeftIcon, CheckIcon, FilmIcon } from "@/components/icons";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import styles from "./new-story.module.css";

export default function NewStoryPage() {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const story = await api.post<Story>("/stories", { title, brief });
      router.push(`/stories/${story.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The story couldn’t be created. Your draft remains on this screen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link href="/stories" className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />All stories</Link>
      <PageHeader eyebrow="Open brief" title="Invite creators into a story." description="Publish a non-competitive creative brief that creators can claim. You follow the collaboration without ranking engagement or controlling authorship." />
      {error && <Notice tone="danger" title="Story not created">{error}</Notice>}
      <div className={styles.layout}>
        <form className={`card ${styles.form}`} onSubmit={onSubmit}>
          <span className="field-label">Brief type</span>
          <div className={styles.choice}>
            <div className={`${styles.choiceCard} ${styles.choiceActive}`}><strong>Open Story</strong><span>Free to claim · no voting or prize pool</span></div>
            <Link className={styles.choiceCard} href="/challenges/new"><strong>Challenge</strong><span>Funded prize · blind competition</span></Link>
          </div>
          <div className="field"><label htmlFor="title">Story title</label><input id="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="A morning ritual worth sharing" required /></div>
          <div className="field"><label htmlFor="brief">Creative direction</label><textarea id="brief" rows={8} value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Describe the product truth, audience and emotional outcome. Leave room for the creator’s own voice…" required /></div>
          <button type="submit" className="btn-block" disabled={busy}>{busy ? "Publishing…" : "Publish open story"}</button>
        </form>
        <aside className={`card ${styles.preview}`}>
          <div className={styles.art} />
          <span className="page-eyebrow">Creator preview</span>
          <h2>{title || "Your story title"}</h2>
          <p>{brief || "A concise, outcome-led brief will appear here for creators to review before claiming."}</p>
          <div className="cluster"><span className="badge badge-accent">FREE</span><span className="badge">OPEN</span></div>
          <div className={styles.tips}>
            <div className={styles.tip}><span className={styles.tipIcon}><CheckIcon width={15} height={15} aria-hidden /></span><span>Focus on the message and audience, not a shot-by-shot script.</span></div>
            <div className={styles.tip}><span className={styles.tipIcon}><FilmIcon width={15} height={15} aria-hidden /></span><span>Creators can add media and external post links after claiming.</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
