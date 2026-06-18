import type { DrugRegistryEntry } from "../drug-data/types";
import type { MedicationCourseSummary, MedicationEvent } from "./types";

export function summarizeMedicationCourse({
  events,
  selectedDrug,
  now
}: {
  events: MedicationEvent[];
  selectedDrug: DrugRegistryEntry;
  now: Date;
}): MedicationCourseSummary {
  const selectedEvents = events.filter((event) => event.drugId === selectedDrug.id);
  const totalDoseMg = selectedEvents.reduce((sum, event) => sum + event.doseAmount, 0);
  const last24hStart = now.getTime() - 24 * 60 * 60 * 1000;
  const last24hDoseMg = selectedEvents
    .filter((event) => new Date(event.takenAt).getTime() >= last24hStart)
    .reduce((sum, event) => sum + event.doseAmount, 0);
  const expectedDoses = Math.floor(48 / selectedDrug.defaultIntervalHours) + 1;
  const adherencePercent = expectedDoses > 0 ? Math.min(100, Math.round((selectedEvents.length / expectedDoses) * 100)) : 0;

  return {
    totalDoseMg,
    last24hDoseMg,
    doseCount: selectedEvents.length,
    adherencePercent
  };
}

export function sortMedicationEvents(events: MedicationEvent[]) {
  return [...events].sort((left, right) => new Date(right.takenAt).getTime() - new Date(left.takenAt).getTime());
}
