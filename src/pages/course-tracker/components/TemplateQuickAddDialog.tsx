import { AlertTriangle, Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DateTimeInput } from "../../../components/ui/DateTimeInput";
import { formatDatetimeLocal } from "../../../features/medication/dateTime";
import { buildMedicationEventFromTemplate } from "../../../features/medication/templates";
import type { LongTermMedicationTemplate, MedicationEvent } from "../../../features/medication/types";

interface TemplateQuickAddDialogProps {
  templates: LongTermMedicationTemplate[];
  onCancel: () => void;
  onCreatePendingEvent: (event: MedicationEvent) => void;
}

export function TemplateQuickAddDialog({ templates, onCancel, onCreatePendingEvent }: TemplateQuickAddDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? "");
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0];
  const [takenAtLocal, setTakenAtLocal] = useState(() => formatDatetimeLocal(new Date()));
  const [doseAmount, setDoseAmount] = useState(() => String(selectedTemplate?.doseAmount ?? ""));
  const [intervalHours, setIntervalHours] = useState(() => String(selectedTemplate?.intervalHours ?? ""));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const templateOptions = useMemo(() => templates, [templates]);

  function selectTemplate(templateId: string) {
    const template = templates.find((entry) => entry.id === templateId);
    setSelectedTemplateId(templateId);
    setDoseAmount(String(template?.doseAmount ?? ""));
    setIntervalHours(String(template?.intervalHours ?? ""));
    setError("");
  }

  function createEvent() {
    const dose = Number(doseAmount);
    const interval = Number(intervalHours);
    const takenAt = new Date(takenAtLocal);

    if (!selectedTemplate) {
      setError("当前药物还没有长期用药模板。");
      return;
    }

    if (Number.isNaN(takenAt.getTime())) {
      setError("请填写有效的给药时间。");
      return;
    }

    if (!Number.isFinite(dose) || dose <= 0) {
      setError("请填写大于 0 的剂量。");
      return;
    }

    if (!Number.isFinite(interval) || interval <= 0) {
      setError("请填写大于 0 的间隔。");
      return;
    }

    onCreatePendingEvent(
      buildMedicationEventFromTemplate({
        template: selectedTemplate,
        takenAtLocal,
        doseAmountOverride: dose,
        intervalOverride: interval,
        note
      })
    );
  }

  return (
    <div className="modal-scrim" role="presentation">
      <div className="confirm-dialog template-dialog" role="dialog" aria-modal="true" aria-labelledby="template-quick-add-title">
        <div className="confirm-dialog-header">
          <div>
            <span>快速加入</span>
            <h2 id="template-quick-add-title">长期用药模板</h2>
          </div>
          <button className="row-menu-button" type="button" onClick={onCancel} title="关闭">
            <X size={18} />
          </button>
        </div>
        <p className="panel-copy">选择一个模板，可以在加入前临时调整参数。下一步仍会进入二次确认，不会直接写入记录。</p>
        {templateOptions.length > 0 ? (
          <div className="template-quick-form">
            <label className="wide">
              <span>模板</span>
              <select value={selectedTemplateId} onChange={(event) => selectTemplate(event.target.value)}>
                {templateOptions.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>给药时间</span>
              <DateTimeInput value={takenAtLocal} onChange={setTakenAtLocal} onSetNow={() => setTakenAtLocal(formatDatetimeLocal(new Date()))} />
            </label>
            <label>
              <span>剂量 mg</span>
              <input value={doseAmount} inputMode="decimal" onChange={(event) => setDoseAmount(event.target.value)} />
            </label>
            <label>
              <span>间隔 h</span>
              <input value={intervalHours} inputMode="decimal" onChange={(event) => setIntervalHours(event.target.value)} />
            </label>
            <label>
              <span>途径</span>
              <input value={selectedTemplate?.route === "injection" ? "注射" : "口服"} readOnly />
            </label>
            <label className="wide">
              <span>备注</span>
              <input value={note} placeholder="例如本次提前/延后、随餐、症状备注" onChange={(event) => setNote(event.target.value)} />
            </label>
          </div>
        ) : (
          <div className="confirm-safety">
            <AlertTriangle size={16} />
            <span>当前药物还没有长期用药模板。请先在药物库中保存一个长期用药模板。</span>
          </div>
        )}
        {error ? <p className="form-error">{error}</p> : null}
        <div className="button-row confirm-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            取消
          </button>
          <button className="primary-button" type="button" onClick={createEvent} disabled={templateOptions.length === 0}>
            <Check size={16} />
            套用并复核
          </button>
        </div>
      </div>
    </div>
  );
}
