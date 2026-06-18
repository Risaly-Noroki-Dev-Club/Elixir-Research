import { Activity, AlertTriangle, Bell } from "lucide-react";
import { Panel } from "../../components/ui/Panel";
import { QueueItem } from "../../components/ui/QueueItem";
import { StatusPill } from "../../components/ui/StatusPill";
import type { DrugRegistryEntry } from "../../features/drug-data/types";

export function MedicationRemindersPage({ selectedDrug }: { selectedDrug: DrugRegistryEntry }) {
  const nextDoseHour = selectedDrug.defaultIntervalHours;

  return (
    <>
      <section className="page-heading">
        <div className="heading-icon">
          <Bell size={32} />
        </div>
        <div>
          <h1>用药提醒</h1>
          <p>把排程提醒、漏服窗口、阈值提醒和高风险药物提示拆开配置。提醒只做本地策略，不给剂量建议。</p>
        </div>
      </section>

      <section className="detail-grid">
        <Panel title="提醒策略" icon={<Bell size={17} />} wide>
          <div className="reminder-grid">
            <ReminderRule title="排程提醒" value={`每 ${selectedDrug.defaultIntervalHours} 小时`} state="ready" />
            <ReminderRule title="漏服窗口" value="计划时间后 2 小时内" state="draft" />
            <ReminderRule title="阈值提醒" value="低于参考带下限时提醒复核" state="needs-review" />
            <ReminderRule title="高风险阻断" value={selectedDrug.controlled ? "受控药物需二次确认" : "常规确认"} state="ready" />
          </div>
        </Panel>

        <Panel title="下一次提醒" icon={<Activity size={17} />}>
          <QueueItem label="drug" value={selectedDrug.brandNames[0] ?? selectedDrug.genericName} />
          <QueueItem label="scheduled next" value={`T+${nextDoseHour}h`} />
          <QueueItem label="notification channel" value="local notification N/A" warning />
        </Panel>

        <Panel title="安全边界" icon={<AlertTriangle size={17} />}>
          <p className="panel-copy">提醒模块永远不根据血药浓度自动建议加量。受控药、精神药品、镇静药、阿片类默认进入临床审查级别。</p>
        </Panel>
      </section>
    </>
  );
}

function ReminderRule({ title, value, state }: { title: string; value: string; state: string }) {
  return (
    <div className="reminder-rule">
      <div>
        <strong>{title}</strong>
        <span>{value}</span>
      </div>
      <StatusPill status={state} />
    </div>
  );
}
