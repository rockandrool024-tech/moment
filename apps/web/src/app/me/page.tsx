"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { JourneyMilestone, RallyStats, ReferralStats, StreakSummary, User } from "@/lib/types";
import { tierBadgeStyle, tierLabel } from "@/lib/tier";
import { formatCents } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { JourneyStepper } from "@/components/JourneyStepper";
import { SharePanel } from "@/components/SharePanel";
import { Sheet } from "@/components/Sheet";
import { Notice } from "@/components/Notice";
import { CardSkeletonList } from "@/components/Skeleton";
import { CheckIcon, FlameIcon, RallyIcon, ShareIcon, TierCrownIcon, WalletIcon } from "@/components/icons";
import styles from "./me.module.css";

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

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<RallyStats>("/users/me/rally-stats").then(setRallyStats),
      api.get<StreakSummary>("/users/me/streak").then(setStreak),
      api.get<ReferralStats>("/users/me/referrals").then(setReferralStats),
      api.get<JourneyMilestone[]>("/users/me/journey").then(setJourney),
    ]).catch(() => setError("Some progress data couldn’t refresh. Your profile is still available."));
    setDisplayNameDraft(user.displayName ?? "");
    setLocationDraft(user.location ?? "");
  }, [user]);

  async function regenerateAvatar() {
    setAvatarBusy(true);
    setError(null);
    try {
      const updated = await api.post<User>("/users/me/avatar/generate");
      setAvatarVersion(Number(new Date(updated.updatedAt)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "A new avatar couldn’t be generated.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function saveProfile() {
    setProfileBusy(true);
    setError(null);
    try {
      await api.patch<User>("/users/me", { displayName: displayNameDraft.trim() || undefined, location: locationDraft.trim() || undefined });
      await refresh();
      setEditingProfile(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your profile couldn’t be saved.");
    } finally {
      setProfileBusy(false);
    }
  }

  function copyRallyLink() {
    if (!user) return;
    navigator.clipboard.writeText(`${window.location.origin}/v/${user.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyReferralLink() {
    if (!user) return;
    navigator.clipboard.writeText(`${window.location.origin}/r/${user.referralCode}`);
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
      setError(err instanceof ApiError ? err.message : "Payout setup couldn’t start.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <CardSkeletonList count={4} />;
  if (!user) return <Notice tone="warning" title="Log in to view your profile">Your public progress and payout setup live here after verification.</Notice>;

  const streakCount = streak?.streakCount ?? user.streakCount;

  return (
    <div>
      {error && <Notice tone="danger" title="Profile needs attention" action={<button className="ghost" onClick={() => setError(null)}>Dismiss</button>}>{error}</Notice>}

      <section className={`card ${styles.hero}`}>
        <div className={styles.identity}>
          <Avatar userId={user.id} size={82} tier={user.tier} cacheBust={avatarVersion ? String(avatarVersion) : user.updatedAt} />
          <div className={styles.identityCopy}>
            <span className="page-eyebrow">Creator profile</span>
            <h1>{user.displayName ?? "Name your creator profile"}</h1>
            <p>{user.location ?? "Add your city"} · {user.role === "both" ? "Creator + brand" : user.role}</p>
            <span className="badge badge-tier" style={tierBadgeStyle(user.tier) as React.CSSProperties}><TierCrownIcon width={14} height={14} aria-hidden />{tierLabel(user.tier)}</span>
          </div>
        </div>
        <div className={styles.actions}>
          <button className="secondary" onClick={() => setEditingProfile(true)}>Edit profile</button>
          <button className="ghost" onClick={() => void regenerateAvatar()} disabled={avatarBusy}>{avatarBusy ? "Generating…" : "Refresh avatar"}</button>
        </div>
      </section>

      <section className={styles.stats} aria-label="Creator statistics">
        <div className={`card ${styles.stat}`}><span className={styles.statIcon}><WalletIcon width={20} height={20} aria-hidden /></span><strong>{formatCents(user.lifetimeEarnings)}</strong><span>Lifetime earnings</span></div>
        <div className={`card ${styles.stat}`}><span className={styles.statIcon}><TierCrownIcon width={20} height={20} aria-hidden /></span><strong>{user.tasteScore}</strong><span>Taste score</span></div>
        <div className={`card ${styles.stat}`}><span className={`${styles.statIcon} ${streak?.streakPausedReason ? styles.streakPaused : styles.streakLive}`}><FlameIcon width={20} height={20} aria-hidden /></span><strong>{streakCount}</strong><span>{streak?.streakPausedReason ? "Streak paused" : "Voting streak"}</span></div>
        <div className={`card ${styles.stat}`}><span className={styles.statIcon}><RallyIcon width={20} height={20} aria-hidden /></span><strong>{rallyStats?.rallyXp ?? user.rallyXp}</strong><span>Rally XP</span></div>
      </section>

      <SharePanel
        href={`/v/${user.referralCode}`}
        title={`${user.displayName ?? "A Perokio creator"} is building momentum`}
        message={`Follow ${user.displayName ?? "this creator"}'s Perokio journey`}
        label="Share your journey"
      />

      <div className={styles.grid}>
        <section className={`card ${styles.card}`}>
          <span className="page-eyebrow">Audience momentum</span>
          <h2>Your rally link</h2>
          <p className="muted">It always points to your current battle. Supporters can help the crowd-favourite score, but never decide the main prize.</p>
          <div className={styles.shareCode}><code>/v/{user.referralCode}</code><button className="secondary" onClick={copyRallyLink}><ShareIcon width={14} height={14} aria-hidden />{copied ? "Copied" : "Copy"}</button></div>
          <div className={styles.shareStats}>
            <div className={styles.shareStat}><strong>{rallyStats?.totalVoters ?? 0}</strong><span>Voters recruited</span></div>
            <div className={styles.shareStat}><strong>{rallyStats?.rallyXp ?? user.rallyXp}</strong><span>Rally XP</span></div>
          </div>
        </section>

        <section className={`card ${styles.card}`}>
          <span className="page-eyebrow">Invite loop</span>
          <h2>Bring a creator in.</h2>
          <p className="muted">Earn $5 after someone you invite completes their first eligible vote or entry.</p>
          <div className={styles.shareCode}><code>/r/{user.referralCode}</code><button className="secondary" onClick={copyReferralLink}><ShareIcon width={14} height={14} aria-hidden />{refCopied ? "Copied" : "Copy"}</button></div>
          <div className={styles.shareStats}>
            <div className={styles.shareStat}><strong>{referralStats?.totalReferred ?? 0}</strong><span>People referred</span></div>
            <div className={styles.shareStat}><strong>{formatCents(referralStats?.totalRewardedCents ?? 0)}</strong><span>Referral earnings</span></div>
          </div>
        </section>

        {journey && (
          <section className={`card ${styles.card}`}>
            <span className="page-eyebrow">Progress</span>
            <h2>Your journey</h2>
            <JourneyStepper milestones={journey} />
          </section>
        )}

        <section className={`card ${styles.card}`}>
          <span className="page-eyebrow">Account readiness</span>
          <h2>Verification and payouts</h2>
          <div className={styles.settings}>
            <div className={styles.settingRow}><div className={styles.settingCopy}><strong>Phone verification</strong><span>{user.phone} · used to protect one-person-one-vote</span></div><span className="badge badge-accent"><CheckIcon width={13} height={13} aria-hidden />Verified</span></div>
            <div className={styles.settingRow}><div className={styles.settingCopy}><strong>Creator payouts</strong><span>{user.stripeConnectAccountId ? "Ready to receive prize and stipend transfers" : "Required before money can be transferred"}</span></div>{user.stripeConnectAccountId ? <span className="badge badge-accent">Connected</span> : <button onClick={() => void startStripeOnboarding()} disabled={busy}>{busy ? "Opening…" : "Set up"}</button>}</div>
          </div>
        </section>
      </div>

      {editingProfile && (
        <Sheet title="Edit public profile" onClose={() => setEditingProfile(false)} footer={<div className={styles.editActions}><button className="secondary" onClick={() => setEditingProfile(false)} disabled={profileBusy}>Cancel</button><button onClick={() => void saveProfile()} disabled={profileBusy}>{profileBusy ? "Saving…" : "Save profile"}</button></div>}>
          <div className="field"><label htmlFor="displayName">Display name</label><input id="displayName" value={displayNameDraft} onChange={(event) => setDisplayNameDraft(event.target.value)} maxLength={60} placeholder="Your creator name" /></div>
          <div className="field"><label htmlFor="location">Location</label><input id="location" value={locationDraft} onChange={(event) => setLocationDraft(event.target.value)} maxLength={80} placeholder="Brooklyn, NY" /></div>
          <p className="muted">Only your display name, avatar, city and competition stats appear publicly.</p>
        </Sheet>
      )}
    </div>
  );
}
