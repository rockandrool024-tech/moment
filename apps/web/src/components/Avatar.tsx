import { avatarUrl } from "@/lib/avatar";
import { tierColorVar } from "@/lib/tier";
import styles from "./Avatar.module.css";

interface AvatarProps {
  userId: string;
  size?: number;
  /** Wraps a pulsing tier-colored presence ring (the /map pin treatment).
   * Pass the creator's tier to enable it; omit for non-creators. */
  tier?: number;
  cacheBust?: string;
}

export function Avatar({ userId, size = 40, tier, cacheBust }: AvatarProps) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- external, API-served avatar
    <img
      src={avatarUrl(userId, cacheBust)}
      alt=""
      width={size}
      height={size}
      className={styles.img}
    />
  );

  if (tier === undefined) return img;

  return (
    <span
      className={styles.wrap}
      style={{ ["--ring-color" as string]: tierColorVar(tier) }}
    >
      {img}
    </span>
  );
}
