"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { BellIcon, FilmIcon } from "@/components/icons";

const UNREAD_POLL_MS = 60_000;

// Mobile-only top bar (hidden at 768px+, where Sidebar takes over — see
// globals.css). Slimmed down to branding + notifications + auth: the
// primary nav links this used to carry live in BottomNav now, so a
// creator's thumb never has to reach the top of a phone screen for them.
export function NavBar() {
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
    <nav className="nav">
      <Link href="/challenges" className="wordmark">
        PEROKIO
      </Link>
      <span className="spacer" />
      <Link
        href="/feed"
        className={isActive("/feed") ? "active" : undefined}
        style={{ display: "inline-flex", alignItems: "center" }}
        aria-label="Watch"
      >
        <FilmIcon width={18} height={18} aria-hidden />
      </Link>
      {user && (
        <Link
          href="/notifications"
          className={isActive("/notifications") ? "active" : undefined}
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          <span style={{ position: "relative", display: "inline-flex" }}>
            <BellIcon width={18} height={18} aria-hidden />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -6,
                  minWidth: 14,
                  height: 14,
                  borderRadius: 999,
                  background: "var(--rally)",
                  color: "#fff",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 2px",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
        </Link>
      )}
      {user ? (
        <button
          className="secondary"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          Log out
        </button>
      ) : (
        <Link href="/login">Log in</Link>
      )}
    </nav>
  );
}
