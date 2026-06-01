"use client";

import React from "react";
import Cropper from "react-easy-crop";
import { UI, FREDOKA } from "@/lib/ui";
import { cropImage, type CropArea, type CompressedImage } from "@/lib/image";

interface CropEditorProps {
  src: string; // image to edit (data/object/signed URL)
  onDone: (img: CompressedImage) => void;
  onCancel: () => void;
}

// Full-screen crop + rotate editor. The cropped/rotated result is downscaled
// and JPEG-compressed by cropImage() before it bubbles up for saving.
export function CropEditor({ src, onDone, onCancel }: CropEditorProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [aspect, setAspect] = React.useState(3 / 4);
  const [area, setArea] = React.useState<CropArea | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Match the crop frame to the photo's own proportions so nothing is cropped
  // away by default; the user zooms/pans/rotates to refine.
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setAspect(img.width / img.height || 3 / 4);
    img.src = src;
  }, [src]);

  const onComplete = React.useCallback((_area: unknown, areaPixels: CropArea) => setArea(areaPixels), []);

  const apply = async () => {
    if (!area || busy) return;
    setBusy(true);
    try {
      onDone(await cropImage(src, area, rotation));
    } finally {
      setBusy(false);
    }
  };

  const btn: React.CSSProperties = {
    border: "none",
    borderRadius: 14,
    padding: "13px 16px",
    fontFamily: FREDOKA,
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    background: "rgba(255,255,255,0.16)",
    color: "#fff",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000", display: "flex", flexDirection: "column" }}
      className="anim-fade"
    >
      <div style={{ position: "relative", flex: 1 }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          minZoom={0.5}
          restrictPosition={false}
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onComplete}
        />
      </div>
      <div style={{ padding: "14px 16px calc(16px + env(safe-area-inset-bottom))", background: "#000", display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          style={{ width: "100%", accentColor: UI.accent }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setRotation((r) => (r + 90) % 360)} style={btn}>
            Putar 90°
          </button>
          <button onClick={onCancel} style={btn}>
            Batal
          </button>
          <button onClick={apply} disabled={busy} style={{ ...btn, flex: 1, background: UI.accent }}>
            {busy ? "Menyimpan…" : "Selesai"}
          </button>
        </div>
      </div>
    </div>
  );
}
