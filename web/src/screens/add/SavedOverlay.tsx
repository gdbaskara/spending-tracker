"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { fmtRp } from "@/lib/engine";
import { Mascot } from "@/components/Mascot";

interface SavedOverlayProps {
  amount: number;
  categoryName?: string;
}

/** Celebration shown briefly after a new expense is recorded. */
export function SavedOverlay({ amount, categoryName }: SavedOverlayProps) {
  return (
    <div
      style={{ position: "absolute", inset: 0, borderRadius: 28, background: "rgba(251,245,239,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}
    >
      <div className="anim-pop-slow">
        <Mascot size={140} mood="proud" />
      </div>
      <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 24, color: UI.ink }}>Tercatat! 🎉</div>
      <div style={{ fontSize: 15, color: UI.sub }}>
        {fmtRp(amount)} · {categoryName}
      </div>
    </div>
  );
}
