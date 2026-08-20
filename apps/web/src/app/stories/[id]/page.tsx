"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { ExternalPost, Story, StoryClaim } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeftIcon, CheckIcon, FilmIcon, PlusIcon } from "@/components/icons";
import { Notice } from "@/components/Notice";
import { CardSkeleton } from "@/components/Skeleton";
import styles from "./story-detail.module.css";

interface ExternalPostDraft { platform: string; url: string; views: string; likes: string; }
const EMPTY_POST: ExternalPostDraft = { platform: "", url: "", views: "", likes: "" };

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [myClaim, setMyClaim] = useState<StoryClaim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [posts, setPosts] = useState<ExternalPostDraft[]>([{ ...EMPTY_POST }]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [currentStory, claims] = await Promise.all([api.get<Story>(`/stories/${id}`), user ? api.get<StoryClaim[]>("/stories/me/claims") : Promise.resolve([])]);
      setStory(currentStory);
      const claim = claims.find((item) => item.storyId === id) ?? null;
      setMyClaim(claim);
      if (claim?.content) {
        setMediaUrl(claim.content.mediaUrl ?? "");
        setCaption(claim.content.caption ?? "");
      }
    } catch {
      setError("This story couldn’t be loaded.");
    }
  }, [id, user]);

  useEffect(() => { void load(); }, [load]);

  async function claimStory() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/stories/${id}/claim`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The story couldn’t be claimed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveContent(e: React.FormEvent) {
    e.preventDefault();
    if (!myClaim) return;
    setBusy(true);
    setError(null);
    try {
      const externalPosts = posts.filter((post) => post.platform && post.url).map((post) => ({ platform: post.platform, url: post.url, views: post.views ? Number(post.views) : undefined, likes: post.likes ? Number(post.likes) : undefined }));
      await api.post(`/stories/claims/${myClaim.id}/content`, { mediaUrl: mediaUrl || undefined, caption: caption || undefined, externalPosts: externalPosts.length ? externalPosts : undefined });
      await load();
      setPosts([{ ...EMPTY_POST }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your content update couldn’t be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!story) return error ? <Notice tone="danger" title="Story unavailable" action={<button className="secondary" onClick={() => void load()}>Retry</button>}>{error}</Notice> : <CardSkeleton media />;

  const canClaim = Boolean(user && (user.role === "creator" || user.role === "both") && story.mode === "OPEN");

  return (
    <div>
      <Link href="/stories" className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />All stories</Link>
      <section className={styles.hero}>
        <div className={styles.badges}><span className="badge badge-accent">{story.access}</span><span className="badge">{story.mode}</span></div>
        <div className={styles.heroCopy}><h1>{story.title}</h1><p>Open story brief · creators keep authorship and report external performance for context only.</p></div>
      </section>
      {error && <Notice tone="danger" title="Action needs attention">{error}</Notice>}

      <div className={styles.layout}>
        <main>
          <section className={`card ${styles.brief}`}><span className="page-eyebrow">The story brief</span><h2>What the brand wants to communicate</h2><p>{story.brief}</p></section>

          {myClaim && (
            <section className={`card ${styles.contentCard}`}>
              <span className="page-eyebrow">Your claimed story</span>
              <h2>Add the content you made.</h2>
              <p className="muted">Media and external post links help the brand follow the collaboration. Reported views and likes are never verified or scored.</p>
              <form onSubmit={saveContent}>
                <div className={styles.formSection}>
                  <div className="field"><label htmlFor="mediaUrl">Primary media URL</label><input id="mediaUrl" type="url" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://…" /></div>
                  <div className="field"><label htmlFor="caption">Caption or creative note</label><textarea id="caption" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Explain the angle, hook or final caption…" /></div>
                </div>
                <div className={styles.formSection}>
                  <h3>External posts</h3>
                  {posts.map((post, index) => (
                    <div className={styles.postGrid} key={index}>
                      <div className="field"><label htmlFor={`platform-${index}`}>Platform</label><input id={`platform-${index}`} value={post.platform} onChange={(event) => setPosts(posts.map((row, rowIndex) => rowIndex === index ? { ...row, platform: event.target.value } : row))} placeholder="TikTok" /></div>
                      <div className="field"><label htmlFor={`url-${index}`}>Post URL</label><input id={`url-${index}`} type="url" value={post.url} onChange={(event) => setPosts(posts.map((row, rowIndex) => rowIndex === index ? { ...row, url: event.target.value } : row))} placeholder="https://…" /></div>
                      <div className={styles.postMetrics}>
                        <div className="field"><label htmlFor={`views-${index}`}>Reported views</label><input id={`views-${index}`} type="number" min={0} value={post.views} onChange={(event) => setPosts(posts.map((row, rowIndex) => rowIndex === index ? { ...row, views: event.target.value } : row))} /></div>
                        <div className="field"><label htmlFor={`likes-${index}`}>Reported likes</label><input id={`likes-${index}`} type="number" min={0} value={post.likes} onChange={(event) => setPosts(posts.map((row, rowIndex) => rowIndex === index ? { ...row, likes: event.target.value } : row))} /></div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className={`secondary ${styles.addButton}`} onClick={() => setPosts([...posts, { ...EMPTY_POST }])}><PlusIcon width={15} height={15} aria-hidden />Add another post</button>
                  <button type="submit" className="btn-block" disabled={busy}>{busy ? "Saving…" : "Save content"}</button>
                </div>
              </form>

              {myClaim.content?.externalPosts && myClaim.content.externalPosts.length > 0 && (
                <div className={styles.saved}><h3>Saved posts</h3>{myClaim.content.externalPosts.map((post: ExternalPost) => <div className={styles.savedRow} key={post.id}><div><strong>{post.platform}</strong><a className={styles.previewLink} href={post.url} target="_blank" rel="noreferrer">{post.url}</a></div><span className={styles.reported}>{post.views !== null ? `${post.views.toLocaleString()} views` : "No views reported"}<br />{post.likes !== null ? `${post.likes.toLocaleString()} likes` : "No likes reported"}</span></div>)}</div>
              )}
            </section>
          )}
        </main>

        <aside>
          <section className={`card ${styles.actionCard}`}>
            {story.mode === "CHALLENGE" ? (
              <><span className="page-eyebrow">Funded competition</span><h2>This story runs as a Challenge.</h2><p>Entries, blind voting and payouts happen on the dedicated challenge page.</p><Link href={`/challenges/${story.challengeId}`} className="btn btn-block">Open challenge</Link></>
            ) : myClaim ? (
              <><span className="page-eyebrow">Claimed</span><h2>The brief is in your workspace.</h2><p>Add your content and publication links when they are ready.</p><span className="badge badge-accent"><CheckIcon width={14} height={14} aria-hidden />Claim active</span></>
            ) : canClaim ? (
              <><span className="page-eyebrow">Open brief</span><h2>Make this story your own.</h2><p>Claiming tells the brand you intend to create. It does not transfer ownership of your work.</p><button className="btn-block" onClick={() => void claimStory()} disabled={busy}>{busy ? "Claiming…" : "Claim this story"}</button></>
            ) : (
              <><span className="page-eyebrow">Creator access</span><h2>Log in as a creator to claim.</h2><p>You can read every open brief before deciding.</p><Link href={`/login?returnTo=/stories/${id}`} className="btn btn-block"><FilmIcon width={16} height={16} aria-hidden />Log in</Link></>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
