"use client";

import { useEffect } from "react";
import { setRallyCode } from "@/lib/rally";

/** Silently persists a `?rally=code` query param on first render. Renders nothing. */
export function RallyCapture({ code }: { code?: string }) {
  useEffect(() => {
    if (code) setRallyCode(code);
  }, [code]);

  return null;
}
