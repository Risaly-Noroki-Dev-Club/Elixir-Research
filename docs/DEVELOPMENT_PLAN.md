# Development Plan

## Product North Star

Elixir Research visualizes drug concentration over time so chronic-disease patients can understand timing, risk windows, and adherence patterns. The app must be fast, local-first, cross-platform, and explicit that it supports patient-clinician conversations rather than prescribing.

## Phase 0: Foundation

- Establish Vite + React + TypeScript web/PWA app deployable on Netlify.
- Build a Material You-inspired UI system with dark/light themes, responsive layout, and web palette customization.
- Keep PK algorithms local and deterministic.
- Store user settings and dose events locally first.
- Create docs that future agents can read before adding modules.

## Phase 1: PK Core

- Define drug modules with versioned model metadata.
- Support immediate-release, extended-release, delayed-release, depot, patch, and custom multi-input absorption models.
- Add therapeutic window overlays, peak/trough detection, next-dose estimation, and threshold reminders.
- Add calibration hooks for lab values without silently changing source parameters.

## Phase 2: Drug Data

- Pull openFDA label data through a backend fetch/cache job, not from the client at every use.
- Normalize RxNorm, generic names, brand names, active ingredients, routes, dosage forms, warnings, and interaction keywords.
- Maintain a large bilingual mapping table as data, not code.
- Ship a compact local cache for common medicines and update it opportunistically.

## Phase 3: Safety and Privacy

- Interaction checking: start from high-risk rule modules, then expand with curated source provenance.
- Add optional local vault unlock using passphrase/WebAuthn.
- Add JSON import/export and signed export metadata.
- Add PDF doctor report with "research visualization" disclaimers and provenance.
- Do not introduce weird CAPTCHA. Prefer rate limits, passkeys, device attestation where appropriate, and server-side abuse scoring.

## Phase 4: Sync

- Anonymous local-only mode remains first-class.
- Optional account sync supports Google and Apple sign-in.
- User-owned cloud sync should prefer WebDAV-compatible endpoints.
- Hosted sync must be opt-in, encrypted client-side where feasible, and region-transparent.

## Phase 5: Mobile and Native Surface

- PWA first, then Capacitor for Android/iOS if platform APIs justify it.
- Android: Material You dynamic color through native bridge.
- iOS: system color and passkey/biometric integration through platform APIs.
- Widgets and reminder notifications are native modules, not web-only hacks.

## Module Rule

Every feature after Phase 0 must enter as a module with:

- `module.manifest.ts`
- typed input/output contracts
- test fixtures
- source/provenance notes
- privacy and safety notes
- versioned migration path if it stores data

