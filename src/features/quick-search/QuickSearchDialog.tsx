import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { matchQuickSearchEntries } from "./matchQuickSearchEntries";
import type { QuickSearchEntry } from "./searchIndex";

interface QuickSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (entry: QuickSearchEntry) => void;
}

export function QuickSearchDialog({ open, onClose, onSelect }: QuickSearchDialogProps) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const results = useMemo(() => matchQuickSearchEntries(query, locale), [locale, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-scrim" role="presentation" onClick={onClose}>
      <div className="quick-search-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-search-title" onClick={(event) => event.stopPropagation()}>
        <div className="confirm-dialog-header quick-search-header">
          <div>
            <span>{t("quickSearch.title")}</span>
            <h2 id="quick-search-title">{t("quickSearch.subtitle")}</h2>
          </div>
          <button className="row-menu-button" type="button" onClick={onClose} title={t("common.close")}>
            <X size={18} />
          </button>
        </div>

        <label className="quick-search-input quick-search-input-strong">
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("quickSearch.placeholder")}
          />
        </label>

        <div className="quick-search-results">
          {results.length > 0 ? (
            results.map(({ entry, title, description }) => (
              <button
                key={entry.id}
                type="button"
                className="quick-search-result"
                onClick={() => {
                  onSelect(entry);
                  onClose();
                }}
              >
                <div>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
                <em>{entry.action.kind === "navigate" ? t("common.ready") : t("common.notAvailable")}</em>
              </button>
            ))
          ) : (
            <div className="table-feedback">{t("quickSearch.noResults")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
