"use client";

import React, { useEffect, useState } from "react";
import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  startTime: string; // ISO string
  endTime: string; // ISO string (T+24h)
  onComplete?: () => void;
}

export function ProgressBar({ startTime, endTime, onComplete }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      const elapsed = now - start;
      const total = end - start;
      const remaining = Math.max(0, end - now);

      const progressPercent = Math.min((elapsed / total) * 100, 100);
      setProgress(progressPercent);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setProgress(100);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime, onComplete]);

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  return (
    <div className={styles.container}>
      <div className={styles.barContainer}>
        <div className={styles.bar} style={{ width: `${progress}%` }}></div>
      </div>
      <p className={styles.text}>
        {progress < 100
          ? `${progress.toFixed(0)}% | ${hours}h ${minutes}m remaining`
          : "Payout complete"}
      </p>
    </div>
  );
}
