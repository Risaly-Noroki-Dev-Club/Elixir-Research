# PK Modeling Notes

## Core Modeling Decision

The PK engine separates:

- input/release/absorption model
- central compartment concentration
- elimination model
- derived events such as peak, trough, threshold crossing, and next-dose timing

This matters for extended-release and controlled-release products. A single oral first-order absorption curve can look tidy but will fail for multi-phase release products.

## Current Equation

The implementation now follows the one-compartment first-order absorption/elimination model in `pk_model_1.pdf`.

For each absorption phase after a dose:

```text
C(t) = F * Dose * ka / (Vd * (ka - ke)) * (exp(-ke * t) - exp(-ka * t))
ke = ln(2) / halfLife
```

Where:

- `F` is oral bioavailability.
- `Vd` is apparent volume of distribution scaled by body weight.
- `ka` is the phase absorption rate.
- `ke` is the elimination rate.
- controlled/extended release is represented as multiple absorption phases with independent fractions, `ka`, and lag times.

For steady-state preview, the simulator includes historical doses for about five half-lives before chart time zero. This approximates the repeated-dose accumulation implied by the PDF's `tau`/steady-state section while keeping the engine simple and inspectable.

## Initial Oxycodone CR Prototype

The prototype uses a one-compartment model with a two-input absorption approximation:

- fast fraction for early release
- slow fraction for extended release
- first-order elimination
- body-weight-scaled apparent volume
- repeated-dose wash-in for steady-state preview

This is not enough for clinical decisions, but it creates the correct software shape for OxyContin-like profiles. The UI must label this as an unvalidated research model until the formulation, population parameters, and validation dataset are reviewed.

## Current Estimation Limits

- Do not call the visible band a therapeutic window for oxycodone until a clinician-reviewed source defines it for the exact use case.
- Do not estimate the next dose from a concentration threshold for controlled substances. Show scheduled timing only, unless a future clinician-reviewed module explicitly supports a reminder threshold.
- Peak and trough must be calculated inside the active dosing interval, not over an arbitrary trailing chart window.
- The controlled-release model needs validation against published concentration-time data before it can be used beyond visual prototyping.

## Biphasic and Double-Peak Strategy

For drugs like OxyContin/Oxycodone CR:

1. Represent the tablet/formulation as multiple input functions.
2. Allow two or more absorption phases with independent fractions and rate constants.
3. Add optional lag times for delayed second input.
4. Keep model parameters versioned per formulation.
5. Mark all opioid/controlled-substance modules as clinical-review-required.

Future implementation can support:

- Weibull release functions
- transit-compartment absorption
- mixed zero-order plus first-order release
- population PK parameter sets
- lab-calibrated individual scaling

## Derived Metrics

- `current`: interpolated concentration at selected time
- `peak`: local maximum over the visible horizon
- `trough`: local minimum after steady dosing interval or visible horizon
- `therapeuticWindow`: source-defined or user-defined range
- `nextDoseEstimate`: time until concentration crosses a configured floor

## Units

Store concentration in canonical units per drug profile. The UI may display mg/L, ng/mL, pg/mL, ng/dL, or mmol/L, but conversions must be explicit and tested.
