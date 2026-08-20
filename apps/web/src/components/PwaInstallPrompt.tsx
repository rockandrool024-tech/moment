"use client";

import { useEffect, useState } from "react";
import styles from "./PwaInstallPrompt.module.css";

const VISIT_COUNT_KEY = "moment.visitCount";
const DISMISSED_KEY = "moment.installDismissed";
const MIN_VISITS_BEFORE_PROMPT = 2;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Custom install banner, not the browser's own delayed default prompt — per
// the growth-mechanics feedback, triggered after a real 2nd visit (tracked
// in localStorage) rather than on first load, so it doesn't compete with
// getting a brand-new visitor through the actual core loop.
export function PwaInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failing shouldn't break the app — PWA install is a
        // progressive enhancement, not a requirement to use Perokio.
      });
    }

    const count = Number(window.localStorage.getItem(VISIT_COUNT_KEY) ?? "0") + 1;
    window.localStorage.setItem(VISIT_COUNT_KEY, String(count));
    setEligible(count >= MIN_VISITS_BEFORE_PROMPT && !window.localStorage.getItem(DISMISSED_KEY));

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!deferredEvent || !eligible || !visible) return null;

  async function install() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    if (outcome === "dismissed") window.localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  return (
    <div className={`card card-elevated sheet-rise ${styles.prompt}`} role="dialog" aria-label="Install Perokio">
      <div className={styles.copy}>
        <strong>Keep Perokio close</strong>
        <span>Install the app for faster votes, results and payouts.</span>
      </div>
      <div className={styles.actions}>
        <button onClick={install}>Install</button>
        <button className="secondary" onClick={dismiss}>Not now</button>
      </div>
    </div>
  );
}
