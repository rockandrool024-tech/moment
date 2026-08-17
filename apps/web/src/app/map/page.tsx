"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { MapNearbyResponse, MapPin } from "@/lib/types";
import { avatarUrl } from "@/lib/avatar";
import { tierColorVar } from "@/lib/tier";
import { CompassIcon, PinIcon } from "@/components/icons";
import styles from "./map.module.css";

// A pin for the current viewer's own account, synthesized client-side (see
// buildSelfPin below) rather than returned by /public/map/nearby — that
// endpoint is anonymous and shared-cached across every visitor (ADR-002),
// so per-viewer personalization can't live in its response.
type ViewerPin = MapPin & { isSelf?: boolean };

// Real Mapbox rendering (vector tiles, pan/zoom/rotate, real 3D building
// extrusion) for the *background scene* — but pin placement is plain CSS
// percentage positioning (see .pinLayer below), not mapboxgl.Marker/
// setLngLat. It used to be geo-projected, which under this scene's steep
// 58° pitch reprojected every pin 60-120px above the container (clipped,
// invisible) and forced Mapbox to re-run screen-projection for every marker
// on every camera frame (the map's main lag source). Positions stay
// stylized either way — there's no lat/lng on User, no geocoding, no
// location permission flow (deliberately out of scope, see
// docs/perokio/HANDOFF.md). CENTER/toOrbitTarget below are only a fixed,
// unlabeled anchor for the atmosphere and the profile-orbit camera, never
// surfaced to the user as "your city."
const CENTER: [number, number] = [-73.9857, 40.7484]; // dense-building area, not shown as a place name
const ORBIT_SPREAD = 0.006; // degrees — how far a selected pin's orbit target drifts from CENTER
const CHALLENGE_COLOR = "var(--rally)";
const SELF_COLOR = "var(--info)"; // distinct from every tier color and the rally pink, so "you" never blends in

function pinColor(pin: ViewerPin): string {
  if (pin.isSelf) return SELF_COLOR;
  return pin.kind === "challenge" ? CHALLENGE_COLOR : tierColorVar(pin.tier);
}

// Same hash as the backend's seededUnitFloat (public.service.ts) — mirrored
// here (not fetched) so the viewer's own pin lands in the same stylized
// grid deterministically without needing a personalized, uncached endpoint.
function seededUnitFloat(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10_000) / 10_000;
}

function buildSelfPin(user: { id: string; displayName: string | null; tier: number; referralCode: string }): ViewerPin {
  return {
    id: user.id,
    kind: "creator",
    displayName: user.displayName,
    referralCode: user.referralCode,
    tier: user.tier,
    x: 8 + seededUnitFloat(`${user.id}:x`) * 84,
    y: 12 + seededUnitFloat(`${user.id}:y`) * 68,
    heightScale: 0.5 + (user.tier / 3) * 0.6 + seededUnitFloat(`${user.id}:h`) * 0.2,
    meta: "This is you",
    rank: 0, // not among the ranked top creators — see rankBadge guard below
    count: 0, // no wins to report yet either — honest zero, not omitted
    isSelf: true,
  };
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}

// A stylized lng/lat for a pin, used only as an orbit-camera target when its
// sheet is open — never for placing the pin itself (see comment above).
function orbitTarget(pin: MapPin): [number, number] {
  const offsetLng = ((pin.x - 50) / 50) * ORBIT_SPREAD;
  const offsetLat = ((pin.y - 50) / 50) * ORBIT_SPREAD;
  return [CENTER[0] + offsetLng, CENTER[1] + offsetLat];
}

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapPageInner />
    </Suspense>
  );
}

