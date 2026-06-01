"use client";

import React from "react";
import { UI, card, FREDOKA } from "@/lib/ui";
import { fmtRp, fmtRpShort, periodLabel } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { Avatar, CatIcon } from "@/components/primitives";
import { PROFILES } from "@/lib/seed";
import { getSupabase } from "@/lib/supabase";
import { CategoryEditor } from "./CategoryEditor";
import { RecurringEditor } from "./RecurringEditor";
import { ProfileEditor } from "./ProfileEditor";
import type { Category, Recurring } from "@/lib/types";

const secLabel: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 700,
  color: UI.sub,
  margin: "8px 6px 12px",
  letterSpacing: 0.3,
};

const rowS = (i: number): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "16px 0",
  borderTop: i ? `1px solid ${UI.line}` : "none",
});

const chev = (
  <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
    <path d="M1 1l6 6-6 6" stroke="#C9BEB3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Sw({ on, t }: { on: boolean; t: () => void }) {
  return (
    <div
      onClick={t}
      style={{ width: 48, height: 28, borderRadius: 999, background: on ? UI.good : "#E2D8CE", padding: 3, cursor: "pointer", transition: "background .2s", flexShrink: 0 }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 2px 5px rgba(0,0,0,0.18)",
          transform: on ? "translateX(20px)" : "translateX(0)",
          transition: "transform .2s",
        }}
      />
    </div>
  );
}

