"use client";

import React from "react";
import { UI, FREDOKA } from "@/lib/ui";
import { useStore } from "@/lib/store";
import { Avatar } from "./primitives";
import { Mascot } from "./Mascot";
import { NavIcon, type NavKey } from "./icons";
import { Home } from "@/screens/Home";
import { Reports } from "@/screens/Reports";
import { Settle } from "@/screens/Settle";
import { Settings } from "@/screens/Settings";
import { AddModal } from "@/screens/AddModal";
import { AllTransactions } from "@/screens/AllTransactions";
import { periodLabel, stepPeriod } from "@/lib/engine";
import type { Expense } from "@/lib/types";

const NAV: [NavKey, string][] = [
  ["home", "Beranda"],
  ["reports", "Laporan"],
  ["settle", "Saldo"],
  ["settings", "Pengaturan"],
];
const TITLES: Record<NavKey, string> = {
  home: "Beranda",
  reports: "Laporan",
  settle: "Saldo Bareng",
  settings: "Pengaturan",
};

const PlusIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Activate a clickable element on Enter/Space for keyboard accessibility.
function activateOnKey(e: React.KeyboardEvent, action: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    action();
  }
}

type Screen = NavKey | "all";

export function WebApp() {
  const { ready, me, profiles, period, setPeriod } = useStore();
  const [screen, setScreen] = React.useState<Screen>("home");
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const myName = profiles[me].name;

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="anim-bob">
          <Mascot size={90} mood="sleepy" />
        </div>
      </div>
    );
  }

  const body: Record<Screen, React.ReactNode> = {
    home: <Home onSettle={() => setScreen("settle")} onEdit={setEditing} onViewAll={() => setScreen("all")} />,
    reports: <Reports />,
    settle: <Settle />,
    settings: <Settings />,
    all: <AllTransactions onEdit={setEditing} />,
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <Mascot size={34} mood="happy" />
          </div>
          <div className="sidebar-label">
            <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 18, color: UI.ink }}>Celengin</div>
            <div style={{ fontSize: 11.5, color: UI.sub }}>Mei &amp; Baskara</div>
          </div>
        </div>

        <button className="add-btn" onClick={() => setAdding(true)}>
          <PlusIcon />
          <span className="sidebar-label">Tambah</span>
        </button>

        <nav className="nav">
          {NAV.map(([key, label]) => (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-current={screen === key ? "page" : undefined}
              aria-label={label}
              className={`nav-item${screen === key ? " active" : ""}`}
              onClick={() => setScreen(key)}
              onKeyDown={(e) => activateOnKey(e, () => setScreen(key))}
            >
              <NavIcon name={key} />
              <span className="sidebar-label">{label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <Avatar pid={me} size={34} ring />
          <Avatar pid={me === "mei" ? "bas" : "mei"} size={34} />
          <span className="sidebar-label" style={{ fontSize: 12, color: UI.sub, fontWeight: 600 }}>
            Kamu: {myName}
          </span>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="topbar">
          <div>
            {screen === "home" ? (
              <>
                <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: "clamp(24px,3vw,30px)", color: UI.ink }}>
                  Hai, {myName}! 👋
                </div>
                <div style={{ fontSize: 14, color: UI.sub, fontWeight: 500, marginTop: 6 }}>Sabtu, 31 Mei 2026</div>
              </>
            ) : screen === "all" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span onClick={() => setScreen("home")} className="press" style={{ cursor: "pointer", fontSize: 22, color: UI.sub, lineHeight: 1 }}>‹</span>
                <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: "clamp(22px,3vw,28px)", color: UI.ink }}>Semua Transaksi</div>
              </div>
            ) : (
              <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: "clamp(24px,3vw,30px)", color: UI.ink }}>
                {TITLES[screen]}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="month-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 8px" }}>
              <span onClick={() => setPeriod(stepPeriod(period, -1))} className="press" style={{ cursor: "pointer", padding: "2px 8px", fontSize: 16, lineHeight: 1, color: UI.sub }}>‹</span>
              <span style={{ minWidth: 78, textAlign: "center" }}>{periodLabel(period)}</span>
              <span onClick={() => setPeriod(stepPeriod(period, 1))} className="press" style={{ cursor: "pointer", padding: "2px 8px", fontSize: 16, lineHeight: 1, color: UI.sub }}>›</span>
            </div>
          </div>
        </div>

        {/* key on screen so the content re-mounts and its entrance animation replays on tab change */}
      <div className="content" key={screen}>{body[screen]}</div>
      </main>

      {/* Bottom nav (phones) */}
      <nav className="bottomnav">
        {([["home", "Beranda"], ["reports", "Laporan"]] as [NavKey, string][]).map(([key, label]) => (
          <div
            key={key}
            role="button"
            tabIndex={0}
            aria-current={screen === key ? "page" : undefined}
            aria-label={label}
            className={`bn-item${screen === key ? " active" : ""}`}
            onClick={() => setScreen(key)}
            onKeyDown={(e) => activateOnKey(e, () => setScreen(key))}
          >
            <NavIcon name={key} size={20} />
            {label}
          </div>
        ))}
        <div
          role="button"
          tabIndex={0}
          aria-label="Tambah pengeluaran"
          className="bn-fab press"
          onClick={() => setAdding(true)}
          onKeyDown={(e) => activateOnKey(e, () => setAdding(true))}
        >
          <PlusIcon size={24} />
        </div>
        {([["settle", "Saldo"], ["settings", "Atur"]] as [NavKey, string][]).map(([key, label]) => (
          <div
            key={key}
            role="button"
            tabIndex={0}
            aria-current={screen === key ? "page" : undefined}
            aria-label={label}
            className={`bn-item${screen === key ? " active" : ""}`}
            onClick={() => setScreen(key)}
            onKeyDown={(e) => activateOnKey(e, () => setScreen(key))}
          >
            <NavIcon name={key} size={20} />
            {label}
          </div>
        ))}
      </nav>

      {adding && <AddModal onClose={() => setAdding(false)} />}
      {editing && <AddModal editing={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
