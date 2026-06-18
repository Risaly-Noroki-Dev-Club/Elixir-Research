import { Activity, AlertTriangle, Check, ChevronDown, ListChecks, Pencil, Pill, Plus, ShieldCheck, Syringe, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ActionNotice } from "../../app/types";
import { DateTimeInput } from "../../components/ui/DateTimeInput";
import { Metric } from "../../components/ui/Metric";
import { Panel } from "../../components/ui/Panel";
import { QueueItem } from "../../components/ui/QueueItem";
import type { DrugRegistryEntry } from "../../features/drug-data/types";
import { summarizeMedicationCourse, sortMedicationEvents } from "../../features/medication/courseSummary";
import { formatDatetimeLocal, formatMedicationTime } from "../../features/medication/dateTime";
import { getRouteGuidance, type GuidanceSection } from "../../features/medication/routeGuidance";
import type { LongTermMedicationTemplate, MedicationDraft, MedicationEvent, MedicationRoute } from "../../features/medication/types";
import { useI18n, type Locale } from "../../i18n/I18nProvider";
import { PkPreviewPanel } from "./components/PkPreviewPanel";
import { TemplateQuickAddDialog } from "./components/TemplateQuickAddDialog";

interface CourseTrackerPageProps {
  selectedDrug: DrugRegistryEntry;
  medicationEvents: MedicationEvent[];
  longTermTemplates: LongTermMedicationTemplate[];
  onAddMedicationEvent: (event: MedicationEvent) => void;
  onUpdateMedicationEvent: (event: MedicationEvent) => void;
  onDeleteMedicationEvent: (event: MedicationEvent) => void;
  onSaveLongTermTemplate: (template: LongTermMedicationTemplate) => void;
  onNotify: (notice: Omit<ActionNotice, "id">) => void;
}

