"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";

interface ReceiptFieldProps {
  src: string | null; // current receipt preview, null if none/removed
  busy?: boolean; // compressing / reading the image
  // Attach a photo. `scan` requests auto-OCR (true from camera, false from gallery).
  onPick: (file: File, scan: boolean) => void;
  onCrop: () => void; // open the crop/rotate editor
  onRemove: () => void; // drop the receipt
  onScan?: () => void; // read the attached photo on demand
  canScan?: boolean; // a freshly attached photo is available to read
}

// Single receipt control. When empty it offers two sources: Kamera (capture,
// auto-reads) and Galeri (attach only). Once a photo is attached it shows a
// thumbnail with read / crop / replace / remove.
export function ReceiptField({ src, busy, onPick, onCrop, onRemove, onScan, canScan }: ReceiptFieldProps) {
  const cameraRef = React.useRef<HTMLInputElement>(null); // forces the camera
  const galleryRef = React.useRef<HTMLInputElement>(null); // camera OR gallery
  const [viewing, setViewing] = React.useState(false);

  // Never leave the lightbox open for an image that's gone (e.g. after removal).
  React.useEffect(() => {
    if (!src) setViewing(false);
  }, [src]);

  // Close the lightbox on Escape. Capture-phase + stopPropagation so the host
  // modal's own Escape handler doesn't also fire and close the whole modal.
  React.useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setViewing(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [viewing]);

  const pick = (scan: boolean) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPick(file, scan);
  };

  const sourceBtn: React.CSSProperties = {
    flex: 1,
    border: `1.5px dashed ${UI.accent}`,
    borderRadius: 14,
    padding: "13px",
    background: UI.accentSoft,
    color: UI.accentDk,
    fontFamily: FREDOKA,
    fontWeight: 600,
    fontSize: 14,
    cursor: busy ? "default" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={pick(true)} style={{ display: "none" }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={pick(false)} style={{ display: "none" }} />

      {src ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <button
            onClick={() => setViewing(true)}
            aria-label="Lihat struk"
            style={{ width: 64, height: 64, borderRadius: 14, border: "none", padding: 0, flexShrink: 0, cursor: "pointer", overflow: "hidden", background: UI.faint, boxShadow: "0 3px 9px rgba(196,170,142,0.16)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Struk" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: busy ? 0.5 : 1 }} />
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {onScan && canScan && (
              <button onClick={onScan} disabled={busy} style={{ ...smallBtn, color: UI.accentDk, background: UI.accentSoft }}>
                Baca otomatis
              </button>
            )}
            <button onClick={onCrop} disabled={busy} style={smallBtn}>
              Crop &amp; putar
            </button>
            <button onClick={() => galleryRef.current?.click()} disabled={busy} style={smallBtn}>
              Ganti
            </button>
            <button onClick={onRemove} disabled={busy} style={{ ...smallBtn, color: UI.bad }}>
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={() => cameraRef.current?.click()} disabled={busy} style={sourceBtn}>
            <CameraIcon /> {busy ? "Memproses…" : "Kamera"}
          </button>
          <button onClick={() => galleryRef.current?.click()} disabled={busy} style={sourceBtn}>
            <GalleryIcon /> Galeri
          </button>
        </div>
      )}

      {viewing && src && (
        <div
          onClick={() => setViewing(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau struk"
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

function CameraIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
