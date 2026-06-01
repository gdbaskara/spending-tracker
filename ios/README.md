# iOS — decision: PWA for now

**Decision (2026-05-31):** no native iOS app yet. The web app is installed on
iPhone as a **PWA** — it already has a manifest, `apple-touch-icon`,
`theme-color`, and `display: standalone`, so "Add to Home Screen" gives a
full-screen app with the celengan icon. For two people this is enough.

## Install on iPhone
1. Open **https://celengin-mei-baskara.netlify.app** in Safari
2. Share button → **Add to Home Screen**
3. Launches full-screen, offline-tolerant (local seed fallback), syncs live when logged in

## If/when a native app is wanted later
Revisit after the web app has been used with real data and the data model is
stable (avoid building native twice). Recommended path given the existing code:
**Expo / React Native** — reuses ~80% of `../web/src` (engine, types, Supabase
via `@supabase/supabase-js`). SwiftUI is the alternative (best native feel, but
the balance logic must be reimplemented in Swift + `supabase-swift`).

Shared assets either way:
- Backend: `../supabase/migrations` (already applied to the live project).
- Balance/format logic: `../web/src/lib/engine.ts`.
- Design tokens: Mei `#F7B5CB`, Baskara `#A8D8C8`, accent `#FF8A5B`, bg `#FBF5EF`; Fredoka + Plus Jakarta Sans.
- Phone-layout reference: `../design-bundle/spending-tracker/project/` (the iPhone prototype).
