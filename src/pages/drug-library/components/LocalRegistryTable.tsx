import { StatusPill } from "../../../components/ui/StatusPill";
import type { ActionNotice, NotFoundContext } from "../../../app/types";
import type { DrugRegistryEntry, DrugRegistrySearchResult } from "../../../features/drug-data/types";
import type { LongTermMedicationTemplate, MedicationEvent } from "../../../features/medication/types";
import { useI18n } from "../../../i18n/I18nProvider";
import { DrugRowActions } from "./DrugRowActions";
import { PlanSelector } from "./PlanSelector";

interface LocalRegistryTableProps {
  selectedDrugId: string;
  entries: DrugRegistryEntry[];
  medicationEvents: MedicationEvent[];
  longTermTemplates: LongTermMedicationTemplate[];
  searchResult: DrugRegistrySearchResult | null;
  isSearching: boolean;
  searchError: string | null;
  onSelectDrug: (entry: DrugRegistryEntry) => void;
  onOpenHistory: (entry: DrugRegistryEntry) => void;
  onDeleteHistory: (entry: DrugRegistryEntry) => void;
  onSaveLongTermTemplate: (template: LongTermMedicationTemplate) => void;
  onOpenMapping: (context: NotFoundContext) => void;
  onNotify: (notice: Omit<ActionNotice, "id">) => void;
}

export function LocalRegistryTable({
  selectedDrugId,
  entries,
  medicationEvents,
  longTermTemplates,
  searchResult,
  isSearching,
  searchError,
  onSelectDrug,
  onOpenHistory,
  onDeleteHistory,
  onSaveLongTermTemplate,
  onOpenMapping,
  onNotify
}: LocalRegistryTableProps) {
  const { t } = useI18n();

  return (
    <section className="drug-table-panel" aria-label="Drug registry table">
      <div className="table-grid table-head">
        <span>{t("drugLibrary.table.drug")}</span>
        <span>{t("drugLibrary.table.status")}</span>
        <span>{t("drugLibrary.table.fdaMapping")}</span>
        <span>{t("drugLibrary.table.plan")}</span>
        <span />
      </div>

      {isSearching ? <div className="table-feedback">{t("drugLibrary.loadingSearch")}</div> : null}
      {searchError ? <div className="table-feedback">{t("drugLibrary.searchFailed")} {searchError}</div> : null}
      {!isSearching && !searchError && searchResult?.unmatchedCjk ? <div className="table-feedback">{t("drugLibrary.unmappedChinese")}</div> : null}
      {!isSearching && !searchError && !searchResult?.unmatchedCjk && entries.length === 0 ? <div className="table-feedback">{t("drugLibrary.noMatches")}</div> : null}

      {!isSearching && !searchError
        ? entries.map((entry) => {
            const historyCount = medicationEvents.filter((event) => event.drugId === entry.id).length;

            return (
              <div
                key={entry.id}
                className={entry.id === selectedDrugId ? "table-grid table-row active" : "table-grid table-row"}
                role="button"
                tabIndex={0}
                onClick={() => onSelectDrug(entry)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectDrug(entry);
                  }
                }}
              >
                <span className="drug-cell">
                  <strong>{entry.brandNames[0] ?? entry.genericName}</strong>
                  <small>
                    {entry.genericNameZh} / {entry.genericName}
                  </small>
                </span>
                <span>
                  <StatusPill status={entry.reviewStatus} />
                </span>
                <span>
                  <button
                    className="table-link-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenMapping({ module: "fda-label", action: "open_query_details", source: entry.id });
                    }}
                  >
                    {t("drugLibrary.openFdaQuery")}
                  </button>
                </span>
                <span>
                  <PlanSelector drug={entry} templates={longTermTemplates} onSaveTemplate={onSaveLongTermTemplate} onNotify={onNotify} />
                </span>
                <span className="row-menu">
                  <DrugRowActions
                    drug={entry}
                    historyCount={historyCount}
                    onOpenHistory={onOpenHistory}
                    onDeleteHistory={onDeleteHistory}
                    onNotify={onNotify}
                  />
                </span>
              </div>
            );
          })
        : null}
    </section>
  );
}
