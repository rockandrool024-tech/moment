"use client";

import { useState, useEffect } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { ArrowLeftIcon, TrendingUpIcon, BarChart3Icon, CheckCircleIcon } from "@/components/icons";
import Link from "next/link";
import styles from "./process.module.css";

interface ActiveStory {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar: string;
  status: "voting" | "payout_ready" | "claimed";
  createdAt: string;
  endsAt: string;
  views: {
    tiktok: number;
    instagram: number;
    facebook: number;
    app: number;
  };
  votes: {
    upvotes: number;
    downvotes: number;
  };
  yourVote?: "upvote" | "downvote";
  earnings: {
    views: number;
    voting: number;
    accuracy: number;
    total: number;
  };
}

const mockStory: ActiveStory = {
  id: "story-1",
  title: "Urban Fashion Drop",
  creatorName: "Alex Chen",
  creatorAvatar: "AC",
  status: "voting",
  createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  endsAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
  views: {
    tiktok: 1200,
    instagram: 950,
    facebook: 700,
    app: 0,
  },
  votes: {
    upvotes: 342,
    downvotes: 58,
  },
  yourVote: "upvote",
  earnings: {
    views: 285,
    voting: 10,
    accuracy: 5,
    total: 300,
  },
};

export default function ProcessPage() {
  const [story] = useState<ActiveStory>(mockStory);
  const [timeRemaining, setTimeRemaining] = useState("");

  const totalViews = story.views.tiktok + story.views.instagram + story.views.facebook + story.views.app;
  const viralThreshold = 5000;
  const progressPercent = Math.min((totalViews / viralThreshold) * 100, 100);
  const isViralPredicted = totalViews >= viralThreshold;
  const totalVotes = story.votes.upvotes + story.votes.downvotes;
  const upvotePercent = totalVotes > 0 ? (story.votes.upvotes / totalVotes) * 100 : 50;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(story.endsAt).getTime();
      const diff = Math.max(0, end - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}h ${minutes}m remaining`);
    }, 1000);

    return () => clearInterval(timer);
  }, [story.endsAt]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/discovery" className={styles.backBtn}>
          <ArrowLeftIcon width={20} height={20} aria-hidden />
        </Link>
        <h1 className={styles.title}>24-Hour Payout Cycle</h1>
      </div>

      {/* Active Story */}
      <section className={styles.storyCard}>
        <div className={styles.storyHeader}>
          <div className={styles.creatorInfo}>
            <div className={styles.creatorAvatar}>{story.creatorAvatar}</div>
            <div>
              <strong>{story.title}</strong>
              <span>by {story.creatorName}</span>
            </div>
          </div>
          <span className={`${styles.status} ${styles[story.status]}`}>
            {story.status === "voting" && "⏳ Voting in progress"}
            {story.status === "payout_ready" && "✓ Payout ready"}
            {story.status === "claimed" && "✓ Payout claimed"}
          </span>
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          <div className={styles.stage}>
            <div className={`${styles.stageMarker} ${styles.completed}`}>
              <CheckCircleIcon width={20} height={20} aria-hidden />
            </div>
            <div className={styles.stageContent}>
              <strong>T+0 — Upload Approved</strong>
              <span>{new Date(story.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.stage}>
            <div className={`${styles.stageMarker} ${styles.active}`}>
              <span>⏳</span>
            </div>
            <div className={styles.stageContent}>
              <strong>T+12H — Halfway Point</strong>
              <span>Real-time metrics below</span>
            </div>
          </div>

          <div className={styles.stage}>
            <div className={`${styles.stageMarker}`}>
              <span>📊</span>
            </div>
            <div className={styles.stageContent}>
              <strong>T+24H — Payout Moment</strong>
              <span>{timeRemaining}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar startTime={story.createdAt} endTime={story.endsAt} onComplete={() => {}} />
      </section>

      {/* Live Metrics */}
      <section className={styles.metricsSection}>
        <h2 className={styles.sectionTitle}>Live Metrics</h2>

        {/* Views */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Views</span>
            <span className={styles.metricValue}>{totalViews.toLocaleString()}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${isViralPredicted ? styles.viral : ""}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.progressLabel}>
            <span>{progressPercent.toFixed(0)}%</span>
            <span>{viralThreshold - totalViews} to viral</span>
          </div>

          {/* Platform Breakdown */}
          <div className={styles.platformBreakdown}>
            <div className={styles.platformItem}>
              <span>🎵 TikTok</span>
              <strong>{story.views.tiktok}</strong>
            </div>
            <div className={styles.platformItem}>
              <span>📷 Instagram</span>
              <strong>{story.views.instagram}</strong>
            </div>
            <div className={styles.platformItem}>
              <span>f Facebook</span>
              <strong>{story.views.facebook}</strong>
            </div>
            <div className={styles.platformItem}>
              <span>📱 App</span>
              <strong>{story.views.app}</strong>
            </div>
          </div>
        </div>

        {/* Votes */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Community Prediction</span>
            <span className={styles.metricValue}>{upvotePercent.toFixed(0)}% predict viral</span>
          </div>
          <div className={styles.voteBar}>
            <div
              className={`${styles.voteFill} ${styles.upvotes}`}
              style={{ width: `${upvotePercent}%` }}
            >
              <span className={styles.voteLabel}>
                👍 {story.votes.upvotes} upvotes
              </span>
            </div>
            <div
              className={`${styles.voteFill} ${styles.downvotes}`}
              style={{ width: `${100 - upvotePercent}%` }}
            >
              <span className={styles.voteLabel}>
                👎 {story.votes.downvotes} downvotes
              </span>
            </div>
          </div>
        </div>

        {/* Your Prediction */}
        {story.yourVote && (
          <div className={`${styles.metricCard} ${styles.yourPrediction}`}>
            <strong>Your Prediction: {story.yourVote === "upvote" ? "👍 Viral" : "👎 Not Viral"}</strong>
            <span>Points if correct: +{story.earnings.accuracy} accuracy bonus</span>
          </div>
        )}
      </section>

      {/* Earnings Breakdown */}
      <section className={styles.earningsSection}>
        <h2 className={styles.sectionTitle}>Estimated Earnings</h2>
        <div className={styles.earningsCard}>
          <div className={styles.earningRow}>
            <div>
              <span className={styles.earningLabel}>Views</span>
              <span className={styles.earningDesc}>{totalViews} views × 0.1</span>
            </div>
            <strong className={styles.green}>+{story.earnings.views} pts</strong>
          </div>
          <div className={styles.earningRow}>
            <div>
              <span className={styles.earningLabel}>Voting Participation</span>
              <span className={styles.earningDesc}>Voted {story.yourVote}</span>
            </div>
            <strong className={styles.green}>+{story.earnings.voting} pts</strong>
          </div>
          {story.yourVote && (
            <div className={styles.earningRow}>
              <div>
                <span className={styles.earningLabel}>Accuracy Bonus</span>
                <span className={styles.earningDesc}>If prediction is correct</span>
              </div>
              <strong className={styles.green}>+{story.earnings.accuracy} pts</strong>
            </div>
          )}
          <div className={`${styles.earningRow} ${styles.total}`}>
            <strong>Total Estimated</strong>
            <strong className={styles.cyan}>+{story.earnings.total} pts = ${(story.earnings.total * 0.01).toFixed(2)} USD</strong>
          </div>
        </div>
      </section>

      {/* Live Feed */}
      <section className={styles.feedSection}>
        <h2 className={styles.sectionTitle}>Live Updates</h2>
        <div className={styles.feedItems}>
          <div className={styles.feedItem}>
            <span className={styles.feedTime}>Just now</span>
            <span className={styles.feedText}>+500 views from TikTok</span>
          </div>
          <div className={styles.feedItem}>
            <span className={styles.feedTime}>2 min ago</span>
            <span className={styles.feedText}>15 people just voted</span>
          </div>
          <div className={styles.feedItem}>
            <span className={styles.feedTime}>5 min ago</span>
            <span className={styles.feedText}>Vote is 85/15 upvote - Going viral! 🔥</span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className={styles.actions}>
        <Link href="/discovery" className={styles.actionBtn}>
          Back to Discovery
        </Link>
        <Link href="/wallet-moment" className={`${styles.actionBtn} ${styles.secondary}`}>
          View Wallet
        </Link>
      </div>
    </div>
  );
}
