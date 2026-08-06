"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function MePage() {
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        <p>Phone: {user.phone}</p>
        <p>Role: {user.role}</p>
        <p>Phone verified: {user.phoneVerifiedAt ? "yes" : "no"}</p>
        <p>Tier: {user.tier}</p>
        <p>Taste score: {user.tasteScore}</p>
        <p>Referral code: {user.referralCode}</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Payouts</h2>
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
