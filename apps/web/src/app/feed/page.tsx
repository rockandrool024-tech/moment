"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { FeedVideo } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { Loading } from "@/components/Loading";
import { FilmIcon, MuteIcon, ShareIcon, UnmuteIcon } from "@/components/icons";
import styles from "./feed.module.css";

// TikTok-style scrollable feed of real, ready-to-play challenge submissions
// (Submission.videoStatus === "ready" && playbackId set — see
// PublicService.getFeedVideos). No placeholder/fabricated rows: an empty
// list means nothing is actually playable yet, which is the honest state
// of a fresh environment before any Mux asset finishes processing.
export default function FeedPage() {
  const [videos, setVideos] = useState<FeedVideo[] | null>(null);
  const [muted, setMuted] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    api.get<{ videos: FeedVideo[] }>("/public/feed/videos").then((r) => setVideos(r.videos));
  }, []);

  // Only the section mostly in view plays — every other video stays paused
  // and reset, so switching feels instant and nothing plays off-screen.
  useEffect(() => {
    if (!videos || videos.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.muted = muted;
            void video.play().catch(() => undefined);
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      },
      { root: containerRef.current, threshold: [0, 0.6] },
    );
    for (const el of videoRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [videos, muted]);

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      for (const el of videoRefs.current.values()) el.muted = next;
      return next;
    });
  }

  function copyLink(video: FeedVideo) {
    const link = `${window.location.origin}/battle/${video.challengeId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (videos === null) return <Loading />;

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={<FilmIcon width={28} height={28} aria-hidden />}
        title="Nothing ready to play yet"
        body="Videos show up here the moment a submission finishes processing. Check back once a round has entries."
      />
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.muteToggle} onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
        {muted ? <MuteIcon width={18} height={18} aria-hidden /> : <UnmuteIcon width={18} height={18} aria-hidden />}
      </button>
      <div className={styles.scroller} ref={containerRef}>
        {videos.map((video) => (
          <section className={styles.slide} key={video.id}>
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(video.id, el);
                else videoRefs.current.delete(video.id);
              }}
              className={styles.video}
              src={`https://stream.mux.com/${video.playbackId}/high.mp4`}
              muted={muted}
              loop
              playsInline
              preload="metadata"
            />
            <div className={styles.scrim} />

            <div className={styles.actionRail}>
              <Link href={`/discovery`} className={styles.railAvatar} aria-label={video.creatorName ?? "Creator"}>
                <Avatar userId={video.creatorId} size={44} />
              </Link>
              <div className={styles.railStat}>
                <span className={styles.railCount}>{video.voteCount}</span>
                <span className={styles.railLabel}>votes</span>
              </div>
              <button className={styles.railButton} onClick={() => copyLink(video)} aria-label="Copy link to this challenge">
                <ShareIcon width={22} height={22} aria-hidden />
                <span className={styles.railLabel}>{copiedId === video.id ? "Copied" : "Share"}</span>
              </button>
            </div>

            <div className={styles.caption}>
              <p className={styles.creatorName}>{video.creatorName ?? "Unnamed creator"}</p>
              <Link href={`/challenges/${video.challengeId}`} className={styles.challengeLink}>
                {video.challengeTitle}
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
