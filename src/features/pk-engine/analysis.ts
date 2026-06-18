import type { ConcentrationSample } from "./types";

export interface CurveAnalysisInput {
  samples: ConcentrationSample[];
  referenceMin: number;
  referenceMax: number;
  referenceBandValidated: boolean;
  intervalHours: number;
  nowHours: number;
  intervalStartHours?: number;
  intervalEndHours?: number;
  nextDoseHoursOverride?: number;
}

export interface CurveAnalysis {
  current: number;
  peak: ConcentrationSample;
  trough: ConcentrationSample;
  nextDoseHours: number;
  activeIntervalStart: number;
  activeIntervalEnd: number;
  status: "research" | "low" | "in-range" | "high";
}

export function analyzeCurve(input: CurveAnalysisInput): CurveAnalysis {
  const current = nearestSample(input.samples, input.nowHours);
  const activeIntervalStart = input.intervalStartHours ?? Math.floor(input.nowHours / input.intervalHours) * input.intervalHours;
  const activeIntervalEnd = input.intervalEndHours ?? activeIntervalStart + input.intervalHours;
  const intervalSamples = input.samples.filter(
    (sample) => sample.time >= activeIntervalStart && sample.time <= activeIntervalEnd
  );
  const peak = maxBy(intervalSamples, (sample) => sample.concentration);
  const trough = minBy(intervalSamples, (sample) => sample.concentration);
  const nextDoseHours = input.nextDoseHoursOverride ?? Math.max(0, activeIntervalEnd - input.nowHours);

  return {
    current: current.concentration,
    peak,
    trough,
    nextDoseHours,
    activeIntervalStart,
    activeIntervalEnd,
    status: input.referenceBandValidated
      ? current.concentration > input.referenceMax
        ? "high"
        : current.concentration < input.referenceMin
          ? "low"
          : "in-range"
      : "research"
  };
}

function nearestSample(samples: ConcentrationSample[], time: number) {
  return samples.reduce((nearest, sample) => (Math.abs(sample.time - time) < Math.abs(nearest.time - time) ? sample : nearest), samples[0]);
}

function maxBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((best, item) => (getValue(item) > getValue(best) ? item : best), items[0]);
}

function minBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((best, item) => (getValue(item) < getValue(best) ? item : best), items[0]);
}
