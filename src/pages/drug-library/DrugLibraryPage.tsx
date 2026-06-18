import { Database, FilePlus2, Search, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ActionNotice, NotFoundContext } from "../../app/types";
import { Panel } from "../../components/ui/Panel";
import {
  createRegistryDraftFromOpenFdaCandidate,
  searchOpenFdaCatalog
} from "../../features/drug-data/openFdaCatalog";
import { persistDrugRegistryDraftEntry } from "../../features/drug-data/localDrafts";
import { resetDrugRegistryDatabase, searchDrugRegistry } from "../../features/drug-data/registry";
import type { DrugRegistryEntry, DrugRegistrySearchResult, OpenFdaCatalogSearchResult } from "../../features/drug-data/types";
import type { LongTermMedicationTemplate, MedicationEvent } from "../../features/medication/types";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useI18n } from "../../i18n/I18nProvider";
import { DrugLibraryToolbar, type DrugLibraryStatusFilter } from "./components/DrugLibraryToolbar";
import { LocalRegistryTable } from "./components/LocalRegistryTable";
import { OpenFdaSearchPanel } from "./components/OpenFdaSearchPanel";

interface DrugLibraryPageProps {
  registryCount: number;
  selectedDrug: DrugRegistryEntry;
  medicationEvents: MedicationEvent[];
  longTermTemplates: LongTermMedicationTemplate[];
  onSelectDrug: (entry: DrugRegistryEntry) => void;
  onSaveLongTermTemplate: (template: LongTermMedicationTemplate) => void;
  onOpenHistory: (entry: DrugRegistryEntry) => void;
  onDeleteHistory: (entry: DrugRegistryEntry) => void;
  onNotFound: (context: NotFoundContext) => void;
  onNotify: (notice: Omit<ActionNotice, "id">) => void;
  onRegistryRefresh: (entryId?: string) => void;
}

