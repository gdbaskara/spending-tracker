"use client";

// Auth gate for the root route. Sends users to the right place before the app
// renders:
//   - no session            -> /login
//   - session, no household  -> /onboarding
//   - session + household    -> the live dashboard
// When Supabase is not configured (local dev), it falls through to the offline
// demo so the app stays usable without a backend.
import React from "react";
import { useRouter } from "next/navigation";
import { StoreProvider } from "@/lib/store";
import { WebApp } from "@/components/WebApp";
import { Mascot } from "@/components/Mascot";
import { getSupabase } from "@/lib/supabase";
import { getMembership } from "@/lib/db";

type GateState = "checking" | "allow";

export function AppGate() {
  const router = useRouter();
  const [state, setState] = React.useState<GateState>("checking");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      // No backend configured -> offline demo (keeps local dev working).
      if (!sb) {
        if (!cancelled) setState("allow");
        return;
      }
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const membership = await getMembership(sb, session.user.id);
      if (!membership) {
        router.replace("/onboarding");
        return;
      }
      if (!cancelled) setState("allow");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="anim-bob">
          <Mascot size={90} mood="sleepy" />
        </div>
      </div>
    );
  }

  return (
    <StoreProvider>
      <WebApp />
    </StoreProvider>
  );
}
