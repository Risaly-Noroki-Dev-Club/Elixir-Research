import React, { useState } from "react";
import { FlaskConical } from "lucide-react";
import type { ActionNotice as ActionNoticeModel, AppView, NotFoundContext } from "./types";
import { ConsoleNavigation } from "../components/console/ConsoleNavigation";
import { ConsoleTopbar } from "../components/console/ConsoleTopbar";
import { ActionNotice } from "../components/ui/ActionNotice";
import { drugRegistry } from "../features/drug-data/registry";
import type { DrugRegistryEntry } from "../features/drug-data/types";
import { sampleMedicationEvents } from "../features/medication/sampleData";
import type { LongTermMedicationTemplate, MedicationEvent } from "../features/medication/types";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { CourseTrackerPage } from "../pages/course-tracker/CourseTrackerPage";
import { DrugLibraryPage } from "../pages/drug-library/DrugLibraryPage";
import { MedicationRemindersPage } from "../pages/medication-reminders/MedicationRemindersPage";
import { NotFoundPage } from "../pages/not-found/NotFoundPage";
import { UnavailableNotice } from "../pages/unavailable/UnavailableNotice";

export function App() {
  const [theme, setTheme] = useLocalStorageState<"dark" | "light">("er:theme", "light");
  const [accent, setAccent] = useLocalStorageState("er:accent", "#0f6fff");
  const [selectedDrugId, setSelectedDrugId] = useLocalStorageState("er:v1:selected-drug", drugRegistry[0].id);
  const [view, setView] = useState<AppView>("drug-library");
  const [activeNav, setActiveNav] = useState("药物列表");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 药物库: true, "FDA 数据": false, 用药: true });
  const [medicationEvents, setMedicationEvents] = useLocalStorageState<MedicationEvent[]>("er:v1:medication-events", sampleMedicationEvents);
  const [longTermTemplates, setLongTermTemplates] = useLocalStorageState<LongTermMedicationTemplate[]>("er:v1:medication-templates", []);
  const [notice, setNotice] = useState<ActionNoticeModel | null>(null);
  const [notFoundContext, setNotFoundContext] = useState<NotFoundContext>({
    module: "unknown",
    action: "unknown",
    source: "unknown"
  });

  const selectedDrug = drugRegistry.find((entry) => entry.id === selectedDrugId) ?? drugRegistry[0];

  function selectDrug(entry: DrugRegistryEntry) {
    setSelectedDrugId(entry.id);
  }

  function showNotFound(context: NotFoundContext) {
    notify({
      title: "按钮已触发",
      detail: `${context.module}.${context.action}`,
      tone: "info"
    });
    setNotFoundContext(context);
    setView("not-found");
  }

  function selectUnavailableNav(label: string) {
    notify({
      title: "选项卡已触发",
      detail: `${label} 当前功能未完成`,
      tone: "warning"
    });
    setActiveNav(label);
    setView("drug-library");
  }

  function navigate(label: string, nextView: AppView) {
    notify({
      title: "选项卡已切换",
      detail: label,
      tone: "info"
    });
    setActiveNav(label);
    setView(nextView);
  }

  function toggleGroup(label: string) {
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }));
    notify({
      title: "导航分组已切换",
      detail: label,
      tone: "info"
    });
    setActiveNav(label);
    setView("drug-library");
  }

  function addMedicationEvent(event: MedicationEvent) {
    notify({
      title: "用药记录已加入",
      detail: `${event.doseAmount} ${event.doseUnit} · ${event.source}`,
      tone: "success"
    });
    setMedicationEvents((current) => [event, ...current]);
  }

  function updateMedicationEvent(event: MedicationEvent) {
    notify({
      title: "用药记录已更新",
      detail: `${event.doseAmount} ${event.doseUnit} · ${event.source}`,
      tone: "success"
    });
    setMedicationEvents((current) => current.map((entry) => (entry.id === event.id ? event : entry)));
  }

  function deleteMedicationEvent(event: MedicationEvent) {
    notify({
      title: "用药记录已删除",
      detail: `${event.doseAmount} ${event.doseUnit} · ${formatMedicationDateForNotice(event.takenAt)}`,
      tone: "danger"
    });
    setMedicationEvents((current) => current.filter((entry) => entry.id !== event.id));
  }

  function saveLongTermTemplate(template: LongTermMedicationTemplate) {
    notify({
      title: "长期用药模板已保存",
      detail: `${template.label} · ${template.doseAmount} ${template.doseUnit} / ${template.intervalHours}h`,
      tone: "success"
    });
    setLongTermTemplates((current) => [template, ...current.filter((entry) => entry.id !== template.id)]);
  }

  function deleteMedicationHistory(drugId: string) {
    const drug = drugRegistry.find((entry) => entry.id === drugId);
    const count = medicationEvents.filter((event) => event.drugId === drugId).length;
    notify({
      title: "历史数据已删除",
      detail: `${drug?.genericNameZh ?? drugId} · ${count} 条记录`,
      tone: "danger"
    });
    setMedicationEvents((current) => current.filter((event) => event.drugId !== drugId));
  }

  function notify(nextNotice: Omit<ActionNoticeModel, "id">) {
    setNotice({
      id: Date.now(),
      ...nextNotice
    });
  }

  return (
    <main className="console-shell" data-theme={theme} style={{ "--accent": accent } as React.CSSProperties}>
      <aside className="console-sidebar" aria-label="Primary navigation">
        <div className="account-strip">
          <div className="brand-mark">
            <FlaskConical size={24} />
          </div>
          <div>
            <strong>Elixir Research</strong>
            <span>local-first console</span>
          </div>
        </div>
        <ConsoleNavigation
          activeNav={activeNav}
          openGroups={openGroups}
          onToggleGroup={toggleGroup}
          onNavigate={navigate}
          onUnavailable={selectUnavailableNav}
        />
      </aside>

      <section className="console-main">
        <ConsoleTopbar theme={theme} accent={accent} onThemeChange={setTheme} onAccentChange={setAccent} onNotFound={showNotFound} />
        {notice ? (
          <div className="notice-shell">
            <ActionNotice key={notice.id} notice={notice} />
          </div>
        ) : null}
        {view === "not-found" ? (
          <NotFoundPage
            context={notFoundContext}
            onBack={() => {
              setView("drug-library");
              setActiveNav("药物列表");
            }}
          />
        ) : (
          <div className="console-content">
            {activeNav !== "药物列表" && view === "drug-library" ? <UnavailableNotice label={activeNav} /> : null}
            {view === "course-tracker" ? (
              <CourseTrackerPage
                selectedDrug={selectedDrug}
                medicationEvents={medicationEvents}
                longTermTemplates={longTermTemplates}
                onAddMedicationEvent={addMedicationEvent}
                onUpdateMedicationEvent={updateMedicationEvent}
                onDeleteMedicationEvent={deleteMedicationEvent}
                onSaveLongTermTemplate={saveLongTermTemplate}
                onNotify={notify}
              />
            ) : view === "medication-reminders" ? (
              <MedicationRemindersPage selectedDrug={selectedDrug} />
            ) : (
              <DrugLibraryPage
                selectedDrug={selectedDrug}
                medicationEvents={medicationEvents}
                longTermTemplates={longTermTemplates}
                onSelectDrug={selectDrug}
                onSaveLongTermTemplate={saveLongTermTemplate}
                onOpenHistory={(entry) => {
                  selectDrug(entry);
                  navigate("疗程追踪器", "course-tracker");
                }}
                onDeleteHistory={(entry) => deleteMedicationHistory(entry.id)}
                onNotFound={showNotFound}
                onNotify={notify}
              />
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function formatMedicationDateForNotice(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "invalid time";
  return date.toLocaleString();
}
