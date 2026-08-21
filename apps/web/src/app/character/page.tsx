"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { CharacterProfile } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/Avatar";
import { Notice } from "@/components/Notice";
import { CardSkeletonList } from "@/components/Skeleton";
import { CheckIcon, RefreshIcon, UserIcon } from "@/components/icons";
import styles from "./character.module.css";

const PRESETS: Array<{ value: CharacterProfile["preset"]; name: string; description: string }> = [
  { value: "parrot", name: "Parrot", description: "Bright, social and unmistakably Perokio." },
  { value: "street", name: "Street signal", description: "Bold energy for creators in motion." },
  { value: "studio", name: "Studio light", description: "Clean, composed and brand-ready." },
  { value: "night", name: "Night mode", description: "Quiet confidence with a darker edge." },
];

const PALETTES: Array<{ value: CharacterProfile["palette"]; name: string; colors: string[] }> = [
  { value: "tropical", name: "Tropical", colors: ["#c8ff2e", "#00c6c9", "#ffb900"] },
  { value: "coral", name: "Coral pulse", colors: ["#ff6f61", "#ffb900", "#16213a"] },
  { value: "midnight", name: "Midnight", colors: ["#16213a", "#6e7dff", "#c8ff2e"] },
  { value: "sand", name: "Warm sand", colors: ["#f2d2a2", "#e98a63", "#16213a"] },
];

export default function CharacterPage() {
  const { user, loading } = useAuth();
  const [character, setCharacter] = useState<CharacterProfile | null>(null);
  const [preset, setPreset] = useState<CharacterProfile["preset"]>("parrot");
  const [palette, setPalette] = useState<CharacterProfile["palette"]>("tropical");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<CharacterProfile>("/users/me/character").then((profile) => {
      setCharacter(profile);
      setPreset(profile.preset);
      setPalette(profile.palette);
    }).catch(() => setError("Your character settings couldn’t be loaded."));
  }, [user]);

  const activeProfile = character ?? { preset, palette, updatedAt: null };
  const avatarCacheBust = character?.updatedAt ?? user?.updatedAt;
  const presetLabel = useMemo(() => PRESETS.find((item) => item.value === preset)?.name ?? "Parrot", [preset]);

  async function saveCharacter() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await api.patch<CharacterProfile>("/users/me/character", { preset, palette });
      await api.post("/users/me/avatar/generate");
      setCharacter(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your character couldn’t be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <CardSkeletonList count={3} />;
  if (!user) return <Notice tone="warning" title="Log in to create your character">Your public character is part of your creator profile.</Notice>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className="page-eyebrow">Creator identity</span>
          <h1>Make your character yours.</h1>
          <p>Choose a visual direction for your public profile, discovery cards and shareable results.</p>
        </div>
        <Link href="/me" className="secondary">Back to profile</Link>
      </header>

      {error && <Notice tone="danger" title="Character needs attention">{error}</Notice>}
      {saved && <Notice tone="success" title="Character saved">Your new identity is ready across Perokio.</Notice>}

      <section className={`card ${styles.preview}`} style={{ ["--character-accent" as string]: palette === "coral" ? "#ff6f61" : palette === "midnight" ? "#6e7dff" : palette === "sand" ? "#e98a63" : "#c8ff2e" }}>
        <div className={styles.previewGlow} />
        <div className={styles.previewIdentity}>
          <div className={styles.avatarFrame}><Avatar userId={user.id} size={128} tier={user.tier} cacheBust={avatarCacheBust} /></div>
          <div><span className="page-eyebrow">Current direction</span><h2>{presetLabel}</h2><p>{user.displayName ?? "Your creator profile"}</p></div>
        </div>
        <div className={styles.previewMeta}><span><UserIcon width={16} height={16} aria-hidden /> Public profile identity</span><span>Preset: {activeProfile.preset}</span></div>
      </section>

      <section className={styles.section} aria-labelledby="preset-title">
        <div className={styles.sectionHeader}><div><span className="page-eyebrow">01 · Character</span><h2 id="preset-title">Choose your presence</h2></div><span className="badge badge-accent">Saved to profile</span></div>
        <div className={styles.presetGrid}>
          {PRESETS.map((item) => (
            <button key={item.value} type="button" className={`${styles.preset} ${preset === item.value ? styles.selected : ""}`} onClick={() => setPreset(item.value)} aria-pressed={preset === item.value}>
              <span className={`${styles.presetOrb} ${styles[item.value]}`}><span /></span>
              <span className={styles.presetCopy}><strong>{item.name}</strong><span>{item.description}</span></span>
              {preset === item.value && <CheckIcon className={styles.check} width={18} height={18} aria-hidden />}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="palette-title">
        <div className={styles.sectionHeader}><div><span className="page-eyebrow">02 · Palette</span><h2 id="palette-title">Set your signal</h2></div><span className="muted">Perokio-safe colors only</span></div>
        <div className={styles.paletteGrid}>
          {PALETTES.map((item) => (
            <button key={item.value} type="button" className={`${styles.palette} ${palette === item.value ? styles.selected : ""}`} onClick={() => setPalette(item.value)} aria-pressed={palette === item.value}>
              <span className={styles.swatches}>{item.colors.map((color) => <span key={color} style={{ background: color }} />)}</span>
              <strong>{item.name}</strong>
              {palette === item.value && <CheckIcon className={styles.check} width={17} height={17} aria-hidden />}
            </button>
          ))}
        </div>
      </section>

      <footer className={styles.footer}><p>Character choices change your visual presence only. They never affect voting, ranking, payouts or verification.</p><button onClick={() => void saveCharacter()} disabled={busy}>{busy ? <><RefreshIcon width={17} height={17} aria-hidden />Saving…</> : <><CheckIcon width={17} height={17} aria-hidden />Save character</>}</button></footer>
    </div>
  );
}
