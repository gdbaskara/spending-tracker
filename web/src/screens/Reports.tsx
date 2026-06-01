"use client";

import React from "react";
import { UI, card, FREDOKA } from "@/lib/ui";
import { fmtRp, fmtRpShort, periodLabel } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { Avatar, CatIcon, BudgetBar } from "@/components/primitives";
import { DonutChart } from "@/components/DonutChart";

const ctitle: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 700,
  color: UI.sub,
  letterSpacing: 0.3,
  marginBottom: 16,
};

export function Reports() {
  const { categories, spendByCat, paid, trend, expenses, period, profiles } = useStore();
  const [yearly, setYearly] = React.useState(false);

  // Real per-category + per-person totals for the selected YEAR (from the ledger).
  const yearAgg = React.useMemo(() => {
    const byCat: Record<string, number> = {};
    const byPerson = { mei: 0, bas: 0 };
    for (const e of expenses) {
      if (Number(e.spent_at.slice(0, 4)) !== period.y) continue;
      byCat[e.category_id] = (byCat[e.category_id] ?? 0) + e.amount;
      byPerson[e.payer_id] += e.amount;
    }
    return { byCat, byPerson };
  }, [expenses, period.y]);

  const catSource = yearly ? yearAgg.byCat : spendByCat;
  const catData = categories
    .map((c) => ({ ...c, val: catSource[c.id] ?? 0 }))
    .filter((c) => c.val > 0)
    .sort((a, b) => b.val - a.val);
  const grand = catData.reduce((s, c) => s + c.val, 0);

  const paidMei = yearly ? yearAgg.byPerson.mei : paid.mei;
  const paidBas = yearly ? yearAgg.byPerson.bas : paid.bas;
  const paidMax = Math.max(paidMei, paidBas, 1);

  const trendMax = Math.max(...trend.map((t) => t.total), 1);
  const curShort = trend[period.m]?.m;

  const segStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 22px",
    borderRadius: 13,
    fontFamily: FREDOKA,
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    whiteSpace: "nowrap",
    background: active ? "#fff" : "transparent",
    color: active ? UI.ink : UI.sub,
    boxShadow: active ? "0 4px 12px rgba(196,170,142,0.18)" : "none",
  });

  return (
    <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Period toggle */}
      <div style={{ display: "inline-flex", gap: 5, background: UI.faint, borderRadius: 16, padding: 5, alignSelf: "flex-start" }}>
        <div onClick={() => setYearly(false)} style={segStyle(!yearly)}>
          {periodLabel(period)}
        </div>
        <div onClick={() => setYearly(true)} style={segStyle(yearly)}>
          Tahun {period.y}
        </div>
      </div>

      {/* Yearly trend */}
      {yearly && (
        <div style={card}>
          <div style={{ ...ctitle, padding: "20px 24px 0", margin: 0 }}>TREN 12 BULAN · {period.y}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 200, padding: "16px 24px 20px" }}>
            {trend.map((t) => {
              const h = t.total ? Math.max((t.total / trendMax) * 100, 3) : 2;
              const cur = t.m === curShort;
              return (
                <div key={t.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ fontSize: 10.5, color: UI.sub, fontWeight: 600, opacity: t.total ? 1 : 0 }}>
                    {fmtRpShort(t.total)}
                  </div>
                  <div className="draw-h" style={{ width: "100%", maxWidth: 46, height: h + "%", borderRadius: 10, background: cur ? UI.accent : t.total ? "#F3D9C6" : UI.line, transformOrigin: "bottom" }} />
                  <span style={{ fontSize: 11.5, color: cur ? UI.accentDk : UI.sub, fontWeight: cur ? 700 : 500 }}>{t.m}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Donut + contribution */}
      <div className="rgrid">
        <div style={{ ...card, padding: 24, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {grand > 0 ? (
            <DonutChart segments={catData.map((c) => ({ color: c.color, value: c.val }))} total={grand} size={210} stroke={30} />
          ) : (
            <div style={{ width: 210, height: 210, display: "flex", alignItems: "center", justifyContent: "center", color: UI.sub, fontSize: 14, textAlign: "center" }}>
              Belum ada pengeluaran di periode ini 🌱
            </div>
          )}
          <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 12 }}>
            {catData.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, color: UI.ink, fontWeight: 600, flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 13, color: UI.sub, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtRpShort(c.val)}</span>
                <span style={{ fontSize: 12, color: UI.sub, fontWeight: 600, width: 38, textAlign: "right" }}>
                  {grand ? Math.round((c.val / grand) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, padding: 24 }}>
          <div style={ctitle}>SIAPA PALING SERING NALANGIN</div>
          {([["mei", paidMei], ["bas", paidBas]] as const).map(([p, v]) => (
            <div key={p} style={{ marginBottom: p === "mei" ? 22 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Avatar pid={p} size={30} />
                <span style={{ fontSize: 15, fontWeight: 600, color: UI.ink, flex: 1 }}>{profiles[p].name}</span>
                <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 17, color: UI.ink }}>{fmtRp(v)}</span>
              </div>
              <div style={{ height: 14, borderRadius: 999, background: UI.faint, overflow: "hidden" }}>
                <div style={{ width: (v / paidMax) * 100 + "%", height: "100%", borderRadius: 999, background: profiles[p].color }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 24, fontSize: 13.5, color: UI.sub, lineHeight: 1.5 }}>
            {profiles[paidMei >= paidBas ? "mei" : "bas"].name} paling sering nalangin {yearly ? `tahun ${period.y}` : "bulan ini"} — sebagian besar buat sewa & tagihan rutin.
          </div>
        </div>
      </div>

      {/* Budget / total per category */}
      <div style={{ ...card, padding: "8px 26px 14px" }}>
        <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, color: UI.ink, padding: "18px 0 4px" }}>
          {yearly ? "Total per kategori" : "Budget per kategori"}
        </div>
        {catData.map((c, i) => {
          const budget = yearly ? null : c.budget;
          const pct = budget ? Math.round((c.val / budget) * 100) : null;
          return (
            <div key={c.id} style={{ padding: "15px 0", borderTop: i ? `1px solid ${UI.line}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: budget ? 10 : 0 }}>
                <CatIcon cat={c.id} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: UI.ink }}>{c.name}</div>
                  {budget && pct! > 100 && (
                    <div style={{ fontSize: 12, color: UI.bad, fontWeight: 600, marginTop: 2 }}>Lewat budget {pct! - 100}% 😮</div>
                  )}
                  {budget && pct! >= 80 && pct! <= 100 && (
                    <div style={{ fontSize: 12, color: UI.warn, fontWeight: 600, marginTop: 2 }}>Hampir habis ({pct}%)</div>
                  )}
                </div>
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 16, color: UI.ink }}>{fmtRpShort(c.val)}</div>
                  {budget && <div style={{ fontSize: 12, color: UI.sub }}>dari {fmtRpShort(budget)}</div>}
                </div>
              </div>
              {budget && <BudgetBar pct={pct!} color={c.color} />}
            </div>
          );
        })}
        {catData.length === 0 && (
          <div style={{ padding: "20px 0", textAlign: "center", color: UI.sub, fontSize: 14 }}>
            Belum ada data buat ditampilkan 🌱
          </div>
        )}
      </div>
    </div>
  );
}
