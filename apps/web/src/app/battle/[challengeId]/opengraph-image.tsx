import { ImageResponse } from "next/og";
import { api } from "@/lib/api-client";
import { PublicChallengeSummary } from "@/lib/types";
import { formatCents } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Next's file-convention OG image — auto-wired into this route's <meta>
// tags, no manual reference needed. This IS the share card a battle-page
// link unfurls as (ADR-002: "treat the two as one feature, not two").
export default async function Image({ params }: { params: { challengeId: string } }) {
  const summary = await api.get<PublicChallengeSummary>(`/public/challenges/${params.challengeId}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0f1a14",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 32, color: "#7fd9a6", display: "flex" }}>MOMENT · LIVE BATTLE</div>
        <div style={{ fontSize: 90, fontWeight: 700, marginTop: 20, display: "flex" }}>
          {formatCents(summary.prizePool)}
        </div>
        <div style={{ fontSize: 44, marginTop: 10, display: "flex" }}>{summary.title}</div>
        <div style={{ fontSize: 28, color: "#9fb3a8", marginTop: 30, display: "flex" }}>
          {summary.status.replace("_", " ")} — watch free, vote with a verified account
        </div>
      </div>
    ),
    { ...size },
  );
}
