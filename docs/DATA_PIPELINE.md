# Data Pipeline

## Source Strategy

Current pipeline is local-first and reproducible:

- Curated registry seed SQL in `src/features/drug-data/registry.sql`
- DoseLab mapping source JSON for multilingual aliases
- Generated SQL mapping bundle in `src/features/drug-data/drug_name_mapping.sql`
- openFDA NDC and label APIs used only as runtime fallback after local resolution

## Pipeline Shape

1. Read DoseLab alias data.
2. Normalize categories into the local drug taxonomy.
3. Emit SQL inserts for `drug_name_mapping` and `drug_name_mapping_alias`.
4. Concatenate registry seed SQL, mapping SQL, and local draft SQL at boot.
5. Initialize embedded SQLite in the browser through WASM.
6. Resolve user search locally before any remote lookup.

## Runtime Search Shape

User search must follow this order:

1. Search the curated local registry.
2. Resolve aliases through the SQL mapping table.
3. If mapped, query openFDA with canonical English NDC search terms.
4. Convert remote candidates into local draft registry rows.
5. Keep every remote-derived row in review-gated state until a human confirms it.

## Formats

### Mapping source

DoseLab alias source is JSON.

### Runtime seed

The app boot payload is SQL, not a TypeScript array.

### Draft additions

User-added openFDA candidates are serialized to LocalStorage and rehydrated back into SQL during database boot.

## Cleaning Rules

- Never send unmapped raw Chinese text directly to openFDA.
- Keep brand names, generic names, and aliases separate.
- Keep query logic in feature modules, not page components.
- Preserve provenance for every imported mapping batch.
- Remote PK or label facts remain review-gated.
