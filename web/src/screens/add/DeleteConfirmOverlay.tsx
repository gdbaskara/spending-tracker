"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { fmtRp } from "@/lib/engine";

interface DeleteConfirmOverlayProps {
  amount: number;
  categoryName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmation sheet shown over the edit modal before deleting a transaction. */
export function DeleteConfirmOverlay({ amount, categoryName, onCancel, onConfirm }: DeleteConfirmOverlayProps) {
  return (
    <div
      onClick={onCancel}
      style={{ position: "absolute", inset: 0, borderRadius: 28, background: "rgba(63,53,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      className="anim-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-pop"
        style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 24, padding: "26px 24px", textAlign: "center" }}
      >
        <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, color: UI.ink }}>Hapus transaksi ini?</div>
        <div style={{ fontSize: 14, color: UI.sub, marginTop: 8, lineHeight: 1.5 }}>
          {fmtRp(amount)} · {categoryName}. Nggak bisa dibalikin.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onCancel}
            className="press"
            style={{ flex: 1, border: "none", borderRadius: 14, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: UI.sub, background: UI.faint, cursor: "pointer" }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="press"
            style={{ flex: 1.2, border: "none", borderRadius: 14, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: "#fff", background: UI.bad, cursor: "pointer" }}
          >
            Ya, hapus
          </button>
        </div>
      </div>
    </div>
  );
}
