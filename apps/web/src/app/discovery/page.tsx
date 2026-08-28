"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbsDownIcon, ThumbsUpIcon, WalletIcon } from "@/components/icons";
import { StatCard } from "@/components/StatCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Notice } from "@/components/Notice";
import styles from "./discovery.module.css";

interface Story {
  id: string;
  title: string;
  creatorName: string;
  viewsAggregate: number;
  viewsTikTok: number;
  viewsInstagram: number;
  viewsFacebook: number;
  viewsApp: number;
  upvotes: number;
  downvotes: number;
  payoutCycleEndsAt: string;
  createdAt: string;
}

const mockStories: Story[] = [
  {
    id: "1",
    title: "Urban Fashion Drop",
    creatorName: "Alex Chen",
    viewsAggregate: 2850,
    viewsTikTok: 1200,
    viewsInstagram: 950,
    viewsFacebook: 700,
    viewsApp: 0,
    upvotes: 342,
    downvotes: 58,
    payoutCycleEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export default function DiscoveryPage() {
  const [userVotes, setUserVotes] = useState({});
  const handleVote = (id: string, dir: string) => setUserVotes(prev => ({ ...prev, [id]: prev[id] === dir ? null : dir }));
  return (
    <div className={styles.container}>
      <section className={styles.banner}><h1>Predict viral moments.</h1></section>
      <section className={styles.storyGrid}>
        {mockStories.map(story => (
          <article key={story.id} className={`card ${styles.storyCard}`}>
            <h3>{story.title}</h3>
            <div className={styles.votingPrompt}>
              <button onClick={() => handleVote(story.id, "up")}>👍 Yes ({story.upvotes})</button>
              <button onClick={() => handleVote(story.id, "down")}>👎 No ({story.downvotes})</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
