"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { fmtRp } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/primitives";
import { CuteCalendar } from "@/components/CuteCalendar";
import { PROFILES } from "@/lib/seed";
import type { PersonId, Settlement } from "@/lib/types";

// Edit or delete a recorded settlement (pelunasan) — in case the amount,
// direction, or date was wrong. Affects the net balance immediately.
export function SettlementEditor({
  settlement,
  onClose,
}: {
  settlement: Settlement;
  onClose: () => void;
}) {
  const { editSettlement, removeSettlement } = useStore();
  const [from, setFrom] = React.useState<PersonId>(settlement.from_id);
  const [amount, setAmount] = React.useState(settlement.amount);
  const [note, setNote] = React.useState(settlement.note ?? "");
  const [date, setDate] = React.useState(settlement.settled_at);
  const [showCal, setShowCal] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);

  const to: PersonId = from === "mei" ? "bas" : "mei";
  const canSave = amount > 0;

  const save = () => {
    if (!canSave) return;
    editSettlement({ ...settlement, from_id: from, to_id: to, amount, note: note.trim() || null, settled_at: date });
    onClose();
  };

  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: UI.sub, margin: "0 2px 9px", letterSpacing: 0.2 };
  const field: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", border: "none", background: "#fff", borderRadius: 14,
    padding: "13px 15px", fontSize: 15, color: UI.ink, outline: "none",
    boxShadow: "0 4px 12px rgba(196,170,142,0.12)", marginBottom: 16,
  };
  const seg = (active: boolean, color?: string): React.CSSProperties => ({
    flex: 1, padding: "11px 8px", borderRadius: 13, fontSize: 14, fontWeight: 600, cursor: "pointer",
    textAlign: "center", transition: "all .18s",
    background: active ? color ?? UI.accent : "transparent", color: active ? "#fff" : UI.sub,
    boxShadow: active ? "0 6px 14px rgba(0,0,0,0.12)" : "none",
  });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(63,53,48,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} className="anim-fade">
      <div onClick={(e) => e.stopPropagation()} className="add-modal anim-pop" style={{ width: "100%", maxWidth: 420, maxHeight: "92vh", overflow: "auto", background: UI.bg, borderRadius: 28, padding: "22px 24px 26px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 19, color: UI.ink }}>Edit pelunasan</div>
          <div onClick={onClose} className="press" style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(196,170,142,0.2)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke={UI.ink} strokeWidth="2.2" strokeLinecap="round" /></svg>
          </div>
        </div>

        <div style={label}>SIAPA YANG BAYAR</div>
        <div style={{ display: "flex", gap: 6, background: UI.faint, borderRadius: 16, padding: 5, marginBottom: 16 }}>
          {(["mei", "bas"] as const).map((p) => (
            <div key={p} onClick={() => setFrom(p)} style={seg(from === p, PROFILES[p].color)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Avatar pid={p} size={22} />{PROFILES[p].name}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, color: UI.sub, margin: "-8px 2px 16px" }}>
          {PROFILES[from].name} → {PROFILES[to].name}
        </div>

        <div style={label}>JUMLAH</div>
        <input
          type="text" inputMode="numeric"
          value={amount > 0 ? amount.toLocaleString("id-ID") : ""}
          onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); setAmount(Number.isFinite(n) ? Math.min(n, 999_999_999) : 0); }}
          placeholder="0" style={field}
        />

        <div style={label}>CATATAN</div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. Lunasin sewa (opsional)" style={field} />

        <div style={label}>TANGGAL</div>
        <div style={{ marginBottom: showCal ? 0 : 16 }}>
          <div onClick={() => setShowCal((s) => !s)} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", background: UI.accentSoft, color: UI.accentDk }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
            {date}
          </div>
        </div>
        {showCal && <div style={{ marginBottom: 16 }}><CuteCalendar value={date} onChange={(d) => setDate(d)} /></div>}

        <button onClick={save} disabled={!canSave} className="press" style={{ width: "100%", border: "none", borderRadius: 16, padding: 15, fontFamily: FREDOKA, fontWeight: 600, fontSize: 17, color: "#fff", cursor: canSave ? "pointer" : "default", background: canSave ? UI.accent : "#E7DDD4", boxShadow: canSave ? "0 8px 20px rgba(255,138,91,0.4)" : "none" }}>
          Simpan perubahan
        </button>
        <button onClick={() => setConfirmDel(true)} className="press" style={{ width: "100%", marginTop: 10, border: "none", borderRadius: 16, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: UI.bad, background: "transparent", cursor: "pointer" }}>
          Hapus pelunasan ini
        </button>

        {confirmDel && (
          <div onClick={() => setConfirmDel(false)} style={{ position: "absolute", inset: 0, borderRadius: 28, background: "rgba(63,53,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} className="anim-fade">
            <div onClick={(e) => e.stopPropagation()} className="anim-pop" style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 24, padding: "26px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, color: UI.ink }}>Hapus pelunasan?</div>
              <div style={{ fontSize: 14, color: UI.sub, marginTop: 8, lineHeight: 1.5 }}>{fmtRp(amount)} dari {PROFILES[from].name}. Saldo akan dihitung ulang.</div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setConfirmDel(false)} className="press" style={{ flex: 1, border: "none", borderRadius: 14, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: UI.sub, background: UI.faint, cursor: "pointer" }}>Batal</button>
                <button onClick={() => { removeSettlement(settlement.id); onClose(); }} className="press" style={{ flex: 1.2, border: "none", borderRadius: 14, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: "#fff", background: UI.bad, cursor: "pointer" }}>Ya, hapus</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
