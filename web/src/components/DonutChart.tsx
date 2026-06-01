import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { fmtRpShort } from "@/lib/engine";

interface Segment {
  value: number;
  color: string;
}

// Arc-based donut via stroke-dasharray, center total label. Faithful port.
export function DonutChart({
  segments,
  total,
  size = 178,
  stroke = 26,
}: {
  segments: Segment[];
  total: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  // Sweep the whole ring in on mount (mask grows 0 -> full circumference).
  const [grown, setGrown] = React.useState(false);
  React.useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setGrown(true);
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  let off = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={UI.line} strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = total > 0 ? (s.value / total) * c : 0;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-off}
              strokeLinecap="butt"
            />
          );
          off += len;
          return el;
        })}
        {/* growing mask: a cream arc that retreats to reveal the segments */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={UI.card}
          strokeWidth={stroke + 2}
          strokeDasharray={c}
          strokeDashoffset={grown ? -c : 0}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 12, color: UI.sub, fontWeight: 600 }}>Total</div>
        <div style={{ fontFamily: FREDOKA, fontSize: 22, fontWeight: 600, color: UI.ink }}>
          {fmtRpShort(total)}
        </div>
      </div>
    </div>
  );
}
