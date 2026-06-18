# Medication Modules

## Course Tracker

The course tracker is a separate module under the `用药` navigation group. It owns:

- medication event logs
- dose accumulation
- course-window summaries
- adherence scoring
- exportable course history

## Dose Accumulation Logic

Each medication event should store:

```json
{
  "drugId": "oxycodone-cr",
  "takenAt": "2026-06-18T08:00:00+08:00",
  "route": "oral",
  "doseAmount": 20,
  "doseUnit": "mg",
  "formulation": "controlled-release tablet",
  "site": null,
  "source": "manual",
  "note": "morning"
}
```

Initial supported routes:

- `oral`
- `injection`

Route-specific SOP text lives in `src/features/medication/routeGuidance.ts`. It is intentionally written as a safety checklist, not as self-administration instructions. Current reference anchors:

- CDC Preventing Unsafe Injection Practices: injection safety, sterile single-patient/single-use equipment, sharps safety.
- MedlinePlus Taking medicines: questions to ask providers, label/prescription confirmation, safe medicine use.

Manual entry flow:

1. User fills medication event parameters.
2. App creates a pending event only in memory.
3. App shows a confirmation dialog with drug, time, route, dose, formulation, site, and note.
4. Event is saved only after explicit confirmation.
5. Cancel returns to editing without adding a record.

## PK Linkage

The PK preview consumes medication events as a first-class data source. The drug library PK card has two source modes:

- `records`: builds the curve from `medication.events.v1` for the selected drug.
- `scheduled`: keeps the older theoretical fixed-interval simulation for model debugging.

When `records` is active:

- only events matching the selected canonical drug id are included
- each event contributes its recorded `doseAmount`, `takenAt`, and `route`
- the active interval is inferred from the last recorded dose before chart time and the selected drug's default interval
- the next-dose counter is a schedule projection, not a recommendation
- injection records use an experimental route bridge until route-specific PK parameters exist

This linkage is intentionally local-first: adding a medication event updates React state and browser storage, then the PK curve recomputes without a network call.

The accumulator groups events by:

- canonical drug id
- formulation
- route
- course id
- time window

Common windows:

- last 24 hours
- current dosing interval
- last 7 days
- full course

The module must not merge different formulations unless a reviewed conversion rule exists.

## Course Tracking

A course has:

- start time
- optional planned end time
- selected drug/formulation
- planned interval
- planned dose
- adherence target
- clinical-review flag for high-risk medicines

Adherence can start as:

```text
logged doses / expected scheduled doses
```

This score is a behavior summary, not a medical outcome.

## Plan Modes And Templates

The drug library table exposes a plan selector per drug:

- `acute`: one-off/as-needed logging, no template is required.
- `long-term`: stores a reusable template in `medication.templates.v1`.

A long-term template stores:

```json
{
  "id": "template-...",
  "drugId": "oxycodone-cr",
  "label": "盐酸羟考酮 长期用药",
  "route": "oral",
  "doseAmount": 20,
  "doseUnit": "mg",
  "formulation": "extended-release / controlled-release",
  "intervalHours": 12,
  "note": "长期用药模板"
}
```

Template flow:

1. User selects `long-term` in the drug library plan column.
2. User may adjust dose, interval, route, and formulation.
3. Saving the template updates local storage only.
4. In the course tracker, `快速加入（长期用药模板）` opens a template picker.
5. User may temporarily override time, dose, interval, and note.
6. Applying a template creates a pending `MedicationEvent` with `source: "template"`.
7. The normal second-confirmation dialog is still required before writing the record.

The row action menu in the drug library owns record navigation:

- `查看历史`: switches to the course tracker for the selected drug.
- `删除历史数据`: removes medication events for the selected drug only; it does not delete drug registry entries or templates.

## Medication Reminders

The medication reminder module is separate from the course tracker. It owns:

- scheduled reminder rules
- missed-dose windows
- local notification permissions
- quiet hours
- high-risk confirmation prompts
- optional threshold-based review reminders

Reminder types:

- schedule reminder: fires before or at planned dose time
- missed-dose check: fires after a configurable grace period
- threshold review: warns that a concentration estimate crossed a configured reference band
- safety confirmation: requires extra acknowledgement for controlled or high-risk drugs

## Safety Rules

- The reminder module must never recommend extra dosing.
- Threshold reminders must be phrased as "review" or "check plan", not "take more".
- Controlled substances, opioids, sedatives, psychiatric medicines, anticoagulants, lithium, clozapine, antiepileptics, pediatric, pregnancy, renal, and hepatic scenarios default to clinical-review-required.
- If notification permission is unavailable, reminders remain visible in-app and are marked as local notification N/A.

## Local-First Storage

Initial storage can be local browser storage for prototype data. Production storage should move to IndexedDB with a migration layer:

- `medication.events.v1`
- `medication.courses.v1`
- `medication.reminders.v1`

Cloud sync remains opt-in.
