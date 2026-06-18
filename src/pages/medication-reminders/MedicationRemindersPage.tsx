import { Activity, AlertTriangle, Bell } from "lucide-react";
import { Panel } from "../../components/ui/Panel";
import { QueueItem } from "../../components/ui/QueueItem";
import { StatusPill } from "../../components/ui/StatusPill";
import { useI18n } from "../../i18n/I18nProvider";
import type { DrugRegistryEntry } from "../../features/drug-data/types";

export function MedicationRemindersPage({ selectedDrug }: { selectedDrug: DrugRegistryEntry }) {
  const { tx } = useI18n();
  const nextDoseHour = selectedDrug.defaultIntervalHours;

  return (
    <>
      <section className="page-heading">
        <div className="heading-icon">
          <Bell size={32} />
        </div>
        <div>
          <h1>{tx({ en: "Medication Reminders", zh: "用药提醒" })}</h1>
          <p>{tx({ en: "Configure schedule reminders, missed-dose windows, threshold alerts, and high-risk safeguards as separate local policies.", zh: "把排程提醒、漏服窗口、阈值提醒和高风险药物提示拆开配置。" })}</p>
        </div>
      </section>

      <section className="detail-grid">
        <Panel title={tx({ en: "Reminder Policy", zh: "提醒策略" })} icon={<Bell size={17} />} wide>
          <div className="reminder-grid">
            <ReminderRule title={tx({ en: "Scheduled reminder", zh: "排程提醒" })} value={tx({ en: "Every {hours} hours", zh: "每 {hours} 小时" }, { hours: selectedDrug.defaultIntervalHours })} state="ready" />
            <ReminderRule title={tx({ en: "Missed-dose window", zh: "漏服窗口" })} value={tx({ en: "Within 2 hours after the scheduled time", zh: "计划时间后 2 小时内" })} state="draft" />
            <ReminderRule title={tx({ en: "Threshold alert", zh: "阈值提醒" })} value={tx({ en: "Require review when predicted levels fall below the lower reference band", zh: "低于参考带下限时提醒复核" })} state="needs-review" />
            <ReminderRule title={tx({ en: "High-risk gate", zh: "高风险阻断" })} value={selectedDrug.controlled ? tx({ en: "Controlled substances require second confirmation", zh: "受控药物需二次确认" }) : tx({ en: "Standard confirmation", zh: "常规确认" })} state="ready" />
          </div>
        </Panel>

        <Panel title={tx({ en: "Next Reminder", zh: "下一次提醒" })} icon={<Activity size={17} />}>
          <QueueItem label="drug" value={selectedDrug.brandNames[0] ?? selectedDrug.genericName} />
          <QueueItem label="scheduled next" value={`T+${nextDoseHour}h`} />
          <QueueItem label="notification channel" value="local notification N/A" warning />
        </Panel>

        <Panel title={tx({ en: "Safety Boundary", zh: "安全边界" })} icon={<AlertTriangle size={17} />}>
          <p className="panel-copy">{tx({ en: "Reminder logic never recommends dose escalation from concentration estimates. Controlled, psychiatric, sedative, and opioid drugs default to review-first behavior.", zh: "提醒模块永远不根据血药浓度自动建议加量。受控药、精神药品、镇静药、阿片类默认进入临床审查级别。" })}</p>
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
