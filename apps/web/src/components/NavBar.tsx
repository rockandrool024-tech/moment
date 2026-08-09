"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Avatar } from "@/components/Avatar";
import { BellIcon, CompassIcon, PinIcon, PlayIcon, WalletIcon } from "@/components/icons";

const UNREAD_POLL_MS = 60_000;

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={active ? "active" : undefined}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
    >
      {children}
    </Link>
  );
}

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
      <Link href="/challenges">PEROKIO</Link>
      <NavLink href="/challenges" active={isActive("/challenges")}>
        <PlayIcon width={16} height={16} aria-hidden />
        Challenges
      </NavLink>
      <NavLink href="/stories" active={isActive("/stories")}>
        Stories
      </NavLink>
      <NavLink href="/map" active={isActive("/map")}>
        <CompassIcon width={16} height={16} aria-hidden />
        Map
      </NavLink>
      <NavLink href="/discovery" active={isActive("/discovery")}>
        <PinIcon width={16} height={16} aria-hidden />
        Discover
      </NavLink>
      {user && (
        <NavLink href="/wallet" active={isActive("/wallet")}>
          <WalletIcon width={16} height={16} aria-hidden />
          Wallet
        </NavLink>
      )}
      {user && (
        <NavLink href="/notifications" active={isActive("/notifications")}>
          <span style={{ position: "relative", display: "inline-flex" }}>
            <BellIcon width={16} height={16} aria-hidden />
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
        </NavLink>
      )}
      {user && (
        <NavLink href="/me" active={isActive("/me")}>
          <Avatar userId={user.id} size={20} />
          Me
        </NavLink>
      )}
      <span className="spacer" />
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
