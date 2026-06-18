import React, { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import type { ActionNotice as ActionNoticeModel, AppView, NotFoundContext } from "./types";
import { ConsoleNavigation } from "../components/console/ConsoleNavigation";
import { ConsoleTopbar } from "../components/console/ConsoleTopbar";
import { ActionNotice } from "../components/ui/ActionNotice";
import { listDrugRegistry } from "../features/drug-data/registry";
import type { DrugRegistryEntry } from "../features/drug-data/types";
import { getHelpDocByNavLabel, helpGroupLabel } from "../features/help/helpDocs";
import { sampleMedicationEvents } from "../features/medication/sampleData";
import type { LongTermMedicationTemplate, MedicationEvent } from "../features/medication/types";
import { QuickSearchDialog } from "../features/quick-search/QuickSearchDialog";
import type { QuickSearchEntry } from "../features/quick-search/searchIndex";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { useI18n } from "../i18n/I18nProvider";
import { CourseTrackerPage } from "../pages/course-tracker/CourseTrackerPage";
import { DrugLibraryPage } from "../pages/drug-library/DrugLibraryPage";
import { HelpPage } from "../pages/help/HelpPage";
import { MedicationRemindersPage } from "../pages/medication-reminders/MedicationRemindersPage";
import { NotFoundPage } from "../pages/not-found/NotFoundPage";
import { UnavailableNotice } from "../pages/unavailable/UnavailableNotice";

const drugLibraryGroupLabel = "Drug Library";
const drugLibraryNavLabel = "Library";
const medicationGroupLabel = "Medication";
const courseTrackerNavLabel = "Course Tracker";

const navLabelKeyMap: Record<string, string> = {
  "Account Home": "nav.accountHome",
  "Drug Library": "nav.drugLibrary",
  Library: "nav.library",
  "FDA Data": "nav.fdaData",
  "Label Search": "nav.labelSearch",
  "PK Extraction": "nav.pkExtraction",
  "Mapping Review": "nav.mappingReview",
  Medication: "nav.medication",
  "Course Tracker": "nav.courseTracker",
  "Medication Reminders": "nav.medicationReminders",
  Help: "nav.help",
  "Help Overview": "nav.helpOverview",
  "Help Drug Library": "nav.helpDrugLibrary",
  "Help Course Tracker": "nav.helpCourseTracker",
  "Help PK Preview": "nav.helpPkPreview",
  "Help Data & Settings": "nav.helpDataOps",
  "PK Preview": "nav.pkPreview",
  "Interaction Risk": "nav.interactionRisk",
  "FDA Extraction": "nav.fdaExtraction",
  "Report Templates": "nav.reportTemplates",
  "Privacy Keys": "nav.privacyKeys"
};

export function App() {
  const { t } = useI18n();
  const [theme, setTheme] = useLocalStorageState<"dark" | "light">("er:theme", "light");
  const [accent, setAccent] = useLocalStorageState("er:accent", "#0f6fff");
  const [selectedDrugId, setSelectedDrugId] = useLocalStorageState("er:v1:selected-drug", "");
  const [view, setView] = useState<AppView>("drug-library");
  const [activeNav, setActiveNav] = useState(drugLibraryNavLabel);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [registryReloadKey, setRegistryReloadKey] = useState(0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    [drugLibraryGroupLabel]: true,
    "FDA Data": false,
    [medicationGroupLabel]: true,
    [helpGroupLabel]: false
  });
  const [drugRegistry, setDrugRegistry] = useState<DrugRegistryEntry[]>([]);
  const [registryLoading, setRegistryLoading] = useState(true);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [medicationEvents, setMedicationEvents] = useLocalStorageState<MedicationEvent[]>("er:v1:medication-events", sampleMedicationEvents);
  const [longTermTemplates, setLongTermTemplates] = useLocalStorageState<LongTermMedicationTemplate[]>("er:v1:medication-templates", []);
  const [notice, setNotice] = useState<ActionNoticeModel | null>(null);
  const [notFoundContext, setNotFoundContext] = useState<NotFoundContext>({
    module: "unknown",
    action: "unknown",
    source: "unknown"
  });

  useEffect(() => {
    let cancelled = false;

    async function loadRegistry() {
      setRegistryLoading(true);
      setRegistryError(null);

      try {
        const entries = await listDrugRegistry();
        if (cancelled) return;

        setDrugRegistry(entries);
        setRegistryError(null);
        setRegistryLoading(false);
        setSelectedDrugId((current) => (entries.some((entry) => entry.id === current) ? current : (entries[0]?.id ?? "")));
      } catch (error) {
        if (cancelled) return;

        setRegistryLoading(false);
        setRegistryError(error instanceof Error ? error.message : t("app.unknownRegistryError"));
      }
    }

    void loadRegistry();

    return () => {
      cancelled = true;
    };
  }, [registryReloadKey, setSelectedDrugId, t]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuickSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedDrug = drugRegistry.find((entry) => entry.id === selectedDrugId) ?? drugRegistry[0];
  const activeNavLabel = resolveNavDisplayLabel(activeNav, t);
  const activeHelpDoc = getHelpDocByNavLabel(activeNav);

  function selectDrug(entry: DrugRegistryEntry) {
    setSelectedDrugId(entry.id);
  }

  function showNotFound(context: NotFoundContext) {
    notify({
      title: t("app.actionTriggered"),
      detail: `${context.module}.${context.action}`,
      tone: "info"
    });
    setNotFoundContext(context);
    setView("not-found");
  }

  function selectUnavailableNav(label: string) {
    const displayLabel = resolveNavDisplayLabel(label, t);
    notify({
      title: t("app.navigationPlaceholder"),
      detail: t("app.notImplemented", { label: displayLabel }),
      tone: "warning"
    });
    setActiveNav(label);
    setView("drug-library");
  }

  function navigate(label: string, nextView: AppView) {
    const displayLabel = resolveNavDisplayLabel(label, t);
    notify({
      title: t("app.navigationUpdated"),
      detail: displayLabel,
      tone: "info"
    });
    setActiveNav(label);
    setView(nextView);
  }

  function toggleGroup(label: string) {
    const displayLabel = resolveNavDisplayLabel(label, t);
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }));
    notify({
      title: t("app.navigationGroupUpdated"),
      detail: displayLabel,
      tone: "info"
    });
    setActiveNav(label);
    setView("drug-library");
  }

  function addMedicationEvent(event: MedicationEvent) {
    notify({
      title: t("app.medicationLogAdded"),
      detail: `${event.doseAmount} ${event.doseUnit} / ${event.source}`,
      tone: "success"
    });
    setMedicationEvents((current) => [event, ...current]);
  }

  function updateMedicationEvent(event: MedicationEvent) {
    notify({
      title: t("app.medicationLogUpdated"),
      detail: `${event.doseAmount} ${event.doseUnit} / ${event.source}`,
      tone: "success"
    });
    setMedicationEvents((current) => current.map((entry) => (entry.id === event.id ? event : entry)));
  }

  function deleteMedicationEvent(event: MedicationEvent) {
    notify({
      title: t("app.medicationLogDeleted"),
      detail: `${event.doseAmount} ${event.doseUnit} / ${formatMedicationDateForNotice(event.takenAt)}`,
      tone: "danger"
    });
    setMedicationEvents((current) => current.filter((entry) => entry.id !== event.id));
  }

  function saveLongTermTemplate(template: LongTermMedicationTemplate) {
    notify({
      title: t("app.templateSaved"),
      detail: `${template.label} / ${template.doseAmount} ${template.doseUnit} / ${template.intervalHours}h`,
      tone: "success"
    });
    setLongTermTemplates((current) => [template, ...current.filter((entry) => entry.id !== template.id)]);
  }

  function deleteMedicationHistory(drugId: string) {
    const drug = drugRegistry.find((entry) => entry.id === drugId);
    const count = medicationEvents.filter((event) => event.drugId === drugId).length;
    notify({
      title: t("app.historyDeleted"),
      detail: t("app.historyDeletedDetail", { drug: drug?.genericName ?? drugId, count }),
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

  function handleQuickSearchSelect(entry: QuickSearchEntry) {
    if (entry.action.kind === "navigate") {
      navigate(entry.action.navLabel, entry.action.view);
      return;
    }

    selectUnavailableNav(entry.action.navLabel);
  }

  function refreshRegistry(entryId?: string) {
    if (entryId) {
      setSelectedDrugId(entryId);
    }
    setRegistryReloadKey((current) => current + 1);
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
          onQuickSearch={() => setQuickSearchOpen(true)}
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
              setActiveNav(drugLibraryNavLabel);
            }}
          />
        ) : (
            <div className="console-content">
            {activeNav !== drugLibraryNavLabel && view === "drug-library" ? <UnavailableNotice label={activeNavLabel} /> : null}
            {view === "help" ? (
              <HelpPage doc={activeHelpDoc} />
            ) : registryLoading ? (
              <div className="page-empty-state">{t("app.loadingRegistry")}</div>
            ) : registryError ? (
              <div className="page-empty-state">
                <div>{t("app.registryUnavailable")} {registryError}</div>
                <button className="secondary-button" type="button" onClick={() => setRegistryReloadKey((current) => current + 1)}>
                  {t("common.retryRegistry")}
                </button>
              </div>
            ) : !selectedDrug ? (
              <div className="page-empty-state">{t("app.registryEmpty")}</div>
            ) : view === "course-tracker" ? (
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
                registryCount={drugRegistry.length}
                selectedDrug={selectedDrug}
                medicationEvents={medicationEvents}
                longTermTemplates={longTermTemplates}
                onSelectDrug={selectDrug}
                onSaveLongTermTemplate={saveLongTermTemplate}
                onOpenHistory={(entry) => {
                  selectDrug(entry);
                  navigate(courseTrackerNavLabel, "course-tracker");
                }}
                onDeleteHistory={(entry) => deleteMedicationHistory(entry.id)}
                onNotFound={showNotFound}
                onNotify={notify}
                onRegistryRefresh={refreshRegistry}
              />
            )}
          </div>
        )}
      </section>

      <QuickSearchDialog open={quickSearchOpen} onClose={() => setQuickSearchOpen(false)} onSelect={handleQuickSearchSelect} />
    </main>
  );
}

function formatMedicationDateForNotice(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "invalid time";
  return date.toLocaleString();
}

function resolveNavDisplayLabel(label: string, t: (key: string, variables?: Record<string, string | number>) => string) {
  const translationKey = navLabelKeyMap[label];
  return translationKey ? t(translationKey) : label;
}
