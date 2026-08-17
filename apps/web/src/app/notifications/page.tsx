"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Notification } from "@/lib/types";
import { BellIcon } from "@/components/icons";
import { PushOptIn } from "@/components/PushOptIn";

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

      {notifications?.map((n) => (
        <div
          key={n.id}
          className={`card card-elevated${!n.readAt ? " card-edged" : ""}`}
          style={{ ["--edge-color" as string]: "var(--accent)", cursor: n.readAt ? "default" : "pointer" }}
          onClick={() => !n.readAt && markRead(n.id)}
        >
          <p style={{ margin: "0 0 0.25rem", fontWeight: n.readAt ? 500 : 700 }}>{n.title}</p>
          <p className="muted" style={{ margin: 0 }}>
            {n.body}
          </p>
          <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.75rem" }}>
            {timeAgo(n.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
