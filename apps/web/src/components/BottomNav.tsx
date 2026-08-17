"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/Avatar";
import { CompassIcon, PinIcon, PlayIcon, WalletIcon } from "@/components/icons";
import styles from "./BottomNav.module.css";

// The five-screen core loop (Challenges/Map/Discover/Wallet/Me) as a fixed
// thumb-reach tab bar — mobile-only (Sidebar.module.css hides it at 768px+
// the opposite direction). Stories stays reachable from the top bar/
// Challenges rather than crowding a sixth item into limited thumb space.
export function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <>
      <div className={styles.spacer} aria-hidden />
      <nav className={styles.nav} aria-label="Primary">
        <Link href="/challenges" className={`${styles.item} ${isActive("/challenges") ? styles.active : ""}`}>
          <PlayIcon width={20} height={20} aria-hidden />
          Challenges
        </Link>
        <Link href="/map" className={`${styles.item} ${isActive("/map") ? styles.active : ""}`}>
          <CompassIcon width={20} height={20} aria-hidden />
          Map
        </Link>
        <Link href="/discovery" className={`${styles.item} ${isActive("/discovery") ? styles.active : ""}`}>
          <PinIcon width={20} height={20} aria-hidden />
          Discover
        </Link>
        {user && (
          <Link href="/wallet" className={`${styles.item} ${isActive("/wallet") ? styles.active : ""}`}>
            <WalletIcon width={20} height={20} aria-hidden />
            Wallet
          </Link>
        )}
        {user ? (
          <Link href="/me" className={`${styles.item} ${isActive("/me") ? styles.active : ""}`}>
            <span className={`${styles.avatarWrap} ${isActive("/me") ? styles.active : ""}`}>
              <Avatar userId={user.id} size={20} />
            </span>
            Me
          </Link>
        ) : (
          <Link href="/login" className={`${styles.item} ${isActive("/login") ? styles.active : ""}`}>
            <PinIcon width={20} height={20} aria-hidden />
            Log in
          </Link>
        )}
      </nav>
    </>
  );
}
