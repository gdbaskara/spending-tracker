"use client";

// Client-side image compression + crop/rotate, shared by the receipt scanner
// and the receipt attachment. Everything runs on a <canvas>; no upload of the
// original full-resolution photo ever happens.

export interface CompressOpts {
  maxEdge?: number; // longest edge in px
  quality?: number; // JPEG quality 0..1
}

// Balanced default: legible receipts at ~120-180 KB. Keep in sync with the
// value documented in the UI/migration.
export const RECEIPT_COMPRESS: Required<CompressOpts> = { maxEdge: 1280, quality: 0.75 };

export interface CompressedImage {
  blob: Blob; // image/jpeg, ready to upload
  dataUrl: string; // same bytes as a data: URL, for previews / local mode
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Gagal mengompres gambar"));
        const reader = new FileReader();
        reader.onload = () => resolve({ blob, dataUrl: reader.result as string });
        reader.onerror = () => reject(new Error("Gagal membaca gambar"));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = src;
  });
}

/** Downscale + JPEG-compress a whole image file (no crop). */
export async function compressImage(file: File | Blob, opts: CompressOpts = {}): Promise<CompressedImage> {
  const { maxEdge, quality } = { ...RECEIPT_COMPRESS, ...opts };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvasToJpeg(canvas, quality);
}

/**
 * Apply a crop rectangle (in source pixels) and a rotation (degrees) to an
 * image, then downscale + JPEG-compress the result. Used by the crop editor.
 */
export async function cropImage(
  src: string,
  area: CropArea,
  rotation = 0,
  opts: CompressOpts = {}
): Promise<CompressedImage> {
  const { maxEdge, quality } = { ...RECEIPT_COMPRESS, ...opts };
  const img = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;

  // 1) Draw the rotated image onto a scratch canvas big enough to hold it.
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bw = img.width * cos + img.height * sin;
  const bh = img.width * sin + img.height * cos;
  const scratch = document.createElement("canvas");
  scratch.width = Math.round(bw);
  scratch.height = Math.round(bh);
  const sctx = scratch.getContext("2d");
  if (!sctx) throw new Error("Canvas tidak didukung");
  sctx.translate(bw / 2, bh / 2);
  sctx.rotate(rad);
  sctx.drawImage(img, -img.width / 2, -img.height / 2);

  // 2) Copy the crop area out, downscaling to the max edge.
  const scale = Math.min(1, maxEdge / Math.max(area.width, area.height));
  const ow = Math.max(1, Math.round(area.width * scale));
  const oh = Math.max(1, Math.round(area.height * scale));
  const out = document.createElement("canvas");
  out.width = ow;
  out.height = oh;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas tidak didukung");
  octx.drawImage(scratch, area.x, area.y, area.width, area.height, 0, 0, ow, oh);

  return canvasToJpeg(out, quality);
}
