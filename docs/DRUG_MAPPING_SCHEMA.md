# Drug Mapping Schema

## Goal

The mapping table bridges multilingual user input, DoseLab aliases, and openFDA canonical English search terms.

## Tables

### `drug_name_mapping`

One row per canonical drug concept.

Columns:

- `id`: stable slug used by local SQL assets
- `canonical_name_en`: canonical English search term sent to openFDA
- `category`: local drug category enum
- `aliases_zh_json`: reviewed Chinese aliases array
- `sources_json`: provenance array such as `doselab`, `manual`, `openfda`

### `drug_name_mapping_alias`

One row per searchable alias.

Columns:

- `mapping_id`: foreign key to `drug_name_mapping.id`
- `alias`: raw alias text shown to humans
- `alias_normalized`: lowercase normalized search token
- `alias_locale`: `en` or `zh`
- `alias_priority`: smaller means higher ranking

## Source of Truth

- DoseLab source file: `C:\Users\Administrator\Documents\GitHub\DoseLab\assets\data\zh_drug_map.json`
- Generated SQL asset: `src/features/drug-data/drug_name_mapping.sql`
- Generator script: `scripts/generate-drug-mapping-sql.mjs`

Do not hand-edit the generated SQL unless there is an urgent hotfix. Prefer updating the generator or source mapping data.

## Search Rules

1. Normalize the query.
2. Resolve aliases locally in SQLite first.
3. If the query is CJK and no mapping exists, do not send raw Chinese text to openFDA.
4. If a mapping is found, search openFDA NDC using the canonical English term.
5. Rank alias hits in this order: exact, prefix, contains.

## Change Checklist

- Preserve stable `id` values when updating aliases.
- Keep Chinese aliases in reviewed data, not UI code.
- Add provenance in `sources_json` for every imported batch.
- Re-run the generator after updating DoseLab source data.
- Re-run `npm.cmd run test` and `npm.cmd run build` after schema or seed changes.
