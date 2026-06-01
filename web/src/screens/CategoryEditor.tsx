"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { fmtRp } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { CatIcon } from "@/components/primitives";
import type { Category } from "@/lib/types";

const ICONS = ["makan", "sewa", "tagihan", "belanja", "hiburan", "transport", "lainnya"];
const COLORS = ["#FF9E64", "#7FA9D6", "#F4C04E", "#5FC6B0", "#F58BB0", "#B59CE6", "#9AA7B5", "#FF8A5B"];

// Add or edit a category (name, icon, color, monthly budget).
export function CategoryEditor({
  category,
  onClose,
}: {
  category: Category | null; // null = add new
  onClose: () => void;
}) {
  const { saveCategory, addCategory, removeCategory, categories, expenses, recurring } = useStore();
  const editing = !!category;
  const [name, setName] = React.useState(category?.name ?? "");
  const [icon, setIcon] = React.useState(category?.icon ?? "lainnya");
  const [color, setColor] = React.useState(category?.color ?? COLORS[0]);
  const [budget, setBudget] = React.useState<number>(category?.budget ?? 0);
  const [confirmDel, setConfirmDel] = React.useState(false);

  const canSave = name.trim().length > 0;

  // A category can only be removed when nothing references it (expenses keep
  // their category_id, so deleting one in use would orphan them) and it is not
  // the last remaining category.
  const usedCount = category ? expenses.filter((e) => e.category_id === category.id).length : 0;
  const usedByRecurring = category ? recurring.some((r) => r.category_id === category.id) : false;
  const canDelete = editing && usedCount === 0 && !usedByRecurring && categories.length > 1;
  const blockReason = !editing
    ? null
    : usedCount > 0
    ? `Masih dipakai di ${usedCount} transaksi`
    : usedByRecurring
    ? "Masih dipakai pengeluaran rutin"
    : categories.length <= 1
    ? "Minimal harus ada satu kategori"
    : null;

  const doDelete = async () => {
    if (!category || !canDelete) return;
    await removeCategory(category.id);
    onClose();
  };

  const save = async () => {
    if (!canSave) return;
    const payload = { name: name.trim(), icon, color, budget: budget > 0 ? budget : null };
    if (editing && category) {
      await saveCategory({ ...category, ...payload });
    } else {
      await addCategory(payload);
    }
    onClose();
  };

  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: UI.sub, margin: "0 2px 9px", letterSpacing: 0.2 };
  const field: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "none",
    background: "#fff",
    borderRadius: 14,
    padding: "13px 15px",
    fontSize: 15,
    color: UI.ink,
    outline: "none",
    boxShadow: "0 4px 12px rgba(196,170,142,0.12)",
    marginBottom: 16,
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(63,53,48,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      className="anim-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="add-modal anim-pop"
        style={{ width: "100%", maxWidth: 440, maxHeight: "92vh", overflow: "auto", background: UI.bg, borderRadius: 28, padding: "22px 24px 26px" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 19, color: UI.ink }}>
            {editing ? "Edit kategori" : "Tambah kategori"}
          </div>
          <div
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(196,170,142,0.2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke={UI.ink} strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Preview + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <CatIcon category={{ id: "preview", name, icon, color, budget: null }} size={48} />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kategori"
            autoFocus
            style={{ ...field, marginBottom: 0, flex: 1 }}
          />
        </div>

        {/* Icon */}
        <div style={label}>IKON</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {ICONS.map((ic) => (
            <div
              key={ic}
              onClick={() => setIcon(ic)}
              style={{ borderRadius: 14, padding: 3, cursor: "pointer", boxShadow: icon === ic ? `0 0 0 2px ${color}` : "none" }}
            >
              <CatIcon category={{ id: ic, name: ic, icon: ic, color, budget: null }} size={40} radius={12} />
            </div>
          ))}
        </div>

        {/* Color */}
        <div style={label}>WARNA</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {COLORS.map((col) => (
            <div
              key={col}
              onClick={() => setColor(col)}
              style={{ width: 34, height: 34, borderRadius: "50%", background: col, cursor: "pointer", boxShadow: color === col ? `0 0 0 3px #fff, 0 0 0 5px ${col}` : "none" }}
            />
          ))}
        </div>

        {/* Budget */}
        <div style={label}>BUDGET BULANAN (kosongkan = tanpa budget)</div>
        <input
          type="text"
          inputMode="numeric"
          value={budget > 0 ? budget.toLocaleString("id-ID") : ""}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ""));
            setBudget(Number.isFinite(n) ? Math.min(n, 999_999_999) : 0);
          }}
          placeholder="0"
          style={field}
        />
        {budget > 0 && (
          <div style={{ fontSize: 13, color: UI.sub, marginTop: -8, marginBottom: 16 }}>{fmtRp(budget)} / bulan</div>
        )}

        {/* Save */}
        <button
          onClick={save}
          disabled={!canSave}
          style={{ width: "100%", border: "none", borderRadius: 16, padding: 15, fontFamily: FREDOKA, fontWeight: 600, fontSize: 17, color: "#fff", cursor: canSave ? "pointer" : "default", background: canSave ? UI.accent : "#E7DDD4", boxShadow: canSave ? "0 8px 20px rgba(255,138,91,0.4)" : "none" }}
        >
          {editing ? "Simpan perubahan" : "Tambah kategori"}
        </button>

        {/* Delete (edit mode only) */}
        {editing && (
          <>
            <button
              onClick={() => canDelete && setConfirmDel(true)}
              disabled={!canDelete}
              style={{ width: "100%", marginTop: 10, border: "none", borderRadius: 16, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: canDelete ? UI.bad : UI.sub, background: "transparent", cursor: canDelete ? "pointer" : "default" }}
            >
              Hapus kategori
            </button>
            {blockReason && (
              <div style={{ fontSize: 12.5, color: UI.sub, textAlign: "center", marginTop: -4 }}>{blockReason}</div>
            )}
          </>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDel && category && (
        <div
          onClick={(e) => { e.stopPropagation(); setConfirmDel(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(63,53,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          className="anim-fade"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="anim-pop"
            style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 24, padding: "26px 24px", textAlign: "center" }}
          >
            <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, color: UI.ink }}>Hapus kategori ini?</div>
            <div style={{ fontSize: 14, color: UI.sub, marginTop: 8, lineHeight: 1.5 }}>
              {category.name}. Bisa diurungkan setelahnya.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setConfirmDel(false)}
                style={{ flex: 1, border: "none", borderRadius: 14, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: UI.sub, background: UI.faint, cursor: "pointer" }}
              >
                Batal
              </button>
              <button
                onClick={doDelete}
                style={{ flex: 1.2, border: "none", borderRadius: 14, padding: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, color: "#fff", background: UI.bad, cursor: "pointer" }}
              >
                Ya, hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
