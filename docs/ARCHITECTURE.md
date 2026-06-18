# Architecture

## Current Stack

Frontend runtime:

- React + TypeScript + Vite
- Embedded SQLite via `sql.js` + WASM for local drug registry and mapping search
- JSON-backed i18n catalogs with English source copy and locale overlays
- Custom CSS variable system and lightweight component primitives

Data runtime:

- Local-first registry boot from SQL seed assets in `src/features/drug-data`
- DoseLab-derived alias mapping compiled into SQLite seed SQL
- Client-side openFDA search fallback only after local alias resolution
- LocalStorage for user preferences, medication drafts, and draft registry additions

## High-Level Boundaries

- `src/app`: application shell, navigation, view orchestration
- `src/features/drug-data`: SQL seed assets, mapping resolution, openFDA search adapters
- `src/features/quick-search`: locale-aware module search index and matching engine
- `src/features/pk-engine`: deterministic pharmacokinetic simulation logic
- `src/features/medication`: course tracking, reminders, templates, dose history
- `src/components`: reusable UI and console shell primitives
- `src/pages`: page-level composition modules assembled from smaller feature components

## Runtime Search Path

1. Query embedded SQLite registry.
2. Resolve multilingual aliases in `drug_name_mapping_alias`.
3. If needed, map to canonical English name.
4. Query openFDA NDC with reviewed search terms.
5. Save new candidates as local draft registry rows before any downstream use.

## Non-Goals For This Build

- No server dependency for local registry or mapping search.
- No silent promotion from openFDA candidate to reviewed PK model.
- No giant page modules that mix seed data, search logic, and full UI layout in one file.
