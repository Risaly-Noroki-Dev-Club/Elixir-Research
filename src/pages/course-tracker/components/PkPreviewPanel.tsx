import { Activity, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import type { ActionNotice } from "../../../app/types";
import { ConcentrationChart } from "../../../components/chart/ConcentrationChart";
import { ControlBlock, Segmented, Slider } from "../../../components/ui/FormControls";
import { Metric } from "../../../components/ui/Metric";
import { Panel } from "../../../components/ui/Panel";
import { QueueItem } from "../../../components/ui/QueueItem";
import { AnalysisPill } from "../../../components/ui/StatusPill";
import type { DrugRegistryEntry } from "../../../features/drug-data/types";
import { formatMedicationTime, getHoursBetween, getLatestMedicationEventTime } from "../../../features/medication/dateTime";
import type { LongTermMedicationTemplate, MedicationEvent } from "../../../features/medication/types";
import { analyzeCurve } from "../../../features/pk-engine/analysis";
import { simulateMedicationEvents, simulateRegimen } from "../../../features/pk-engine/simulate";
import type { CypMetabolizer } from "../../../features/pk-engine/types";
import { useLocalStorageState } from "../../../hooks/useLocalStorageState";
import { PlanSelector } from "../../drug-library/components/PlanSelector";

const metabolizerMultipliers: Record<CypMetabolizer, number> = {
  slow: 0.72,
  normal: 1,
  fast: 1.28
};

interface PkPreviewPanelProps {
  selectedDrug: DrugRegistryEntry;
  medicationEvents: MedicationEvent[];
  longTermTemplates: LongTermMedicationTemplate[];
  onSaveLongTermTemplate: (template: LongTermMedicationTemplate) => void;
  onNotify: (notice: Omit<ActionNotice, "id">) => void;
}

export function PkPreviewPanel({
  selectedDrug,
  medicationEvents,
  longTermTemplates,
  onSaveLongTermTemplate,
  onNotify
}: PkPreviewPanelProps) {
  const [doseMg, setDoseMg] = useLocalStorageState("er:v2:dose-mg", selectedDrug.defaultDoseMg);
  const [weightKg, setWeightKg] = useLocalStorageState("er:v2:weight-kg", 70);
  const [scheduledNowHours, setScheduledNowHours] = useLocalStorageState("er:v2:scheduled-now-hours", 24);
  const [pkSource, setPkSource] = useLocalStorageState<"records" | "scheduled">("er:v1:pk-source", "records");
  const [regimenMode, setRegimenMode] = useLocalStorageState<"first-dose" | "steady-state">("er:v1:regimen-mode", "steady-state");
  const [metabolizer, setMetabolizer] = useLocalStorageState<CypMetabolizer>("er:v2:cyp", "normal");

  const profile = selectedDrug.profile;
  const intervalHours = selectedDrug.defaultIntervalHours;
  const selectedMedicationEvents = useMemo(
    () => medicationEvents.filter((event) => event.drugId === selectedDrug.id),
    [medicationEvents, selectedDrug.id]
  );
  const recordedAnchorTime = useMemo(
    () => getLatestMedicationEventTime(selectedMedicationEvents),
    [selectedMedicationEvents]
  );
  const recordedNowHours = useMemo(
    () => clamp(getHoursBetween(recordedAnchorTime, new Date()), 0, 48),
    [recordedAnchorTime]
  );
  const recordedDoses = useMemo(
    () =>
      selectedMedicationEvents.map((event) => ({
        id: event.id,
        takenAt: event.takenAt,
        doseMg: event.doseAmount,
        route: event.route
      })),
    [selectedMedicationEvents]
  );
  const usingRecordedPk = pkSource === "records";
  const activeNowHours = usingRecordedPk ? recordedNowHours : scheduledNowHours;
  const recordedDoseWindow = useMemo(
    () => getRecordedDoseWindow(selectedMedicationEvents, intervalHours, recordedAnchorTime, activeNowHours),
    [selectedMedicationEvents, intervalHours, recordedAnchorTime, activeNowHours]
  );
  const scheduledSimulation = useMemo(
    () =>
      simulateRegimen({
        profile,
        doseMg,
        weightKg,
        intervalHours,
        horizonHours: 48,
        model: selectedDrug.releaseModel,
        clearanceMultiplier: metabolizerMultipliers[metabolizer],
        steadyState: regimenMode === "steady-state"
      }),
    [profile, doseMg, weightKg, intervalHours, selectedDrug.releaseModel, metabolizer, regimenMode]
  );
  const recordedSimulation = useMemo(
    () =>
      simulateMedicationEvents({
        profile,
        doses: recordedDoses,
        weightKg,
        horizonHours: 48,
        model: selectedDrug.releaseModel,
        clearanceMultiplier: metabolizerMultipliers[metabolizer],
        anchorTime: recordedAnchorTime
      }),
    [profile, recordedDoses, weightKg, selectedDrug.releaseModel, metabolizer, recordedAnchorTime]
  );
  const simulation = usingRecordedPk ? recordedSimulation : scheduledSimulation;
  const analysis = useMemo(
    () =>
      analyzeCurve({
        samples: simulation.samples,
        referenceMin: profile.referenceMin,
        referenceMax: profile.referenceMax,
        referenceBandValidated: profile.referenceBandValidated,
        intervalHours,
        nowHours: activeNowHours,
        intervalStartHours: usingRecordedPk ? recordedDoseWindow.intervalStartHours : undefined,
        intervalEndHours: usingRecordedPk ? recordedDoseWindow.intervalEndHours : undefined,
        nextDoseHoursOverride: usingRecordedPk ? recordedDoseWindow.nextDoseHours : undefined
      }),
    [simulation, profile, intervalHours, activeNowHours, usingRecordedPk, recordedDoseWindow]
  );

  return (
    <Panel title="PK 预览" icon={<Activity size={17} />} wide>
      <div className="preview-header">
        <div>
          <h2>{profile.name}</h2>
          <p>{profile.subtitle}</p>
        </div>
        <AnalysisPill status={analysis.status} />
      </div>
      <div className="model-warning">
        <AlertTriangle size={16} />
        <span>{profile.modelNote}</span>
      </div>
      <div className="pk-management-row">
        <PlanSelector
          drug={selectedDrug}
          templates={longTermTemplates}
          onSaveTemplate={onSaveLongTermTemplate}
          onNotify={onNotify}
        />
      </div>
      <div className="pk-source-bar">
        <div>
          <strong>{usingRecordedPk ? "用药记录驱动" : "理论排程驱动"}</strong>
          <span>
            {usingRecordedPk
              ? `最新一条 ${selectedDrug.genericNameZh} 记录会被当作 T+0，当前锚点 ${formatMedicationTime(recordedAnchorTime)}。如果录入时改了日期或时间，就按你输入的时间重算曲线。`
              : "使用固定剂量、默认间隔和 steady-state/first-dose 参数生成演示曲线。"}
          </span>
        </div>
        <Segmented
          value={pkSource}
          options={[
            ["records", "用药记录"],
            ["scheduled", "理论排程"]
          ]}
          onChange={(value) => {
            setPkSource(value as "records" | "scheduled");
            onNotify({
              title: "PK 数据源已切换",
              detail: value === "records" ? "已切换到用药记录驱动" : "已切换到理论排程驱动",
              tone: "info"
            });
          }}
        />
      </div>
      {usingRecordedPk && selectedMedicationEvents.some((event) => event.route === "injection") ? (
        <div className="model-warning route-warning">
          <AlertTriangle size={16} />
          <span>注射 route 目前仍使用实验性吸收桥接参数，只用于界面联动验证，不能作为真实暴露估算。</span>
        </div>
      ) : null}
      <div className="metrics-grid">
        <Metric label="Current" value={analysis.current.toFixed(3)} unit="mg/L" />
        <Metric label="Peak" value={analysis.peak.concentration.toFixed(3)} unit="mg/L" />
        <Metric label="Trough" value={analysis.trough.concentration.toFixed(3)} unit="mg/L" />
        <Metric label={usingRecordedPk ? "Next due" : "Scheduled next"} value={analysis.nextDoseHours.toFixed(1)} unit="h" />
      </div>
      <ConcentrationChart
        samples={simulation.samples}
        min={profile.referenceMin}
        max={profile.referenceMax}
        peakTime={analysis.peak.time}
        troughTime={analysis.trough.time}
        nowTime={activeNowHours}
      />
      <div className="controls-grid">
        {!usingRecordedPk ? (
          <>
            <ControlBlock label="Dose (mg)">
              <Slider
                value={doseMg}
                min={5}
                max={80}
                step={5}
                onChange={(value) => {
                  setDoseMg(value);
                  onNotify({ title: "剂量参数已调整", detail: `${value} mg`, tone: "info" });
                }}
                suffix="mg"
              />
            </ControlBlock>
            <ControlBlock label="Chart time (h)">
              <Slider
                value={scheduledNowHours}
                min={0}
                max={48}
                step={0.5}
                onChange={(value) => {
                  setScheduledNowHours(value);
                  onNotify({ title: "图表时间已调整", detail: `${value} h`, tone: "info" });
                }}
                suffix="h"
              />
            </ControlBlock>
            <ControlBlock label="Regimen state">
              <Segmented
                value={regimenMode}
                options={[
                  ["steady-state", "Steady state"],
                  ["first-dose", "First dose"]
                ]}
                onChange={(value) => {
                  setRegimenMode(value as "first-dose" | "steady-state");
                  onNotify({ title: "给药状态已切换", detail: value, tone: "info" });
                }}
              />
            </ControlBlock>
          </>
        ) : (
          <ControlBlock label="Recorded T+0">
            <div className="pk-anchor-readout">
              <strong>{formatMedicationTime(recordedAnchorTime)}</strong>
              <span>{selectedMedicationEvents.length > 0 ? `当前已过去 ${activeNowHours.toFixed(1)} h` : "暂无记录，曲线保持空白基线"}</span>
            </div>
          </ControlBlock>
        )}
        <ControlBlock label="Body weight (kg)">
          <Slider
            value={weightKg}
            min={40}
            max={120}
            step={1}
            onChange={(value) => {
              setWeightKg(value);
              onNotify({ title: "体重参数已调整", detail: `${value} kg`, tone: "info" });
            }}
            suffix="kg"
          />
        </ControlBlock>
        <ControlBlock label="CYP metabolizer">
          <Segmented
            value={metabolizer}
            options={[
              ["slow", "Slow"],
              ["normal", "Normal"],
              ["fast", "Fast"]
            ]}
            onChange={(value) => {
              setMetabolizer(value as CypMetabolizer);
              onNotify({ title: "CYP 代谢状态已切换", detail: value, tone: "info" });
            }}
          />
        </ControlBlock>
      </div>
      <div className="pk-record-strip">
        <QueueItem label="PK data source" value={usingRecordedPk ? "medication.events.v1" : "scheduled regimen"} />
        <QueueItem label="recorded doses" value={String(selectedMedicationEvents.length)} warning={usingRecordedPk && selectedMedicationEvents.length === 0} />
        <QueueItem
          label={usingRecordedPk ? "T+0 anchor" : "chart focus"}
          value={usingRecordedPk ? formatMedicationTime(recordedAnchorTime) : `T+${activeNowHours.toFixed(1)}h`}
          warning={usingRecordedPk && selectedMedicationEvents.length === 0}
        />
      </div>
    </Panel>
  );
}

function getRecordedDoseWindow(events: MedicationEvent[], intervalHours: number, anchorTime: string, nowHours: number) {
  const anchorMs = new Date(anchorTime).getTime();
  const doseHours = events
    .map((event) => (new Date(event.takenAt).getTime() - anchorMs) / 3_600_000)
    .filter((hour) => Number.isFinite(hour))
    .sort((left, right) => left - right);
  const lastDoseHour = [...doseHours].reverse().find((hour) => hour <= nowHours);
  const futureDoseHour = doseHours.find((hour) => hour > nowHours);
  const intervalStartHours = lastDoseHour ?? Math.floor(nowHours / intervalHours) * intervalHours;
  const intervalEndHours = futureDoseHour ?? intervalStartHours + intervalHours;
  const nextDoseHours = Math.max(0, intervalEndHours - nowHours);

  return {
    intervalStartHours,
    intervalEndHours,
    nextDoseHours
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
