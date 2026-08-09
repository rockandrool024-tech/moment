"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import {
  AdminChallengeDetail,
  Challenge,
  Dispute,
  DisputeStatus,
  GrowthDashboard,
  StuckRound,
  User,
} from "@/lib/types";
import { formatCents } from "@/lib/format";

type Tab = "challenges" | "rounds" | "kyb" | "disputes" | "growth";

// Not linked from NavBar on purpose — reached directly at /admin. Every
// request here still goes through AdminGuard server-side (phone allowlist);
// this page assumes nothing about who can see it and just surfaces a 403
// cleanly if the visitor isn't on the list.
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("challenges");
  const [forbidden, setForbidden] = useState(false);

  if (forbidden) {
    return (
      <div>
        <h1>Admin</h1>
        <p className="error">You don&rsquo;t have admin access.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Admin</h1>
      <div className="nav" style={{ border: "none", padding: 0, marginBottom: "1rem", flexWrap: "wrap" }}>
        {(["challenges", "rounds", "kyb", "disputes", "growth"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "" : "secondary"} onClick={() => setTab(t)}>
            {t === "kyb" ? "KYB queue" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "challenges" && <ChallengesTab onForbidden={() => setForbidden(true)} />}
      {tab === "rounds" && <StuckRoundsTab onForbidden={() => setForbidden(true)} />}
      {tab === "kyb" && <KybTab onForbidden={() => setForbidden(true)} />}
      {tab === "disputes" && <DisputesTab onForbidden={() => setForbidden(true)} />}
      {tab === "growth" && <GrowthTab onForbidden={() => setForbidden(true)} />}
    </div>
  );
}

function useForbiddenCatch(onForbidden: () => void) {
  return (err: unknown) => {
    if (err instanceof ApiError && err.status === 403) onForbidden();
  };
}

function ChallengesTab({ onForbidden }: { onForbidden: () => void }) {
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [detail, setDetail] = useState<AdminChallengeDetail | null>(null);
  const catchForbidden = useForbiddenCatch(onForbidden);

  useEffect(() => {
    api.get<Challenge[]>("/admin/challenges").then(setChallenges).catch(catchForbidden);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openDetail(id: string) {
    setDetail(await api.get<AdminChallengeDetail>(`/admin/challenges/${id}`));
  }

  async function eliminate(submissionId: string) {
    await api.post(`/admin/submissions/${submissionId}/eliminate`);
    if (detail) setDetail(await api.get<AdminChallengeDetail>(`/admin/challenges/${detail.id}`));
  }

  if (detail) {
    return (
      <div>
        <button className="secondary" onClick={() => setDetail(null)} style={{ marginBottom: "1rem" }}>
          ← Back to list
        </button>
        <h2>{detail.title}</h2>
        <p>
          <span className="badge">{detail.status}</span> · {formatCents(detail.prizePool)} pool
        </p>

        <h3>Rounds</h3>
        {detail.rounds.map((r) => (
          <p key={r.id} className="muted">
            Round {r.roundNumber} — {r.type} <span className="badge">{r.status}</span>
          </p>
        ))}

        <h3>Submissions ({detail.submissions.length})</h3>
        {detail.submissions.map((s) => (
          <div key={s.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              {s.id.slice(0, 8)} — {s.phase} <span className="badge">{s.status}</span>
            </span>
            {s.status !== "eliminated" && (
              <button className="secondary" onClick={() => eliminate(s.id)}>
                Eliminate
              </button>
            )}
          </div>
        ))}

        <h3>Payouts ({detail.payouts.length})</h3>
        {detail.payouts.map((p) => (
          <p key={p.id} className="muted">
            {formatCents(p.amount)} — {p.type} <span className="badge">{p.status}</span>
          </p>
        ))}
      </div>
    );
  }

  return (
    <div>
      {challenges === null && <p className="muted">Loading…</p>}
      {challenges?.map((c) => (
        <div key={c.id} className="card" style={{ cursor: "pointer" }} onClick={() => openDetail(c.id)}>
          {c.title} <span className="badge">{c.status}</span>{" "}
          <span className="muted">{formatCents(c.prizePool)}</span>
        </div>
      ))}
    </div>
  );
}

function StuckRoundsTab({ onForbidden }: { onForbidden: () => void }) {
  const [rounds, setRounds] = useState<StuckRound[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const catchForbidden = useForbiddenCatch(onForbidden);

  function load() {
    api.get<StuckRound[]>("/admin/rounds/stuck").then(setRounds).catch(catchForbidden);
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function forceReveal(id: string) {
    setBusy(id);
    try {
      await api.post(`/admin/rounds/${id}/force-reveal`);
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p className="muted">
        Rounds past their own close/reveal deadline but not yet revealed — usually a missed job
        after a Redis blip, not a design flaw.
      </p>
      {rounds === null && <p className="muted">Loading…</p>}
      {rounds?.length === 0 && <p className="muted">Nothing stuck right now.</p>}
      {rounds?.map((r) => (
        <div key={r.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {r.challenge.title} — round {r.roundNumber} <span className="badge">{r.status}</span>
          </span>
          <button onClick={() => forceReveal(r.id)} disabled={busy === r.id}>
            {busy === r.id ? "Revealing…" : "Force reveal"}
          </button>
        </div>
      ))}
    </div>
  );
}

function KybTab({ onForbidden }: { onForbidden: () => void }) {
  const [queue, setQueue] = useState<User[] | null>(null);
  const catchForbidden = useForbiddenCatch(onForbidden);

  function load() {
    api.get<User[]>("/admin/kyb-queue").then(setQueue).catch(catchForbidden);
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function decide(id: string, approve: boolean) {
    await api.post(`/admin/users/${id}/kyb-${approve ? "approve" : "reject"}`);
    load();
  }

  return (
    <div>
      {queue === null && <p className="muted">Loading…</p>}
      {queue?.length === 0 && <p className="muted">No pending KYB requests.</p>}
      {queue?.map((u) => (
        <div key={u.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {u.displayName ?? u.phone} <span className="muted">requested {u.kybRequestedAt}</span>
          </span>
          <span style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => decide(u.id, true)}>Approve</button>
            <button className="secondary" onClick={() => decide(u.id, false)}>
              Reject
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

function DisputesTab({ onForbidden }: { onForbidden: () => void }) {
  const [disputes, setDisputes] = useState<Dispute[] | null>(null);
  const [filter, setFilter] = useState<DisputeStatus>("open");
  const [resolutionDraft, setResolutionDraft] = useState<Record<string, string>>({});
  const catchForbidden = useForbiddenCatch(onForbidden);

  function load() {
    api.get<Dispute[]>(`/admin/disputes?status=${filter}`).then(setDisputes).catch(catchForbidden);
  }

  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function resolve(id: string, status: "upheld" | "denied") {
    const resolution = resolutionDraft[id]?.trim();
    if (!resolution) return;
    await api.patch(`/admin/disputes/${id}`, { status, resolution });
    load();
  }

  return (
    <div>
      <div className="nav" style={{ border: "none", padding: 0, marginBottom: "1rem" }}>
        {(["open", "upheld", "denied"] as DisputeStatus[]).map((s) => (
          <button key={s} className={filter === s ? "" : "secondary"} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>
      {disputes === null && <p className="muted">Loading…</p>}
      {disputes?.length === 0 && <p className="muted">No {filter} disputes.</p>}
      {disputes?.map((d) => (
        <div key={d.id} className="card">
          <p style={{ marginTop: 0 }}>
            Submission {d.submission.id.slice(0, 8)} <span className="badge">{d.submission.status}</span>
          </p>
          <p className="muted">{d.reason}</p>
          {d.status === "open" ? (
            <>
              <input
                placeholder="Resolution note"
                value={resolutionDraft[d.id] ?? ""}
                onChange={(e) => setResolutionDraft({ ...resolutionDraft, [d.id]: e.target.value })}
                style={{ width: "100%", marginBottom: "0.5rem" }}
              />
              <span style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => resolve(d.id, "upheld")}>Uphold (reinstate)</button>
                <button className="secondary" onClick={() => resolve(d.id, "denied")}>
                  Deny
                </button>
              </span>
            </>
          ) : (
            <p className="muted">
              <strong>{d.status}</strong>: {d.resolution}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function GrowthTab({ onForbidden }: { onForbidden: () => void }) {
  const [dashboard, setDashboard] = useState<GrowthDashboard | null>(null);
  const catchForbidden = useForbiddenCatch(onForbidden);

  useEffect(() => {
    api.get<GrowthDashboard>("/admin/growth-dashboard").then(setDashboard).catch(catchForbidden);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!dashboard) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="card">
        <p>Vote-deck completion rate: <strong>{(dashboard.voteDeckCompletionRate * 100).toFixed(0)}%</strong></p>
        <p>Avg entries per campaign: <strong>{dashboard.avgEntriesPerCampaign.toFixed(1)}</strong></p>
        <p>Brand repeat rate: <strong>{(dashboard.brandRepeatRate * 100).toFixed(0)}%</strong></p>
        <p>
          Avg time to first payout:{" "}
          <strong>
            {dashboard.avgTimeToFirstPayoutHours !== null
              ? `${dashboard.avgTimeToFirstPayoutHours.toFixed(1)}h`
              : "n/a yet"}
          </strong>
        </p>
        <p>Rally k-proxy: <strong>{dashboard.rallyKProxy.toFixed(2)}</strong></p>
        <p className="muted">D1/D7/D30 retention: {dashboard.retentionD1D7D30}</p>
      </div>
    </div>
  );
}
