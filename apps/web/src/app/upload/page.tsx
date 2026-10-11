"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon, FilmIcon, PlusIcon } from "@/components/icons";
import { Notice } from "@/components/Notice";
import { Sheet } from "@/components/Sheet";
import styles from "./upload.module.css";

interface UploadedVideo {
  id: string;
  title: string;
  caption: string;
  thumbnail?: string;
  platforms: ("tiktok" | "instagram" | "facebook")[];
  status: "draft" | "pending_approval" | "approved" | "posted";
  createdAt: string;
}

export default function UploadPage() {
  const [videos, setVideos] = useState<UploadedVideo[]>([
    {
      id: "1",
      title: "Urban Fashion Drop",
      caption: "New collection now live 🔥",
      status: "posted",
      platforms: ["tiktok", "instagram", "facebook"],
      createdAt: new Date().toISOString(),
    },
  ]);

  const [selectedPlatforms, setSelectedPlatforms] = useState<("tiktok" | "instagram" | "facebook")[]>([
    "tiktok",
    "instagram",
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const togglePlatform = (platform: "tiktok" | "instagram" | "facebook") => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  async function handleUpload() {
    setBusy(true);
    // Mock upload - in reality this would:
    // 1. Upload video to storage
    // 2. Create story record
    // 3. Queue for approval
    // 4. Auto-post to selected platforms
    setTimeout(() => {
      setBusy(false);
      setShowPreview(true);
    }, 2000);
  }

  return (
    <div>
      <Link href="/discovery" className={styles.back}>
        <ArrowLeftIcon width={16} height={16} aria-hidden />
        Back to discovery
      </Link>

      <section className={`card ${styles.uploadSection}`}>
        <div className={styles.uploadHeader}>
          <span className="page-eyebrow">Creator Dashboard</span>
          <h1>Upload once, post everywhere</h1>
          <p>Select your platforms. We&apos;ll auto-post your video at the same time across all of them.</p>
        </div>

        <div className={styles.uploadZone}>
          <label className={styles.dropZone}>
            <div className={styles.dropZoneContent}>
              <FilmIcon width={48} height={48} aria-hidden />
              <strong>Drop your video or click to upload</strong>
              <span>MP4, MOV up to 500MB. Recommended: vertical 9:16</span>
            </div>
            <input
              type="file"
              accept="video/mp4,video/quicktime"
              className={styles.fileInput}
              disabled={busy}
            />
          </label>
        </div>

        <div className={styles.platformSelect}>
          <span className="page-eyebrow">Auto-post to</span>
          <div className={styles.platformGrid}>
            {(["tiktok", "instagram", "facebook"] as const).map((platform) => (
              <button
                key={platform}
                className={`${styles.platformOption} ${selectedPlatforms.includes(platform) ? styles.selected : ""}`}
                onClick={() => togglePlatform(platform)}
                type="button"
              >
                <span className={styles.platformIcon}>
                  {platform === "tiktok" && "🎵"}
                  {platform === "instagram" && "📷"}
                  {platform === "facebook" && "f"}
                </span>
                <span className={styles.platformLabel}>
                  {platform === "tiktok" && "TikTok"}
                  {platform === "instagram" && "Instagram"}
                  {platform === "facebook" && "Facebook"}
                </span>
                {selectedPlatforms.includes(platform) && (
                  <CheckIcon width={18} height={18} aria-hidden className={styles.platformCheck} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.captionSection}>
          <label htmlFor="caption">Caption (optional)</label>
          <textarea
            id="caption"
            placeholder="Add caption, hashtags, mentions..."
            maxLength={300}
            rows={4}
            className={styles.caption}
          />
          <span className={styles.charCount}>0 / 300</span>
        </div>

        <div className={styles.statsPreview}>
          <div className={styles.stat}>
            <strong>Platforms selected</strong>
            <span>{selectedPlatforms.length}</span>
          </div>
          <div className={styles.stat}>
            <strong>Estimated reach</strong>
            <span>50K+</span>
          </div>
        </div>

        <button className="btn btn-block" onClick={handleUpload} disabled={busy}>
          {busy ? "Uploading & approving…" : "Upload & Preview"}
        </button>
      </section>

      <section className={`card ${styles.historySection}`}>
        <span className="page-eyebrow">Recent uploads</span>
        <h2>Your posted stories</h2>

        <div className={styles.videoList}>
          {videos.map((video) => (
            <article key={video.id} className={styles.videoCard}>
              <div className={styles.videoThumbnail}>
                <div className={styles.videoPlaceholder}>
                  <FilmIcon width={32} height={32} aria-hidden />
                </div>
                <span className={`badge ${video.status === "posted" ? "badge-accent" : "badge"}`}>
                  {video.status === "posted" && "✓ Posted"}
                  {video.status === "pending_approval" && "⏳ Pending"}
                  {video.status === "approved" && "✓ Approved"}
                </span>
              </div>

              <div className={styles.videoMeta}>
                <strong>{video.title}</strong>
                <p className="muted">{video.caption}</p>

                <div className={styles.videoPlatforms}>
                  {video.platforms.map((platform) => (
                    <span key={platform} className="chip">
                      {platform === "tiktok" && "🎵 TikTok"}
                      {platform === "instagram" && "📷 Instagram"}
                      {platform === "facebook" && "f Facebook"}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showPreview && (
        <Sheet
          title="Upload preview"
          onClose={() => setShowPreview(false)}
          footer={
            <div className={styles.previewFooter}>
              <button className="secondary btn-block" onClick={() => setShowPreview(false)}>
                Cancel
              </button>
              <button className="btn-block">Confirm & post</button>
            </div>
          }
        >
          <div className={styles.previewContent}>
            <h3>Ready to post</h3>
            <p>Your video will be posted to TikTok, Instagram, and Facebook at the same time.</p>

            <div className={styles.previewStats}>
              <div>
                <strong>Submission ID</strong>
                <code>STY_001a2b3c</code>
              </div>
              <div>
                <strong>24h voting window</strong>
                <span>Starts when approved</span>
              </div>
              <div>
                <strong>Payout cycle</strong>
                <span>T+24 hours</span>
              </div>
            </div>

            <Notice tone="info" title="How MOMENT works">
              <p>
                Your video will accumulate views from all platforms. Community members vote to predict if you&apos;ll hit
                5K views. Everyone earns parrot points—you for views, them for accurate predictions.
              </p>
            </Notice>
          </div>
        </Sheet>
      )}
    </div>
  );
}
