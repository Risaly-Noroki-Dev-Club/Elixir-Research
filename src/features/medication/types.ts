export type MedicationRoute = "oral" | "injection";

export type MedicationSource = "manual" | "template" | "imported";

export type MedicationPlanKind = "acute" | "long-term";

export interface MedicationEvent {
  id: string;
  drugId: string;
  takenAt: string;
  route: MedicationRoute;
  doseAmount: number;
  doseUnit: "mg";
  formulation: string;
  site?: string;
  source: MedicationSource;
  note: string;
}

export interface MedicationDraft {
  drugId: string;
  takenAtLocal: string;
  route: MedicationRoute;
  doseAmount: string;
  doseUnit: "mg";
  formulation: string;
  site: string;
  note: string;
}

export interface LongTermMedicationTemplate {
  id: string;
  drugId: string;
  label: string;
  route: MedicationRoute;
  doseAmount: number;
  doseUnit: "mg";
  formulation: string;
  intervalHours: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface LongTermTemplateDraft {
  drugId: string;
  label: string;
  route: MedicationRoute;
  doseAmount: string;
  doseUnit: "mg";
  formulation: string;
  intervalHours: string;
  note: string;
}

export interface MedicationCourseSummary {
  totalDoseMg: number;
  last24hDoseMg: number;
  doseCount: number;
  adherencePercent: number;
}
