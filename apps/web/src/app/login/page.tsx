"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import { FilmIcon, PinIcon, UserIcon, VerifiedIcon } from "@/components/icons";
import { BrandMark } from "@/components/BrandMark";
import styles from "./login.module.css";

type Step = "phone" | "code";

const roles: Array<{ value: UserRole; title: string; description: string; icon: React.ReactNode }> = [
  { value: "creator", title: "Creator", description: "Compete, build momentum and get paid.", icon: <UserIcon width={20} height={20} aria-hidden /> },
  { value: "seller", title: "Brand", description: "Launch briefs and discover original work.", icon: <FilmIcon width={20} height={20} aria-hidden /> },
  { value: "both", title: "Both", description: "Create, compete and run campaigns.", icon: <PinIcon width={20} height={20} aria-hidden /> },
];

export default function LoginPage() {
  return <Suspense fallback={<div className={styles.loader}><BrandMark /></div>}><LoginForm /></Suspense>;
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
  const referralCode = searchParams.get("ref") || undefined;

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/otp/request", { phone });
      setStep("code");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn’t send a code. Check the number and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { accessToken } = await api.post<{ accessToken: string }>("/auth/otp/verify", { phone, code, role, referralCode });
      await loginWithToken(accessToken);
      router.push(returnTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That code didn’t work. Request a new one and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel} aria-hidden>
        <Link href="/" className="wordmark" aria-label="Perokio home"><BrandMark /></Link>
        <div className={styles.brandCopy}>
          <h2>Where stories become opportunities.</h2>
          <p>Create work people want to watch, share and remember. Build a track record through fair briefs, blind voting and real opportunities.</p>
        </div>
        <div className={styles.brandStat}><strong>$84K</strong><span>paid to creators this month</span></div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formWrap}>
          <div className={styles.topbar}>
            <Link href="/" className="wordmark" aria-label="Perokio home"><BrandMark /></Link>
            <div className={styles.progress} aria-label={`Step ${step === "phone" ? 1 : 2} of 2`}>
              <span className={`${styles.progressDot} ${styles.progressDotActive}`} />
              <span className={`${styles.progressDot} ${step === "code" ? styles.progressDotActive : ""}`} />
            </div>
          </div>

          <h1 className={styles.title}>{step === "phone" ? "Start your story." : "Check your phone."}</h1>
          <p className={styles.subtitle}>{step === "phone" ? "Choose how you’ll use Perokio, then sign in without a password." : `We sent a one-time code to ${phone}.`}</p>

          <div className={styles.trust}>
            <VerifiedIcon width={18} height={18} aria-hidden />
            <span>Your number verifies one person per vote. It is never shown on your public profile.</span>
          </div>

          {step === "phone" && referralCode && <p className={styles.invite}>You arrived through a member invite. We’ll connect the referral after verification.</p>}

          {step === "phone" ? (
            <form onSubmit={requestOtp}>
              <span className={styles.roleLabel}>I’m joining as</span>
              <div className={styles.roles}>
                {roles.map((item) => (
                  <div className={styles.roleOption} key={item.value}>
                    <input className={styles.roleInput} type="radio" name="role" id={`role-${item.value}`} value={item.value} checked={role === item.value} onChange={() => setRole(item.value)} />
                    <label className={styles.roleCard} htmlFor={`role-${item.value}`}>
                      <span className={styles.roleIcon}>{item.icon}</span>
                      <span><strong>{item.title}</strong><span>{item.description}</span></span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="field">
                <label htmlFor="phone">Mobile number</label>
                <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" required />
              </div>
              {error && <p className="error" role="alert">{error}</p>}
              <button type="submit" className="btn-block" disabled={busy}>{busy ? "Sending code…" : "Start your story"}</button>
            </form>
          ) : (
            <form onSubmit={verifyOtp}>
              <p className={styles.codeMeta}>Enter the six-digit code. It may take a few seconds to arrive.</p>
              <div className="field">
                <label htmlFor="code">Verification code</label>
                <input className={styles.codeInput} id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required autoFocus />
              </div>
              {error && <p className="error" role="alert">{error}</p>}
              <div className={styles.actions}>
                <button type="submit" className="btn-block" disabled={busy || code.length < 4}>{busy ? "Verifying…" : "Verify and continue"}</button>
                <button type="button" className="secondary btn-block" onClick={() => { setStep("phone"); setCode(""); setError(null); }}>Use another number</button>
              </div>
            </form>
          )}
          <p className={styles.legal}>By continuing, you agree to receive a one-time verification message. Standard messaging rates may apply.</p>
        </div>
      </main>
    </div>
  );
}
