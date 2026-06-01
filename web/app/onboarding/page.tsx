"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UI, FREDOKA } from "@/lib/ui";
import { Mascot } from "@/components/Mascot";
import { Avatar } from "@/components/primitives";
import { getSupabase } from "@/lib/supabase";
import {
  createHousehold,
  joinHousehold,
  getMembership,
  seedHouseholdCategories,
  seedHouseholdSample,
} from "@/lib/db";
import {
  CATEGORY_LIST,
  PROFILES,
  SEED_EXPENSES,
  SEED_RECURRING,
  SEED_SETTLEMENTS,
} from "@/lib/seed";
import type { PersonId } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const sb = getSupabase();
  const [person, setPerson] = React.useState<PersonId>("mei");
  const [mode, setMode] = React.useState<"create" | "join">("create");
  const [joinId, setJoinId] = React.useState("");
  const [withSample, setWithSample] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      if (!sb) return;
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const m = await getMembership(sb, session.user.id);
      if (m) router.push("/");
    })();
  }, [sb, router]);

  const finish = async () => {
    if (!sb) {
      setMsg("Supabase belum dikonfigurasi.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const userId = session.user.id;
      const p = PROFILES[person];
      if (mode === "create") {
        const hid = await createHousehold(sb, userId, {
          householdName: "Rumah Mei & Baskara",
          personKey: person,
          name: p.name,
          color: p.color,
        });
        if (!hid) throw new Error("Gagal membuat rumah tangga.");
        await seedHouseholdCategories(sb, hid, CATEGORY_LIST);
        if (withSample)
          await seedHouseholdSample(sb, hid, SEED_EXPENSES, SEED_SETTLEMENTS, SEED_RECURRING);
        setMsg(`Rumah dibuat! Bagikan ID ini ke pasanganmu: ${hid}`);
        setTimeout(() => router.push("/"), 1400);
      } else {
        const ok = await joinHousehold(sb, userId, {
          householdId: joinId.trim(),
          personKey: person,
          name: p.name,
          color: p.color,
        });
        if (!ok) throw new Error("Gagal gabung. Cek ID rumah tangganya.");
        router.push("/");
      }
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
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <Mascot size={84} mood="happy" />
          <div style={{ fontFamily: FREDOKA, fontWeight: 700, fontSize: 24, color: UI.ink, marginTop: 8 }}>Halo! Kamu siapa?</div>
          <div style={{ fontSize: 14, color: UI.sub, marginTop: 4 }}>Pilih identitasmu di rumah ini</div>
        </div>

        {/* Person */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          {(["mei", "bas"] as const).map((p) => (
            <div
              key={p}
              onClick={() => setPerson(p)}
              style={{
                flex: 1,
                background: "#fff",
                borderRadius: 18,
                padding: "18px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                boxShadow: person === p ? `0 0 0 2px ${PROFILES[p].color}` : "0 4px 12px rgba(196,170,142,0.12)",
              }}
            >
              <Avatar pid={p} size={48} />
              <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 16, color: UI.ink }}>{PROFILES[p].name}</span>
            </div>
          ))}
        </div>

        {/* Create / join */}
        <div style={{ display: "flex", gap: 5, background: UI.faint, borderRadius: 16, padding: 5, marginBottom: 14 }}>
          {([["create", "Buat rumah baru"], ["join", "Gabung rumah"]] as const).map(([m, label]) => (
            <div
              key={m}
              onClick={() => setMode(m)}
              style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 13, fontFamily: FREDOKA, fontWeight: 600, fontSize: 13.5, cursor: "pointer", background: mode === m ? "#fff" : "transparent", color: mode === m ? UI.ink : UI.sub, boxShadow: mode === m ? "0 4px 12px rgba(196,170,142,0.18)" : "none" }}
            >
              {label}
            </div>
          ))}
        </div>

        {mode === "join" ? (
          <input style={input} placeholder="ID rumah tangga" value={joinId} onChange={(e) => setJoinId(e.target.value)} />
        ) : (
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 4px", fontSize: 14, color: UI.ink, cursor: "pointer" }}>
            <input type="checkbox" checked={withSample} onChange={(e) => setWithSample(e.target.checked)} />
            Isi dengan data contoh (biar nggak kosong)
          </label>
        )}

        {msg && <div style={{ fontSize: 13, color: UI.accentDk, margin: "4px 2px 12px", lineHeight: 1.5, wordBreak: "break-all" }}>{msg}</div>}

        <button
          onClick={finish}
          disabled={busy}
          style={{ width: "100%", border: "none", borderRadius: 16, padding: 15, fontFamily: FREDOKA, fontWeight: 600, fontSize: 16, color: "#fff", background: UI.accent, boxShadow: "0 8px 20px rgba(255,138,91,0.4)", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, marginTop: 6 }}
        >
          {busy ? "Sebentar…" : "Mulai"}
        </button>
      </div>
    </div>
  );
}