function MapPageInner() {
  const searchParams = useSearchParams();
  const preselectId = searchParams.get("pin");
  const { user } = useAuth();
  const [serverPins, setServerPins] = useState<MapPin[] | null>(null);
  const [selected, setSelected] = useState<ViewerPin | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  // Set the instant the visitor first touches/drags/scrolls the map —
  // gates the orbit spin loop below so it never fights a real gesture.
  const userInteractedRef = useRef(false);
  // Fires the "welcome" orbit-to-self exactly once per visit, and never if
  // a `?pin=` deep link already claimed the initial selection.
  const autoOrbitedRef = useRef(false);

  // Merge the viewer's own account into the anonymous, shared-cached pin
  // list — either flagging their existing pin (if they're already a top
  // creator/brand) or synthesizing one with buildSelfPin so every logged-in
  // user sees their own mark, not just the top of the leaderboard.
  const pins: ViewerPin[] | null = useMemo(() => {
    if (!serverPins) return null;
    if (!user) return serverPins;
    if (serverPins.some((p) => p.id === user.id)) {
      return serverPins.map((p) => (p.id === user.id ? { ...p, isSelf: true } : p));
    }
    return [...serverPins, buildSelfPin(user)];
  }, [serverPins, user]);

  useEffect(() => {
    api.get<MapNearbyResponse>("/public/map/nearby").then((r) => {
      setServerPins(r.pins);
      // Deep-link from /discovery's "View on map" — pre-opens that pin's
      // sheet instead of making the visitor find it themselves.
      if (preselectId) {
        const match = r.pins.find((p) => p.id === preselectId);
        if (match) setSelected(match);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preselect only on initial load
  }, []);

  // Map initializes once — it's just the 3D atmosphere/background now, pins
  // are a plain React-rendered overlay (see the JSX below), so this effect
  // never needs to touch markers.
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setMapError("Map isn't configured yet — missing NEXT_PUBLIC_MAPBOX_TOKEN.");
      return;
    }
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      // Mapbox's own Standard template, not a hand-tuned dark-v11 — the
      // night look, 3D buildings, and landmark rendering all come from
      // Mapbox's maintained "night" light preset instead of a custom fog +
      // fill-extrusion layer, so this stays in sync with Mapbox's own
      // template rather than drifting from it.
      style: "mapbox://styles/mapbox/standard",
      center: CENTER,
      zoom: 14.6,
      pitch: 58,
      bearing: -17,
      antialias: true,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    // Any of these means a real visitor gesture, not a programmatic
    // easeTo/flyTo — the orbit spin loop below checks this ref and stops
    // itself rather than fighting the drag. Mirrors Mapbox's own
    // spinning-globe example (mousedown + touchstart).
    const stopAutoOrbit = () => {
      userInteractedRef.current = true;
    };
    map.on("mousedown", stopAutoOrbit);
    map.on("touchstart", stopAutoOrbit);
    map.on("wheel", stopAutoOrbit);

    map.on("style.load", () => {
      map.setConfigProperty("basemap", "lightPreset", "night");
    });

    map.on("load", () => {
      mapReadyRef.current = true;
      setMapReady(true);
    });

    map.on("error", (e) => {
      // Mapbox surfaces bad-token / style-load failures this way rather
      // than throwing — catch it so the page shows a message instead of a
      // silently blank tile area.
      setMapError(e.error?.message ?? "The map failed to load.");
    });

    return () => {
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  // Cinematic camera orbit around whichever pin's sheet is open — flies in,
  // then slowly spins the bearing around that point, like circling a
  // profile. Skips the continuous spin (just flies in) under
  // prefers-reduced-motion; always eases back to the default framing when
  // the sheet closes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    map.stop();
    // The orbit/highlight camera move is reserved for the viewer's own
    // profile — opening any other pin's sheet just shows the card without
    // moving the camera, so the map itself stays put except for that one
    // "here's you" moment.
    if (!selected?.isSelf) {
      map.easeTo({ center: CENTER, zoom: 14.6, pitch: 58, bearing: -17, duration: 700 });
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.easeTo({ center: orbitTarget(selected), zoom: 17.3, pitch: 60, duration: 900 });
    if (reduceMotion) return;

    // Fresh spin, fresh chance to run — a touch from a *previous* orbit
    // shouldn't pre-cancel this one.
    userInteractedRef.current = false;

    let raf = 0;
    const spin = () => {
      if (userInteractedRef.current) return; // real gesture — let it own the camera, don't reschedule
      map.setBearing(map.getBearing() + 0.12);
      raf = requestAnimationFrame(spin);
    };
    const startTimer = setTimeout(() => {
      raf = requestAnimationFrame(spin);
    }, 900);

    return () => {
      clearTimeout(startTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [selected, mapReady]);

  // Welcome moment: as soon as the map and the pin list are both ready,
  // orbit in on the viewer's own (stylized, non-GPS) pin automatically —
  // same camera move as tapping it by hand — unless a `?pin=` deep link
  // already claimed the opening shot.
  useEffect(() => {
    if (autoOrbitedRef.current || preselectId || !mapReady || !pins) return;
    const selfPin = pins.find((p) => p.isSelf);
    if (!selfPin) return;
    autoOrbitedRef.current = true;
    setSelected(selfPin);
  }, [mapReady, pins, preselectId]);

  function recenter() {
    setSelected(null);
    mapRef.current?.easeTo({ center: CENTER, zoom: 14.6, pitch: 58, bearing: -17, duration: 500 });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1>live map</h1>
          <p className={styles.caption}>
            Who&rsquo;s active right now — laid out for feel, not GPS. Perokio doesn&rsquo;t track
            real location.
          </p>
        </div>
        <button type="button" className={styles.compass} onClick={recenter} aria-label="Re-center the map">
          <CompassIcon width={18} height={18} />
        </button>
      </div>

      <div className={styles.scene}>
        {mapError ? (
          <div className={styles.mapFallback}>
            <p>{mapError}</p>
          </div>
        ) : (
          <div ref={containerRef} className={styles.mapContainer} />
        )}

        {!mapError && (
          <div className={styles.pinLayer}>
            {pins?.map((p) => (
              <button
                key={p.id}
                type="button"
                className={p.isSelf ? `${styles.pin} ${styles.pinSelf}` : styles.pin}
                style={{ left: `${p.x}%`, top: `${p.y}%`, ["--pin-color" as string]: pinColor(p) }}
                aria-label={p.isSelf ? "You" : p.displayName ?? "Map pin"}
                onClick={() => setSelected(p)}
              >
                <span className={styles.ring}>
                  <span className={styles.teardrop}>
                    {p.kind === "creator" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external, API-served avatar
                      <img src={avatarUrl(p.id)} width={26} height={26} alt="" className={styles.pinAvatar} />
                    ) : (
                      <span className={styles.avatarDot} />
                    )}
                  </span>
                  {p.count > 0 && <span className={styles.countBadge}>{p.count}</span>}
                  {p.rank > 0 && p.rank <= 12 && <span className={styles.rankBadge}>#{p.rank}</span>}
                </span>
                <span className={p.isSelf ? `${styles.pinLabel} ${styles.pinLabelSelf}` : styles.pinLabel}>
                  {p.isSelf ? "You" : p.displayName ?? initials(p.displayName)}
                </span>
              </button>
            ))}
          </div>
        )}

        {pins?.length === 0 && (
          <p className={styles.emptyNote}>Nothing active yet — check back once a challenge opens.</p>
        )}
      </div>

      <div className={styles.legend}>
        {["Bronze", "Silver", "Gold", "Platinum"].map((label, i) => (
          <span key={label}>
            <span className={styles.legendDot} style={{ background: tierColorVar(i) }} />
            {label}
          </span>
        ))}
        <span>
          <span className={styles.legendDot} style={{ background: CHALLENGE_COLOR }} />
          Live challenge
        </span>
        {user && (
          <span>
            <span className={styles.legendDot} style={{ background: SELF_COLOR }} />
            You
          </span>
        )}
      </div>

      {selected && (
        <div className={styles.sheet} role="dialog" aria-label={selected.displayName ?? "Pin details"}>
          <div className={styles.sheetHead}>
            {selected.kind === "creator" ? (
              /* eslint-disable-next-line @next/next/no-img-element -- external, API-served avatar */
              <img src={avatarUrl(selected.id)} alt="" width={42} height={42} style={{ borderRadius: "50%" }} />
            ) : (
              <span className={styles.sheetAvatar} style={{ ["--pin-color" as string]: pinColor(selected) }}>
                <PinIcon width={20} height={20} />
              </span>
            )}
            <div>
              <p className={styles.sheetName}>
                {selected.displayName ?? (selected.isSelf ? "You" : "Unnamed")}
                {selected.rank > 0 && <span className={styles.sheetRank}> #{selected.rank}</span>}
              </p>
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
