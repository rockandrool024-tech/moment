"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRightIcon,
  CompassIcon,
  FlameIcon,
  PinIcon,
  PlusIcon,
  VerifiedIcon,
  WalletIcon,
} from "@/components/icons";
import { discoveryArenas, discoveryFilters, featuredOpportunities } from "@/features/discovery/data";
import type { DiscoveryFilter } from "@/features/discovery/model";
import styles from "./discovery.module.css";

function initials(seed: string) {
  return seed.slice(0, 2).toUpperCase();
}

export default function DiscoveryPage() {
  const [activeFilter, setActiveFilter] = useState<DiscoveryFilter>("Today");
  const [saved, setSaved] = useState<string[]>([]);

  const visibleArenas = useMemo(() => {
    if (activeFilter === "Today") return discoveryArenas.slice(0, 2);
    if (activeFilter === "Tomorrow") return discoveryArenas.slice(1);
    if (activeFilter === "Later") return discoveryArenas.slice(2);
    return discoveryArenas;
  }, [activeFilter]);

  function toggleSaved(id: string) {
    setSaved((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}><CompassIcon width={19} height={19} aria-hidden /></span>
          <div>
            <span className={styles.eyebrow}>Live discovery</span>
            <h1>Arena</h1>
          </div>
        </div>
        <Link href="/notifications" className={styles.headerAction} aria-label="Open notifications">
          <span className={styles.notificationDot} />
          <span aria-hidden>◌</span>
        </Link>
      </header>

      <section className={styles.intro} aria-labelledby="discovery-title">
        <div>
          <span className={styles.kicker}><FlameIcon width={15} height={15} aria-hidden /> Momentum is moving</span>
          <h2 id="discovery-title">Become the top challenger in your next story.</h2>
          <p>Pick an opportunity that fits your voice, claim your place, and turn your next idea into momentum.</p>
        </div>
        <div className={styles.liveStat}>
          <strong>12</strong>
          <span>live opportunities</span>
        </div>
      </section>

      <section className={styles.featuredSection} aria-labelledby="featured-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Curated for you</span>
            <h2 id="featured-title">Featured arenas</h2>
          </div>
          <Link href="/stories" className={styles.textLink}>See all <ChevronRightIcon width={15} height={15} aria-hidden /></Link>
        </div>

        <div className={styles.featuredRail}>
          {featuredOpportunities.map((item) => (
            <article key={item.id} className={`${styles.featuredCard} ${styles[`tone-${item.tone}`]}`}>
              <div className={styles.featuredGlow} aria-hidden />
              <div className={styles.cardTopline}>
                <span className={styles.scopeBadge}><PinIcon width={13} height={13} aria-hidden />{item.scope}</span>
                <span className={styles.timeBadge}>{item.time}</span>
              </div>
              <div className={styles.featuredCopy}>
                <h3>{item.title}</h3>
                <p>Hosted by {item.host}</p>
              </div>
              <div className={styles.featuredFooter}>
                <span className={styles.miniReward}><WalletIcon width={15} height={15} aria-hidden />{item.reward}</span>
                <span className={styles.avatarStack} aria-label={`${item.arenas} active arenas`}>
                  {Array.from({ length: item.arenas }, (_, index) => <span key={index} className={styles.miniAvatar}>{String.fromCharCode(65 + index)}</span>)}
                </span>
              </div>
              <Link href="/stories" className={styles.cardOverlayLink} aria-label={`Open ${item.title}`} />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.arenaSection} aria-labelledby="arenas-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Find your opening</span>
            <h2 id="arenas-title">Arenas</h2>
          </div>
          <span className={styles.countLabel}>{visibleArenas.length} showing</span>
        </div>

        <div className={styles.filters} role="tablist" aria-label="Opportunity timing">
          {discoveryFilters.map((filter) => (
            <button
              key={filter}
              className={`${styles.filter} ${activeFilter === filter ? styles.filterActive : ""}`}
              onClick={() => setActiveFilter(filter)}
              role="tab"
              aria-selected={activeFilter === filter}
            >
              {filter}
              {filter === "Tomorrow" && <span className={styles.filterCount}>1</span>}
              {filter === "This month" && <span className={styles.filterCount}>9</span>}
            </button>
          ))}
        </div>

        <div className={styles.arenaList}>
          {visibleArenas.map((arena) => {
            const isSaved = saved.includes(arena.id);
            return (
              <article key={arena.id} className={styles.arenaRow}>
                <div className={styles.arenaMedia} aria-hidden>
                  <span className={styles.mediaPlay}><span /></span>
                </div>
                <div className={styles.arenaBody}>
                  <div className={styles.arenaMeta}>
                    <span className={styles.scopeBadge}><PinIcon width={13} height={13} aria-hidden />{arena.scope}</span>
                    <span className={styles.timeBadge}>{arena.time}</span>
                  </div>
                  <h3>{arena.title}</h3>
                  <p>{arena.brief}</p>
                  <div className={styles.arenaFooter}>
                    <span className={styles.avatarStack} aria-label={`${arena.participants.length} creators joined`}>
                      {arena.participants.map((participant) => <span key={participant} className={styles.miniAvatar}>{initials(participant)}</span>)}
                    </span>
                    <span className={styles.rewardLabel}><WalletIcon width={14} height={14} aria-hidden />{arena.reward}</span>
                  </div>
                </div>
                <div className={styles.arenaRank}>
                  <span className={arena.rankTone === "up" ? styles.rankUp : styles.rankSteady}>{arena.rankTone === "up" ? "▲" : "•"}</span>
                  <strong>{arena.rank}</strong>
                  <button className={`${styles.saveButton} ${isSaved ? styles.saveButtonActive : ""}`} onClick={() => toggleSaved(arena.id)} aria-label={isSaved ? `Remove ${arena.title} from saved` : `Save ${arena.title}`}>
                    {isSaved ? "Saved" : "Save"}
                  </button>
                </div>
                <Link href="/stories" className={styles.rowLink} aria-label={`Open ${arena.title}`} />
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.creatorCta} aria-labelledby="creator-cta-title">
        <div className={styles.ctaIcon}><PlusIcon width={20} height={20} aria-hidden /></div>
        <div>
          <span className={styles.eyebrow}>Have a brief?</span>
          <h2 id="creator-cta-title">Start an arena for your community.</h2>
          <p>Turn a clear creative direction into an opportunity other creators can claim.</p>
        </div>
        <Link href="/stories/new" className="btn">Create an arena <ChevronRightIcon width={16} height={16} aria-hidden /></Link>
      </section>

      <p className={styles.trustNote}><VerifiedIcon width={16} height={16} aria-hidden /> Rewards are shown before you claim. No hidden entry fees.</p>
    </div>
  );
}
