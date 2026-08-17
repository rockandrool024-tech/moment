"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Avatar } from "@/components/Avatar";
import { BellIcon, CompassIcon, FilmIcon, PinIcon, PlayIcon, WalletIcon } from "@/components/icons";
import styles from "./Sidebar.module.css";

const UNREAD_POLL_MS = 60_000;

function SidebarLink({
  href,
  active,
  icon,
  badge,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${styles.link} ${active ? styles.active : ""}`}>
      <span className={styles.icon}>{icon}</span>
      {children}
      {!!badge && <span className={styles.badge}>{badge > 9 ? "9+" : badge}</span>}
    </Link>
  );
}

// Desktop counterpart to NavBar's horizontal bar — same links, same data
// (unread count, active route), vertical layout with room for labels and a
// persistent user footer instead of squeezing everything into one row.
// Hidden below 768px via CSS (Sidebar.module.css), where NavBar takes over.
export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  useEffect(() => {
    if (!user) return;
    const poll = () => api.get<{ count: number }>("/notifications/unread-count").then((r) => setUnreadCount(r.count));
    poll();
    const interval = setInterval(poll, UNREAD_POLL_MS);
    return () => clearInterval(interval);
  }, [user, pathname]);

  return (
    <aside className={styles.sidebar}>
      <Link href="/challenges" className={`wordmark ${styles.wordmark}`}>
        PEROKIO
      </Link>

      <nav className={styles.links}>
        <SidebarLink href="/challenges" active={isActive("/challenges")} icon={<PlayIcon width={18} height={18} aria-hidden />}>
          Challenges
        </SidebarLink>
        <SidebarLink href="/stories" active={isActive("/stories")} icon={<PinIcon width={18} height={18} aria-hidden />}>
          Stories
        </SidebarLink>
        <SidebarLink href="/feed" active={isActive("/feed")} icon={<FilmIcon width={18} height={18} aria-hidden />}>
          Watch
        </SidebarLink>
        <SidebarLink href="/map" active={isActive("/map")} icon={<CompassIcon width={18} height={18} aria-hidden />}>
          Map
        </SidebarLink>
        <SidebarLink href="/discovery" active={isActive("/discovery")} icon={<PinIcon width={18} height={18} aria-hidden />}>
          Discover
        </SidebarLink>
        {user && (
          <SidebarLink href="/wallet" active={isActive("/wallet")} icon={<WalletIcon width={18} height={18} aria-hidden />}>
            Wallet
          </SidebarLink>
        )}
        {user && (
          <SidebarLink
            href="/notifications"
            active={isActive("/notifications")}
            icon={<BellIcon width={18} height={18} aria-hidden />}
            badge={unreadCount}
          >
            Notifications
          </SidebarLink>
        )}
      </nav>

      <span className={styles.spacer} />

      <div className={styles.footer}>
        {user ? (
          <>
            <Link href="/me" className={styles.userRow} style={{ textDecoration: "none", color: "inherit" }}>
              <Avatar userId={user.id} size={32} tier={user.tier} />
              <span className={styles.userName}>{user.displayName ?? "Me"}</span>
            </Link>
            <button
              className="secondary"
              style={{ width: "100%" }}
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <Link href="/login" className="btn" style={{ display: "block", textAlign: "center" }}>
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
}
