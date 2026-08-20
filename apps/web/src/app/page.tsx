"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { CheckIcon, FilmIcon, ShareIcon, VerifiedIcon } from "@/components/icons";
import styles from "./home.module.css";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/challenges");
  }, [loading, user, router]);

  if (loading || user) {
    return <div className={styles.loading}><div className={styles.loadingMark}>PEROKIO</div></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className="wordmark">PEROKIO</Link>
        <div className={styles.headerActions}>
          <Link href="/feed" className={styles.headerLink}>Watch</Link>
          <Link href="/login" className="btn secondary">Log in</Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <div className={styles.kicker}><span className={styles.kickerDot} />Live creative competitions</div>
            <h1 className={styles.title}>Create. Compete. <span className={styles.titleAccent}>Get paid.</span></h1>
            <p className={styles.lede}>Real brand briefs, blind voting and cash prizes. Your following can rally behind you, but your work still decides the win.</p>
            <div className={styles.heroActions}>
              <Link href="/login" className="btn">Start creating</Link>
              <Link href="/feed" className="btn secondary"><FilmIcon width={18} height={18} aria-hidden />Watch live</Link>
            </div>
          </div>

          <article className={styles.featured}>
            <div className={styles.media}>
              <span className={`badge badge-live ${styles.liveBadge}`}>Live</span>
              <div className={styles.mediaCopy}>
                <p>NOVA Studio · verified brief</p>
                <h2>Streetwear in motion</h2>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <div>
                  <span className={styles.prizeLabel}>Winner prize</span>
                  <div className={`${styles.prize} money`}>$5,000</div>
                </div>
                <div className={styles.countdown}>
                  <strong>18h 24m</strong>
                  <span>left to enter</span>
                </div>
              </div>
              <div className={styles.cardMeta}>
                <span>126 creators</span>
                <span><VerifiedIcon width={14} height={14} aria-hidden /> Prize secured</span>
              </div>
              <Link href="/login" className="btn btn-block">Enter challenge</Link>
            </div>
          </article>
        </section>

        <section className={styles.proof} aria-label="How Perokio works">
          <div className={styles.proofCard}>
            <div>
              <div className={`${styles.proofValue} money`}>$84K paid</div>
              <p>to creators this month</p>
            </div>
            <ShareIcon width={32} height={32} aria-hidden />
          </div>
          <div className={styles.steps}>
            <h2>How it works</h2>
            <div className={styles.stepList}>
              <div className={styles.step}><span className={styles.stepNumber}>1</span><div><strong>Brands post real briefs</strong><span>Every prize is funded before entries open.</span></div></div>
              <div className={styles.step}><span className={styles.stepNumber}>2</span><div><strong>Creators submit the work</strong><span>Start with a short teaser, then advance through rounds.</span></div></div>
              <div className={styles.step}><span className={styles.stepNumber}><CheckIcon width={17} height={17} aria-hidden /></span><div><strong>The strongest work wins</strong><span>Blind votes protect quality from follower counts.</span></div></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
