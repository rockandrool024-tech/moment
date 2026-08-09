"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Submission, SubmissionPhase } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { PlayIcon, VoteCheckIcon } from "@/components/icons";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "errored";

export default function SubmitPage() {
  const { id: challengeId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [phase, setPhase] = useState<SubmissionPhase>("teaser");
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await api.post<Submission>("/submissions", {
        challengeId,
        phase,
        durationSeconds,
        caption,
      });
      setSubmission(created);

      if (created.status === "eliminated") {
        setError("This entry was auto-eliminated by the challenge's checklist rules.");
        setBusy(false);
        return;
      }

      if (file) {
        await uploadVideo(created.id, file);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function uploadVideo(submissionId: string, videoFile: File) {
    setUploadState("uploading");
    try {
      const { uploadUrl } = await api.post<{ uploadUrl: string; uploadId: string }>(
        "/media/uploads",
        { submissionId },
      );
      const putResponse = await fetch(uploadUrl, { method: "PUT", body: videoFile });
      if (!putResponse.ok) throw new Error("Upload to Mux failed");
      setUploadState("processing");
      void pollStatus(submissionId);
    } catch {
      setUploadState("errored");
    }
  }

  async function pollStatus(submissionId: string, attempt = 0) {
    if (attempt > 20 || !user) return;
    const list = await api.get<Submission[]>(
      `/submissions?challengeId=${challengeId}&creatorId=${user.id}`,
    );
    const current = list.find((s) => s.id === submissionId);
    if (current?.videoStatus === "ready") {
      setUploadState("ready");
      return;
    }
    if (current?.videoStatus === "errored") {
      setUploadState("errored");
      return;
    }
    setTimeout(() => void pollStatus(submissionId, attempt + 1), 3000);
  }

  if (submission && submission.status !== "eliminated") {
    return (
      <div>
        <h1>Entry submitted</h1>
        <p className="muted">Submission {submission.id.slice(0, 8)} — phase: {submission.phase}</p>
        {uploadState === "idle" && <p>No video attached.</p>}
        {uploadState === "uploading" && <p>Uploading to Mux…</p>}
        {uploadState === "processing" && <p>Processing (Mux is transcoding)…</p>}
        {uploadState === "ready" && (
          <p style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent)" }}>
            <VoteCheckIcon width={18} height={18} aria-hidden /> Video ready
          </p>
        )}
        {uploadState === "errored" && (
          <p className="error">
            Your video didn&rsquo;t process — your entry is still submitted and counts toward the
            round, but try re-uploading the video, or contact support if it keeps failing.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1>Submit an entry</h1>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="phase">Phase</label>
          <select id="phase" value={phase} onChange={(e) => setPhase(e.target.value as SubmissionPhase)}>
            <option value="teaser">Teaser (round 1)</option>
            <option value="full_content">Full content (round 2)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="duration">Duration (seconds)</label>
          <input
            id="duration"
            type="number"
            min={1}
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="caption">Caption</label>
          <input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="video">Video file (optional — uploads to Mux)</label>
          <label
            htmlFor="video"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.4rem",
              padding: "1.75rem 1rem",
              border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 10,
              background: dragging ? "var(--card-bg)" : "transparent",
              cursor: "pointer",
              textAlign: "center",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) setFile(dropped);
            }}
          >
            <PlayIcon width={28} height={28} style={{ color: "var(--muted)" }} aria-hidden />
            <span>{file ? file.name : "Drop a video, or click to browse"}</span>
            <input
              id="video"
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-block" disabled={busy}>
          Submit
        </button>
      </form>
    </div>
  );
}
