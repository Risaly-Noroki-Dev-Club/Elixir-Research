import { MoreVertical } from "lucide-react";
import { useState } from "react";
import type { ActionNotice } from "../../../app/types";
import type { DrugRegistryEntry } from "../../../features/drug-data/types";

interface DrugRowActionsProps {
  drug: DrugRegistryEntry;
  historyCount: number;
  onOpenHistory: (entry: DrugRegistryEntry) => void;
  onDeleteHistory: (entry: DrugRegistryEntry) => void;
  onNotify: (notice: Omit<ActionNotice, "id">) => void;
}

export function DrugRowActions({ drug, historyCount, onOpenHistory, onDeleteHistory, onNotify }: DrugRowActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="row-action-menu" onClick={(event) => event.stopPropagation()}>
      <button className="row-menu-button" onClick={() => setOpen((current) => !current)} title="更多操作" aria-expanded={open}>
        <MoreVertical size={18} />
      </button>
      {open ? (
        <div className="row-action-popover">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onNotify({
                title: "历史选项卡已触发",
                detail: `查看 ${drug.genericNameZh} 的用药历史`,
                tone: "info"
              });
              onOpenHistory(drug);
            }}
          >
            查看历史
            <span>{historyCount} 条记录</span>
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              setOpen(false);
              onNotify({
                title: "历史选项卡已触发",
                detail: `删除 ${drug.genericNameZh} 的 ${historyCount} 条历史记录`,
                tone: "danger"
              });
              onDeleteHistory(drug);
            }}
          >
            删除历史数据
            <span>仅删除该药物记录</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
