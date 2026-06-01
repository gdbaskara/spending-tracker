"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { fmtRp } from "@/lib/engine";

interface AmountInputProps {
  /** Current amount in integer rupiah. */
  amount: number;
  /** Receives the raw input string; parse with parseRpInput upstream. */
  onAmount: (raw: string) => void;
  /** Focus on mount so the system numpad opens (skip when editing). */
  autoFocus?: boolean;
}

/**
 * The "Jumlah" field — a native numeric input so mobile/iPad shows the system
 * numpad instead of an in-app keypad. The value is the formatted rupiah string
 * (e.g. "Rp1.250.000"); digits typed are parsed back into integer rupiah by the
 * parent via parseRpInput.
 */
export function AmountInput({ amount, onAmount, autoFocus }: AmountInputProps) {
  return (
    <>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: UI.sub }}>Jumlah</div>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus={autoFocus}
        value={amount > 0 ? fmtRp(amount) : ""}
        onChange={(e) => onAmount(e.target.value)}
        placeholder="Rp0"
        aria-label="Jumlah"
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "none",
          background: "transparent",
          outline: "none",
          textAlign: "center",
          fontFamily: FREDOKA,
          fontWeight: 600,
          fontSize: 44,
          lineHeight: 1.1,
          color: amount > 0 ? UI.ink : "#D8CFC6",
          caretColor: UI.accent,
        }}
      />
    </>
  );
}
