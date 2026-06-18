# Module Standard

Each module must be readable in isolation by a future model or maintainer.

## Required Files

- `module.manifest.ts`: id, name, version, owner area, status, storage keys, safety level
- `README.md`: what it does, what it refuses to do, links to sources
- `types.ts`: public contracts
- `fixtures/`: deterministic examples
- `tests/`: unit tests or documented manual validation until the test runner exists

## Manifest Shape

```ts
export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  status: "experimental" | "review" | "stable";
  safetyLevel: "low" | "medium" | "high" | "clinical-review-required";
  storageKeys: string[];
  sourceNotes: string[];
}
```

## Safety Requirements

- Any controlled substance, opioid, sedative, MAOI, lithium, clozapine, anticoagulant, antiepileptic, pregnancy, pediatric, renal, hepatic, or overdose-sensitive module starts at `clinical-review-required`.
- UI must never present dose changes as instructions.
- Source parameters must expose provenance and revision date.
- User-entered overrides must be visibly labeled as overrides.
- Machine-extracted label facts must be marked `needs-review` and blocked from direct patient-facing simulation.

## Data Requirements

- Store source identifiers alongside normalized values.
- Separate bilingual display strings from canonical medical identifiers.
- Prefer structured parsing over string heuristics.
- Never throw away the raw source reference needed to reproduce a mapping.
