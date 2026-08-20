"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Notification } from "@/lib/types";
import {
  BellIcon,
  FlameIcon,
  PinIcon,
  RallyIcon,
  ShareIcon,
  TierCrownIcon,
  VoteCheckIcon,
  WalletIcon,
} from "@/components/icons";
import { PushOptIn } from "@/components/PushOptIn";

// Same payout-type -> color mapping as /wallet's history list, so a payout
// reads the same color whether you see it in the inbox or the wallet.
const PAYOUT_ICON: Record<string, { Icon: typeof WalletIcon; color: string }> = {
  winner: { Icon: TierCrownIcon, color: "var(--tier-2)" },
  stipend: { Icon: WalletIcon, color: "var(--accent)" },
  survivor_bonus: { Icon: WalletIcon, color: "var(--tier-0)" },
  crowd_favourite: { Icon: RallyIcon, color: "var(--rally)" },
  referral_bonus: { Icon: ShareIcon, color: "var(--tier-3)" },
};

// One real icon per notification, replacing what used to be an emoji baked
// into the server-generated title text — keyed off the machine-readable
// `type`/`data.payoutType` fields, not string-matched off the copy.
function notificationIcon(n: Notification): { Icon: typeof WalletIcon; color: string } {
  if (n.type === "payout") {
    const payoutType = typeof n.data?.payoutType === "string" ? n.data.payoutType : undefined;
    return (payoutType && PAYOUT_ICON[payoutType]) || { Icon: WalletIcon, color: "var(--muted)" };
  }
  switch (n.type) {
    case "challenge_invite":
      return { Icon: PinIcon, color: "var(--accent)" };
    case "round_result":
      return { Icon: VoteCheckIcon, color: "var(--info)" };
    case "streak":
      return { Icon: FlameIcon, color: "var(--warning)" };
    default:
      return { Icon: BellIcon, color: "var(--muted)" };
  }
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  useEffect(() => {
    api.get<Notification[]>("/notifications").then(setNotifications);
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev ? prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) : prev,
    );
    await api.post(`/notifications/${id}/read`);
  }

  async function markAllRead() {
    setNotifications((prev) =>
      prev ? prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) : prev,
    );
    await api.post("/notifications/read-all");
  }

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div>
      <div className="nav" style={{ border: "none", padding: 0, marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BellIcon width={22} height={22} aria-hidden /> Notifications
        </h1>
        <span className="spacer" />
        {unreadCount > 0 && (
          <button className="secondary" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <PushOptIn />

      {notifications === null && <p className="muted">Loading…</p>}
      {notifications?.length === 0 && (
        <p className="muted">
          Nothing yet — you&rsquo;ll see round results, payouts, and invites here as they happen.
        </p>
      )}

      {notifications?.map((n) => {
        const { Icon, color } = notificationIcon(n);
        return (
          <div
            key={n.id}
            className={`card card-elevated${!n.readAt ? " card-edged" : ""}`}
            style={{
              ["--edge-color" as string]: "var(--accent)",
              cursor: n.readAt ? "default" : "pointer",
              display: "flex",
              gap: "0.75rem",
            }}
            onClick={() => !n.readAt && markRead(n.id)}
          >
            <span
              style={{
                flexShrink: 0,
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `color-mix(in srgb, ${color} 16%, transparent)`,
                color,
              }}
            >
              <Icon width={18} height={18} aria-hidden />
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: "0 0 0.25rem", fontWeight: n.readAt ? 500 : 700 }}>{n.title}</p>
              <p className="muted" style={{ margin: 0 }}>
                {n.body}
              </p>
              <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.75rem" }}>
                {timeAgo(n.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