export function CourseTrackerPage({
  selectedDrug,
  medicationEvents,
  longTermTemplates,
  onAddMedicationEvent,
  onUpdateMedicationEvent,
  onDeleteMedicationEvent,
  onSaveLongTermTemplate,
  onNotify
}: CourseTrackerPageProps) {
  const { locale, t } = useI18n();
  const [draft, setDraft] = useState<MedicationDraft>(() => createInitialDraft(selectedDrug, t));
  const [pendingEvent, setPendingEvent] = useState<MedicationEvent | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const selectedEvents = useMemo(
    () => sortMedicationEvents(medicationEvents.filter((event) => event.drugId === selectedDrug.id)),
    [medicationEvents, selectedDrug.id]
  );
  const summary = useMemo(
    () => summarizeMedicationCourse({ events: medicationEvents, selectedDrug, now: new Date() }),
    [medicationEvents, selectedDrug]
  );
  const route = getRouteGuidance(draft.route);
  const routeCopy = useMemo(() => getLocalizedRouteGuidance(route.route, route.sections, t), [route.route, route.sections, t]);
  const selectedTemplates = useMemo(
    () => longTermTemplates.filter((template) => template.drugId === selectedDrug.id),
    [longTermTemplates, selectedDrug.id]
  );
  const selectedDrugPrimaryName = getDisplayedDrugName(selectedDrug, locale);
  const selectedDrugSecondaryName = getDisplayedDrugSecondaryName(selectedDrug, locale);
  const statusLabel = ["seed", "needs-review", "reviewed", "rejected"].includes(selectedDrug.reviewStatus)
    ? t(`status.${selectedDrug.reviewStatus}`)
    : selectedDrug.reviewStatus;

  useEffect(() => {
    setDraft(createInitialDraft(selectedDrug, t));
    setPendingEvent(null);
    setEditingEventId(null);
    setFormError("");
  }, [selectedDrug.id]);

  function updateDraft<Key extends keyof MedicationDraft>(key: Key, value: MedicationDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormError("");
  }

  function prepareConfirmation() {
    const doseAmount = Number(draft.doseAmount);
    const takenAt = new Date(draft.takenAtLocal);

    if (Number.isNaN(takenAt.getTime())) {
      setFormError(t("courseTracker.form.errors.invalidTime"));
      return;
    }

    if (!Number.isFinite(doseAmount) || doseAmount <= 0) {
      setFormError(t("courseTracker.form.errors.invalidDose"));
      return;
    }

    setPendingEvent({
      id: editingEventId ?? `dose-${Date.now()}`,
      drugId: selectedDrug.id,
      takenAt: takenAt.toISOString(),
      route: draft.route,
      doseAmount,
      doseUnit: draft.doseUnit,
      formulation: draft.formulation.trim() || inferDefaultFormulation(selectedDrug, t),
      site: draft.route === "injection" ? draft.site.trim() || t("courseTracker.confirm.notApplicable") : undefined,
      source: editingEventId ? selectedEvents.find((event) => event.id === editingEventId)?.source ?? "manual" : "manual",
      note: draft.note.trim()
    });
  }

  function confirmMedicationEvent() {
    if (!pendingEvent) return;

    if (editingEventId) {
      onUpdateMedicationEvent(pendingEvent);
    } else {
      onAddMedicationEvent(pendingEvent);
    }

    resetEditor();
  }

  function editMedicationEvent(event: MedicationEvent) {
    setEditingEventId(event.id);
    setPendingEvent(null);
    setFormError("");
    setDraft(eventToDraft(event));
    onNotify({
      title: t("courseTracker.notices.editorOpened"),
      detail: t("courseTracker.notices.editorOpenedDetail", {
        time: formatDateTime(event.takenAt, locale),
        dose: event.doseAmount,
        unit: event.doseUnit
      }),
      tone: "info"
    });
  }

  function deleteMedicationEvent(event: MedicationEvent) {
    const confirmed = window.confirm(
      t("courseTracker.logs.deleteConfirm", {
        time: formatDateTime(event.takenAt, locale),
        dose: event.doseAmount,
        unit: event.doseUnit
      })
    );
    if (!confirmed) return;
    if (editingEventId === event.id) {
      resetEditor();
    }
    onDeleteMedicationEvent(event);
  }

  function resetEditor() {
    setPendingEvent(null);
    setEditingEventId(null);
    setDraft(createInitialDraft(selectedDrug, t));
    setFormError("");
  }

  return (
    <>
      <section className="page-heading">
        <div className="heading-icon">
          <ListChecks size={32} />
        </div>
        <div>
          <h1>{t("courseTracker.title")}</h1>
          <p>{t("courseTracker.copy")}</p>
        </div>
      </section>

      <section className="tracker-summary">
        <Metric label={t("courseTracker.summary.courseTotal")} value={String(summary.totalDoseMg)} unit="mg" />
        <Metric label={t("courseTracker.summary.last24h")} value={String(summary.last24hDoseMg)} unit="mg" />
        <Metric label={t("courseTracker.summary.doseCount")} value={String(summary.doseCount)} unit={t("courseTracker.summary.logs") as string} />
        <Metric label={t("courseTracker.summary.adherence")} value={String(summary.adherencePercent)} unit="%" />
      </section>

      <div className="pk-link-notice">
        <Activity size={16} />
        <span>{t("courseTracker.pkLinkNotice")}</span>
      </div>

      <section className="detail-grid">
        <PkPreviewPanel
          selectedDrug={selectedDrug}
          medicationEvents={medicationEvents}
          longTermTemplates={longTermTemplates}
          onSaveLongTermTemplate={onSaveLongTermTemplate}
          onNotify={onNotify}
        />

        <Panel title={editingEventId ? t("courseTracker.form.editTitle") : t("courseTracker.form.addTitle")} icon={editingEventId ? <Pencil size={17} /> : <Plus size={17} />} wide>
          <div className="medication-form">
            <label>
              <span>{t("courseTracker.form.administrationTime")}</span>
              <DateTimeInput value={draft.takenAtLocal} onChange={(value) => updateDraft("takenAtLocal", value)} onSetNow={() => updateDraft("takenAtLocal", formatDatetimeLocal(new Date()))} />
            </label>

            <label>
              <span>{t("courseTracker.form.route")}</span>
              <div className="route-selector">
                <button type="button" className={draft.route === "oral" ? "route-option active" : "route-option"} onClick={() => updateDraft("route", "oral")}>
                  <Pill size={17} />
                  {t("courseTracker.form.oral")}
                </button>
                <button type="button" className={draft.route === "injection" ? "route-option active" : "route-option"} onClick={() => updateDraft("route", "injection")}>
                  <Syringe size={17} />
                  {t("courseTracker.form.injection")}
                </button>
              </div>
            </label>

            <label>
              <span>{t("courseTracker.form.drug")}</span>
              <div className="select-like-input">
                <Pill size={18} />
                <strong>
                  {selectedDrugPrimaryName}
                  {selectedDrugSecondaryName ? ` (${selectedDrugSecondaryName})` : ""}
                </strong>
                <ChevronDown size={16} />
              </div>
            </label>

            <label>
              <span>{t("courseTracker.form.dose")}</span>
              <input value={draft.doseAmount} inputMode="decimal" placeholder="0.0" onChange={(event) => updateDraft("doseAmount", event.target.value)} />
            </label>

            <label>
              <span>{t("courseTracker.form.formulation")}</span>
              <input value={draft.formulation} placeholder={t("courseTracker.form.formulationPlaceholder")} onChange={(event) => updateDraft("formulation", event.target.value)} />
            </label>

            {draft.route === "injection" ? (
              <label>
                <span>{t("courseTracker.form.site")}</span>
                <input value={draft.site} placeholder={t("courseTracker.form.sitePlaceholder")} onChange={(event) => updateDraft("site", event.target.value)} />
              </label>
            ) : null}

            <label className="form-wide">
              <span>{t("courseTracker.form.note")}</span>
              <input value={draft.note} placeholder={t("courseTracker.form.notePlaceholder")} onChange={(event) => updateDraft("note", event.target.value)} />
            </label>
          </div>

          <div className="route-guidance-callout">
            <AlertTriangle size={18} />
            <div>
              <strong>{t("courseTracker.routeGuidance.recordingTitle", { route: routeCopy.label })}</strong>
              <span>{routeCopy.summary}</span>
            </div>
          </div>

          <div className="sop-grid">
            {routeCopy.sections.map((section) => (
              <section className={`sop-card ${section.emphasis ?? ""}`} key={section.title}>
                <strong>{section.title}</strong>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="source-line">
            {t("courseTracker.routeGuidance.source")}{" "}
            <a href={route.sourceUrl} target="_blank" rel="noreferrer">
              {routeCopy.sourceLabel}
            </a>
          </div>

          {formError ? <p className="form-error">{formError}</p> : null}
          <div className="button-row form-actions">
            <button className="secondary-button" type="button" onClick={() => setQuickAddOpen(true)} disabled={Boolean(editingEventId)}>
              {t("courseTracker.form.quickAdd")}
            </button>
            <button className="secondary-button" type="button" onClick={resetEditor}>
              {editingEventId ? t("courseTracker.form.cancelEdit") : t("courseTracker.form.clear")}
            </button>
            <button className="primary-button" type="button" onClick={prepareConfirmation}>
              {editingEventId ? t("courseTracker.form.reviewSave") : t("courseTracker.form.reviewAdd")}
            </button>
          </div>
        </Panel>

        <Panel title={t("courseTracker.logs.title")} icon={<ListChecks size={17} />} wide>
          <div className="dose-log-table">
            <div className="dose-log-row head">
              <span>{t("courseTracker.logs.table.time")}</span>
              <span>{t("courseTracker.logs.table.drug")}</span>
              <span>{t("courseTracker.logs.table.route")}</span>
              <span>{t("courseTracker.logs.table.dose")}</span>
              <span>{t("courseTracker.logs.table.note")}</span>
              <span>{t("courseTracker.logs.table.actions")}</span>
            </div>
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => (
                <div className={editingEventId === event.id ? "dose-log-row editing" : "dose-log-row"} key={event.id}>
                  <div className="dose-log-time">
                    <span>{formatDateTime(event.takenAt, locale)}</span>
                    <small className="dose-log-relative">{formatRelativeToNow(event.takenAt, t)}</small>
                  </div>
                  <span>{selectedDrugSecondaryName || selectedDrugPrimaryName}</span>
                  <span>{event.route === "oral" ? t("courseTracker.form.oral") : t("courseTracker.form.injection")}</span>
                  <span>
                    {event.doseAmount} {event.doseUnit}
                  </span>
                  <span>{event.note || event.formulation}</span>
                  <span className="dose-log-actions">
                    <button className="table-link-button" type="button" onClick={() => editMedicationEvent(event)}>
                      <Pencil size={15} />
                      {t("courseTracker.logs.edit")}
                    </button>
                    <button className="table-link-button danger" type="button" onClick={() => deleteMedicationEvent(event)}>
                      <Trash2 size={15} />
                      {t("courseTracker.logs.delete")}
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <div className="dose-log-row empty">{t("courseTracker.logs.empty")}</div>
            )}
          </div>
        </Panel>

        <Panel title={t("courseTracker.panels.aggregationTitle")} icon={<Activity size={17} />}>
          <p className="panel-copy">{t("courseTracker.panels.aggregationCopy")}</p>
        </Panel>

        <Panel title={t("courseTracker.panels.stateTitle")} icon={<ShieldCheck size={17} />}>
          <QueueItem label={t("courseTracker.state.defaultInterval")} value={`${selectedDrug.defaultIntervalHours} h`} />
          <QueueItem label={t("courseTracker.state.courseWindow")} value={t("courseTracker.state.courseWindowValue")} />
          <QueueItem label={t("courseTracker.state.reviewState")} value={statusLabel} warning={selectedDrug.reviewStatus !== "reviewed"} />
        </Panel>
      </section>

      {pendingEvent ? (
        <MedicationConfirmationDialog event={pendingEvent} selectedDrug={selectedDrug} onCancel={() => setPendingEvent(null)} onConfirm={confirmMedicationEvent} isEditing={Boolean(editingEventId)} />
      ) : null}
      {quickAddOpen ? (
        <TemplateQuickAddDialog
          templates={selectedTemplates}
          onCancel={() => setQuickAddOpen(false)}
          onCreatePendingEvent={(event) => {
            setQuickAddOpen(false);
            setPendingEvent(event);
          }}
        />
      ) : null}
    </>
  );
}

function MedicationConfirmationDialog({
  event,
  selectedDrug,
  onCancel,
  onConfirm,
  isEditing
}: {
  event: MedicationEvent;
  selectedDrug: DrugRegistryEntry;
  onCancel: () => void;
  onConfirm: () => void;
  isEditing: boolean;
}) {
  const { locale, t } = useI18n();
  const primaryDrugName = getDisplayedDrugName(selectedDrug, locale);
  const secondaryDrugName = getDisplayedDrugSecondaryName(selectedDrug, locale);

  return (
    <div className="modal-scrim" role="presentation">
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-medication-title">
        <div className="confirm-dialog-header">
          <div>
            <span>{t("courseTracker.confirm.tag")}</span>
            <h2 id="confirm-medication-title">{isEditing ? t("courseTracker.confirm.titleEdit") : t("courseTracker.confirm.titleAdd")}</h2>
          </div>
          <button className="row-menu-button" type="button" onClick={onCancel} title={t("common.close")}>
            <X size={18} />
          </button>
        </div>
        <p className="panel-copy">{t("courseTracker.confirm.copy")}</p>
        <div className="confirm-grid">
          <ConfirmItem label={t("courseTracker.confirm.labels.drug")} value={`${primaryDrugName}${secondaryDrugName ? ` / ${secondaryDrugName}` : ""}`} />
          <ConfirmItem label={t("courseTracker.confirm.labels.time")} value={formatDateTime(event.takenAt, locale)} />
          <ConfirmItem label={t("courseTracker.confirm.labels.route")} value={event.route === "oral" ? t("courseTracker.form.oral") : t("courseTracker.form.injection")} />
          <ConfirmItem label={t("courseTracker.confirm.labels.dose")} value={`${event.doseAmount} ${event.doseUnit}`} />
          <ConfirmItem label={t("courseTracker.confirm.labels.formulation")} value={event.formulation} />
          <ConfirmItem label={t("courseTracker.confirm.labels.site")} value={event.site ?? t("courseTracker.confirm.notApplicable")} />
          <ConfirmItem label={t("courseTracker.confirm.labels.note")} value={event.note || t("courseTracker.confirm.noNote")} />
        </div>
        <div className="confirm-safety">
          <AlertTriangle size={16} />
          <span>{t("courseTracker.confirm.safety")}</span>
        </div>
        <div className="button-row confirm-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            {t("courseTracker.confirm.back")}
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            <Check size={16} />
            {isEditing ? t("courseTracker.confirm.confirmSave") : t("courseTracker.confirm.confirmAdd")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="confirm-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function createInitialDraft(selectedDrug: DrugRegistryEntry, t: (key: string, variables?: Record<string, string | number>) => string): MedicationDraft {
  return {
    drugId: selectedDrug.id,
    takenAtLocal: formatDatetimeLocal(new Date()),
    route: "oral",
    doseAmount: String(selectedDrug.defaultDoseMg),
    doseUnit: "mg",
    formulation: inferDefaultFormulation(selectedDrug, t),
    site: "",
    note: ""
  };
}

function eventToDraft(event: MedicationEvent): MedicationDraft {
  return {
    drugId: event.drugId,
    takenAtLocal: formatDatetimeLocal(new Date(event.takenAt)),
    route: event.route,
    doseAmount: String(event.doseAmount),
    doseUnit: event.doseUnit,
    formulation: event.formulation,
    site: event.site ?? "",
    note: event.note
  };
}

function inferDefaultFormulation(selectedDrug: DrugRegistryEntry, t: (key: string, variables?: Record<string, string | number>) => string) {
  return selectedDrug.releaseModel === "biphasic-cr" ? t("courseTracker.form.defaults.extendedRelease") : t("courseTracker.form.defaults.immediateRelease");
}

function formatDateTime(value: string, locale: Locale) {
  return formatMedicationTime(value, locale);
}

function formatRelativeToNow(value: string, t: (key: string, variables?: Record<string, string | number>) => string) {
  const elapsedHours = (Date.now() - new Date(value).getTime()) / 3_600_000;
  if (!Number.isFinite(elapsedHours)) return "";
  if (elapsedHours < 1) return t("courseTracker.logs.justRecorded");
  return t("courseTracker.logs.hoursAgo", { hours: elapsedHours.toFixed(1) });
}

function getDisplayedDrugName(selectedDrug: DrugRegistryEntry, locale: Locale) {
  if (locale === "zh-Hans" || locale === "zh-Hant") {
    return selectedDrug.genericNameZh || selectedDrug.genericName;
  }

  return selectedDrug.genericName;
}

function getDisplayedDrugSecondaryName(selectedDrug: DrugRegistryEntry, locale: Locale) {
  if (locale === "zh-Hans" || locale === "zh-Hant") {
    return selectedDrug.brandNames[0] ?? selectedDrug.genericName;
  }

  return selectedDrug.genericNameZh || selectedDrug.brandNames[0] || "";
}

function getLocalizedRouteGuidance(
  route: MedicationRoute,
  fallbackSections: GuidanceSection[],
  t: (key: string, variables?: Record<string, string | number>) => string
) {
  const sectionKeySets: Record<MedicationRoute, string[]> = {
    oral: ["checkBeforeRecording", "recordingBoundary"],
    injection: ["safetyCheck", "stopAndGetHelp"]
  };
  const sections = sectionKeySets[route].map((sectionKey, index) => ({
    title: t(`courseTracker.routeGuidance.${route}.sections.${sectionKey}.title`),
    items: [1, 2, 3]
      .map((itemIndex) => t(`courseTracker.routeGuidance.${route}.sections.${sectionKey}.items.item${itemIndex}`))
      .filter((item) => !item.includes(".items.item")),
    emphasis: fallbackSections[index]?.emphasis
  }));

  return {
    label: t(`courseTracker.routeGuidance.${route}.label`),
    summary: t(`courseTracker.routeGuidance.${route}.summary`),
    sourceLabel: t(`courseTracker.routeGuidance.${route}.sourceLabel`),
    sections
  };
}
