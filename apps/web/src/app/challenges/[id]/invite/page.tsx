"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, DiscoveryCreator } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { tierLabel } from "@/lib/tier";

export default function InviteCreatorsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [creators, setCreators] = useState<DiscoveryCreator[]>([]);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, list] = await Promise.all([
        api.get<Challenge>(`/challenges/${id}`),
        api.get<DiscoveryCreator[]>("/public/discovery/creators"),
      ]);
      setChallenge(c);
      setCreators(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(creatorId: string) {
    setError(null);
    setBusyId(creatorId);
    try {
      await api.post(`/challenges/${id}/invite`, { creatorId });
      setInvitedIds((prev) => new Set(prev).add(creatorId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || loading) return <p className="muted">Loading…</p>;

  const isOwner = user && challenge && user.id === challenge.sellerId;

  if (!challenge) return <p className="muted">Challenge not found.</p>;
  if (!isOwner) return <p className="muted">Only the owning seller can invite creators.</p>;

  return (
    <div>
      <h1>Invite creators</h1>
      <p className="muted">
        Invite a creator to enter <strong>{challenge.title}</strong>. They&apos;ll get a
        notification pointing them at your challenge.
      </p>

      {error && <p className="error">{error}</p>}

      {creators.length === 0 && <p className="muted">No creators found in the discovery feed yet.</p>}

      {creators.map((c) => {
        const invited = invitedIds.has(c.id);
        return (
          <div key={c.id} className="card">
            <p style={{ margin: 0 }}>
              <strong>{c.displayName ?? "Unnamed creator"}</strong>{" "}
              <span className="badge">{tierLabel(c.tier)}</span>
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              {c.wins} win{c.wins === 1 ? "" : "s"} · referral code {c.referralCode}
            </p>
            <button
              className="secondary"
              onClick={() => invite(c.id)}
              disabled={invited || busyId === c.id}
            >
              {invited ? "Invited ✓" : busyId === c.id ? "Inviting…" : "Invite"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
