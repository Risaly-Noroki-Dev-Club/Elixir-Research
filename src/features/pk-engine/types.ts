export type ReleaseModel = "biphasic-cr" | "standard-ir";

export type CypMetabolizer = "slow" | "normal" | "fast";

export interface AbsorptionPhase {
  label: string;
  fraction: number;
  absorptionRate: number;
  lagHours: number;
}

export interface DrugProfile {
  id: string;
  name: string;
  subtitle: string;
  unit: string;
  bioavailability: number;
  apparentVdLPerKg: number;
  halfLifeHours: number;
  absorptionPhases: AbsorptionPhase[];
  referenceMin: number;
  referenceMax: number;
  referenceBandValidated: boolean;
  modelNote: string;
  interactionTags: string[];
}

export interface SimulationInput {
  profile: DrugProfile;
  doseMg: number;
  weightKg: number;
  intervalHours: number;
  horizonHours: number;
  model: ReleaseModel;
  clearanceMultiplier: number;
  steadyState: boolean;
}

export interface RecordedDoseInput {
  id: string;
  takenAt: string;
  doseMg: number;
  route: "oral" | "injection";
}

export interface MedicationEventSimulationInput {
  profile: DrugProfile;
  doses: RecordedDoseInput[];
  weightKg: number;
  horizonHours: number;
  model: ReleaseModel;
  clearanceMultiplier: number;
  anchorTime: string;
}

export interface ConcentrationSample {
  time: number;
  concentration: number;
}

export interface SimulationResult {
  samples: ConcentrationSample[];
}
