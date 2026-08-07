"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { RallyStats, StreakSummary, User } from "@/lib/types";
import { tierBadgeStyle, tierLabel } from "@/lib/tier";
import { Avatar } from "@/components/Avatar";
import { FlameIcon, RallyIcon, ShareIcon, WalletIcon } from "@/components/icons";

export default function MePage() {
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [rallyStats, setRallyStats] = useState<RallyStats | null>(null);
  const [streak, setStreak] = useState<StreakSummary | null>(null);
  const [copied, setCopied] = useState(false);

  async function regenerateAvatar() {
    setAvatarBusy(true);
    try {
      const updated = await api.post<User>("/users/me/avatar/generate");
      setAvatarVersion(Number(new Date(updated.updatedAt)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setAvatarBusy(false);
    }
  }

  useEffect(() => {
    if (user) {
      api.get<RallyStats>("/users/me/rally-stats").then(setRallyStats);
      api.get<StreakSummary>("/users/me/streak").then(setStreak);
    }
  }, [user]);

  function copyRallyLink() {
    if (!user) return;
    const link = `${window.location.origin}/v/${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function startStripeOnboarding() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.post<{ url: string }>("/users/me/stripe-connect-onboarding");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!user) return <p className="muted">Not logged in.</p>;

  return (
    <div>
      <h1>My profile</h1>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
          <Avatar
            userId={user.id}
            size={72}
            tier={user.tier}
            cacheBust={avatarVersion ? String(avatarVersion) : user.updatedAt}
          />
          <div>
            <button className="secondary" onClick={regenerateAvatar} disabled={avatarBusy}>
              {avatarBusy ? "Generating…" : "Generate new avatar"}
            </button>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              AI-generated placeholder — this is your consistent reference image across MOMENT.
            </p>
          </div>
        </div>
        <p>Phone: {user.phone}</p>
        <p>Role: {user.role}</p>
        <p>Phone verified: {user.phoneVerifiedAt ? "yes" : "no"}</p>
        <p>
          Tier:{" "}
          <span className="badge badge-tier" style={tierBadgeStyle(user.tier) as React.CSSProperties}>
            {tierLabel(user.tier)}
          </span>
        </p>
        <p>Taste score: {user.tasteScore}</p>
        <p>Referral code: {user.referralCode}</p>
        {streak && (
          <p style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {streak.streakPausedReason ? (
              <>
                <FlameIcon width={16} height={16} style={{ color: "var(--muted)" }} aria-hidden />
                {streak.streakCount}-day streak paused — no eligible content to vote on yet,
                it&rsquo;ll resume on your next vote
              </>
            ) : streak.streakCount > 0 ? (
              <>
                <FlameIcon width={16} height={16} style={{ color: "var(--tier-0)" }} aria-hidden />
                {streak.streakCount}-day voting streak
              </>
            ) : (
              <span className="muted">Vote today to start a streak</span>
            )}
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <RallyIcon width={18} height={18} aria-hidden /> Your rally link
        </h2>
        <p className="muted">
          Share this — it always points at whatever battle you currently have live. Votes that
          arrive through it earn you rally XP and count toward crowd favourite; they never
          decide the prize (two-currency split, ADR-005).
        </p>
        <p>
          <code>/v/{user.referralCode}</code>{" "}
          <button className="secondary" onClick={copyRallyLink}>
            <ShareIcon width={14} height={14} aria-hidden style={{ verticalAlign: "-2px" }} />{" "}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </p>
        {rallyStats && (
          <p>
            <strong>{rallyStats.totalVoters}</strong> voters recruited ·{" "}
            <strong>{rallyStats.rallyXp}</strong> rally XP
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <WalletIcon width={18} height={18} aria-hidden /> Payouts
        </h2>
        {user.stripeConnectAccountId ? (
          <p>Stripe Connect account linked ✓</p>
        ) : (
          <>
            <p className="muted">
              Link a Stripe Express account to receive payouts (prize/stipend transfers).
            </p>
            <button onClick={startStripeOnboarding} disabled={busy}>
              Set up payouts
            </button>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
