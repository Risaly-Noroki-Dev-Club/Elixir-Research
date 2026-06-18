import { useEffect, useMemo, useState } from "react";
import type { ActionNotice } from "../../../app/types";
import type { DrugRegistryEntry } from "../../../features/drug-data/types";
import { buildLongTermTemplate, createTemplateDraft, validateTemplateDraft } from "../../../features/medication/templates";
import type { LongTermMedicationTemplate, LongTermTemplateDraft, MedicationPlanKind } from "../../../features/medication/types";

interface PlanSelectorProps {
  drug: DrugRegistryEntry;
  templates: LongTermMedicationTemplate[];
  onSaveTemplate: (template: LongTermMedicationTemplate) => void;
  onNotify: (notice: Omit<ActionNotice, "id">) => void;
}

export function PlanSelector({ drug, templates, onSaveTemplate, onNotify }: PlanSelectorProps) {
  const existingTemplate = templates.find((template) => template.drugId === drug.id);
  const [planKind, setPlanKind] = useState<MedicationPlanKind>(existingTemplate ? "long-term" : "acute");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<LongTermTemplateDraft>(() => existingTemplateToDraft(existingTemplate) ?? createTemplateDraft(drug));
  const [error, setError] = useState("");
  const templateStatus = useMemo(
    () => (existingTemplate ? `${existingTemplate.doseAmount} mg / ${existingTemplate.intervalHours}h` : "未存模板"),
    [existingTemplate]
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
        title: "方案选项卡已激活",
        detail: `${drug.genericNameZh} 已切换为按次记录`,
        tone: "info"
      });
      return;
    }

    setEditorOpen(true);
    onNotify({
      title: "长期用药编辑器已激活",
      detail: `${drug.genericNameZh} 可编辑长期用药模板`,
      tone: "info"
    });
  }

  function saveEditedTemplate() {
    const validation = validateTemplateDraft(draft);
    if (validation) {
      setError(validation);
      onNotify({
        title: "长期模板需要补全",
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
      title: "长期用药模板已激活",
      detail: `${template.label} · ${template.doseAmount} ${template.doseUnit} / ${template.intervalHours}h`,
      tone: "success"
    });
  }

  return (
    <div className="plan-selector" onClick={(event) => event.stopPropagation()}>
      <div className="plan-tabs" role="tablist" aria-label={`${drug.genericNameZh} 用药方案`}>
        <button
          type="button"
          role="tab"
          aria-selected={planKind === "acute"}
          className={planKind === "acute" ? "active" : ""}
          onClick={() => selectPlan("acute")}
        >
          一过性用药
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={planKind === "long-term"}
          className={planKind === "long-term" ? "active" : ""}
          onClick={() => selectPlan("long-term")}
        >
          长期用药
        </button>
      </div>
      <span className="plan-template-status">{planKind === "long-term" ? templateStatus : "按次记录"}</span>
      {planKind === "long-term" && editorOpen ? (
        <div className="plan-editor">
          <label>
            <span>模板名</span>
            <input value={draft.label} onChange={(event) => updateDraft("label", event.target.value)} />
          </label>
          <label>
            <span>剂量 mg</span>
            <input value={draft.doseAmount} inputMode="decimal" onChange={(event) => updateDraft("doseAmount", event.target.value)} />
          </label>
          <label>
            <span>间隔 h</span>
            <input value={draft.intervalHours} inputMode="decimal" onChange={(event) => updateDraft("intervalHours", event.target.value)} />
          </label>
          <label>
            <span>途径</span>
            <select value={draft.route} onChange={(event) => updateDraft("route", event.target.value as LongTermTemplateDraft["route"])}>
              <option value="oral">口服</option>
              <option value="injection">注射</option>
            </select>
          </label>
          <label className="wide">
            <span>剂型/备注</span>
            <input value={draft.formulation} onChange={(event) => updateDraft("formulation", event.target.value)} />
          </label>
          <button type="button" className="secondary-button compact" onClick={saveEditedTemplate}>
            保存并激活模板
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
