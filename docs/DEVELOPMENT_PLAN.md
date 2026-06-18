# Development Plan

## Product North Star

Elixir Research helps users inspect medication timing, registry metadata, and PK context in a local-first workflow that stays explicit about review boundaries.

## Active Foundation Goals

- Keep the shell responsive on desktop and mobile.
- Keep the drug registry embedded and searchable offline through SQLite + WASM.
- Keep copy translatable through JSON locale catalogs.
- Keep openFDA fallback behind local mapping resolution.
- Keep feature modules split into small, testable files.

## Current Delivery Priorities

### Registry and Mapping

- Expand the SQL seed registry.
- Sync reviewed aliases from DoseLab.
- Preserve direct-search add flow through openFDA draft capture.

### UX and IA

- Keep quick search locale-aware.
- Keep language switching lightweight and animated.
- Keep page modules composed from feature components, not giant page files.

### Safety and PK

- Maintain review gates between fetched source data and any PK model usage.
- Expand reviewed profiles over time instead of inferring them automatically.

## Module Rule

Every substantial feature should ship with:

- a feature entry point
- typed contracts
- tests for search or transformation logic
- documentation for schema or translator-facing rules when relevant
- a migration path if persisted data shape changes
