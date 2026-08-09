import { redirect } from "next/navigation";

// Referral loop 3 — distinct from /v/[code] (which requires the creator to
// have a currently-live battle to redirect to). This one always works,
// since a winner sharing their code post-payout may have no active
// submission at all; the code itself is only validated at signup time
// (auth.controller.ts), not here.
export default function ReferralRedirectPage({ params }: { params: { code: string } }) {
  redirect(`/login?ref=${encodeURIComponent(params.code)}`);
}
