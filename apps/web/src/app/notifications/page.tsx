"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Notification } from "@/lib/types";
import { BellIcon, FlameIcon, PinIcon, RallyIcon, RefreshIcon, ShareIcon, TierCrownIcon, VoteCheckIcon, WalletIcon } from "@/components/icons";
import { PushOptIn } from "@/components/PushOptIn";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import { CardSkeletonList } from "@/components/Skeleton";
import styles from "./notifications.module.css";

const PAYOUT_ICON: Record<string, { Icon: typeof WalletIcon; color: string }> = {
  winner: { Icon: TierCrownIcon, color: "var(--tier-2)" },
  stipend: { Icon: WalletIcon, color: "var(--accent)" },
  survivor_bonus: { Icon: WalletIcon, color: "var(--tier-0)" },
  crowd_favourite: { Icon: RallyIcon, color: "var(--rally)" },
  referral_bonus: { Icon: ShareIcon, color: "var(--tier-3)" },
};

function notificationIcon(notification: Notification): { Icon: typeof WalletIcon; color: string } {
  if (notification.type === "payout") {
    const payoutType = typeof notification.data?.payoutType === "string" ? notification.data.payoutType : undefined;
    return (payoutType && PAYOUT_ICON[payoutType]) || { Icon: WalletIcon, color: "var(--muted)" };
  }
  if (notification.type === "challenge_invite") return { Icon: PinIcon, color: "var(--accent)" };
  if (notification.type === "round_result") return { Icon: VoteCheckIcon, color: "var(--info)" };
  if (notification.type === "streak") return { Icon: FlameIcon, color: "var(--warning)" };
  return { Icon: BellIcon, color: "var(--muted)" };
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [error, setError] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    setNotifications(null);
    setError(false);
    api.get<Notification[]>("/notifications").then(setNotifications).catch(() => { setNotifications([]); setError(true); });
  }, [requestKey]);

  async function markRead(id: string) {
    setNotifications((previous) => previous ? previous.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item) : previous);
    try { await api.post(`/notifications/${id}/read`); } catch { setRequestKey((key) => key + 1); }
  }

  async function markAllRead() {
    setNotifications((previous) => previous ? previous.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) : previous);
    try { await api.post("/notifications/read-all"); } catch { setRequestKey((key) => key + 1); }
  }

  const unreadCount = notifications?.filter((item) => !item.readAt).length ?? 0;
  const today = notifications?.filter((item) => Date.now() - new Date(item.createdAt).getTime() < 86_400_000) ?? [];
  const earlier = notifications?.filter((item) => Date.now() - new Date(item.createdAt).getTime() >= 86_400_000) ?? [];

  function renderGroup(items: Notification[], label: string) {
    if (!items.length) return null;
    return (
      <section>
        <h2 className={styles.groupLabel}>{label}</h2>
        <div className={styles.list}>
          {items.map((notification) => {
            const { Icon, color } = notificationIcon(notification);
            const unread = !notification.readAt;
            return (
              <article
                className={`card card-enter ${styles.item} ${unread ? styles.unread : ""}`}
                key={notification.id}
                onClick={() => unread && void markRead(notification.id)}
                onKeyDown={(event) => { if (unread && (event.key === "Enter" || event.key === " ")) void markRead(notification.id); }}
                tabIndex={unread ? 0 : undefined}
                role={unread ? "button" : undefined}
              >
                <span className={styles.icon} style={{ ["--icon-color" as string]: color }}><Icon width={19} height={19} aria-hidden /></span>
                <div className={styles.copy}><p className={styles.title}>{notification.title}</p><p className={styles.body}>{notification.body}</p><div className={styles.time}>{timeAgo(notification.createdAt)}</div></div>
                {unread && <span className={styles.unreadDot} aria-label="Unread" />}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div>
      <PageHeader eyebrow={unreadCount ? `${unreadCount} unread` : "You’re caught up"} title="Notifications" description="Round updates, payouts, invites and account activity appear here." actions={unreadCount > 0 ? <button className="secondary" onClick={() => void markAllRead()}>Mark all read</button> : undefined} />
      <div className={styles.push}><PushOptIn /></div>
      {error && <Notice tone="danger" title="Notifications couldn’t refresh" action={<button className="secondary" onClick={() => setRequestKey((key) => key + 1)}><RefreshIcon width={15} height={15} aria-hidden />Retry</button>}>Your previous notifications may still be available after reconnecting.</Notice>}
      {notifications === null && <CardSkeletonList count={4} />}
      {notifications?.length === 0 && !error && <EmptyState icon={<BellIcon width={30} height={30} aria-hidden />} title="Nothing needs your attention" body="Round results, payouts and creator invites appear here when they happen." action={{ label: "Browse live challenges", href: "/challenges" }} />}
      {notifications && <>{renderGroup(today, "Today")}{renderGroup(earlier, "Earlier")}</>}
    </div>
  );
}
