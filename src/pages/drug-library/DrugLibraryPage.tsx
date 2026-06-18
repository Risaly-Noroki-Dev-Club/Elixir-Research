import { Database, FilePlus2, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { ActionNotice, NotFoundContext } from "../../app/types";
import { Panel } from "../../components/ui/Panel";
import { StatusPill } from "../../components/ui/StatusPill";
import { drugRegistry, searchRegistry } from "../../features/drug-data/registry";
import type { DrugRegistryEntry } from "../../features/drug-data/types";
import type { LongTermMedicationTemplate, MedicationEvent } from "../../features/medication/types";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { DrugRowActions } from "./components/DrugRowActions";
import { PlanSelector } from "./components/PlanSelector";

interface DrugLibraryPageProps {
  selectedDrug: DrugRegistryEntry;
  medicationEvents: MedicationEvent[];
  longTermTemplates: LongTermMedicationTemplate[];
  onSelectDrug: (entry: DrugRegistryEntry) => void;
  onSaveLongTermTemplate: (template: LongTermMedicationTemplate) => void;
  onOpenHistory: (entry: DrugRegistryEntry) => void;
  onDeleteHistory: (entry: DrugRegistryEntry) => void;
  onNotFound: (context: NotFoundContext) => void;
  onNotify: (notice: Omit<ActionNotice, "id">) => void;
}

export function DrugLibraryPage({
  selectedDrug,
  medicationEvents,
  longTermTemplates,
  onSelectDrug,
  onSaveLongTermTemplate,
  onOpenHistory,
  onDeleteHistory,
  onNotFound,
  onNotify
}: DrugLibraryPageProps) {
  const [query, setQuery] = useLocalStorageState("er:v1:drug-query", "");
  const [newGenericName, setNewGenericName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const filteredRegistry = useMemo(() => searchRegistry(query), [query]);

  function selectDrug(entry: DrugRegistryEntry) {
    onSelectDrug(entry);
    onNotify({
      title: "药物选项卡已激活",
      detail: `${entry.genericNameZh} · ${entry.brandNames[0] ?? entry.genericName}`,
      tone: "info"
    });
  }

  return (
    <>
      <section className="page-heading">
        <div className="heading-icon">
          <Database size={32} />
        </div>
        <div>
          <h1>药物库</h1>
          <p>维护处方药、精神药品与 FDA label 映射，所有机器抽取的 PK 数值先进入待审核队列。</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={() => onNotFound({ module: "data-portability", action: "import_json", source: "page-heading" })}>
            导入 JSON
          </button>
          <button className="secondary-button" onClick={() => onNotFound({ module: "data-portability", action: "export_json", source: "page-heading" })}>
            导出
          </button>
          <button className="primary-button" onClick={() => onNotFound({ module: "drug-registry", action: "create_drug", source: "page-heading" })}>
            <FilePlus2 size={16} />
            新增药物
          </button>
        </div>
      </section>

      <section className="toolbar-row">
        <div className="filter-chip">筛选依据: 待审核</div>
        <div className="table-search">
          <Search size={17} />
          <input value={query} placeholder="按通用名、商品名、中文别名搜索..." onChange={(event) => setQuery(event.target.value)} />
          <button onClick={() => onNotFound({ module: "drug-registry", action: "advanced_search", source: "toolbar" })}>搜索</button>
        </div>
      </section>

      <section className="drug-table-panel" aria-label="Drug registry table">
        <div className="table-grid table-head">
          <span>药物</span>
          <span>状态</span>
          <span>FDA 映射</span>
          <span>方案</span>
          <span />
        </div>
        {filteredRegistry.map((entry) => (
          <div
            key={entry.id}
            className={entry.id === selectedDrug.id ? "table-grid table-row active" : "table-grid table-row"}
            role="button"
            tabIndex={0}
            onClick={() => selectDrug(entry)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectDrug(entry);
              }
            }}
          >
            <span className="drug-cell">
              <strong>{entry.brandNames[0] ?? entry.genericName}</strong>
              <small>
                {entry.genericNameZh} · {entry.genericName}
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
                  onNotFound({ module: "fda-label", action: "open_query_details", source: entry.id });
                }}
              >
                openFDA query
              </button>
            </span>
            <span>
              <PlanSelector drug={entry} templates={longTermTemplates} onSaveTemplate={onSaveLongTermTemplate} onNotify={onNotify} />
            </span>
            <span className="row-menu">
              <DrugRowActions
                drug={entry}
                historyCount={medicationEvents.filter((event) => event.drugId === entry.id).length}
                onOpenHistory={onOpenHistory}
                onDeleteHistory={onDeleteHistory}
                onNotify={onNotify}
              />
            </span>
          </div>
        ))}
      </section>

      <div className="item-count">{filteredRegistry.length} 个项目</div>

      <section className="detail-grid">
        <Panel title="新增药物" icon={<FilePlus2 size={17} />}>
          <div className="form-grid">
            <label>
              <span>通用名</span>
              <input value={newGenericName} placeholder="例如 methylphenidate hydrochloride" onChange={(event) => setNewGenericName(event.target.value)} />
            </label>
            <label>
              <span>商品名</span>
              <input value={newBrandName} placeholder="例如 Concerta" onChange={(event) => setNewBrandName(event.target.value)} />
            </label>
            <label>
              <span>剂型</span>
              <select defaultValue="extended-release tablet">
                <option>extended-release tablet</option>
                <option>immediate-release tablet</option>
                <option>capsule</option>
                <option>transdermal patch</option>
              </select>
            </label>
            <label>
              <span>审核级别</span>
              <select defaultValue="clinical-review-required">
                <option>clinical-review-required</option>
                <option>needs-review</option>
                <option>reviewed</option>
              </select>
            </label>
          </div>
          <button className="wide-primary" onClick={() => onNotFound({ module: "drug-registry", action: "queue_mapping_review", source: "add-drug-panel" })}>
            加入待审核映射
          </button>
        </Panel>

        <Panel title="FDA 搜索" icon={<Search size={17} />}>
          <p className="panel-copy">当前药物先通过 curated 映射表解析，再拉取 openFDA label。抽取结果不会直接进入曲线模型。</p>
          <code className="query-code">{selectedDrug.openFdaQuery}</code>
          <div className="button-row">
            <button className="secondary-link" onClick={() => onNotFound({ module: "fda-label", action: "preview_openfda", source: selectedDrug.id })}>
              openFDA preview
            </button>
            <button className="secondary-button" onClick={() => onNotFound({ module: "fda-label", action: "fetch_label", source: selectedDrug.id })}>
              拉取 label
            </button>
          </div>
        </Panel>

        <Panel title="安全与提醒" icon={<ShieldAlert size={17} />}>
          <p className="panel-copy">{selectedDrug.controlled ? "受控药物默认进入二次确认与临床审查级别。" : "常规药物仍保留本地确认、历史记录与提醒策略。"}</p>
          <p className="panel-copy">当前注册表共 {drugRegistry.length} 个种子药物，方案列可直接保存长期用药模板。</p>
        </Panel>
      </section>
    </>
  );
}