export function DrugLibraryPage({
  registryCount,
  selectedDrug,
  medicationEvents,
  longTermTemplates,
  onSelectDrug,
  onSaveLongTermTemplate,
  onOpenHistory,
  onDeleteHistory,
  onNotFound,
  onNotify,
  onRegistryRefresh
}: DrugLibraryPageProps) {
  const { t } = useI18n();
  const [query, setQuery] = useLocalStorageState("er:v1:drug-query", "");
  const [statusFilter, setStatusFilter] = useLocalStorageState<DrugLibraryStatusFilter>("er:v1:drug-status-filter", "all");
  const [newGenericName, setNewGenericName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [searchResult, setSearchResult] = useState<DrugRegistrySearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [remoteResult, setRemoteResult] = useState<OpenFdaCatalogSearchResult | null>(null);
  const [isRemoteSearching, setIsRemoteSearching] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRegistry() {
      setIsSearching(true);

      try {
        const result = await searchDrugRegistry(query);
        if (cancelled) return;

        setSearchResult(result);
        setSearchError(null);
      } catch (error) {
        if (cancelled) return;

        setSearchResult(null);
        setSearchError(error instanceof Error ? error.message : t("app.unknownRegistryError"));
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    void loadRegistry();

    return () => {
      cancelled = true;
    };
  }, [query, t]);

  useEffect(() => {
    if (!query.trim()) {
      setRemoteResult(null);
      setRemoteError(null);
      setIsRemoteSearching(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsRemoteSearching(true);
      try {
        const result = await searchOpenFdaCatalog(query);
        if (cancelled) return;
        setRemoteResult(result);
        setRemoteError(null);
      } catch (error) {
        if (cancelled) return;
        setRemoteResult(null);
        setRemoteError(error instanceof Error ? error.message : "openFDA search failed");
      } finally {
        if (!cancelled) {
          setIsRemoteSearching(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const filteredRegistry = useMemo(() => {
    const entries = searchResult?.entries ?? [];
    return entries.filter((entry) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "controlled-only") return entry.controlled;
      return entry.reviewStatus === statusFilter;
    });
  }, [searchResult, statusFilter]);

  function selectDrug(entry: DrugRegistryEntry) {
    onSelectDrug(entry);
    onNotify({
      title: t("drugLibrary.cardFocused"),
      detail: `${entry.genericNameZh} / ${entry.brandNames[0] ?? entry.genericName}`,
      tone: "info"
    });
  }

  function addOpenFdaCandidate(candidate: OpenFdaCatalogSearchResult["candidates"][number]) {
    const draft = createRegistryDraftFromOpenFdaCandidate(candidate);
    persistDrugRegistryDraftEntry(draft);
    resetDrugRegistryDatabase();
    onNotify({
      title: t("drugLibrary.addedDraft"),
      detail: t("drugLibrary.addedDraftDetail", { brand: candidate.brandName, generic: candidate.genericName }),
      tone: "success"
    });
    onRegistryRefresh(draft.id);
  }

  return (
    <>
      <section className="page-heading">
        <div className="heading-icon">
          <Database size={32} />
        </div>
        <div>
          <h1>{t("drugLibrary.title")}</h1>
          <p>{t("drugLibrary.copy")}</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={() => onNotFound({ module: "data-portability", action: "import_json", source: "page-heading" })}>
            {t("drugLibrary.importJson")}
          </button>
          <button className="secondary-button" onClick={() => onNotFound({ module: "data-portability", action: "export_json", source: "page-heading" })}>
            {t("drugLibrary.export")}
          </button>
          <button className="primary-button" onClick={() => onNotFound({ module: "drug-registry", action: "create_drug", source: "page-heading" })}>
            <FilePlus2 size={16} />
            {t("drugLibrary.addDrug")}
          </button>
        </div>
      </section>

      <DrugLibraryToolbar
        query={query}
        statusFilter={statusFilter}
        onQueryChange={setQuery}
        onStatusFilterChange={setStatusFilter}
        onSearchAction={() => onNotFound({ module: "drug-registry", action: "advanced_search", source: "toolbar" })}
      />

      <LocalRegistryTable
        selectedDrugId={selectedDrug.id}
        entries={filteredRegistry}
        medicationEvents={medicationEvents}
        longTermTemplates={longTermTemplates}
        searchResult={searchResult}
        isSearching={isSearching}
        searchError={searchError}
        onSelectDrug={selectDrug}
        onOpenHistory={onOpenHistory}
        onDeleteHistory={onDeleteHistory}
        onSaveLongTermTemplate={onSaveLongTermTemplate}
        onOpenMapping={onNotFound}
        onNotify={onNotify}
      />

      <div className="item-count">{t("drugLibrary.resultsCount", { count: filteredRegistry.length })}</div>

      <OpenFdaSearchPanel
        query={query}
        result={remoteResult}
        isSearching={isRemoteSearching}
        error={remoteError}
        onAddCandidate={addOpenFdaCandidate}
      />

      <section className="detail-grid detail-grid-library">
        <Panel title={t("drugLibrary.addPanel.title")} icon={<FilePlus2 size={17} />}>
          <div className="form-grid">
            <label>
              <span>{t("drugLibrary.addPanel.genericName")}</span>
              <input value={newGenericName} placeholder={t("drugLibrary.addPanel.genericPlaceholder")} onChange={(event) => setNewGenericName(event.target.value)} />
            </label>
            <label>
              <span>{t("drugLibrary.addPanel.brandName")}</span>
              <input value={newBrandName} placeholder={t("drugLibrary.addPanel.brandPlaceholder")} onChange={(event) => setNewBrandName(event.target.value)} />
            </label>
            <label>
              <span>{t("drugLibrary.addPanel.formulation")}</span>
              <select defaultValue="extended-release tablet">
                <option>extended-release tablet</option>
                <option>immediate-release tablet</option>
                <option>capsule</option>
                <option>transdermal patch</option>
              </select>
            </label>
            <label>
              <span>{t("drugLibrary.addPanel.reviewStatus")}</span>
              <select defaultValue="needs-review">
                <option>needs-review</option>
                <option>reviewed</option>
                <option>rejected</option>
              </select>
            </label>
          </div>
          <button className="wide-primary" onClick={() => onNotFound({ module: "drug-registry", action: "queue_mapping_review", source: "add-drug-panel" })}>
            {t("drugLibrary.addPanel.queueReview")}
          </button>
        </Panel>

        <Panel title={t("drugLibrary.fdaPanel.title")} icon={<Search size={17} />}>
          <p className="panel-copy">{t("drugLibrary.fdaPanel.copy")}</p>
          <code className="query-code">search term: {selectedDrug.openFda.searchTerm}</code>
          <code className="query-code">ndc exact: {selectedDrug.openFda.ndcExactQuery}</code>
          <code className="query-code">ndc loose: {selectedDrug.openFda.ndcLooseQuery}</code>
          <code className="query-code">label: {selectedDrug.openFda.labelQuery}</code>
          <div className="button-row">
            <button className="secondary-link" onClick={() => onNotFound({ module: "fda-label", action: "preview_openfda", source: selectedDrug.id })}>
              {t("drugLibrary.fdaPreview")}
            </button>
            <button className="secondary-button" onClick={() => onNotFound({ module: "fda-label", action: "fetch_label", source: selectedDrug.id })}>
              {t("drugLibrary.fetchLabel")}
            </button>
          </div>
        </Panel>

        <Panel title={t("drugLibrary.safetyPanel.title")} icon={<ShieldAlert size={17} />}>
          <p className="panel-copy">{selectedDrug.controlled ? t("drugLibrary.safetyPanel.controlled") : t("drugLibrary.safetyPanel.standard")}</p>
          <p className="panel-copy">{t("drugLibrary.safetyPanel.seedCount", { count: registryCount })}</p>
        </Panel>
      </section>
    </>
  );
}
