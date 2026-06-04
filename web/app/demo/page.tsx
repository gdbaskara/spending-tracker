import Link from "next/link";
import { StoreProvider } from "@/lib/store";
import { WebApp } from "@/components/WebApp";

// Public, shareable demo. Runs the in-memory seed data via forceLocal, so it
// never reads a session, never goes live, and never redirects -- even if the
// visitor happens to be logged in. The real app lives at "/".
export default function DemoPage() {
  return (
    <StoreProvider forceLocal>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "8px 14px",
          background: "#FF8A5B",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 2px 10px rgba(255,138,91,0.4)",
        }}
      >
        <span>Mode demo - data contoh, perubahan tidak tersimpan.</span>
        <Link
          href="/login"
          style={{
            background: "#fff",
            color: "#F0703F",
            borderRadius: 999,
            padding: "4px 12px",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Masuk
        </Link>
      </div>
      <WebApp />
    </StoreProvider>
  );
}
