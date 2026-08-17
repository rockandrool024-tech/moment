"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { JourneyMilestone, RallyStats, ReferralStats, StreakSummary, User } from "@/lib/types";
import { tierBadgeStyle, tierColorVar, tierLabel } from "@/lib/tier";
import { formatCents } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { JourneyStepper } from "@/components/JourneyStepper";
import { FlameIcon, RallyIcon, ShareIcon, TierCrownIcon, WalletIcon } from "@/components/icons";

export default function MePage() {
  const { user, loading, refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [rallyStats, setRallyStats] = useState<RallyStats | null>(null);
  const [streak, setStreak] = useState<StreakSummary | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [journey, setJourney] = useState<JourneyMilestone[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

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
      api.get<ReferralStats>("/users/me/referrals").then(setReferralStats);
      api.get<JourneyMilestone[]>("/users/me/journey").then(setJourney);
      setDisplayNameDraft(user.displayName ?? "");
      setLocationDraft(user.location ?? "");
    }
  }, [user]);

  async function saveProfile() {
    setProfileBusy(true);
    setError(null);
    try {
      await api.patch<User>("/users/me", {
        displayName: displayNameDraft.trim() || undefined,
        location: locationDraft.trim() || undefined,
      });
      await refresh();
      setEditingProfile(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your profile");
    } finally {
      setProfileBusy(false);
    }
  }

  function copyRallyLink() {
    if (!user) return;
    const link = `${window.location.origin}/v/${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyReferralLink() {
    if (!user) return;
    const link = `${window.location.origin}/r/${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
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
              Generated placeholder — your consistent reference image across Perokio until you add
              a real one.
            </p>
          </div>
        </div>
        {editingProfile ? (
          <div style={{ marginBottom: "0.75rem" }}>
            <div className="field">
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                value={displayNameDraft}
                onChange={(e) => setDisplayNameDraft(e.target.value)}
                maxLength={60}
                placeholder="Your name"
              />
            </div>
            <div className="field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                value={locationDraft}
                onChange={(e) => setLocationDraft(e.target.value)}
                maxLength={80}
                placeholder="Brooklyn, NY"
              />
            </div>
            <button onClick={saveProfile} disabled={profileBusy}>
              {profileBusy ? "Saving…" : "Save"}
            </button>{" "}
            <button className="secondary" onClick={() => setEditingProfile(false)} disabled={profileBusy}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            {user.displayName && <h2 style={{ margin: "0 0 0.5rem" }}>{user.displayName}</h2>}
            {user.location && <p className="muted" style={{ margin: "0 0 0.5rem" }}>{user.location}</p>}
            <button className="secondary" onClick={() => setEditingProfile(true)}>
              Edit profile
            </button>
          </>
        )}
        <p>Phone: {user.phone}</p>
        <p>Role: {user.role}</p>
        <p>Phone verified: {user.phoneVerifiedAt ? "yes" : "no"}</p>
        <p style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          Tier:
          <TierCrownIcon
            width={16}
            height={16}
            style={{ color: tierColorVar(user.tier) }}
            aria-hidden
          />
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

      {journey && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Your journey</h2>
          <JourneyStepper milestones={journey} />
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <RallyIcon width={18} height={18} aria-hidden /> Invite friends
        </h2>
        <p className="muted">
          Different from your rally link above — this one&rsquo;s for inviting new people to
          Perokio itself. You earn $5 the first time someone you invite submits an entry or casts
          a vote.
        </p>
        <p>
          <code>/r/{user.referralCode}</code>{" "}
          <button className="secondary" onClick={copyReferralLink}>
            <ShareIcon width={14} height={14} aria-hidden style={{ verticalAlign: "-2px" }} />{" "}
            {refCopied ? "Copied!" : "Copy link"}
          </button>
        </p>
        {referralStats && (
          <p>
            <strong>{referralStats.totalReferred}</strong> people referred ·{" "}
            <strong>{formatCents(referralStats.totalRewardedCents)}</strong> earned
            {referralStats.pendingCount > 0 && (
              <span className="muted"> · {referralStats.pendingCount} pending</span>
            )}
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
