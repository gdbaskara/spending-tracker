"use client";

import { getSupabase } from "./supabase";

// Client helper: downscale a captured receipt photo (privacy + payload size),
// POST it to the scan endpoint, and return the structured result.
export interface ScanResult {
  amount: number;
  spent_at: string | null;
  merchant: string | null;
  description: string | null;
  category_id: string;
  confidence: "high" | "medium" | "low";
}

// Downscale to max 1280px on the long edge, JPEG q0.8. Keeps text legible while
// shrinking a 4MB phone photo to a few hundred KB.
async function downscale(file: File, maxEdge = 1280): Promise<{ base64: string; mimeType: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  return { base64: dataUrl, mimeType: "image/jpeg" };
}

export async function scanReceipt(file: File): Promise<ScanResult> {
  const { base64, mimeType } = await downscale(file);

  // Attach the Supabase session token so the server can verify the caller is
  // logged in (the scan endpoint is gated to authenticated users).
  const sb = getSupabase();
  const token = sb ? (await sb.auth.getSession()).data.session?.access_token : null;
  if (!token) {
    throw new Error("Masuk dulu untuk scan struk ya.");
  }

  const res = await fetch("/api/scan-receipt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ image: base64, mimeType }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Gagal memindai (HTTP ${res.status})`);
  }
  return (await res.json()) as ScanResult;
}
