import { ImageResponse } from "next/og";
import { api } from "@/lib/api-client";
import { SubmissionWithOutcome } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { outcomeTone, OUTCOME_COPY } from "@/lib/outcome";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
        <div style={{ fontSize: 34, color: TONE_COLOR[tone], fontWeight: 700, display: "flex" }}>
          MOMENT
        </div>
        <div
          style={{
            fontSize: 100,
            fontWeight: 800,
            marginTop: 20,
            color: TONE_COLOR[tone],
            display: "flex",
          }}
        >
          {headline}
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
