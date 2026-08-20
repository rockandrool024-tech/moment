"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Avatar } from "@/components/Avatar";
import { BrandMark } from "@/components/BrandMark";
import { BellIcon } from "@/components/icons";
import styles from "./NavBar.module.css";

const UNREAD_POLL_MS = 60_000;

export function NavBar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const poll = () => {
      api.get<{ count: number }>("/notifications/unread-count").then((r) => setUnreadCount(r.count)).catch(() => undefined);
    };
    poll();
    const interval = setInterval(poll, UNREAD_POLL_MS);
    return () => clearInterval(interval);
  }, [user, pathname]);

  const notificationsActive = pathname === "/notifications";

  return (
    <nav className="nav" aria-label="Mobile header">
      <Link href="/challenges" className="wordmark" aria-label="Perokio home"><BrandMark compact /></Link>
      <span className="spacer" />
      {user ? (
        <>
          <Link
            href="/notifications"
            className={`${styles.iconLink} ${notificationsActive ? "active" : ""}`}
            aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
          >
            <BellIcon width={20} height={20} aria-hidden />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </Link>
          <Link href="/me" className={styles.avatarLink} aria-label="Profile">
            <Avatar userId={user.id} size={30} tier={user.tier} />
          </Link>
        </>
      ) : (
        <Link href="/login" className={styles.loginLink}>Log in</Link>
      )}
    </nav>
  );
}
