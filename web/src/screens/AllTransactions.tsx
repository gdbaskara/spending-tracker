"use client";

import React from "react";
import { UI, card, FREDOKA } from "@/lib/ui";
import { fmtRp, dateLabel, SHORT_MONTHS } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { Avatar, CatIcon } from "@/components/primitives";
import { PROFILES } from "@/lib/seed";
import type { Expense, PersonId } from "@/lib/types";

// Full, searchable & filterable transaction list — for monthly checking and
// consolidation. Grouped by date; tap a row to edit.
export function AllTransactions({ onEdit }: { onEdit: (e: Expense) => void }) {
  const { expenses, categories } = useStore();
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<string>("all");
  const [who, setWho] = React.useState<PersonId | "all">("all");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return expenses
      .filter((e) => (cat === "all" ? true : e.category_id === cat))
      .filter((e) => (who === "all" ? true : e.payer_id === who))
      .filter((e) => (needle ? e.description.toLowerCase().includes(needle) : true))
      .slice()
      .sort((a, b) => (a.spent_at < b.spent_at ? 1 : -1));
  }, [expenses, q, cat, who]);

  const sum = filtered.reduce((s, e) => s + e.amount, 0);

  // group by YYYY-MM
  const groups = React.useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const k = e.spent_at.slice(0, 7);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const monthName = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return `${SHORT_MONTHS[m - 1]} ${y}`;
  };

  const field: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", border: "none", background: "#fff", borderRadius: 14,
    padding: "12px 15px", fontSize: 15, color: UI.ink, outline: "none",
    boxShadow: "0 4px 12px rgba(196,170,142,0.12)",
  };
  const pill = (active: boolean): React.CSSProperties => ({
    padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
    background: active ? UI.accentSoft : "#fff", color: active ? UI.accentDk : UI.sub,
    boxShadow: "0 3px 9px rgba(196,170,142,0.1)",
  });

  return (
    <div className="stagger" style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari transaksi…" style={field} />

      {/* person filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div onClick={() => setWho("all")} style={pill(who === "all")}>Semua orang</div>
        {(["mei", "bas"] as const).map((p) => (
          <div key={p} onClick={() => setWho(p)} style={pill(who === p)}>{PROFILES[p].name}</div>
        ))}
      </div>

      {/* category filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div onClick={() => setCat("all")} style={pill(cat === "all")}>Semua kategori</div>
        {categories.map((c) => (
          <div key={c.id} onClick={() => setCat(c.id)} style={pill(cat === c.id)}>{c.name}</div>
        ))}
      </div>

      {/* summary */}
      <div style={{ ...card, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, color: UI.sub, fontWeight: 600 }}>{filtered.length} transaksi</span>
        <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 18, color: UI.ink }}>{fmtRp(sum)}</span>
      </div>

      {groups.length === 0 && (
        <div style={{ ...card, padding: 28, textAlign: "center", color: UI.sub }}>Nggak ada transaksi yang cocok 🔍</div>
      )}

      {groups.map(([key, items]) => (
        <div key={key}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: UI.sub, letterSpacing: 0.3, margin: "4px 4px 8px" }}>
            {monthName(key).toUpperCase()}
          </div>
          <div style={{ ...card, padding: "4px 20px" }}>
            {items.map((e, i) => (
              <div
                key={e.id}
                onClick={() => onEdit(e)}
                className="press"
                style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", borderTop: i ? `1px solid ${UI.line}` : "none", cursor: "pointer" }}
              >
                <CatIcon cat={e.category_id} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: UI.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {e.description || PROFILES[e.payer_id].name}
                    {e.recurring ? <span style={{ fontSize: 11, color: UI.sub, fontWeight: 600 }}> · 🔁</span> : null}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <Avatar pid={e.payer_id} size={15} />
                    <span style={{ fontSize: 12.5, color: UI.sub, fontWeight: 500, whiteSpace: "nowrap" }}>
                      {PROFILES[e.payer_id].name} · {dateLabel(e.spent_at)}
                      {e.split_type === "full" ? " · sendiri" : ""}
                    </span>
                  </div>
                </div>
                <div style={{ fontFamily: FREDOKA, fontSize: 15, fontWeight: 600, color: UI.ink }}>{fmtRp(e.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
