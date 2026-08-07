// A small hand-drawn icon set, in one consistent line style (24px grid,
// 1.75 stroke, round caps), so the app stops depending on emoji for its
// core concepts and doesn't need an external icon-font CDN. Add to this
// file rather than reaching for a new dependency.
import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function FlameIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2.5c1 3-3.5 4.5-3.5 8.5a3.5 3.5 0 0 0 7 0c0-1.2-.6-2-1.2-2.7.9.2 2.2 1.6 2.2 4a5.5 5.5 0 0 1-11 0c0-5 3.5-6 3-9.8Z" />
    </svg>
  );
}

export function TierCrownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3 8 3.5 3L12 5l5.5 6L21 8l-1.5 10h-15Z" />
      <path d="M6.5 21h11" />
    </svg>
  );
}

export function VoteCheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="m7.5 12 3 3 6-6.5" />
    </svg>
  );
}

export function RallyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l1 5h2l-1-5h4l6 4V6l-6 4H6a2 2 0 0 0-2 2Z" />
      <path d="M19 9.5a3 3 0 0 1 0 5" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5V8H5.5A2.5 2.5 0 0 1 3 5.5" />
      <rect x="3" y="8" width="18" height="12" rx="2.5" />
      <path d="M15 14.25h2.5" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

export function VerifiedIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m12 2.5 2.4 1.4 2.75-.2 1.05 2.55L20.8 8l-.75 2.7.75 2.7-2.6 1.75-1.05 2.55-2.75-.2L12 19l-2.4-1.5-2.75.2-1.05-2.55-2.6-1.75.75-2.7L3.2 8l2.6-1.75 1.05-2.55 2.75.2Z" />
      <path d="m8.7 12.1 2.1 2.1 4.3-4.5" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4.5v15l13-7.5Z" strokeLinejoin="round" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 6-6 2 2-6Z" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="18" cy="5.5" r="2.25" />
      <circle cx="6" cy="12" r="2.25" />
      <circle cx="18" cy="18.5" r="2.25" />
      <path d="m8 10.8 8-4.2M8 13.2l8 4.2" />
    </svg>
  );
}
