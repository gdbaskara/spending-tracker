"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UI, FREDOKA } from "@/lib/ui";
import { Mascot } from "@/components/Mascot";
import { getSupabase } from "@/lib/supabase";
import { getMembership } from "@/lib/db";

// Signup is gated behind an env flag so it can be locked down without a code
// change. Set NEXT_PUBLIC_ALLOW_SIGNUP=true to re-open registration.
const SIGNUP_OPEN = process.env.NEXT_PUBLIC_ALLOW_SIGNUP === "true";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"in" | "up">("in");
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const sb = getSupabase();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) {
      setMsg("Supabase belum dikonfigurasi. Isi .env.local dulu ya.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "up") {
        if (!SIGNUP_OPEN) {
          setMsg("Pendaftaran lagi ditutup.");
          return;
        }
        const { error } = await sb.auth.signUp({ email, password: pw });
        if (error) throw error;
        const {
          data: { session },
        } = await sb.auth.getSession();
        if (!session) {
          setMsg("Cek email kamu untuk konfirmasi, lalu masuk ya.");
          setMode("in");
          return;
        }
        router.push("/onboarding");
        return;
      }
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      const membership = data.user ? await getMembership(sb, data.user.id) : null;
      router.push(membership ? "/" : "/onboarding");
    } catch (err: any) {
      setMsg(err?.message ?? "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  };

  const input: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "none",
    background: "#fff",
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 15,
    color: UI.ink,
    outline: "none",
    boxShadow: "0 4px 12px rgba(196,170,142,0.12)",
    marginBottom: 12,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <Mascot size={96} mood="happy" />
          <div style={{ fontFamily: FREDOKA, fontWeight: 700, fontSize: 30, color: UI.ink, marginTop: 8 }}>Celengin</div>
          <div style={{ fontSize: 14.5, color: UI.sub, marginTop: 4 }}>Catat pengeluaran bareng, anti ribut 💕</div>
        </div>

        {SIGNUP_OPEN && (
          <div style={{ display: "flex", gap: 5, background: UI.faint, borderRadius: 16, padding: 5, marginBottom: 18 }}>
            {(["in", "up"] as const).map((m) => (
              <div
                key={m}
                onClick={() => setMode(m)}
                style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 14.5, cursor: "pointer", background: mode === m ? "#fff" : "transparent", color: mode === m ? UI.ink : UI.sub, boxShadow: mode === m ? "0 4px 12px rgba(196,170,142,0.18)" : "none" }}
              >
                {m === "in" ? "Masuk" : "Daftar"}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submit}>
          <input style={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={input} type="password" placeholder="Kata sandi" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />
          {msg && <div style={{ fontSize: 13, color: UI.accentDk, margin: "4px 2px 12px", lineHeight: 1.5 }}>{msg}</div>}
          <button
            type="submit"
            disabled={busy}
            style={{ width: "100%", border: "none", borderRadius: 16, padding: 15, fontFamily: FREDOKA, fontWeight: 600, fontSize: 16, color: "#fff", background: UI.accent, boxShadow: "0 8px 20px rgba(255,138,91,0.4)", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Sebentar…" : mode === "in" ? "Masuk" : "Buat akun"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <a href="/" style={{ fontSize: 13.5, color: UI.sub, fontWeight: 600, textDecoration: "none" }}>
            Lihat demo tanpa masuk →
          </a>
        </div>
      </div>
    </div>
  );
}
