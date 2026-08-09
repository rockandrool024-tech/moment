"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { api } from "@/lib/api-client";
import { MapNearbyResponse, MapPin } from "@/lib/types";
import { avatarUrl } from "@/lib/avatar";
import { tierColorVar } from "@/lib/tier";
import { CompassIcon, PinIcon } from "@/components/icons";
import styles from "./map.module.css";

// Real Mapbox rendering (vector tiles, pan/zoom/rotate, real 3D building
// extrusion) — but pin *positions* stay stylized, same "not GPS" posture as
// before. There's no lat/lng on User yet, no geocoding, no location
// permission flow (that's real GPS positions, deliberately out of scope for
// this pass — see docs/perokio/HANDOFF.md). CENTER is a fixed, unlabeled
// anchor point picked only because it has dense real building data for the
// extrusion layer to render — never surfaced to the user as "your city."
const CENTER: [number, number] = [-73.9857, 40.7484]; // dense-building area, not shown as a place name
const SPREAD = 0.004; // degrees — keeps pins within a few blocks of CENTER
const CHALLENGE_COLOR = "var(--rally)";

function pinColor(pin: MapPin): string {
  return pin.kind === "challenge" ? CHALLENGE_COLOR : tierColorVar(pin.tier);
}

function pinColorResolved(pin: MapPin, root: CSSStyleDeclaration): string {
  const varName = pin.kind === "challenge" ? "--rally" : `--tier-${pin.tier}`;
  return root.getPropertyValue(varName).trim() || "#F98404";
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}

function toLngLat(pin: MapPin): [number, number] {
  const offsetLng = ((pin.x - 50) / 50) * SPREAD;
  const offsetLat = ((pin.y - 50) / 50) * SPREAD;
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
  const [pins, setPins] = useState<MapPin[] | null>(null);
  const [selected, setSelected] = useState<MapPin | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const pinsRef = useRef<MapPin[] | null>(null);

  useEffect(() => {
    api.get<MapNearbyResponse>("/public/map/nearby").then((r) => {
      setPins(r.pins);
      // Deep-link from /discovery's "View on map" — pre-opens that pin's
      // sheet instead of making the visitor find it themselves.
      if (preselectId) {
        const match = r.pins.find((p) => p.id === preselectId);
        if (match) setSelected(match);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preselect only on initial load
  }, []);

  // Map initializes once; markers are synced separately whenever pins change
  // (avoids tearing the whole map down just to redraw pins).
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
      style: "mapbox://styles/mapbox/dark-v11",
      center: CENTER,
      zoom: 15.75,
      pitch: 58,
      bearing: -17,
      antialias: true,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      const root = getComputedStyle(document.documentElement);
      const buildingBase = root.getPropertyValue("--card-bg").trim() || "#18181B";
      const buildingGlow = root.getPropertyValue("--border-active").trim() || "#F98404";

      map.addLayer({
        id: "perokio-3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 13,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "height"],
            0,
            buildingBase,
            80,
            buildingGlow,
          ],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.75,
        },
      });

      syncMarkers();
    });

    map.on("error", (e) => {
      // Mapbox surfaces bad-token / style-load failures this way rather
      // than throwing — catch it so the page shows a message instead of a
      // silently blank tile area.
      setMapError(e.error?.message ?? "The map failed to load.");
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  function syncMarkers() {
    const map = mapRef.current;
    const currentPins = pinsRef.current;
    if (!map || !currentPins) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = currentPins.map((p) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = styles.pin;
      el.setAttribute("aria-label", p.displayName ?? "Map pin");
      el.style.setProperty("--pin-color", pinColorResolved(p, getComputedStyle(document.documentElement)));

      const ring = document.createElement("span");
      ring.className = styles.ring;
      if (p.kind === "creator") {
        const img = document.createElement("img");
        img.src = avatarUrl(p.id);
        img.width = 30;
        img.height = 30;
        img.alt = "";
        img.style.borderRadius = "50%";
        img.style.border = "2px solid #0c0f0a";
        ring.appendChild(img);
      } else {
        ring.innerHTML = `<span class="${styles.avatarDot}"></span>`;
      }
      el.appendChild(ring);

      const label = document.createElement("span");
      label.className = styles.pinLabel;
      label.textContent = p.displayName ?? initials(p.displayName);
      el.appendChild(label);

      el.addEventListener("click", () => setSelected(p));

      return new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat(toLngLat(p)).addTo(map);
    });
  }

  useEffect(() => {
    pinsRef.current = pins;
    if (mapRef.current?.loaded()) syncMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  function recenter() {
    mapRef.current?.easeTo({ center: CENTER, zoom: 15.75, pitch: 58, bearing: -17, duration: 500 });
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
              <img src={avatarUrl(selected.id)} alt="" width={42} height={42} style={{ borderRadius: "50%" }} />
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
