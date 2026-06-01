// Serverless receipt scanner. Takes a base64 JPEG, asks Gemini Flash to OCR +
// extract amount/date/merchant + classify into our fixed category list, and
// returns structured JSON. The image is forwarded to Google and NOT stored.
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const CATEGORY_IDS = [
  "makan",
  "sewa",
  "tagihan",
  "belanja",
  "hiburan",
  "transport",
  "lainnya",
] as const;

interface ScanResult {
  amount: number; // integer rupiah, 0 if not found
  spent_at: string | null; // YYYY-MM-DD or null
  merchant: string | null;
  description: string | null;
  category_id: (typeof CATEGORY_IDS)[number];
  confidence: "high" | "medium" | "low";
}

const PROMPT = `Kamu membaca struk belanja Indonesia dari sebuah foto. Ekstrak data dan balas HANYA dengan satu objek JSON valid (tanpa markdown, tanpa penjelasan).

Field:
- amount: TOTAL akhir yang dibayar, integer rupiah tanpa titik/koma/simbol (mis. 84000). Pakai grand total / "TOTAL" / jumlah yang dibayar, bukan subtotal atau kembalian. Kalau tidak yakin, 0.
- spent_at: tanggal transaksi format "YYYY-MM-DD". Kalau tidak ada/ragu, null.
- merchant: nama toko/merchant, atau null.
- description: ringkasan singkat isi belanja dalam Bahasa Indonesia (mis. "Makan malam Padang", "Belanja bulanan"), maksimal 5 kata.
- category_id: WAJIB salah satu dari: makan, sewa, tagihan, belanja, hiburan, transport, lainnya.
  Panduan: restoran/cafe/gofood=makan; sewa kontrakan=sewa; listrik/air/internet/pulsa=tagihan; supermarket/minimarket/toko=belanja; bioskop/game/konser=hiburan; bensin/gojek/grab/parkir/tol=transport; sisanya=lainnya.
- confidence: "high" | "medium" | "low" seberapa yakin kamu membaca total & tanggalnya.

Jika foto bukan struk, kembalikan amount 0, category_id "lainnya", confidence "low".`;

// Verify the caller's Supabase session by asking the Auth API who the token
// belongs to. Returns an error response if missing/invalid, else null.
async function requireUser(req: NextRequest): Promise<NextResponse | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    // Auth not configured -> fail closed rather than leave the endpoint open.
    return NextResponse.json({ error: "Auth belum dikonfigurasi." }, { status: 503 });
  }
  if (!token) {
    return NextResponse.json({ error: "Masuk dulu untuk scan struk ya." }, { status: 401 });
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Sesi tidak valid. Masuk lagi ya." }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Gagal memverifikasi sesi." }, { status: 502 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum diset di server." },
      { status: 503 }
    );
  }

  // Gate: only logged-in users may scan (protects the Gemini quota from abuse).
  const authErr = await requireUser(req);
  if (authErr) return authErr;

  let imageBase64: string;
  let mimeType: string;
  try {
    const body = await req.json();
    imageBase64 = String(body.image ?? "");
    mimeType = String(body.mimeType ?? "image/jpeg");
    if (!imageBase64) throw new Error("no image");
    // Only forward known image types to Gemini (don't proxy arbitrary content).
    if (!new Set(["image/jpeg", "image/webp", "image/png"]).has(mimeType)) {
      throw new Error("bad mime");
    }
    // strip a data URL prefix if present
    const comma = imageBase64.indexOf(",");
    if (imageBase64.startsWith("data:") && comma !== -1) {
      imageBase64 = imageBase64.slice(comma + 1);
    }
    // ~8MB base64 ceiling to avoid abuse
    if (imageBase64.length > 8_000_000) throw new Error("image too large");
  } catch {
    return NextResponse.json({ error: "Payload gambar tidak valid." }, { status: 400 });
  }

  // Current Flash model. gemini-2.0-flash is blocked for new projects; 2.5-flash
  // is the supported cheap+accurate vision model. Override via GEMINI_MODEL.
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch {
    return NextResponse.json({ error: "Gagal menghubungi layanan OCR." }, { status: 502 });
  }

  if (!geminiRes.ok) {
    // Drain the upstream body but do NOT forward it — Gemini error payloads can
    // leak model/billing/config details. Return only a friendly message.
    await geminiRes.text().catch(() => "");
    let msg = "Layanan OCR lagi bermasalah, coba lagi nanti.";
    if (geminiRes.status === 429) {
      msg = "Kuota OCR habis / belum aktif. Cek billing di Google AI Studio, lalu coba lagi.";
    } else if (geminiRes.status === 400 || geminiRes.status === 403) {
      msg = "API key OCR tidak valid. Periksa GEMINI_API_KEY.";
    }
    return NextResponse.json({ error: msg, status: geminiRes.status }, { status: 502 });
  }

  const data = await geminiRes.json().catch(() => null);
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: "OCR tidak mengembalikan hasil." }, { status: 502 });
  }

  const parsed = safeParse(text);
  if (!parsed) {
    return NextResponse.json({ error: "Hasil OCR tidak bisa dibaca." }, { status: 502 });
  }

  const result: ScanResult = {
    amount: clampInt(parsed.amount),
    spent_at: validDate(parsed.spent_at),
    merchant: trimOrNull(parsed.merchant),
    description: trimOrNull(parsed.description),
    category_id: CATEGORY_IDS.includes(parsed.category_id) ? parsed.category_id : "lainnya",
    confidence: ["high", "medium", "low"].includes(parsed.confidence) ? parsed.confidence : "low",
  };

  return NextResponse.json(result);
}

function safeParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    // tolerate stray markdown fences or prose around the JSON
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

function clampInt(v: unknown): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 999_999_999);
}

function validDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, 80) : null;
}
