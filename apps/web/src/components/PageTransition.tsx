"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import styles from "./PageTransition.module.css";

// Keyed by pathname so React remounts this div on every route change,
// which re-triggers the CSS entrance animation — no animation library
// needed for a route-level transition.
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={styles.wrap}>
      {children}
    </div>
  );
}
