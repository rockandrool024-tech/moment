"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { TrustStats } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { tierLabel } from "@/lib/tier";

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
      <div className="muted" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
}

/** Public, screenshot-shareable trust stats — ADR-004's "moat." */
export function TrustStatsMini({ userId, tier }: { userId: string; tier?: number }) {
  const [stats, setStats] = useState<TrustStats | null>(null);

  useEffect(() => {
    api.get<TrustStats>(`/users/${userId}/trust-stats`).then(setStats);
  }, [userId]);

  if (!stats) return <p className="muted">Loading trust stats…</p>;

  return (
    <div>
      {stats.creator && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
          {tier !== undefined && <StatBox label="Tier" value={tierLabel(tier)} />}
          <StatBox label="Wins" value={stats.creator.wins} />
          <StatBox label="Finals rate" value={`${Math.round(stats.creator.finalsRate * 100)}%`} />
          <StatBox
            label="Brand score"
            value={
              stats.creator.brandScore !== null
                ? `${stats.creator.brandScore.toFixed(1)} (${stats.creator.brandScoreCount})`
                : "—"
            }
          />
        </div>
      )}

      {stats.brand && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {stats.brand.isColdStart ? (
            <div style={{ gridColumn: "1 / -1" }} className="muted">
              💰 {formatCents(stats.brand.escrowedCents)} escrowed · first campaign
            </div>
          ) : (
            <>
              <StatBox label="Campaigns" value={stats.brand.campaignsRun} />
              <StatBox label="Total paid" value={formatCents(stats.brand.totalPaidOutCents)} />
              <StatBox
                label="On-time"
                value={
                  stats.brand.onTimePayoutRate !== null
                    ? `${Math.round(stats.brand.onTimePayoutRate * 100)}%`
                    : "—"
                }
              />
              <StatBox
                label="Creator score"
                value={
                  stats.brand.creatorScore !== null
                    ? `${stats.brand.creatorScore.toFixed(1)} (${stats.brand.creatorScoreCount})`
                    : "—"
                }
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
