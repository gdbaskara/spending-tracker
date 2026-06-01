"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { fmtRp } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { CatIcon, Avatar } from "@/components/primitives";
import { PROFILES } from "@/lib/seed";
import type { PersonId, Recurring, SplitType } from "@/lib/types";

// Add or edit a recurring expense (tagihan rutin).
export function RecurringEditor({
  recurring,
  onClose,
}: {
  recurring: Recurring | null; // null = add new
  onClose: () => void;
}) {
  const { categories, addRecurring, editRecurring, removeRecurring, me } = useStore();
  const isEdit = !!recurring;
  const [desc, setDesc] = React.useState(recurring?.description ?? "");
  const [amount, setAmount] = React.useState(recurring?.amount ?? 0);
  const [catId, setCatId] = React.useState(recurring?.category_id ?? categories[0]?.id ?? "tagihan");
  const [payer, setPayer] = React.useState<PersonId>(recurring?.payer_id ?? me);
  const [split, setSplit] = React.useState<SplitType>(recurring?.split_type ?? "equal");
  const [day, setDay] = React.useState(recurring?.day ?? 1);
  const [confirmDel, setConfirmDel] = React.useState(false);

  const canSave = desc.trim().length > 0 && amount > 0;

  const save = () => {
    if (!canSave) return;
    const payload = {
      description: desc.trim(),
      amount,
      category_id: catId,
      payer_id: payer,
      split_type: split,
      day,
      active: recurring?.active ?? true,
    };
    if (isEdit && recurring) editRecurring({ ...recurring, ...payload });
    else addRecurring(payload);
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
  const segWrap: React.CSSProperties = { display: "flex", gap: 6, background: UI.faint, borderRadius: 16, padding: 5, marginBottom: 16 };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(63,53,48,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      className="anim-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="add-modal anim-pop"
        style={{ width: "100%", maxWidth: 440, maxHeight: "92vh", overflow: "auto", background: UI.bg, borderRadius: 28, padding: "22px 24px 26px", position: "relative" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 19, color: UI.ink }}>
            {isEdit ? "Edit pengeluaran berulang" : "Tambah pengeluaran berulang"}
          </div>
          <div onClick={onClose} className="press" style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(196,170,142,0.2)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke={UI.ink} strokeWidth="2.2" strokeLinecap="round" /></svg>
          </div>
        </div>

        <div style={label}>NAMA TAGIHAN</div>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="mis. Listrik PLN" autoFocus style={field} />

        <div style={label}>JUMLAH PER BULAN</div>
        <input
          type="text" inputMode="numeric"
          value={amount > 0 ? amount.toLocaleString("id-ID") : ""}
          onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); setAmount(Number.isFinite(n) ? Math.min(n, 999_999_999) : 0); }}
          placeholder="0" style={field}
        />

        <div style={label}>KATEGORI</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          {categories.map((c) => {
            const active = c.id === catId;
            return (
              <div key={c.id} onClick={() => setCatId(c.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <div style={{ borderRadius: 16, padding: 3, background: active ? `${c.color}33` : "transparent", boxShadow: active ? `0 0 0 2px ${c.color}` : "none" }}>
                  <CatIcon cat={c.id} size={42} radius={13} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: active ? UI.ink : UI.sub, textAlign: "center", lineHeight: 1.1 }}>{c.name}</div>
              </div>
            );
          })}
        </div>

        <div style={label}>SIAPA YANG BAYAR?</div>
        <div style={segWrap}>
          {(["mei", "bas"] as const).map((p) => (
            <div key={p} onClick={() => setPayer(p)} style={seg(payer === p, PROFILES[p].color)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Avatar pid={p} size={22} />{PROFILES[p].name}
              </div>
            </div>
          ))}
        </div>

        <div style={label}>DIBAGI GIMANA?</div>
        <div style={segWrap}>
          <div onClick={() => setSplit("equal")} style={seg(split === "equal")}>Bagi 2 rata</div>
          <div onClick={() => setSplit("full")} style={seg(split === "full")}>Sendiri</div>
        </div>

        <div style={label}>TIAP TANGGAL (1–28)</div>
        <input
          type="text" inputMode="numeric"
          value={day}
          onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); setDay(Math.min(28, Math.max(1, Number.isFinite(n) ? n : 1))); }}
          style={field}
        />

        <button onClick={save} disabled={!canSave} className="press"
          style={{ width: "100%", border: "none", borderRadius: 16, padding: 15, fontFamily: FREDOKA, fontWeight: 600, fontSize: 17, color: "#fff", cursor: canSave ? "pointer" : "default", background: canSave ? UI.accent : "#E7DDD4", boxShadow: canSave ? "0 8px 20px rgba(255,138,91,0.4)" : "none" }}>
          {isEdit ? "Simpan perubahan" : "Tambah"}
        </button>

        {isEdit && (
          <button onClick={() => setConfirmDel(true)} className="press"
            style={{ width: "100%", marginTop: 10, border: "none", borderRadius: 16, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: UI.bad, background: "transparent", cursor: "pointer" }}>
            Hapus tagihan ini
          </button>
        )}

        {confirmDel && recurring && (
          <div onClick={() => setConfirmDel(false)} style={{ position: "absolute", inset: 0, borderRadius: 28, background: "rgba(63,53,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} className="anim-fade">
            <div onClick={(e) => e.stopPropagation()} className="anim-pop" style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 24, padding: "26px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, color: UI.ink }}>Hapus tagihan?</div>
              <div style={{ fontSize: 14, color: UI.sub, marginTop: 8, lineHeight: 1.5 }}>{desc} · {fmtRp(amount)}/bln</div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setConfirmDel(false)} className="press" style={{ flex: 1, border: "none", borderRadius: 14, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: UI.sub, background: UI.faint, cursor: "pointer" }}>Batal</button>
                <button onClick={() => { removeRecurring(recurring.id); onClose(); }} className="press" style={{ flex: 1.2, border: "none", borderRadius: 14, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: "#fff", background: UI.bad, cursor: "pointer" }}>Ya, hapus</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
