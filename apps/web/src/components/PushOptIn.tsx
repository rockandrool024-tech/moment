"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import {
  getExistingPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import { BellIcon } from "@/components/icons";

interface PushSubscriptionJSONBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function isIosSafariNotInstalled(): boolean {
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
  return isIos && !isStandalone;
}

// Opt-in control for real Web Push (VAPID) — lives on /notifications next to
// the mark-all-read bar. iOS Safari can't do web push until the app is
// installed as a PWA (Home Screen), so that case gets its own message
// instead of a button that would just silently fail.
export function PushOptIn() {
  const [supported, setSupported] = useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isPushSupported());
    setIosNeedsInstall(isIosSafariNotInstalled());
    getExistingPushSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const sub = await subscribeToPush();
      const json = sub.toJSON() as PushSubscriptionJSONBody;
      await api.post("/notifications/push-subscriptions", {
        endpoint: json.endpoint,
        keys: json.keys,
        userAgent: navigator.userAgent,
      });
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const sub = await getExistingPushSubscription();
      if (sub) {
        await api.delete("/notifications/push-subscriptions", { endpoint: sub.endpoint });
        await unsubscribeFromPush(sub);
      }
      setSubscribed(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null;

  if (iosNeedsInstall) {
    return (
      <p className="muted" style={{ marginBottom: "1rem" }}>
        <BellIcon width={14} height={14} aria-hidden style={{ verticalAlign: "-2px" }} /> Add Perokio to
        your Home Screen to enable push notifications on iPhone/iPad.
      </p>
    );
  }

  if (!supported) return null;

  return (
    <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <button className="secondary" onClick={subscribed ? disable : enable} disabled={busy}>
        <BellIcon width={14} height={14} aria-hidden style={{ verticalAlign: "-2px" }} />{" "}
        {busy ? "Working…" : subscribed ? "Turn off push notifications" : "Enable push notifications"}
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
