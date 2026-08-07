import { API_URL } from "./api-client";

/** Always resolvable — the API serves a deterministic placeholder identicon
 * until a real AI-generated image exists (see avatar-generator.ts). */
export function avatarUrl(userId: string, cacheBust?: string): string {
  const base = `${API_URL}/users/${userId}/avatar.png`;
  return cacheBust ? `${base}?v=${encodeURIComponent(cacheBust)}` : base;
}
