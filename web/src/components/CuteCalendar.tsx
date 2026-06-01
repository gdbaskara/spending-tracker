"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { ST_MONTHS, todayParts, isoOf } from "@/lib/engine";

const WEEKDAYS = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];

// Inline calendar; Monday-first grid, future dates disabled (cannot log ahead),
// nav goes back two years and forward to the current month.
export function CuteCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const [vy, vm, vd] = value.split("-").map(Number);
  const [view, setView] = React.useState<{ y: number; m: number }>({
    y: vy,
    m: vm - 1,
  });
  // Real "today" — stable for the lifetime of this calendar instance.
  const [T] = React.useState(todayParts);

  const atMin = view.y < T.y - 2 || (view.y === T.y - 2 && view.m === 0);
  const atMax = view.y > T.y || (view.y === T.y && view.m >= T.m);

  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isFuture = (d: number) => {
    if (view.y > T.y) return true;
    if (view.y === T.y && view.m > T.m) return true;
    if (view.y === T.y && view.m === T.m && d > T.d) return true;
    return false;
  };

  const navBtn = (dir: -1 | 1, disabled: boolean) => (
    <button
      onClick={() =>
        setView((v) => {
          let m = v.m + dir;
          let y = v.y;
          if (m < 0) {
            m = 11;
            y -= 1;
          }
          if (m > 11) {
            m = 0;
            y += 1;
          }
          return { y, m };
        })
      }
      disabled={disabled}
      style={{
        border: "none",
        background: "transparent",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.3 : 1,
        fontSize: 18,
        color: UI.ink,
        padding: "2px 8px",
        lineHeight: 1,
      }}
    >
      {dir < 0 ? "‹" : "›"}
    </button>
  );

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: "14px 14px 8px",
        boxShadow: "0 6px 18px rgba(196,170,142,0.16)",
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        {navBtn(-1, atMin)}
        <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 15, color: UI.ink }}>
          {ST_MONTHS[view.m]} {view.y}
        </div>
        {navBtn(1, atMax)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: UI.sub }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const selected = view.y === vy && view.m === vm - 1 && d === vd;
          const today = view.y === T.y && view.m === T.m && d === T.d;
          const future = isFuture(d);
          return (
            <button
              key={i}
              disabled={future}
              onClick={() => onChange(isoOf(view.y, view.m, d))}
              style={{
                aspectRatio: "1 / 1",
                border: today && !selected ? `1.5px solid ${UI.accent}` : "none",
                borderRadius: 12,
                background: selected ? UI.accent : "transparent",
                color: selected ? "#fff" : future ? "#D8CFC6" : UI.ink,
                fontWeight: selected ? 700 : 500,
                fontSize: 13.5,
                cursor: future ? "default" : "pointer",
                boxShadow: selected ? "0 4px 10px rgba(255,138,91,0.4)" : "none",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
