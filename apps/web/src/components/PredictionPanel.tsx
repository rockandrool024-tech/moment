"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Notice } from "@/components/Notice";
import styles from "./PredictionPanel.module.css";

type PredictionData = {
  roundId: string;
  challengeTitle: string;
  status: string;
  closesAt: string;
  canPredict: boolean;
  isEntrant: boolean;
  options: Array<{ id: string; creatorId: string }>;
  prediction: { id: string; submissionId: string; correct: boolean | null; createdAt: string } | null;
};

export function PredictionPanel({ roundId }: { roundId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<PredictionData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<PredictionData>(`/rounds/${roundId}/predictions`).then(setData).catch((err) => {
      setError(err instanceof ApiError ? err.message : "Predictions could not be loaded.");
    });
  }, [roundId, user]);

  async function predict(submissionId: string) {
    setBusy(true);
    setError(null);
    try {
      const saved = await api.post<PredictionData["prediction"]>(`/rounds/${roundId}/predictions`, { submissionId });
      setData((current) => current ? { ...current, canPredict: false, prediction: saved } : current);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your prediction could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;
  if (error) return <Notice tone="danger" title="Predictions unavailable">{error}</Notice>;
  if (!data || data.options.length < 2 || data.isEntrant) return null;

  return (
    <section className={`card ${styles.panel}`} aria-labelledby="prediction-title">
      <div className={styles.header}>
        <div>
          <span className="page-eyebrow">Spectator participation</span>
          <h2 id="prediction-title">Make your call</h2>
          <p className="muted">Predict who survives the final. Your prediction is separate from the blind quality vote.</p>
        </div>
        <span className={styles.clock}>Closes {new Date(data.closesAt).toLocaleDateString()}</span>
      </div>

      {data.prediction ? (
        <Notice tone={data.prediction.correct === null ? "info" : data.prediction.correct ? "success" : "warning"} title={data.prediction.correct === null ? "Prediction locked" : data.prediction.correct ? "Prediction correct" : "Prediction missed"}>
          Your prediction is recorded. The result will be scored when the round closes.
        </Notice>
      ) : (
        <div className={styles.options}>
          {data.options.map((option, index) => (
            <button key={option.id} className={styles.option} type="button" disabled={!data.canPredict || busy} onClick={() => void predict(option.id)}>
              <span className={styles.number}>{index + 1}</span>
              <span>Finalist {index + 1}</span>
              <span className={styles.arrow} aria-hidden>→</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
