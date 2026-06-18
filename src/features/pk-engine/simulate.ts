import type { ConcentrationSample, MedicationEventSimulationInput, RecordedDoseInput, SimulationInput, SimulationResult } from "./types";

const STEP_HOURS = 0.1;
const STEADY_STATE_HALF_LIVES = 5;

export function simulateRegimen(input: SimulationInput): SimulationResult {
  const samples: ConcentrationSample[] = [];
  const doseTimes = buildDoseTimes(input);

  for (let time = 0; time <= input.horizonHours + 0.0001; time += STEP_HOURS) {
    const concentration = doseTimes.reduce((sum, doseTime) => {
      if (time < doseTime) return sum;
      return sum + concentrationFromDose(time - doseTime, input);
    }, 0);

    samples.push({
      time: round(time, 1),
      concentration
    });
  }

  return { samples };
}

export function simulateMedicationEvents(input: MedicationEventSimulationInput): SimulationResult {
  const samples: ConcentrationSample[] = [];
  const anchorMs = new Date(input.anchorTime).getTime();
  const doseEvents = input.doses
    .map((dose) => ({ ...dose, relativeHour: (new Date(dose.takenAt).getTime() - anchorMs) / 3_600_000 }))
    .filter((dose) => Number.isFinite(dose.relativeHour) && dose.relativeHour <= input.horizonHours);

  for (let time = 0; time <= input.horizonHours + 0.0001; time += STEP_HOURS) {
    const concentration = doseEvents.reduce((sum, dose) => {
      if (time < dose.relativeHour) return sum;
      return sum + concentrationFromRecordedDose(time - dose.relativeHour, dose, input);
    }, 0);

    samples.push({
      time: round(time, 1),
      concentration
    });
  }

  return { samples };
}

function buildDoseTimes(input: SimulationInput) {
  const doseTimes: number[] = [];
  const start = input.steadyState ? -washInHours(input.profile.halfLifeHours, input.intervalHours) : 0;

  for (let time = start; time <= input.horizonHours; time += input.intervalHours) {
    doseTimes.push(time);
  }
  return doseTimes;
}

function washInHours(halfLifeHours: number, intervalHours: number) {
  const target = halfLifeHours * STEADY_STATE_HALF_LIVES;
  return Math.ceil(target / intervalHours) * intervalHours;
}

function concentrationFromDose(elapsedHours: number, input: SimulationInput) {
  const vdLiters = Math.max(1, input.profile.apparentVdLPerKg * input.weightKg);
  const eliminationRate = (Math.log(2) / input.profile.halfLifeHours) * input.clearanceMultiplier;
  const phases =
    input.model === "standard-ir"
      ? [{ label: "IR", fraction: 1, absorptionRate: 1.15, lagHours: 0 }]
      : input.profile.absorptionPhases;

  return phases.reduce(
    (sum, phase) =>
      sum +
      firstOrderAbsorption({
        doseMg: input.doseMg * phase.fraction,
        bioavailability: input.profile.bioavailability,
        absorptionRate: phase.absorptionRate,
        eliminationRate,
        vdLiters,
        elapsedHours: elapsedHours - phase.lagHours
      }),
    0
  );
}

function concentrationFromRecordedDose(
  elapsedHours: number,
  dose: RecordedDoseInput,
  input: MedicationEventSimulationInput
) {
  const vdLiters = Math.max(1, input.profile.apparentVdLPerKg * input.weightKg);
  const eliminationRate = (Math.log(2) / input.profile.halfLifeHours) * input.clearanceMultiplier;
  const phases =
    dose.route === "injection"
      ? [{ label: "route bridge", fraction: 1, absorptionRate: 8, lagHours: 0 }]
      : input.model === "standard-ir"
        ? [{ label: "IR", fraction: 1, absorptionRate: 1.15, lagHours: 0 }]
        : input.profile.absorptionPhases;

  return phases.reduce(
    (sum, phase) =>
      sum +
      firstOrderAbsorption({
        doseMg: dose.doseMg * phase.fraction,
        bioavailability: dose.route === "injection" ? 1 : input.profile.bioavailability,
        absorptionRate: phase.absorptionRate,
        eliminationRate,
        vdLiters,
        elapsedHours: elapsedHours - phase.lagHours
      }),
    0
  );
}

function firstOrderAbsorption({
  doseMg,
  bioavailability,
  absorptionRate,
  eliminationRate,
  vdLiters,
  elapsedHours
}: {
  doseMg: number;
  bioavailability: number;
  absorptionRate: number;
  eliminationRate: number;
  vdLiters: number;
  elapsedHours: number;
}) {
  if (elapsedHours <= 0) return 0;
  if (Math.abs(absorptionRate - eliminationRate) < 0.000001) {
    const concentration = (bioavailability * doseMg * absorptionRate * elapsedHours * Math.exp(-eliminationRate * elapsedHours)) / vdLiters;
    return Number.isFinite(concentration) ? Math.max(0, concentration) : 0;
  }
  const doseToCentral = (bioavailability * doseMg * absorptionRate) / (vdLiters * (absorptionRate - eliminationRate));
  const concentration = doseToCentral * (Math.exp(-eliminationRate * elapsedHours) - Math.exp(-absorptionRate * elapsedHours));
  return Number.isFinite(concentration) ? Math.max(0, concentration) : 0;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
