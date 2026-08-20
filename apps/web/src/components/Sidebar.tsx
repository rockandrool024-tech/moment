"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Avatar } from "@/components/Avatar";
import {
  BellIcon,
  CompassIcon,
  FilmIcon,
  HomeIcon,
  PinIcon,
  SearchIcon,
  WalletIcon,
} from "@/components/icons";
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
    <Link href={href} className={`${styles.link} ${active ? styles.active : ""}`} aria-current={active ? "page" : undefined}>
      <span className={styles.icon}>{icon}</span>
      <span>{children}</span>
      {!!badge && <span className={styles.badge}>{badge > 9 ? "9+" : badge}</span>}
    </Link>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

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

  return (
    <aside className={styles.sidebar}>
      <Link href="/challenges" className={`wordmark ${styles.wordmark}`}>
        PEROKIO
      </Link>
      <p className={styles.tagline}>Create. Compete. Get paid.</p>

      <nav className={styles.links} aria-label="Main navigation">
        <span className={styles.groupLabel}>Explore</span>
        <SidebarLink href="/challenges" active={isActive("/challenges")} icon={<HomeIcon width={19} height={19} aria-hidden />}>
          Home
        </SidebarLink>
        <SidebarLink href="/feed" active={isActive("/feed")} icon={<FilmIcon width={19} height={19} aria-hidden />}>
          Watch
        </SidebarLink>
        <SidebarLink href="/discovery" active={isActive("/discovery")} icon={<SearchIcon width={19} height={19} aria-hidden />}>
          Discover
        </SidebarLink>
        <SidebarLink href="/stories" active={isActive("/stories")} icon={<PinIcon width={19} height={19} aria-hidden />}>
          Stories
        </SidebarLink>
        <SidebarLink href="/map" active={isActive("/map")} icon={<CompassIcon width={19} height={19} aria-hidden />}>
          Map
        </SidebarLink>

        {user && <span className={styles.groupLabel}>Your space</span>}
        {user && (
          <SidebarLink href="/wallet" active={isActive("/wallet")} icon={<WalletIcon width={19} height={19} aria-hidden />}>
            Wallet
          </SidebarLink>
        )}
        {user && (
          <SidebarLink
            href="/notifications"
            active={isActive("/notifications")}
            icon={<BellIcon width={19} height={19} aria-hidden />}
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
            <Link href="/me" className={styles.userRow}>
              <Avatar userId={user.id} size={38} tier={user.tier} />
              <span className={styles.userCopy}>
                <span className={styles.userName}>{user.displayName ?? "Your profile"}</span>
                <span className={styles.userRole}>{user.role === "both" ? "Creator + brand" : user.role}</span>
              </span>
            </Link>
            <button
              className={`ghost ${styles.logout}`}
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <p className={styles.signInCopy}>Join live briefs and vote on the work that wins.</p>
            <Link href="/login" className="btn btn-block">Log in</Link>
          </>
        )}
      </div>
    </aside>
  );
}
