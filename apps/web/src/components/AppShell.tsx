"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { NavBar } from "@/components/NavBar";
import { PageTransition } from "@/components/PageTransition";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { Sidebar } from "@/components/Sidebar";

const BARE_ROUTES = new Set(["/", "/login"]);
const FULL_BLEED_PREFIXES = ["/feed", "/map"];
const FOCUS_PREFIXES = ["/rounds/", "/battle/", "/results/"];

function startsWithOne(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.has(pathname);
  const focus = startsWithOne(pathname, FOCUS_PREFIXES);
  const fullBleed = startsWithOne(pathname, FULL_BLEED_PREFIXES);
  const showChrome = !bare && !focus;

  const mainClassName = [
    "app-main",
    showChrome ? "app-main--with-sidebar" : "app-main--bare",
    fullBleed ? "app-main--full-bleed" : "",
    focus ? "app-main--focus" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {showChrome && <NavBar />}
      {showChrome && <Sidebar />}
      <main className={mainClassName}>
        <PageTransition>{children}</PageTransition>
      </main>
      {showChrome && <BottomNav />}
      {!focus && <PwaInstallPrompt />}
    </>
  );
}
