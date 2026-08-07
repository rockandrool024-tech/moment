"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";

type Step = "phone" | "code";

// useSearchParams() opts the tree into client-side rendering and requires a
// Suspense boundary above it during static export (Next.js's own rule) —
// this wrapper is that boundary; LoginForm below has the actual logic.
export default function LoginPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<UserRole>("creator");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { loginWithToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/challenges";

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/otp/request", { phone });
      setStep("code");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { accessToken } = await api.post<{ accessToken: string }>("/auth/otp/verify", {
        phone,
        code,
        role,
      });
      await loginWithToken(accessToken);
      router.push(returnTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Log in</h1>
      <p className="muted">Phone-OTP verification, per ADR-001 — no passwords.</p>

      {step === "phone" && (
        <form onSubmit={requestOtp}>
          <div className="field">
            <label htmlFor="phone">Phone (E.164, e.g. +15551234567)</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15551234567"
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={busy}>
            Send code
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyOtp}>
          <p className="muted">Code sent to {phone}.</p>
          <div className="field">
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="role">I am a… (only matters on first login)</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="creator">Creator</option>
              <option value="seller">Brand / seller</option>
              <option value="both">Both</option>
            </select>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={busy}>
            Verify &amp; log in
          </button>{" "}
          <button type="button" className="secondary" onClick={() => setStep("phone")}>
            Back
          </button>
        </form>
      )}
    </div>
  );
}
