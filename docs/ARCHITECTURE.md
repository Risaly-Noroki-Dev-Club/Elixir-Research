# Architecture

## Recommended Stack

Frontend:

- React + TypeScript + Vite
- CSS variables plus lightweight component primitives
- Recharts or custom SVG charting; prototype uses custom SVG to keep the first build small
- IndexedDB for larger local caches later; localStorage only for prototype settings
- PWA manifest and service worker in the next iteration

Backend:

- Netlify Functions for openFDA proxy/cache refresh, share thumbnail rendering hooks, and auth callbacks
- Supabase Auth or Auth.js only when account sync becomes real
- Postgres for account metadata and sync manifests if hosted sync is offered
- WebDAV connector as an optional user-owned sync target

Build/Deploy:

- Netlify static deploy for the app
- `netlify.toml` controls build, headers, HTTPS redirects, and SPA routing
- Algorithm code remains in `src/features/pk-engine`

## High-Level Boundaries

- `src/features/pk-engine`: deterministic pharmacokinetic simulation and derived metrics
- `src/features/drug-data`: normalized drug profile types and source provenance
- `src/features/interactions`: rule-based interaction risk checks
- `src/features/privacy`: vault, export, import, and future WebAuthn/passkey hooks
- `src/features/medication`: course tracker, dose accumulation, and medication reminder modules
- `src/ui`: shared view primitives and styling
- `src/app`: composition, route shells, state orchestration

## Backend Boundary

No PK calculation should require backend availability. Backend services may fetch source data, verify accounts, render server-side assets, or sync encrypted payloads, but the user-visible chart should continue working offline.

The first backend-facing module is `netlify/functions/fda-label-search.ts`. It proxies openFDA label search and returns extracted PK fact candidates with review status. These candidates are not model parameters until curated.

## Cross-Platform Path

1. Web/PWA is canonical.
2. Capacitor wraps the app for mobile.
3. Native bridges only expose platform-specific value:
   - Android Monet dynamic color
   - biometric/passkey unlock
   - local notifications
   - widgets
