"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { MapNearbyResponse, MapPin } from "@/lib/types";
import { avatarUrl } from "@/lib/avatar";
import { CompassIcon, PinIcon } from "@/components/icons";
import styles from "./map.module.css";

const TIER_COLORS = ["#c9834b", "#b9c2c9", "#e6b93c", "#7ee0c9"]; // bronze, silver, gold, platinum
const CHALLENGE_COLOR = "#ff6f91";

function pinColor(pin: MapPin): string {
  return pin.kind === "challenge" ? CHALLENGE_COLOR : TIER_COLORS[pin.tier] ?? TIER_COLORS[0];
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}

export default function MapPage() {
  const [pins, setPins] = useState<MapPin[] | null>(null);
  const [selected, setSelected] = useState<MapPin | null>(null);
  const [tilt, setTilt] = useState({ rz: 0 });
  const sceneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.get<MapNearbyResponse>("/public/map/nearby").then((r) => setPins(r.pins));
  }, []);

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  function onScenePointerMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    setTilt({ rz: px * 6 });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1>live map</h1>
          <p className={styles.caption}>
            Who&rsquo;s active right now — laid out for feel, not GPS. MOMENT doesn&rsquo;t track
            real location.
          </p>
        </div>
        <button
          type="button"
          className={styles.compass}
          onClick={() => setTilt({ rz: 0 })}
          aria-label="Re-center the map"
        >
          <CompassIcon width={18} height={18} />
        </button>
      </div>

      <div
        className={styles.scene}
        ref={sceneRef}
        onMouseMove={onScenePointerMove}
        onMouseLeave={() => setTilt({ rz: 0 })}
      >
        <div
          className={styles.groundPlane}
          style={{ transform: `rotateX(58deg) rotateZ(${tilt.rz}deg)` }}
        >
          {pins?.map((p) => {
            const size = 22 + p.heightScale * 10;
            const height = 22 + p.heightScale * 46;
            return (
              <div
                key={`plot-${p.id}`}
                className={styles.plot}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: size,
                  height,
                  background: `linear-gradient(180deg, ${pinColor(p)}cc, ${pinColor(p)}55)`,
                }}
              />
            );
          })}
        </div>

        <div className={styles.pinLayer}>
          {pins?.map((p) => {
            const lift = 34 + p.heightScale * 46;
            return (
              <button
                key={`pin-${p.id}`}
                type="button"
                className={styles.pin}
                style={{ left: `${p.x}%`, top: `calc(${p.y}% - ${lift}px)`, ["--pin-color" as string]: pinColor(p) }}
                onClick={() => setSelected(p)}
              >
                <span className={styles.ring}>
                  {p.kind === "creator" ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- external, API-served avatar */
                    <img
                      src={avatarUrl(p.id)}
                      alt=""
                      width={30}
                      height={30}
                      style={{ borderRadius: "50%", border: "2px solid #0c0f0a" }}
                    />
                  ) : (
                    <span className={styles.avatarDot}>
                      <PinIcon width={15} height={15} />
                    </span>
                  )}
                </span>
                <span className={styles.pinLabel}>{p.displayName ?? initials(p.displayName)}</span>
              </button>
            );
          })}
        </div>

        {pins?.length === 0 && (
          <p style={{ position: "relative", zIndex: 3, textAlign: "center", marginTop: "2rem", color: "#8a9280" }}>
            Nothing active yet — check back once a challenge opens.
          </p>
        )}
      </div>

      <div className={styles.legend}>
        {["Bronze", "Silver", "Gold", "Platinum"].map((label, i) => (
          <span key={label}>
            <span className={styles.legendDot} style={{ background: TIER_COLORS[i] }} />
            {label}
          </span>
        ))}
        <span>
          <span className={styles.legendDot} style={{ background: CHALLENGE_COLOR }} />
          Live challenge
        </span>
      </div>

      <nav className={styles.bottomNav}>
        <Link href="/challenges" className={styles.navPill}>
          Challenges
        </Link>
        <span className={`${styles.navPill} ${styles.navPillActive}`}>Map</span>
        <Link href="/discovery" className={styles.navPill}>
          Discover
        </Link>
      </nav>

      {selected && (
        <div className={styles.sheet} role="dialog" aria-label={selected.displayName ?? "Pin details"}>
          <div className={styles.sheetHead}>
            {selected.kind === "creator" ? (
              /* eslint-disable-next-line @next/next/no-img-element -- external, API-served avatar */
              <img
                src={avatarUrl(selected.id)}
                alt=""
                width={42}
                height={42}
                style={{ borderRadius: "50%" }}
              />
            ) : (
              <span className={styles.sheetAvatar} style={{ ["--pin-color" as string]: pinColor(selected) }}>
                <PinIcon width={20} height={20} />
              </span>
            )}
            <div>
              <p className={styles.sheetName}>{selected.displayName ?? "Unnamed"}</p>
              <p className={styles.sheetMeta}>
                {selected.kind === "creator" ? `${["Bronze", "Silver", "Gold", "Platinum"][selected.tier]} · ` : ""}
                {selected.meta}
              </p>
            </div>
            <button type="button" className={styles.sheetClose} onClick={() => setSelected(null)} aria-label="Close">
              ✕
            </button>
          </div>
          {selected.kind === "creator" && selected.referralCode && (
            <Link href={`/v/${selected.referralCode}`} className={styles.sheetCta}>
              View {selected.displayName ?? "profile"}
            </Link>
          )}
          {selected.kind === "challenge" && (
            <Link href="/discovery" className={styles.sheetCta}>
              See their live challenges
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
