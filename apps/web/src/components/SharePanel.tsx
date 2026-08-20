"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/icons";
import styles from "./SharePanel.module.css";

interface SharePanelProps {
  href: string;
  title: string;
  message: string;
  eyebrow?: string;
  label?: string;
}

export function SharePanel({ href, title, message, eyebrow = "Turn this moment into momentum", label = "Share" }: SharePanelProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function share() {
    const url = typeof window === "undefined" ? href : new URL(href, window.location.origin).toString();
    const shareData = { title, text: message, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        setStatus("copied");
        return;
      }
      await navigator.clipboard.writeText(`${message}\n${url}`);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className={`card ${styles.panel}`} aria-live="polite">
      <div className={styles.copy}>
        <span className="page-eyebrow">{eyebrow}</span>
        <strong>{message}</strong>
        <span className={styles.hint}>Your link opens this exact story, battle or result — not a generic homepage.</span>
      </div>
      <button type="button" className="btn" onClick={() => void share()}>
        {status === "copied" ? <CheckIcon width={17} height={17} aria-hidden /> : <ShareIcon width={17} height={17} aria-hidden />}
        {status === "copied" ? "Link ready" : status === "error" ? "Try again" : label}
      </button>
    </section>
  );
}
