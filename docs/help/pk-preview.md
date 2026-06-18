# PK Preview

## Source Modes

- `Medication logs`: builds the curve from recorded events for the selected drug.
- `Scheduled regimen`: builds a theoretical curve from dose, interval, and steady-state/first-dose settings.

## Why A Curve May Not Move

- In `Medication logs` mode, the dose slider is hidden because the curve uses actual logged doses.
- In `Scheduled regimen` mode, changing dose, chart time, weight, or regimen state changes the curve immediately.
- Weight affects apparent volume of distribution, so changing weight should change concentration height.

## Hover Preview

- Move the pointer over the chart to see a vertical guide line.
- The tooltip shows relative time after T+0, estimated concentration, and clock time when a recorded anchor exists.
- Peak and trough markers remain visible for the active interval.

## Reading The Metrics

- Current: nearest concentration at the selected chart time.
- Peak: local maximum in the active dosing interval.
- Trough: local minimum in the active dosing interval.
- Next due: scheduled time remaining, not a dosing recommendation.

## Warnings

- Provisional shaded bands are review scaffolds only.
- Draft drugs without validated reference ranges should not be interpreted clinically.
- Injection-route handling remains provisional until route-specific PK parameters are reviewed.
