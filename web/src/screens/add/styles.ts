import type React from "react";
import { UI } from "@/lib/ui";

// Shared style helpers for the AddModal field groups (segmented toggles,
// field labels, and date chips). Kept pure so each piece can be reused and
// the modal itself stays focused on composition.

export function seg(active: boolean, color?: string): React.CSSProperties {
  return {
    flex: 1,
    padding: "11px 8px",
    borderRadius: 13,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
    transition: "all .18s",
    background: active ? color ?? UI.accent : "transparent",
    color: active ? "#fff" : UI.sub,
    boxShadow: active ? "0 6px 14px rgba(0,0,0,0.12)" : "none",
  };
}

export const segWrap: React.CSSProperties = {
  display: "flex",
  gap: 6,
  background: UI.faint,
  borderRadius: 16,
  padding: 5,
  marginBottom: 16,
};

export const fieldLabel: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  color: UI.sub,
  margin: "0 2px 9px",
  letterSpacing: 0.2,
};

export function chip(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    background: active ? UI.accentSoft : "#fff",
    color: active ? UI.accentDk : UI.sub,
    boxShadow: "0 3px 9px rgba(196,170,142,0.1)",
  };
}