export function Settings() {
  const { categories, recurring, toggleRecurring, mode, householdId, period, generateRecurring, profiles, householdName } = useStore();
  const [notif, setNotif] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [editProfile, setEditProfile] = React.useState(false);
  // null = closed; "new" = add; Category = edit that one
  const [editCat, setEditCat] = React.useState<Category | "new" | null>(null);
  const [editRec, setEditRec] = React.useState<Recurring | "new" | null>(null);
  const [genBusy, setGenBusy] = React.useState(false);
  const [genMsg, setGenMsg] = React.useState<string | null>(null);

  const onGenerate = async () => {
    setGenBusy(true);
    const n = await generateRecurring(period);
    setGenMsg(n > 0 ? `${n} tagihan tercatat ✓` : "Semua sudah tercatat ✓");
    setTimeout(() => setGenMsg(null), 2200);
    setGenBusy(false);
  };

  const copyId = async () => {
    if (!householdId) return;
    try {
      await navigator.clipboard.writeText(householdId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; user can long-press to copy */
    }
  };

  const logout = async () => {
    const sb = getSupabase();
    if (sb) {
      await sb.auth.signOut();
      window.location.href = "/login";
    }
  };

  return (
    <div className="rgrid stagger" style={{ alignItems: "start" }}>
      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Household */}
        <div style={{ ...card, padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 86, height: 54, flexShrink: 0 }}>
              <div style={{ position: "absolute", left: 0 }}>
                <Avatar pid="mei" size={54} ring />
              </div>
              <div style={{ position: "absolute", left: 32 }}>
                <Avatar pid="bas" size={54} ring />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, color: UI.ink }}>{householdName}</div>
              <div style={{ fontSize: 13.5, color: UI.sub, marginTop: 2 }}>2 anggota · sejak 2025</div>
            </div>
            <div onClick={() => setEditProfile(true)} className="press" style={{ padding: "8px 14px", borderRadius: 12, background: UI.accentSoft, color: UI.accentDk, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              Edit
            </div>
          </div>
          {mode === "live" && householdId && (
            <div
              onClick={copyId}
              style={{ marginTop: 16, background: UI.bg, borderRadius: 16, padding: "12px 14px", cursor: "pointer" }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: UI.sub, letterSpacing: 0.3, marginBottom: 4 }}>
                ID RUMAH (bagikan ke pasanganmu buat gabung)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <code style={{ flex: 1, fontSize: 12.5, color: UI.ink, wordBreak: "break-all", fontFamily: "monospace" }}>
                  {householdId}
                </code>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: copied ? UI.good : UI.accentDk, whiteSpace: "nowrap" }}>
                  {copied ? "Tersalin ✓" : "Salin"}
                </span>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            {(["mei", "bas"] as const).map((p) => (
              <div key={p} style={{ flex: 1, background: UI.bg, borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: profiles[p].color, boxShadow: `0 0 0 3px ${profiles[p].soft}` }} />
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: UI.ink }}>{profiles[p].name}</div>
                  <div style={{ fontSize: 11.5, color: UI.sub }}>{profiles[p].color}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories & budget */}
        <div>
          <div style={secLabel}>KATEGORI & BUDGET</div>
          <div style={{ ...card, padding: "4px 24px" }}>
            {categories.map((c, i) => (
              <div key={c.id} style={{ ...rowS(i), cursor: "pointer" }} onClick={() => setEditCat(c)}>
                <CatIcon category={c} size={40} />
                <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: UI.ink }}>{c.name}</div>
                <span style={{ fontSize: 14, color: c.budget ? UI.sub : "#C9BEB3", fontWeight: 500 }}>
                  {c.budget ? fmtRpShort(c.budget) + "/bln" : "Tanpa budget"}
                </span>
                {chev}
              </div>
            ))}
            <div
              onClick={() => setEditCat("new")}
              style={{ ...rowS(1), color: UI.accentDk, fontWeight: 600, fontSize: 15, justifyContent: "center", cursor: "pointer" }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Tambah kategori
            </div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Recurring */}
        <div>
          <div style={secLabel}>PENGELUARAN BERULANG</div>
          <div style={{ ...card, padding: "4px 24px" }}>
            {recurring.map((r, i) => (
              <div key={r.id} style={rowS(i)}>
                <div onClick={() => setEditRec(r)} className="press" style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, cursor: "pointer" }}>
                  <CatIcon cat={r.category_id} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: UI.ink }}>{r.description}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <Avatar pid={r.payer_id} size={16} />
                      <span style={{ fontSize: 12.5, color: UI.sub }}>
                        {fmtRp(r.amount)} · tiap tgl {r.day}
                      </span>
                    </div>
                  </div>
                </div>
                <Sw on={r.active} t={() => toggleRecurring(r.id)} />
              </div>
            ))}
            <div onClick={() => setEditRec("new")} className="press" style={{ ...rowS(recurring.length ? 1 : 0), color: UI.accentDk, fontWeight: 600, fontSize: 15, justifyContent: "center", cursor: "pointer" }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Tambah pengeluaran berulang
            </div>
          </div>
          {recurring.some((r) => r.active) && (
            <button
              onClick={onGenerate}
              disabled={genBusy}
              className="press"
              style={{ width: "100%", marginTop: 10, border: "none", borderRadius: 14, padding: 12, background: UI.accentSoft, color: UI.accentDk, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14, cursor: genBusy ? "default" : "pointer" }}
            >
              {genMsg ?? `Catat tagihan rutin untuk ${periodLabel(period)} 🔁`}
            </button>
          )}
        </div>

        {/* Account */}
        <div>
          <div style={secLabel}>AKUN</div>
          <div style={{ ...card, padding: "4px 24px" }}>
            <div style={rowS(0)}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: UI.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>🔔</div>
              <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: UI.ink }}>Notifikasi budget</div>
              <Sw on={notif} t={() => setNotif(!notif)} />
            </div>
            <div style={rowS(1)}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#E7F4EF", display: "flex", alignItems: "center", justifyContent: "center" }}>💱</div>
              <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: UI.ink }}>Mata uang</div>
              <span style={{ fontSize: 14, color: UI.sub }}>Rupiah (IDR)</span>
              {chev}
            </div>
            <div style={rowS(1)}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#E7F4EF", display: "flex", alignItems: "center", justifyContent: "center" }}>☁️</div>
              <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: UI.ink }}>Sinkronisasi</div>
              <span style={{ fontSize: 14, color: mode === "live" ? UI.good : UI.sub }}>{mode === "live" ? "Aktif" : "Lokal"}</span>
            </div>
            <div style={rowS(1)} onClick={logout}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FDECF2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>👋</div>
              <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: UI.bad, cursor: "pointer" }}>Keluar</div>
            </div>
          </div>
        </div>
      </div>

      {editCat !== null && (
        <CategoryEditor
          category={editCat === "new" ? null : editCat}
          onClose={() => setEditCat(null)}
        />
      )}
      {editRec !== null && (
        <RecurringEditor
          recurring={editRec === "new" ? null : editRec}
          onClose={() => setEditRec(null)}
        />
      )}
      {editProfile && <ProfileEditor onClose={() => setEditProfile(false)} />}
    </div>
  );
}
