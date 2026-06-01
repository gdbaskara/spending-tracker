// Celengin design tokens — ported verbatim from the Claude Design handoff
// (Spending Tracker (Web).html + app/components.jsx `UI`).
export const UI = {
  bg: "#FBF5EF",
  card: "#FFFFFF",
  ink: "#3F3530",
  sub: "#A99E94",
  faint: "#EFE7DE",
  line: "#F1E9E1",
  accent: "#FF8A5B",
  accentDk: "#F0703F",
  accentSoft: "#FFE7DB",
  good: "#5FC6B0",
  warn: "#F4A93C",
  bad: "#EF6F6F",
} as const;

// Reusable card surface.
export const card: React.CSSProperties = {
  background: UI.card,
  borderRadius: 28,
  boxShadow: "0 10px 30px rgba(196,170,142,0.14)",
};

export const FREDOKA = "var(--font-fredoka), 'Fredoka', sans-serif";
