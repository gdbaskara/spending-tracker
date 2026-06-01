"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";

interface ReceiptFieldProps {
  src: string | null; // current receipt preview, null if none/removed
  busy?: boolean; // compressing / loading the image
  onPick: (file: File) => void; // attach or replace from a chosen photo
  onCrop: () => void; // open the crop/rotate editor
  onRemove: () => void; // drop the receipt
}

// Shows the attached receipt with view / crop / replace / remove actions, or an
// attach button when there is none. Capturing + scanning still happens via the
// modal's "Scan struk" button; this field manages the saved image itself.
export function ReceiptField({ src, busy, onPick, onCrop, onRemove }: ReceiptFieldProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [viewing, setViewing] = React.useState(false);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPick(file);
  };

  const smallBtn: React.CSSProperties = {
    border: "none",
    borderRadius: 11,
    padding: "9px 12px",
    fontFamily: FREDOKA,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    background: "#fff",
    color: UI.ink,
    boxShadow: "0 3px 9px rgba(196,170,142,0.12)",
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
      {src ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <button
            onClick={() => setViewing(true)}
            aria-label="Lihat struk"
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              border: "none",
              padding: 0,
              flexShrink: 0,
              cursor: "pointer",
              overflow: "hidden",
              background: UI.faint,
              boxShadow: "0 3px 9px rgba(196,170,142,0.16)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Struk" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: busy ? 0.5 : 1 }} />
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button onClick={onCrop} disabled={busy} style={smallBtn}>
              Crop & putar
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={busy} style={smallBtn}>
              Ganti
            </button>
            <button onClick={onRemove} disabled={busy} style={{ ...smallBtn, color: UI.bad }}>
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          style={{
            width: "100%",
            marginBottom: 16,
            border: `1.5px dashed ${UI.sub}`,
            borderRadius: 14,
            padding: "12px",
            background: "transparent",
            color: UI.sub,
            fontFamily: FREDOKA,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {busy ? "Memproses…" : "Lampirkan foto struk"}
        </button>
      )}

      {viewing && src && (
        <div
          onClick={() => setViewing(false)}
          style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          className="anim-fade"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Struk" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 14, objectFit: "contain" }} />
        </div>
      )}
    </>
  );
}
