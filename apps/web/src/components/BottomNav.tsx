"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/Avatar";
import { CompassIcon, FilmIcon, HomeIcon, PlusIcon, UserIcon } from "@/components/icons";
import styles from "./BottomNav.module.css";

export function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
  const createHref = user?.role === "seller" || user?.role === "both" ? "/stories/new" : "/challenges";

  return (
    <>
      <div className={styles.spacer} aria-hidden />
      <nav className={styles.nav} aria-label="Primary navigation">
        <Link href="/challenges" className={`${styles.item} ${isActive("/challenges") ? styles.active : ""}`}>
          <HomeIcon width={21} height={21} aria-hidden />
          <span>Home</span>
        </Link>
        <Link href="/feed" className={`${styles.item} ${isActive("/feed") ? styles.active : ""}`}>
          <FilmIcon width={21} height={21} aria-hidden />
          <span>Watch</span>
        </Link>
        <Link
          href={createHref}
          className={`${styles.item} ${styles.createItem} ${isActive(createHref) ? styles.active : ""}`}
          aria-label={user?.role === "seller" || user?.role === "both" ? "Create a story" : "Find a challenge to enter"}
        >
          <span className={styles.createIcon}><PlusIcon width={22} height={22} aria-hidden /></span>
          <span>Create</span>
        </Link>
        <Link href="/map" className={`${styles.item} ${isActive("/map") ? styles.active : ""}`}>
          <CompassIcon width={21} height={21} aria-hidden />
          <span>Map</span>
        </Link>
        {user ? (
          <Link href="/me" className={`${styles.item} ${isActive("/me") ? styles.active : ""}`}>
            <span className={styles.avatarWrap}><Avatar userId={user.id} size={22} tier={isActive("/me") ? user.tier : undefined} /></span>
            <span>Profile</span>
          </Link>
        ) : (
          <Link href="/login" className={`${styles.item} ${isActive("/login") ? styles.active : ""}`}>
            <UserIcon width={21} height={21} aria-hidden />
            <span>Profile</span>
          </Link>
        )}
      </nav>
    </>
  );
}
