import { redirect, notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";

// Stable personal rally link (growth-viral-mechanics.md §2: "moment.app/v/momo24")
// — always points at whatever battle this creator currently has live.
export default async function RallyRedirectPage({ params }: { params: { code: string } }) {
  let challengeId: string;
  try {
    const resolved = await api.get<{ creatorId: string; challengeId: string }>(
      `/rally/${params.code}/resolve`,
    );
    challengeId = resolved.challengeId;
  } catch (err) {
    // next/navigation's redirect() throws internally too — it must never be
    // called from inside this catch block, or its control-flow signal would
    // be swallowed right here instead of reaching Next's router.
    if (err instanceof ApiError) notFound();
    throw err;
  }

  redirect(`/battle/${challengeId}?rally=${params.code}`);
}
