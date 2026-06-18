# Help Overview

## What This Console Covers

- Drug Library: search the embedded registry, inspect FDA mappings, and save reusable medication templates.
- Course Tracker: record real administrations with a confirmation step and review local medication history.
- PK Preview: inspect simulated concentration curves, switch between recorded-dose and scheduled-regimen modes, and review peak/trough metrics.
- Medication Reminders: review reminder policies and risk gates.

## Safe Usage Rules

- Local reminders and PK estimates do not replace prescriptions or clinician instructions.
- Controlled, psychiatric, sedative, opioid, anticoagulant, and injection workflows should always be rechecked against the real plan.
- openFDA-derived drafts must still be reviewed before clinical use.

## Navigation Basics

1. Use the left sidebar to switch modules.
2. Use `Ctrl + K` to open quick search.
3. Use the top-right language switcher to change locale.
4. Use the accent and theme buttons for visual adjustments only; they do not change data.

## Data Model Basics

- Registry data loads from the embedded SQL seed.
- Medication logs and long-term templates are stored locally in the browser.
- The PK preview recalculates after log changes without a network request.

## Troubleshooting

- If the registry fails to load, use `Retry registry` first.
- If a PK curve looks wrong, confirm whether you are in `Medication logs` mode or `Scheduled regimen` mode.
- If search returns nothing, try the canonical English name, a known alias, or the localized mapping keyword.
