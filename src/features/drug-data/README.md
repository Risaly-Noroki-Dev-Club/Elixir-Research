# Drug Data Registry

## What It Does

- Stores the local curated medication registry used by the app.
- Resolves English, brand, and Chinese aliases before any openFDA lookup.
- Preserves reviewed openFDA mapping queries alongside local display names and PK profile placeholders.

## What It Refuses To Do

- It does not send raw CJK user input to openFDA.
- It does not treat machine-extracted label facts as patient-facing PK parameters.
- It does not infer dose advice from FDA text.

## Source Notes

- Runtime search follows the curated-registry-first path from `docs/DATA_PIPELINE.md`.
- Mapping fields are shaped after the local-first alias model documented in DoseLab's `docs/DRUG_NAME_MAPPING.md`.
- Controlled substances remain review-gated per `docs/MODULE_STANDARD.md`.
