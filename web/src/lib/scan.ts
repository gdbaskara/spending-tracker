"use client";

import { getSupabase } from "./supabase";
import { compressImage } from "./image";

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

export async function scanReceipt(file: File): Promise<ScanResult> {
  // Reuse the shared compressor (resize + JPEG) for the OCR payload.
  const { dataUrl: base64 } = await compressImage(file);
  const mimeType = "image/jpeg";

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
