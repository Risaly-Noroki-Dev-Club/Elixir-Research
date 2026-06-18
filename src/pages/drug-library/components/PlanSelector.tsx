import { useEffect, useMemo, useState } from "react";
import type { ActionNotice } from "../../../app/types";
import type { DrugRegistryEntry } from "../../../features/drug-data/types";
import { buildLongTermTemplate, createTemplateDraft, validateTemplateDraft } from "../../../features/medication/templates";
import type { LongTermMedicationTemplate, LongTermTemplateDraft, MedicationPlanKind } from "../../../features/medication/types";
import { useI18n } from "../../../i18n/I18nProvider";

interface PlanSelectorProps {
  drug: DrugRegistryEntry;
  templates: LongTermMedicationTemplate[];
  onSaveTemplate: (template: LongTermMedicationTemplate) => void;
  onNotify: (notice: Omit<ActionNotice, "id">) => void;
}

export function PlanSelector({ drug, templates, onSaveTemplate, onNotify }: PlanSelectorProps) {
  const { t } = useI18n();
  const existingTemplate = templates.find((template) => template.drugId === drug.id);
  const [planKind, setPlanKind] = useState<MedicationPlanKind>(existingTemplate ? "long-term" : "acute");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<LongTermTemplateDraft>(() => existingTemplateToDraft(existingTemplate) ?? createTemplateDraft(drug));
  const [error, setError] = useState("");
  const templateStatus = useMemo(
    () => (existingTemplate ? `${existingTemplate.doseAmount} mg / ${existingTemplate.intervalHours}h` : t("drugLibrary.plan.noTemplate")),
    [existingTemplate, t]
  );

  useEffect(() => {
    setDraft(existingTemplateToDraft(existingTemplate) ?? createTemplateDraft(drug));
    setPlanKind(existingTemplate ? "long-term" : "acute");
    setEditorOpen(false);
    setError("");
  }, [drug, existingTemplate]);

  function updateDraft<Key extends keyof LongTermTemplateDraft>(key: Key, value: LongTermTemplateDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function selectPlan(kind: MedicationPlanKind) {
    setPlanKind(kind);
    setError("");

    if (kind === "acute") {
      setEditorOpen(false);
      onNotify({
        title: t("drugLibrary.plan.updated"),
        detail: t("drugLibrary.plan.updatedDetail", { drug: drug.genericNameZh }),
        tone: "info"
      });
      return;
    }

    setEditorOpen(true);
    onNotify({
      title: t("drugLibrary.plan.opened"),
      detail: t("drugLibrary.plan.openedDetail", { drug: drug.genericNameZh }),
      tone: "info"
    });
  }

  function saveEditedTemplate() {
    const validation = validateTemplateDraft(draft);
    if (validation) {
      setError(validation);
      onNotify({
        title: t("drugLibrary.plan.needsMoreData"),
        detail: validation,
        tone: "warning"
      });
      return;
    }

    const template = buildLongTermTemplate({ draft, existingTemplateId: existingTemplate?.id });
    onSaveTemplate(template);
    setPlanKind("long-term");
    setEditorOpen(false);
    setError("");
    onNotify({
      title: t("drugLibrary.plan.enabled"),
      detail: `${template.label} / ${template.doseAmount} ${template.doseUnit} / ${template.intervalHours}h`,
      tone: "success"
    });
  }

  return (
    <div className="plan-selector" onClick={(event) => event.stopPropagation()}>
      <div className="plan-tabs" role="tablist" aria-label={t("drugLibrary.plan.medicationPlan", { drug: drug.genericNameZh })}>
        <button
          type="button"
          role="tab"
          aria-selected={planKind === "acute"}
          className={planKind === "acute" ? "active" : ""}
          onClick={() => selectPlan("acute")}
        >
          {t("drugLibrary.plan.perDose")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={planKind === "long-term"}
          className={planKind === "long-term" ? "active" : ""}
          onClick={() => selectPlan("long-term")}
        >
          {t("drugLibrary.plan.longTerm")}
        </button>
      </div>
      <span className="plan-template-status">{planKind === "long-term" ? templateStatus : t("drugLibrary.plan.perDoseLogging")}</span>
      {planKind === "long-term" && editorOpen ? (
        <div className="plan-editor">
          <label>
            <span>{t("drugLibrary.plan.templateLabel")}</span>
            <input value={draft.label} onChange={(event) => updateDraft("label", event.target.value)} />
          </label>
          <label>
            <span>{t("drugLibrary.plan.doseMg")}</span>
            <input value={draft.doseAmount} inputMode="decimal" onChange={(event) => updateDraft("doseAmount", event.target.value)} />
          </label>
          <label>
            <span>{t("drugLibrary.plan.intervalHours")}</span>
            <input value={draft.intervalHours} inputMode="decimal" onChange={(event) => updateDraft("intervalHours", event.target.value)} />
          </label>
          <label>
            <span>{t("drugLibrary.plan.route")}</span>
            <select value={draft.route} onChange={(event) => updateDraft("route", event.target.value as LongTermTemplateDraft["route"])}>
              <option value="oral">{t("drugLibrary.plan.oral")}</option>
              <option value="injection">{t("drugLibrary.plan.injection")}</option>
            </select>
          </label>
          <label className="wide">
            <span>{t("drugLibrary.plan.formulationNote")}</span>
            <input value={draft.formulation} onChange={(event) => updateDraft("formulation", event.target.value)} />
          </label>
          <button type="button" className="secondary-button compact" onClick={saveEditedTemplate}>
            {t("drugLibrary.plan.saveEnable")}
          </button>
          {error ? <p className="mini-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function existingTemplateToDraft(template?: LongTermMedicationTemplate): LongTermTemplateDraft | null {
  if (!template) return null;

  return {
    drugId: template.drugId,
    label: template.label,
    route: template.route,
    doseAmount: String(template.doseAmount),
    doseUnit: template.doseUnit,
    formulation: template.formulation,
    intervalHours: String(template.intervalHours),
    note: template.note
  };
}
