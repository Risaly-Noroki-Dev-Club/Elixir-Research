import { AlertTriangle, Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DateTimeInput } from "../../../components/ui/DateTimeInput";
import { formatDatetimeLocal } from "../../../features/medication/dateTime";
import { buildMedicationEventFromTemplate } from "../../../features/medication/templates";
import type { LongTermMedicationTemplate, MedicationEvent } from "../../../features/medication/types";
import { useI18n } from "../../../i18n/I18nProvider";

interface TemplateQuickAddDialogProps {
  templates: LongTermMedicationTemplate[];
  onCancel: () => void;
  onCreatePendingEvent: (event: MedicationEvent) => void;
}

export function TemplateQuickAddDialog({ templates, onCancel, onCreatePendingEvent }: TemplateQuickAddDialogProps) {
  const { t } = useI18n();
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
      setError(t("courseTracker.quickAdd.errors.noTemplate"));
      return;
    }

    if (Number.isNaN(takenAt.getTime())) {
      setError(t("courseTracker.quickAdd.errors.invalidTime"));
      return;
    }

    if (!Number.isFinite(dose) || dose <= 0) {
      setError(t("courseTracker.quickAdd.errors.invalidDose"));
      return;
    }

    if (!Number.isFinite(interval) || interval <= 0) {
      setError(t("courseTracker.quickAdd.errors.invalidInterval"));
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
            <span>{t("courseTracker.quickAdd.tag")}</span>
            <h2 id="template-quick-add-title">{t("courseTracker.quickAdd.title")}</h2>
          </div>
          <button className="row-menu-button" type="button" onClick={onCancel} title={t("common.close")}>
            <X size={18} />
          </button>
        </div>
        <p className="panel-copy">{t("courseTracker.quickAdd.copy")}</p>
        {templateOptions.length > 0 ? (
          <div className="template-quick-form">
            <label className="wide">
              <span>{t("courseTracker.quickAdd.template")}</span>
              <select value={selectedTemplateId} onChange={(event) => selectTemplate(event.target.value)}>
                {templateOptions.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("courseTracker.quickAdd.administrationTime")}</span>
              <DateTimeInput value={takenAtLocal} onChange={setTakenAtLocal} onSetNow={() => setTakenAtLocal(formatDatetimeLocal(new Date()))} />
            </label>
            <label>
              <span>{t("courseTracker.quickAdd.dose")}</span>
              <input value={doseAmount} inputMode="decimal" onChange={(event) => setDoseAmount(event.target.value)} />
            </label>
            <label>
              <span>{t("courseTracker.quickAdd.interval")}</span>
              <input value={intervalHours} inputMode="decimal" onChange={(event) => setIntervalHours(event.target.value)} />
            </label>
            <label>
              <span>{t("courseTracker.quickAdd.route")}</span>
              <input value={selectedTemplate?.route === "injection" ? t("courseTracker.form.injection") : t("courseTracker.form.oral")} readOnly />
            </label>
            <label className="wide">
              <span>{t("courseTracker.quickAdd.note")}</span>
              <input value={note} placeholder={t("courseTracker.quickAdd.notePlaceholder")} onChange={(event) => setNote(event.target.value)} />
            </label>
          </div>
        ) : (
          <div className="confirm-safety">
            <AlertTriangle size={16} />
            <span>{t("courseTracker.quickAdd.noTemplate")}</span>
          </div>
        )}
        {error ? <p className="form-error">{error}</p> : null}
        <div className="button-row confirm-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button className="primary-button" type="button" onClick={createEvent} disabled={templateOptions.length === 0}>
            <Check size={16} />
            {t("courseTracker.quickAdd.applyReview")}
          </button>
        </div>
      </div>
    </div>
  );
}
