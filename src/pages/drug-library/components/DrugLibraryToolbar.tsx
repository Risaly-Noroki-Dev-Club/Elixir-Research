import { Search, X } from "lucide-react";
import type { ReviewStatus } from "../../../features/drug-data/types";
import { useI18n } from "../../../i18n/I18nProvider";

export type DrugLibraryStatusFilter = "all" | ReviewStatus | "controlled-only";

interface DrugLibraryToolbarProps {
  query: string;
  statusFilter: DrugLibraryStatusFilter;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: DrugLibraryStatusFilter) => void;
  onSearchAction: () => void;
}

const filterOrder: DrugLibraryStatusFilter[] = ["all", "needs-review", "reviewed", "seed", "rejected", "controlled-only"];

export function DrugLibraryToolbar({
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
  onSearchAction
}: DrugLibraryToolbarProps) {
  const { t } = useI18n();

  return (
    <section className="toolbar-row toolbar-row-strong">
      <div className="status-filter-bar" role="tablist" aria-label={t("drugLibrary.title")}>
        {filterOrder.map((filter) => (
          <button
            key={filter}
            type="button"
            className={statusFilter === filter ? "status-filter-option active" : "status-filter-option"}
            onClick={() => onStatusFilterChange(filter)}
          >
            {t(`drugLibrary.filters.${filter}`)}
          </button>
        ))}
      </div>

      <div className="table-search-shell">
        <span className="search-caption">{t("drugLibrary.searchCaption")}</span>
        <div className="table-search table-search-strong">
          <span className="table-search-leading" aria-hidden="true">
            <Search size={17} />
          </span>
          <input value={query} placeholder={t("drugLibrary.searchPlaceholder")} onChange={(event) => onQueryChange(event.target.value)} />
          {query ? (
            <button type="button" className="table-search-clear" onClick={() => onQueryChange("")} title={t("common.close")}>
              <X size={16} />
            </button>
          ) : null}
          <button type="button" className="table-search-submit" onClick={onSearchAction}>
            {t("common.search")}
          </button>
        </div>
      </div>
    </section>
  );
}
