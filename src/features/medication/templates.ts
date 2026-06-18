import type { DrugRegistryEntry } from "../drug-data/types";
import type { LongTermMedicationTemplate, LongTermTemplateDraft, MedicationEvent } from "./types";

export function createTemplateDraft(drug: DrugRegistryEntry): LongTermTemplateDraft {
  return {
    drugId: drug.id,
    label: `${drug.genericNameZh} long-term plan`,
    route: "oral",
    doseAmount: String(drug.defaultDoseMg),
    doseUnit: "mg",
    formulation: drug.releaseModel === "biphasic-cr" ? "extended-release / controlled-release" : "immediate-release",
    intervalHours: String(drug.defaultIntervalHours),
    note: "Long-term medication template"
  };
}

export function buildLongTermTemplate({
  draft,
  existingTemplateId
}: {
  draft: LongTermTemplateDraft;
  existingTemplateId?: string;
}): LongTermMedicationTemplate {
  const now = new Date().toISOString();

  return {
    id: existingTemplateId ?? `template-${Date.now()}`,
    drugId: draft.drugId,
    label: draft.label.trim() || "Long-term medication template",
    route: draft.route,
    doseAmount: Number(draft.doseAmount),
    doseUnit: draft.doseUnit,
    formulation: draft.formulation.trim() || "Unspecified formulation",
    intervalHours: Number(draft.intervalHours),
    note: draft.note.trim(),
    createdAt: now,
    updatedAt: now
  };
}

export function validateTemplateDraft(draft: LongTermTemplateDraft) {
  const dose = Number(draft.doseAmount);
  const interval = Number(draft.intervalHours);

  if (!Number.isFinite(dose) || dose <= 0) {
    return "Enter a dose greater than 0.";
  }

  if (!Number.isFinite(interval) || interval <= 0) {
    return "Enter an interval greater than 0.";
  }

  return "";
}

export function buildMedicationEventFromTemplate({
  template,
  takenAtLocal,
  doseAmountOverride,
  intervalOverride,
  note
}: {
  template: LongTermMedicationTemplate;
  takenAtLocal: string;
  doseAmountOverride?: number;
  intervalOverride?: number;
  note?: string;
}): MedicationEvent {
  const doseAmount = doseAmountOverride && doseAmountOverride > 0 ? doseAmountOverride : template.doseAmount;
  const intervalNote = intervalOverride && intervalOverride !== template.intervalHours ? `Temporary interval override: ${intervalOverride}h` : "";
  const mergedNote = [template.note, intervalNote, note].filter(Boolean).join(" / ");

  return {
    id: `dose-${Date.now()}`,
    drugId: template.drugId,
    takenAt: new Date(takenAtLocal).toISOString(),
    route: template.route,
    doseAmount,
    doseUnit: template.doseUnit,
    formulation: template.formulation,
    source: "template",
    note: mergedNote || template.label
  };
}
