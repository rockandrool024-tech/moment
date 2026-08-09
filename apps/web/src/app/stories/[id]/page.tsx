"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Story, StoryClaim, ExternalPost } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

interface ExternalPostDraft {
  platform: string;
  url: string;
  views: string;
  likes: string;
}

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

  async function load() {
    const [s, claims] = await Promise.all([
      api.get<Story>(`/stories/${id}`),
      user ? api.get<StoryClaim[]>("/stories/me/claims") : Promise.resolve([]),
    ]);
    setStory(s);
    const claim = claims.find((c) => c.storyId === id) ?? null;
    setMyClaim(claim);
    if (claim?.content) {
      setMediaUrl(claim.content.mediaUrl ?? "");
      setCaption(claim.content.caption ?? "");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function claimStory() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/stories/${id}/claim`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
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
      const externalPosts = posts
        .filter((p) => p.platform && p.url)
        .map((p) => ({
          platform: p.platform,
          url: p.url,
          views: p.views ? Number(p.views) : undefined,
          likes: p.likes ? Number(p.likes) : undefined,
        }));
      await api.post(`/stories/claims/${myClaim.id}/content`, {
        mediaUrl: mediaUrl || undefined,
        caption: caption || undefined,
        externalPosts: externalPosts.length > 0 ? externalPosts : undefined,
      });
      await load();
      setPosts([{ ...EMPTY_POST }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!story) return <p className="muted">Loading…</p>;

  const canClaim = user && (user.role === "creator" || user.role === "both") && story.mode === "OPEN";

  return (
    <div>
      <h1>{story.title}</h1>
      <span className="badge">{story.access}</span> <span className="badge">{story.mode}</span>
      <p>{story.brief}</p>

      {error && <p className="error">{error}</p>}

      {!myClaim && canClaim && (
        <button onClick={claimStory} disabled={busy}>
          Claim this story
        </button>
      )}

      {story.mode === "CHALLENGE" && (
        <p className="muted">
          This story runs as a funded Challenge — enter it from the{" "}
          <a href={`/challenges/${story.challengeId}`}>challenge page</a> instead.
        </p>
      )}

      {myClaim && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Your content</h2>
          <form onSubmit={saveContent}>
            <div className="field">
              <label htmlFor="mediaUrl">Media URL</label>
              <input id="mediaUrl" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="caption">Caption</label>
              <input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>

            <label className="muted" style={{ fontSize: "0.85rem" }}>
              External posts (optional — shown on your dashboard only, never used for scoring)
            </label>
            {posts.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                <input
                  placeholder="Platform (tiktok, instagram…)"
                  value={p.platform}
                  onChange={(e) =>
                    setPosts(posts.map((row, idx) => (idx === i ? { ...row, platform: e.target.value } : row)))
                  }
                  style={{ flex: "1 1 140px" }}
                />
                <input
                  placeholder="URL"
                  value={p.url}
                  onChange={(e) =>
                    setPosts(posts.map((row, idx) => (idx === i ? { ...row, url: e.target.value } : row)))
                  }
                  style={{ flex: "2 1 200px" }}
                />
                <input
                  placeholder="Views"
                  type="number"
                  value={p.views}
                  onChange={(e) =>
                    setPosts(posts.map((row, idx) => (idx === i ? { ...row, views: e.target.value } : row)))
                  }
                  style={{ flex: "1 1 90px" }}
                />
                <input
                  placeholder="Likes"
                  type="number"
                  value={p.likes}
                  onChange={(e) =>
                    setPosts(posts.map((row, idx) => (idx === i ? { ...row, likes: e.target.value } : row)))
                  }
                  style={{ flex: "1 1 90px" }}
                />
              </div>
            ))}
            <button
              type="button"
              className="secondary"
              onClick={() => setPosts([...posts, { ...EMPTY_POST }])}
              style={{ marginBottom: "0.75rem" }}
            >
              + Add another post
            </button>

            <button type="submit" className="btn-block" disabled={busy}>
              Save content
            </button>
          </form>

          {myClaim.content?.externalPosts && myClaim.content.externalPosts.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3>Saved posts</h3>
              {myClaim.content.externalPosts.map((p: ExternalPost) => (
                <p key={p.id} className="muted">
                  {p.platform} — {p.url}
                  {p.views !== null && ` · ${p.views} views`}
                  {p.likes !== null && ` · ${p.likes} likes`}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
