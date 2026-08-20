"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, Submission, SubmissionPhase } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeftIcon, CheckIcon, FilmIcon, PlayIcon, VoteCheckIcon } from "@/components/icons";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import styles from "./submit.module.css";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "errored";

function fileSize(bytes: number) {
  return bytes < 1_000_000 ? `${Math.ceil(bytes / 1_000)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export default function SubmitPage() {
  const { id: challengeId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [phase, setPhase] = useState<SubmissionPhase>("teaser");
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    api.get<Challenge>(`/challenges/${challengeId}`).then(setChallenge).catch(() => undefined);
  }, [challengeId]);

  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const maxDuration = typeof challenge?.checklistCriteria?.maxDurationSeconds === "number" ? challenge.checklistCriteria.maxDurationSeconds : phase === "teaser" ? 15 : undefined;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await api.post<Submission>("/submissions", { challengeId, phase, durationSeconds, caption });
      setSubmission(created);
      if (created.status === "eliminated") {
        setError("This entry did not match one or more required brief rules. Review the criteria before trying again.");
        return;
      }
      if (file) await uploadVideo(created.id, file);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your entry couldn’t be submitted. Your selected file is still here; try again.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadVideo(submissionId: string, videoFile: File) {
    setUploadState("uploading");
    try {
      const { uploadUrl } = await api.post<{ uploadUrl: string; uploadId: string }>("/media/uploads", { submissionId });
      const putResponse = await fetch(uploadUrl, { method: "PUT", body: videoFile });
      if (!putResponse.ok) throw new Error("Upload failed");
      setUploadState("processing");
      void pollStatus(submissionId);
    } catch {
      setUploadState("errored");
    }
  }

  async function pollStatus(submissionId: string, attempt = 0) {
    if (attempt > 20 || !user) return;
    try {
      const list = await api.get<Submission[]>(`/submissions?challengeId=${challengeId}&creatorId=${user.id}`);
      const current = list.find((item) => item.id === submissionId);
      if (current?.videoStatus === "ready") { setUploadState("ready"); return; }
      if (current?.videoStatus === "errored") { setUploadState("errored"); return; }
      setTimeout(() => void pollStatus(submissionId, attempt + 1), 3000);
    } catch {
      setTimeout(() => void pollStatus(submissionId, attempt + 1), 3000);
    }
  }

  if (submission && submission.status !== "eliminated") {
    const states: UploadState[] = ["idle", "uploading", "processing", "ready"];
    const currentIndex = states.indexOf(uploadState);
    return (
      <div className={styles.successWrap}>
        <Link href={`/challenges/${challengeId}`} className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />Back to challenge</Link>
        <section className={`card ${styles.successCard}`}>
          <div className={styles.successIcon}><VoteCheckIcon width={28} height={28} aria-hidden /></div>
          <span className="page-eyebrow">Entry received</span>
          <h1>Your idea is in.</h1>
          <p className="muted">Entry {submission.id.slice(0, 8)} · {submission.phase === "teaser" ? "Round 1 teaser" : "Full content"}</p>

          {uploadState === "errored" ? (
            <Notice tone="danger" title="The video didn’t finish processing">Your entry record is safe, but the round needs a playable video. Return to the challenge and contact the campaign owner if the deadline is close.</Notice>
          ) : uploadState === "idle" ? (
            <Notice tone="warning" title="No video attached">The entry exists, but it will need media before it can be judged.</Notice>
          ) : (
            <div className={styles.statusSteps} aria-label="Video status">
              {["Entry saved", "Video uploaded", "Video prepared", "Ready for judging"].map((label, index) => (
                <div className={`${styles.statusStep} ${index <= currentIndex ? styles.statusStepActive : ""}`} key={label}>
                  <span className={styles.statusDot} /><span>{label}</span>{index < currentIndex && <CheckIcon width={15} height={15} aria-hidden />}
                </div>
              ))}
            </div>
          )}

          <div className="cluster">
            <Link href={`/challenges/${challengeId}`} className="btn">View challenge</Link>
            <Link href="/challenges" className="btn secondary">Find another brief</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/challenges/${challengeId}`} className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />Back to challenge</Link>
      <PageHeader eyebrow="Creator entry" title="Submit your strongest cut." description={challenge ? `You’re entering “${challenge.title}”. Review the rules, attach the media and keep the first round concise.` : "Review the rules, attach the media and keep the first round concise."} />

      {submission?.status === "eliminated" && error && <Notice tone="danger" title="Entry needs changes">{error}</Notice>}

      <div className={styles.layout}>
        <form className={`card ${styles.formCard}`} onSubmit={onSubmit}>
          <h2>1. Choose the round</h2>
          <div className={styles.phaseGroup}>
            <div className={styles.phaseOption}>
              <input className={styles.phaseInput} id="phase-teaser" type="radio" name="phase" value="teaser" checked={phase === "teaser"} onChange={() => setPhase("teaser")} />
              <label className={styles.phaseLabel} htmlFor="phase-teaser"><strong>Teaser</strong><span>Round 1 · a short first impression</span></label>
            </div>
            <div className={styles.phaseOption}>
              <input className={styles.phaseInput} id="phase-full" type="radio" name="phase" value="full_content" checked={phase === "full_content"} onChange={() => setPhase("full_content")} />
              <label className={styles.phaseLabel} htmlFor="phase-full"><strong>Full content</strong><span>Round 2 · for creators who advanced</span></label>
            </div>
          </div>

          <h2>2. Describe the cut</h2>
          <div className={styles.fieldGrid}>
            <div className="field">
              <label htmlFor="duration">Duration in seconds</label>
              <input id="duration" type="number" min={1} max={maxDuration} value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value))} />
            </div>
            <div className="field">
              <label htmlFor="caption">Caption</label>
              <input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="One line that frames the idea" />
            </div>
          </div>

          <h2>3. Attach the video</h2>
          <label
            htmlFor="video"
            className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const dropped = e.dataTransfer.files?.[0]; if (dropped) setFile(dropped); }}
          >
            {previewUrl && <video className={styles.preview} src={previewUrl} muted playsInline />}
            <div className={styles.dropContent}>
              <span className={styles.dropIcon}><PlayIcon width={24} height={24} aria-hidden /></span>
              <strong>{file ? "Choose a different video" : "Drop a video here"}</strong>
              <span>{file ? "Your local preview is ready." : "or tap to browse your device"}</span>
            </div>
            <input className={styles.hiddenInput} id="video" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file && <div className={styles.fileMeta}><strong>{file.name}</strong><span>{fileSize(file.size)} · {file.type || "video"}</span></div>}

          {error && !submission && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="btn-block" disabled={busy}>{busy ? "Submitting…" : "Submit entry"}</button>
        </form>

        <aside className={`card ${styles.guideCard}`}>
          <span className="page-eyebrow">Before upload</span>
          <h2>Keep the judging clean.</h2>
          <ul className={styles.guideList}>
            <li className={styles.guideItem}><span className={styles.guideIcon}><FilmIcon width={16} height={16} aria-hidden /></span><div><strong>{maxDuration ? `${maxDuration} seconds maximum` : "Match the requested length"}</strong><span>The system checks duration before the entry advances.</span></div></li>
            <li className={styles.guideItem}><span className={styles.guideIcon}><CheckIcon width={16} height={16} aria-hidden /></span><div><strong>Follow every required criterion</strong><span>Missing required elements can auto-eliminate the entry.</span></div></li>
            <li className={styles.guideItem}><span className={styles.guideIcon}><VoteCheckIcon width={16} height={16} aria-hidden /></span><div><strong>Your identity stays hidden</strong><span>Voters judge the work before they see who made it.</span></div></li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
