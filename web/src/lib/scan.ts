"use client";

import { getSupabase } from "./supabase";

// Client helper: POST an already-compressed receipt image (a data URL) to the
// scan endpoint and return the structured result. The caller compresses once
// (see lib/image.compressImage) and reuses that same image for storage.
export interface ScanResult {
  amount: number;
  spent_at: string | null;
  merchant: string | null;
  description: string | null;
  category_id: string;
  confidence: "high" | "medium" | "low";
}

export async function scanReceipt(base64: string, mimeType = "image/jpeg"): Promise<ScanResult> {
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
