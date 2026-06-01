import React from "react";

// ── Navigation icons (24x24, stroke 2.1) ────────────────────────────────────
export type NavKey = "home" | "reports" | "settle" | "settings";

const NAV_PATHS: Record<NavKey, React.ReactNode> = {
  home: <path d="M3 11l9-7 9 7M5.5 9.5V20h13V9.5M9.5 20v-5.5h5V20" />,
  reports: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  settle: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
    </>
  ),
};

export function NavIcon({ name, size = 22 }: { name: NavKey; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {NAV_PATHS[name]}
    </svg>
  );
}

// ── Category glyphs (drawn inside a colored tile, white stroke) ──────────────
export const CAT_GLYPHS: Record<string, React.ReactNode> = {
  makan: (
    <>
      <path d="M4 10h16a8 8 0 0 1-8 8 8 8 0 0 1-8-8Z" />
      <path d="M12 6V4M9 7V5M15 7V5" />
    </>
  ),
  sewa: (
    <>
      <path d="M4 11l8-6 8 6" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  tagihan: (
    <>
      <path d="M6 3h12v18l-2.5-1.6L13 21l-3-1.6L7 21l-1-1.6V3Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  belanja: (
    <>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M8.5 8a3.5 3.5 0 0 1 7 0" />
    </>
  ),
  hiburan: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="3" />
      <path d="M10.5 9.5l4 2.5-4 2.5v-5Z" fill="currentColor" stroke="none" />
    </>
  ),
  transport: (
    <>
      <path d="M4 13l1.5-4.5A2 2 0 0 1 7.4 7h9.2a2 2 0 0 1 1.9 1.5L20 13v4H4v-4Z" />
      <path d="M4 13h16" />
      <circle cx="7.5" cy="17" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="17" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  lainnya: (
    <>
      <path d="M9 4l1.3 3.2L13.5 8l-3.2 1.3L9 12.5 7.7 9.3 4.5 8l3.2-.8L9 4Z" fill="currentColor" stroke="none" />
      <path d="M16.5 12l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" fill="currentColor" stroke="none" />
    </>
  ),
};
