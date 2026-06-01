"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { useStore } from "@/lib/store";

const COLORS = ["#F7B5CB", "#A8D8C8", "#FF9E64", "#7FA9D6", "#F4C04E", "#5FC6B0", "#F58BB0", "#B59CE6"];

// Edit the logged-in user's display name + identity color, and the household name.
export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const { me, profiles, householdName, saveProfile, saveHouseholdName } = useStore();
  const [name, setName] = React.useState(profiles[me].name);
  const [color, setColor] = React.useState(profiles[me].color);
  const [house, setHouse] = React.useState(householdName);

  const canSave = name.trim().length > 0 && house.trim().length > 0;

  const save = async () => {
    if (!canSave) return;
    await saveProfile({ name: name.trim(), color });
    if (house.trim() !== householdName) await saveHouseholdName(house.trim());
    onClose();
  };

  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: UI.sub, margin: "0 2px 9px", letterSpacing: 0.2 };
  const field: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", border: "none", background: "#fff", borderRadius: 14,
    padding: "13px 15px", fontSize: 15, color: UI.ink, outline: "none",
    boxShadow: "0 4px 12px rgba(196,170,142,0.12)", marginBottom: 16,
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(63,53,48,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} className="anim-fade">
      <div onClick={(e) => e.stopPropagation()} className="add-modal anim-pop" style={{ width: "100%", maxWidth: 420, maxHeight: "92vh", overflow: "auto", background: UI.bg, borderRadius: 28, padding: "22px 24px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 19, color: UI.ink }}>Edit profil</div>
          <div onClick={onClose} className="press" style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(196,170,142,0.2)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke={UI.ink} strokeWidth="2.2" strokeLinecap="round" /></svg>
          </div>
        </div>

        {/* preview + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: FREDOKA, fontWeight: 600, fontSize: 24, flexShrink: 0, border: "2px solid rgba(255,255,255,0.85)", boxShadow: `0 3px 8px ${color}77` }}>
            {(name || "?").charAt(0).toUpperCase()}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" autoFocus style={{ ...field, marginBottom: 0, flex: 1 }} />
        </div>

        <div style={label}>WARNA IDENTITAS</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {COLORS.map((c) => (
            <div key={c} onClick={() => setColor(c)} style={{ width: 34, height: 34, borderRadius: "50%", background: c, cursor: "pointer", boxShadow: color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : "none" }} />
          ))}
        </div>

        <div style={label}>NAMA RUMAH</div>
        <input value={house} onChange={(e) => setHouse(e.target.value)} placeholder="Nama rumah tangga" style={field} />

        <button onClick={save} disabled={!canSave} className="press" style={{ width: "100%", border: "none", borderRadius: 16, padding: 15, fontFamily: FREDOKA, fontWeight: 600, fontSize: 17, color: "#fff", cursor: canSave ? "pointer" : "default", background: canSave ? UI.accent : "#E7DDD4", boxShadow: canSave ? "0 8px 20px rgba(255,138,91,0.4)" : "none" }}>
          Simpan
        </button>
      </div>
    </div>
  );
}
