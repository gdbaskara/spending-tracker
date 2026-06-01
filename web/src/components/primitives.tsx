import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { CATEGORIES } from "@/lib/seed";
import { useLiveProfiles } from "@/lib/store";
import { CAT_GLYPHS } from "./icons";
import type { Category, PersonId } from "@/lib/types";

// ── CatIcon ──────────────────────────────────────────────────────────────────
export function CatIcon({
  cat,
  size = 44,
  radius,
  category,
}: {
  cat?: string;
  size?: number;
  radius?: number;
  category?: Category;
}) {
  const c = category ?? CATEGORIES[cat ?? "lainnya"] ?? CATEGORIES.lainnya;
  const r = radius ?? size * 0.34;
  const g = size * 0.62;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: c.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 4px 10px ${c.color}55`,
      }}
    >
      <svg
        width={g}
        height={g}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {CAT_GLYPHS[c.icon] ?? CAT_GLYPHS.lainnya}
      </svg>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({
  pid,
  size = 40,
  ring = false,
}: {
  pid: PersonId;
  size?: number;
  ring?: boolean;
}) {
  const p = useLiveProfiles()[pid];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: p.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: FREDOKA,
        fontWeight: 600,
        fontSize: size * 0.42,
        letterSpacing: 0.3,
        flexShrink: 0,
        border: "2px solid rgba(255,255,255,0.85)",
        boxShadow: ring
          ? `0 0 0 3px #fff, 0 0 0 5px ${p.color}`
          : `0 3px 8px ${p.color}77`,
      }}
    >
      {p.initial}
    </div>
  );
}

// ── PayerBadge ───────────────────────────────────────────────────────────────
export function PayerBadge({ pid, label }: { pid: PersonId; label?: string }) {
  const p = useLiveProfiles()[pid];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: p.soft,
        color: "#6b5e57",
        borderRadius: 999,
        padding: "4px 10px 4px 4px",
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      <Avatar pid={pid} size={20} />
      {label ?? `${p.name} bayar`}
    </span>
  );
}

// ── BudgetBar ────────────────────────────────────────────────────────────────
export function BudgetBar({ pct, color }: { pct: number; color: string }) {
  const fill = pct > 100 ? UI.bad : pct >= 80 ? UI.warn : color;
  // animate from 0 to target width on mount
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setW(Math.min(pct, 100));
    const id = requestAnimationFrame(() => setW(Math.min(pct, 100)));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return (
    <div style={{ height: 8, borderRadius: 999, background: "#EFEAE6", overflow: "hidden" }}>
      <div
        style={{
          width: `${w}%`,
          height: "100%",
          borderRadius: 999,
          background: fill,
          transition: "width .7s cubic-bezier(.22,1,.36,1)",
        }}
      />
    </div>
  );
}
