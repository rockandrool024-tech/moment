"use client";

import { useEffect, useState } from "react";

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
        // progressive enhancement, not a requirement to use MOMENT.
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
    <div
      className="card"
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "1rem",
        right: "1rem",
        maxWidth: 480,
        margin: "0 auto",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
      }}
    >
      <span>Install MOMENT for quicker access to votes and payouts.</span>
      <span style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button onClick={install}>Install</button>
        <button className="secondary" onClick={dismiss}>
          Not now
        </button>
      </span>
    </div>
  );
}
