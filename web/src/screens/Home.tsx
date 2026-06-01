"use client";

import React from "react";
import { UI, card, FREDOKA } from "@/lib/ui";
import { fmtRp, fmtRpShort, dateLabel } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { Avatar, CatIcon } from "@/components/primitives";
import { DonutChart } from "@/components/DonutChart";
import { Mascot } from "@/components/Mascot";
import { useCountUp } from "@/lib/useCountUp";
import type { Expense } from "@/lib/types";

export function Home({
  onSettle,
  onEdit,
  onViewAll,
}: {
  onSettle: () => void;
  onEdit: (e: Expense) => void;
  onViewAll: () => void;
}) {
  const { total, prevTotal, owes, categories, spendByCat, monthExpenses, profiles } = useStore();

  const recent = monthExpenses.slice(0, 5);
  const animatedTotal = useCountUp(total, 900);

  // Real month-over-month comparison (replaces the old hardcoded "5%").
  const momPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
  const momUp = momPct !== null && momPct >= 0;

  // Spending-by-category donut (only categories with spend this month).
  const catSpend = categories
    .map((c) => ({ ...c, val: spendByCat[c.id] ?? 0 }))
    .filter((c) => c.val > 0)
    .sort((a, b) => b.val - a.val);
  const topCats = catSpend.slice(0, 5);

  return (
    <div className="dash stagger">
      {/* ── LEFT COLUMN ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Hero */}
        <div
          style={{
            padding: "30px 32px",
            borderRadius: 28,
            background: "linear-gradient(120deg,#FF9E6B,#FF7E8A)",
            boxShadow: "0 10px 30px rgba(196,170,142,0.14)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="hero-sheen" />
          <div style={{ position: "absolute", right: 4, bottom: -18, opacity: 0.95 }}>
            <div className="anim-bob">
              <Mascot size={150} mood="happy" />
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 15, fontWeight: 600 }}>
            Pengeluaran bulan ini
          </div>
          <div
            style={{
              fontFamily: FREDOKA,
              fontWeight: 600,
              fontSize: "clamp(40px,5vw,56px)",
              color: "#fff",
              lineHeight: 1.05,
              marginTop: 6,
              letterSpacing: -1,
              position: "relative",
            }}
          >
            {fmtRp(animatedTotal)}
          </div>
          {momPct !== null && (
            <div
              style={{
                display: "inline-flex",
                gap: 6,
                marginTop: 14,
                padding: "7px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.22)",
                color: "#fff",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              {momUp ? "▲" : "▼"} {Math.abs(momPct)}% dari bulan lalu
            </div>
          )}
        </div>

        {/* Spending breakdown (donut) */}
        <div style={{ ...card, padding: "20px 26px 24px" }}>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, color: UI.ink, marginBottom: 8 }}>
            Pengeluaran per kategori
          </div>
          {topCats.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
              <DonutChart
                segments={catSpend.map((c) => ({ color: c.color, value: c.val }))}
                total={total}
                size={190}
                stroke={28}
              />
              <div style={{ flex: 1, minWidth: 170, display: "flex", flexDirection: "column", gap: 11 }}>
                {topCats.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 11, height: 11, borderRadius: 4, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: UI.ink, fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: 13, color: UI.sub, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtRpShort(c.val)}</span>
                    <span style={{ fontSize: 12, color: UI.sub, fontWeight: 600, width: 36, textAlign: "right" }}>
                      {total ? Math.round((c.val / total) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: "28px 0", textAlign: "center", color: UI.sub, fontSize: 14 }}>
              Belum ada pengeluaran bulan ini 🌱
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Saldo */}
        <div className="press" style={{ ...card, padding: 24, cursor: "pointer" }} onClick={onSettle}>
          <div style={{ fontSize: 14, color: UI.sub, fontWeight: 600, marginBottom: 14 }}>Saldo bareng</div>
          {owes ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", width: 70, height: 44, flexShrink: 0 }}>
                  <div style={{ position: "absolute", left: 0 }}>
                    <Avatar pid={owes.debtor} size={44} />
                  </div>
                  <div style={{ position: "absolute", left: 26 }}>
                    <Avatar pid={owes.creditor} size={44} />
                  </div>
                </div>
                <div style={{ fontSize: 15.5, color: UI.ink, fontWeight: 600, lineHeight: 1.3 }}>
                  {profiles[owes.debtor].name} utang ke {profiles[owes.creditor].name}
                </div>
              </div>
              <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 32, color: UI.accentDk, marginTop: 8 }}>
                {fmtRp(owes.amt)}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSettle();
                }}
                className="press"
                style={{
                  width: "100%",
                  marginTop: 16,
                  border: "none",
                  padding: 13,
                  borderRadius: 16,
                  background: UI.accent,
                  color: "#fff",
                  fontFamily: FREDOKA,
                  fontWeight: 600,
                  fontSize: 15.5,
                  cursor: "pointer",
                  boxShadow: "0 8px 18px rgba(255,138,91,0.35)",
                }}
              >
                Lunaskan
              </button>
            </>
          ) : (
            <div style={{ fontSize: 16, color: UI.ink, fontWeight: 600 }}>🎉 Kalian lagi impas!</div>
          )}
        </div>

        {/* Recent transactions (top 5) */}
        <div style={{ ...card, padding: "8px 22px 12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "16px 0 4px" }}>
            <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 18, color: UI.ink }}>
              Transaksi terbaru
            </div>
            <span onClick={onViewAll} style={{ color: UI.accentDk, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Lihat semua
            </span>
          </div>
          {recent.length === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", color: UI.sub, fontSize: 14 }}>
              Belum ada transaksi 🌱
            </div>
          )}
          {recent.map((e, i) => (
            <div
              key={e.id}
              onClick={() => onEdit(e)}
              className="press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                padding: "12px 0",
                borderTop: i ? `1px solid ${UI.line}` : "none",
                cursor: "pointer",
              }}
            >
              <CatIcon cat={e.category_id} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: UI.ink,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {e.description || profiles[e.payer_id].name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <Avatar pid={e.payer_id} size={15} />
                  <span style={{ fontSize: 12.5, color: UI.sub, fontWeight: 500, whiteSpace: "nowrap" }}>
                    {profiles[e.payer_id].name} · {dateLabel(e.spent_at)}
                  </span>
                </div>
              </div>
              <div style={{ fontFamily: FREDOKA, fontSize: 15, fontWeight: 600, color: UI.ink }}>
                {fmtRp(e.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
