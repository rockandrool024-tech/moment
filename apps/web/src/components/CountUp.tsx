"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  format?: (n: number) => string;
  durationMs?: number;
}

// Animates from 0 to `value` on mount/value-change using requestAnimationFrame
// with an ease-out curve — the "satisfying stat reveal" pattern for StatCard
// numbers (wallet balance, streak count, taste score). Respects
// prefers-reduced-motion by jumping straight to the final value.
export function CountUp({ value, format = (n) => String(Math.round(n)), durationMs = 900 }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    let raf: number;
    startRef.current = null;
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <>{format(display)}</>;
}
