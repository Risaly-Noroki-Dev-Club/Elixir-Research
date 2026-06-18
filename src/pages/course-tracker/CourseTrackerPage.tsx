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
import { getRouteGuidance } from "../../features/medication/routeGuidance";
import type { LongTermMedicationTemplate, MedicationDraft, MedicationEvent } from "../../features/medication/types";
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
  const [draft, setDraft] = useState<MedicationDraft>(() => createInitialDraft(selectedDrug));
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
  const selectedTemplates = useMemo(
    () => longTermTemplates.filter((template) => template.drugId === selectedDrug.id),
    [longTermTemplates, selectedDrug.id]
  );

  useEffect(() => {
    setDraft(createInitialDraft(selectedDrug));
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
      setFormError("请先填写有效的给药时间。");
      return;
    }

    if (!Number.isFinite(doseAmount) || doseAmount <= 0) {
      setFormError("请先填写大于 0 的剂量。");
      return;
    }

    setPendingEvent({
      id: editingEventId ?? `dose-${Date.now()}`,
      drugId: selectedDrug.id,
      takenAt: takenAt.toISOString(),
      route: draft.route,
      doseAmount,
      doseUnit: draft.doseUnit,
      formulation: draft.formulation.trim() || inferDefaultFormulation(selectedDrug),
      site: draft.route === "injection" ? draft.site.trim() || "未记录部位" : undefined,
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
      title: "用药记录编辑器已激活",
      detail: `${formatDateTime(event.takenAt)} · ${event.doseAmount} ${event.doseUnit}`,
      tone: "info"
    });
  }

  function deleteMedicationEvent(event: MedicationEvent) {
    const confirmed = window.confirm(`删除这条用药记录？\n${formatDateTime(event.takenAt)} · ${event.doseAmount} ${event.doseUnit}`);
    if (!confirmed) return;
    if (editingEventId === event.id) {
      resetEditor();
    }
    onDeleteMedicationEvent(event);
  }

  function resetEditor() {
    setPendingEvent(null);
    setEditingEventId(null);
    setDraft(createInitialDraft(selectedDrug));
    setFormError("");
  }

  return (
    <>
      <section className="page-heading">
        <div className="heading-icon">
          <ListChecks size={32} />
        </div>
        <div>
          <h1>疗程追踪器</h1>
          <p>记录每次实际用药，统计累计剂量、近 24 小时剂量和疗程依从性。新增与编辑记录都会保留二次确认。</p>
        </div>
      </section>

      <section className="tracker-summary">
        <Metric label="Course total" value={String(summary.totalDoseMg)} unit="mg" />
        <Metric label="Last 24h" value={String(summary.last24hDoseMg)} unit="mg" />
        <Metric label="Dose count" value={String(summary.doseCount)} unit="logs" />
        <Metric label="Adherence" value={String(summary.adherencePercent)} unit="%" />
      </section>

      <div className="pk-link-notice">
        <Activity size={16} />
        <span>这些记录会直接驱动下面的 PK 预览。确认新增、编辑或删除记录后，曲线会按当前记录重新计算。</span>
      </div>

      <section className="detail-grid">
        <PkPreviewPanel
          selectedDrug={selectedDrug}
          medicationEvents={medicationEvents}
          longTermTemplates={longTermTemplates}
          onSaveLongTermTemplate={onSaveLongTermTemplate}
          onNotify={onNotify}
        />

        <Panel title={editingEventId ? "编辑用药记录" : "新增用药记录"} icon={editingEventId ? <Pencil size={17} /> : <Plus size={17} />} wide>
          <div className="medication-form">
            <label>
              <span>给药时间</span>
              <DateTimeInput value={draft.takenAtLocal} onChange={(value) => updateDraft("takenAtLocal", value)} onSetNow={() => updateDraft("takenAtLocal", formatDatetimeLocal(new Date()))} />
            </label>

            <label>
              <span>给药途径</span>
              <div className="route-selector">
                <button type="button" className={draft.route === "oral" ? "route-option active" : "route-option"} onClick={() => updateDraft("route", "oral")}>
                  <Pill size={17} />
                  口服
                </button>
                <button type="button" className={draft.route === "injection" ? "route-option active" : "route-option"} onClick={() => updateDraft("route", "injection")}>
                  <Syringe size={17} />
                  注射
                </button>
              </div>
            </label>

            <label>
              <span>药物类型</span>
              <div className="select-like-input">
                <Pill size={18} />
                <strong>
                  {selectedDrug.genericNameZh} ({selectedDrug.brandNames[0] ?? selectedDrug.genericName})
                </strong>
                <ChevronDown size={16} />
              </div>
            </label>

            <label>
              <span>药物剂量 (mg)</span>
              <input value={draft.doseAmount} inputMode="decimal" placeholder="0.0" onChange={(event) => updateDraft("doseAmount", event.target.value)} />
            </label>

            <label>
              <span>剂型/规格</span>
              <input value={draft.formulation} placeholder="例如 extended-release tablet" onChange={(event) => updateDraft("formulation", event.target.value)} />
            </label>

            {draft.route === "injection" ? (
              <label>
                <span>注射部位/执行记录</span>
                <input value={draft.site} placeholder="例如 左侧上臂 / 处方指定部位 / 由医护执行" onChange={(event) => updateDraft("site", event.target.value)} />
              </label>
            ) : null}

            <label className="form-wide">
              <span>备注</span>
              <input value={draft.note} placeholder="可记录随餐、延后补服、处方确认状态等" onChange={(event) => updateDraft("note", event.target.value)} />
            </label>
          </div>

          <div className="route-guidance-callout">
            <AlertTriangle size={18} />
            <div>
              <strong>{route.label}记录安全提示</strong>
              <span>{route.summary}</span>
            </div>
          </div>

          <div className="sop-grid">
            {route.sections.map((section) => (
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
            来源:{" "}
            <a href={route.sourceUrl} target="_blank" rel="noreferrer">
              {route.sourceLabel}
            </a>
          </div>

          {formError ? <p className="form-error">{formError}</p> : null}
          <div className="button-row form-actions">
            <button className="secondary-button" type="button" onClick={() => setQuickAddOpen(true)} disabled={Boolean(editingEventId)}>
              快速加入（长期用药模板）
            </button>
            <button className="secondary-button" type="button" onClick={resetEditor}>
              {editingEventId ? "取消编辑" : "清空"}
            </button>
            <button className="primary-button" type="button" onClick={prepareConfirmation}>
              {editingEventId ? "复核并保存修改" : "复核并加入记录"}
            </button>
          </div>
        </Panel>

        <Panel title="用药记录" icon={<ListChecks size={17} />} wide>
          <div className="dose-log-table">
            <div className="dose-log-row head">
              <span>时间</span>
              <span>药物</span>
              <span>途径</span>
              <span>剂量</span>
              <span>备注</span>
              <span>操作</span>
            </div>
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => (
                <div className={editingEventId === event.id ? "dose-log-row editing" : "dose-log-row"} key={event.id}>
                  <div className="dose-log-time">
                    <span>{formatDateTime(event.takenAt)}</span>
                    <small className="dose-log-relative">{formatRelativeToNow(event.takenAt)}</small>
                  </div>
                  <span>{selectedDrug.brandNames[0] ?? selectedDrug.genericName}</span>
                  <span>{event.route === "oral" ? "口服" : "注射"}</span>
                  <span>
                    {event.doseAmount} {event.doseUnit}
                  </span>
                  <span>{event.note || event.formulation}</span>
                  <span className="dose-log-actions">
                    <button className="table-link-button" type="button" onClick={() => editMedicationEvent(event)}>
                      <Pencil size={15} />
                      编辑
                    </button>
                    <button className="table-link-button danger" type="button" onClick={() => deleteMedicationEvent(event)}>
                      <Trash2 size={15} />
                      删除
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <div className="dose-log-row empty">当前药物还没有用药记录。</div>
            )}
          </div>
        </Panel>

        <Panel title="剂量累计逻辑" icon={<Activity size={17} />}>
          <p className="panel-copy">累计剂量按药物、剂型、给药途径、疗程窗口和记录时间过滤。不同剂型默认不合并，除非存在经过审核的换算规则。</p>
        </Panel>

        <Panel title="疗程状态" icon={<ShieldCheck size={17} />}>
          <QueueItem label="default interval" value={`${selectedDrug.defaultIntervalHours} h`} />
          <QueueItem label="course window" value="48 h demo" />
          <QueueItem label="review state" value={selectedDrug.reviewStatus} warning={selectedDrug.reviewStatus !== "reviewed"} />
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
  return (
    <div className="modal-scrim" role="presentation">
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-medication-title">
        <div className="confirm-dialog-header">
          <div>
            <span>二次确认</span>
            <h2 id="confirm-medication-title">{isEditing ? "确认保存用药记录修改" : "确认加入用药记录"}</h2>
          </div>
          <button className="row-menu-button" type="button" onClick={onCancel} title="关闭">
            <X size={18} />
          </button>
        </div>
        <p className="panel-copy">请重新核对给药参数。确认后系统只记录事实，不代表处方变更或剂量建议。</p>
        <div className="confirm-grid">
          <ConfirmItem label="药物" value={`${selectedDrug.genericNameZh} / ${selectedDrug.brandNames[0] ?? selectedDrug.genericName}`} />
          <ConfirmItem label="时间" value={formatDateTime(event.takenAt)} />
          <ConfirmItem label="途径" value={event.route === "oral" ? "口服" : "注射"} />
          <ConfirmItem label="剂量" value={`${event.doseAmount} ${event.doseUnit}`} />
          <ConfirmItem label="剂型/规格" value={event.formulation} />
          <ConfirmItem label="部位/执行" value={event.site ?? "不适用"} />
          <ConfirmItem label="备注" value={event.note || "未填写"} />
        </div>
        <div className="confirm-safety">
          <AlertTriangle size={16} />
          <span>受控药物、精神药品、阿片类、镇静药或注射给药场景默认需要按处方和医嘱说明复核。</span>
        </div>
        <div className="button-row confirm-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            返回修改
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            <Check size={16} />
            {isEditing ? "确认保存" : "确认加入"}
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

function createInitialDraft(selectedDrug: DrugRegistryEntry): MedicationDraft {
  return {
    drugId: selectedDrug.id,
    takenAtLocal: formatDatetimeLocal(new Date()),
    route: "oral",
    doseAmount: String(selectedDrug.defaultDoseMg),
    doseUnit: "mg",
    formulation: inferDefaultFormulation(selectedDrug),
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

function inferDefaultFormulation(selectedDrug: DrugRegistryEntry) {
  return selectedDrug.releaseModel === "biphasic-cr" ? "extended-release / controlled-release" : "immediate-release";
}

function formatDateTime(value: string) {
  return formatMedicationTime(value);
}

function formatRelativeToNow(value: string) {
  const elapsedHours = (Date.now() - new Date(value).getTime()) / 3_600_000;
  if (!Number.isFinite(elapsedHours)) return "";
  if (elapsedHours < 1) return "刚刚记录";
  return `${elapsedHours.toFixed(1)} h ago`;
}
