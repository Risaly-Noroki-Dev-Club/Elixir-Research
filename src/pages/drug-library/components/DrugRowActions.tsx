import { MoreVertical } from "lucide-react";
import { useState } from "react";
import type { ActionNotice } from "../../../app/types";
import type { DrugRegistryEntry } from "../../../features/drug-data/types";
import { useI18n } from "../../../i18n/I18nProvider";

interface DrugRowActionsProps {
  drug: DrugRegistryEntry;
  historyCount: number;
  onOpenHistory: (entry: DrugRegistryEntry) => void;
  onDeleteHistory: (entry: DrugRegistryEntry) => void;
  onNotify: (notice: Omit<ActionNotice, "id">) => void;
}

export function DrugRowActions({ drug, historyCount, onOpenHistory, onDeleteHistory, onNotify }: DrugRowActionsProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="row-action-menu" onClick={(event) => event.stopPropagation()}>
      <button className="row-menu-button" onClick={() => setOpen((current) => !current)} title={t("drugLibrary.actions.more")} aria-expanded={open}>
        <MoreVertical size={18} />
      </button>
      {open ? (
        <div className="row-action-popover">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onNotify({
                title: t("drugLibrary.actions.historyOpened"),
                detail: t("drugLibrary.actions.historyOpenedDetail", { drug: drug.genericNameZh }),
                tone: "info"
              });
              onOpenHistory(drug);
            }}
          >
            {t("drugLibrary.actions.viewHistory")}
            <span>{t("drugLibrary.actions.records", { count: historyCount })}</span>
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              setOpen(false);
              onNotify({
                title: t("drugLibrary.actions.historyDeleteRequested"),
                detail: t("drugLibrary.actions.historyDeleteDetail", { drug: drug.genericNameZh, count: historyCount }),
                tone: "danger"
              });
              onDeleteHistory(drug);
            }}
          >
            {t("drugLibrary.actions.deleteHistory")}
            <span>{t("drugLibrary.actions.deleteHistoryHint")}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
