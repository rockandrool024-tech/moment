"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="nav">
      <Link href="/challenges">MOMENT</Link>
      <Link href="/challenges">Challenges</Link>
      <Link href="/discovery">Discover</Link>
      {user && <Link href="/wallet">Wallet</Link>}
      {user && <Link href="/me">Me</Link>}
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
