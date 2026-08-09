import { ImageResponse } from "next/og";
import { api } from "@/lib/api-client";
import { SubmissionWithOutcome } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { outcomeTone, OUTCOME_COPY } from "@/lib/outcome";
import { tierLabel } from "@/lib/tier";
import { avatarUrl } from "@/lib/avatar";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Node runtime, not the edge default — this route fetches the creator's
// avatar from the API at render time, and edge's ~50ms external-fetch
// timeout is tight for that. The avatar route itself is Redis-cached
// (see avatar.controller.ts), so this is a safety margin, not a workaround
// for a slow request.
export const runtime = "nodejs";

const TONE_COLOR: Record<string, string> = {
  winner: "#e8b93f",
  knockout: "#d9695f",
  advanced: "#7fd9a6",
  pending: "#9fb3a8",
};

export default async function Image({ params }: { params: { submissionId: string } }) {
  const submission = await api.get<SubmissionWithOutcome>(`/submissions/${params.submissionId}`);
  const tone = outcomeTone(submission);
  const { headline, tagline } = OUTCOME_COPY[tone];

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
          background: "#111111",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 34, color: TONE_COLOR[tone], fontWeight: 700, display: "flex" }}>
            PEROKIO
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#111111",
              background: "#e8b93f",
              padding: "6px 18px",
              borderRadius: 999,
              fontWeight: 700,
              display: "flex",
            }}
          >
            {tierLabel(submission.creatorTier)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- Satori image tree, not a Next <Image>; decorative in a rendered PNG */}
          <img
            src={avatarUrl(submission.creatorId)}
            width={110}
            height={110}
            alt=""
            style={{ borderRadius: "50%", border: "4px solid " + TONE_COLOR[tone] }}
          />
          <div style={{ fontSize: 88, fontWeight: 800, color: TONE_COLOR[tone], display: "flex" }}>
            {headline}
          </div>
        </div>
        <div style={{ fontSize: 40, marginTop: 16, display: "flex" }}>
          {submission.challenge.title}
        </div>
        <div style={{ fontSize: 28, color: "#c9c9c9", marginTop: 10, display: "flex" }}>
          {tagline} · {formatCents(submission.challenge.prizePool)} pool
        </div>
      </div>
    ),
    { ...size },
  );
}
