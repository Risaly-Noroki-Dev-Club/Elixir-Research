# Data Pipeline

## Source Strategy

Primary public source for label data:

- openFDA Drug Label API
- DailyMed SPL labels
- RxNorm identifiers where available

The client should not scrape FDA data on every use. A backend fetch/cache job should periodically gather and normalize source data, then publish compact static bundles for the app.

## Pipeline Shape

1. Fetch source records by generic name, brand name, ingredient, RxCUI, or NDC.
2. Keep raw source payloads in object storage or a reproducible cache.
3. Normalize identifiers, routes, dosage forms, strengths, warnings, and interaction sections.
4. Build bilingual mapping tables with review status.
5. Emit small app bundles grouped by common medicines and high-risk categories.
6. Record source date, source URL, hash, and transform version for every exported row.

## Runtime Search Shape

User search must not hit arbitrary label text first. The safe path is:

1. Search the curated registry/mapping table.
2. Resolve aliases to canonical generic/brand/formulation entries.
3. Use the entry's reviewed openFDA query to fetch label candidates.
4. Extract candidate PK facts from structured label sections such as `pharmacokinetics` and `clinical_pharmacology`.
5. Store extracted facts as `needs-review`.
6. Promote facts into a PK model only after human/scientific review.

The reason is simple: FDA labels are authoritative source documents, but they are not a normalized PK database. A label may contain multiple populations, formulations, food-effect studies, dose strengths, metabolites, and interaction conditions in the same section.

## Human-Friendly Data Format

Use JSONL for large source-derived tables:

```json
{"rxCui":"7804","generic":"oxycodone","zh":"羟考酮","source":"rxnorm","review":"needs-review"}
```

Use TypeScript fixtures for small model profiles:

```ts
export const oxycodoneCrProfile = {
  id: "oxycodone-cr-demo",
  activeIngredient: "oxycodone",
  releaseModel: "two-input-first-order"
};
```

## Candidate PK Fact Format

Extracted values are candidates, not parameters:

```json
{
  "label": "half-life",
  "value": "4.5",
  "unit": "hours",
  "section": "pharmacokinetics",
  "evidence": "...apparent elimination half-life...",
  "reviewStatus": "needs-review"
}
```

Only reviewed facts can become:

```json
{
  "parameter": "eliminationHalfLife",
  "value": 4.5,
  "unit": "h",
  "population": "adult",
  "formulation": "extended-release tablet",
  "reviewStatus": "reviewed"
}
```

## Cleaning Rules

- Never infer a Chinese drug name without marking review status.
- Keep brand and generic names separate.
- Preserve route and dosage form separately; do not collapse "tablet" and "extended-release tablet".
- Store warnings and interactions as structured evidence snippets with source identifiers.
- Never use regex-extracted PK facts directly in the patient-facing model.
- Every controlled-substance model starts as `clinical-review-required`.
