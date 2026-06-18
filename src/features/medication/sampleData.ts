import type { MedicationEvent } from "./types";

export const sampleMedicationEvents: MedicationEvent[] = [
  {
    id: "dose-1",
    drugId: "oxycodone-cr",
    takenAt: "2026-06-17T08:00:00+08:00",
    route: "oral",
    doseAmount: 20,
    doseUnit: "mg",
    formulation: "controlled-release tablet",
    source: "manual",
    note: "morning"
  },
  {
    id: "dose-2",
    drugId: "oxycodone-cr",
    takenAt: "2026-06-17T20:00:00+08:00",
    route: "oral",
    doseAmount: 20,
    doseUnit: "mg",
    formulation: "controlled-release tablet",
    source: "manual",
    note: "evening"
  },
  {
    id: "dose-3",
    drugId: "oxycodone-cr",
    takenAt: "2026-06-18T08:00:00+08:00",
    route: "oral",
    doseAmount: 20,
    doseUnit: "mg",
    formulation: "controlled-release tablet",
    source: "manual",
    note: "morning"
  },
  {
    id: "dose-4",
    drugId: "methylphenidate-er",
    takenAt: "2026-06-18T08:25:00+08:00",
    route: "oral",
    doseAmount: 18,
    doseUnit: "mg",
    formulation: "extended-release tablet",
    source: "manual",
    note: "workday"
  }
];
