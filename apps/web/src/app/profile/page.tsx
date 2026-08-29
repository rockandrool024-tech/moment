"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ShareIcon, TrendingUpIcon, TargetIcon, ZapIcon, AwardIcon } from "@/components/icons";
import { StatCard } from "@/components/StatCard";
import styles from "./profile.module.css";

interface CreatorProfile {
  id: string;
  displayName: string;
  avatar?: string;
  level: number;
  levelTitle: string;
  points: number;
  accuracy: number;
  followers: number;
  bio: string;
  location: string;
  sector: string;
  joinedDate: string;
  stats: {
    totalUploads: number;
    totalEarnings: number;
    viralContent: number;
    followers: number;
  };
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    unlocked: boolean;
  }>;
}

const mockProfile: CreatorProfile = {
  id: "creator-1",
  displayName: "Emanuel Donaldson",
  avatar: "ED",
  level: 22,
  levelTitle: "Gold",
  points: 3250,
  accuracy: 78,
  followers: 15420,
  bio: "Content creator • Fitness enthusiast • Here for the gains...",
  location: "Berlin, Germany",
  sector: "Fitness & Wellness",
  joinedDate: "March 2024",
  stats: {
    totalUploads: 42,
    totalEarnings: 3250,
    viralContent: 8,
    followers: 15420,
  },
  badges: [
    { id: "1", name: "First Upload", icon: "🎬", unlocked: true },
    { id: "2", name: "Viral", icon: "🔥", unlocked: true },
    { id: "3", name: "Streak", icon: "⚡", unlocked: true },
    { id: "4", name: "Influencer", icon: "👑", unlocked: false },
  ],
};

export default function ProfilePage() {
  const [profile] = useState<CreatorProfile>(mockProfile);
  const [copied, setCopied] = useState(false);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(`moment.app/r/${profile.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/discovery" className={styles.backBtn}>
          <ArrowLeftIcon width={20} height={20} aria-hidden />
        </Link>
        <h1 className={styles.pageTitle}>Profile</h1>
        <div className={styles.spacer} />
      </div>

      {/* Hero Card */}
      <section className={styles.heroCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{profile.avatar}</div>
          <div className={styles.levelBadge}>
            <span className={styles.levelNumber}>{profile.level}</span>
            <span className={styles.levelTitle}>{profile.levelTitle}</span>
          </div>
        </div>

        <div className={styles.heroContent}>
          <h2 className={styles.name}>{profile.displayName}</h2>
          <p className={styles.bio}>{profile.bio}</p>
          <div className={styles.meta}>
            <span>📍 {profile.location}</span>
            <span>🎯 {profile.sector}</span>
          </div>
        </div>

        <button className={styles.shareBtn} onClick={copyReferralLink}>
          <ShareIcon width={18} height={18} aria-hidden />
          {copied ? "Copied!" : "Share"}
        </button>
      </section>

      {/* Stats Grid */}
      <section className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <strong>{profile.stats.totalEarnings.toLocaleString()}</strong>
            <span>Total Earned</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <strong>{profile.accuracy}%</strong>
            <span>Accuracy</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statContent}>
            <strong>{profile.stats.viralContent}</strong>
            <span>Viral Posts</span>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <strong>{(profile.followers / 1000).toFixed(1)}K</strong>
            <span>Followers</span>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      <section className={styles.badgesSection}>
        <h3 className={styles.sectionTitle}>Achievements</h3>
        <div className={styles.badgesGrid}>
          {profile.badges.map((badge) => (
            <div key={badge.id} className={`${styles.badge} ${badge.unlocked ? styles.unlocked : styles.locked}`}>
              <div className={styles.badgeIcon}>{badge.icon}</div>
              <span>{badge.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Referral Links */}
      <section className={styles.referralSection}>
        <div className={styles.referralCard}>
          <h3>Referral Link</h3>
          <code className={styles.referralCode}>/r/{profile.id}</code>
          <button className={styles.copyBtn} onClick={copyReferralLink}>
            {copied ? "✓ Copied" : "Copy Link"}
          </button>
        </div>
      </section>

      {/* CTA */}
      <Link href="/upload" className={styles.ctaButton}>
        Upload Your Story
      </Link>
    </div>
  );
}
