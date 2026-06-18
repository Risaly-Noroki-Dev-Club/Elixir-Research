import { Activity, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { useI18n } from "../../../i18n/I18nProvider";
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
  const { locale, t } = useI18n();
  const [doseMg, setDoseMg] = useLocalStorageState("er:v2:dose-mg", selectedDrug.defaultDoseMg);
  const [weightKg, setWeightKg] = useLocalStorageState("er:v2:weight-kg", 70);
  const [scheduledNowHours, setScheduledNowHours] = useLocalStorageState("er:v2:scheduled-now-hours", 24);
  const [pkSource, setPkSource] = useLocalStorageState<"records" | "scheduled">("er:v1:pk-source", "records");
  const [regimenMode, setRegimenMode] = useLocalStorageState<"first-dose" | "steady-state">("er:v1:regimen-mode", "steady-state");
  const [metabolizer, setMetabolizer] = useLocalStorageState<CypMetabolizer>("er:v2:cyp", "normal");
  const [recordedOffsetHours, setRecordedOffsetHours] = useState(0);

  const profile = selectedDrug.profile;
  const intervalHours = selectedDrug.defaultIntervalHours;
  const selectedMedicationEvents = useMemo(
    () => medicationEvents.filter((event) => event.drugId === selectedDrug.id),
    [medicationEvents, selectedDrug.id]
  );
  const recordedAnchorTime = useMemo(() => getLatestMedicationEventTime(selectedMedicationEvents), [selectedMedicationEvents]);
  const recordedNowHours = useMemo(() => clamp(getHoursBetween(recordedAnchorTime, new Date()), 0, 48), [recordedAnchorTime]);
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
  const activeNowHours = usingRecordedPk ? recordedOffsetHours : scheduledNowHours;
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
  const hasReferenceBand = profile.referenceMax > profile.referenceMin && profile.referenceMax > 0;
  const displayedDrugName = locale === "zh-Hans" || locale === "zh-Hant" ? selectedDrug.genericNameZh || selectedDrug.genericName : selectedDrug.genericName;
  const anchorLabel = formatMedicationTime(recordedAnchorTime, locale);

  useEffect(() => {
    setRecordedOffsetHours(recordedNowHours);
  }, [recordedNowHours, selectedDrug.id, recordedAnchorTime]);

  return (
    <Panel title={t("pkPreview.title")} icon={<Activity size={17} />} wide>
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
        <PlanSelector drug={selectedDrug} templates={longTermTemplates} onSaveTemplate={onSaveLongTermTemplate} onNotify={onNotify} />
      </div>
      <div className="pk-source-bar">
        <div>
          <strong>{usingRecordedPk ? t("pkPreview.source.recordsTitle") : t("pkPreview.source.scheduledTitle")}</strong>
          <span>
            {usingRecordedPk
              ? t("pkPreview.source.recordsDescription", { drug: displayedDrugName, anchor: anchorLabel })
              : t("pkPreview.source.scheduledDescription")}
          </span>
        </div>
        <Segmented
          value={pkSource}
          options={[
            ["records", t("pkPreview.source.options.records")],
            ["scheduled", t("pkPreview.source.options.scheduled")]
          ]}
          onChange={(value) => {
            setPkSource(value as "records" | "scheduled");
            onNotify({
              title: t("pkPreview.notices.sourceUpdated"),
              detail: value === "records" ? t("pkPreview.notices.sourceRecorded") : t("pkPreview.notices.sourceScheduled"),
              tone: "info"
            });
          }}
        />
      </div>
      {usingRecordedPk && selectedMedicationEvents.some((event) => event.route === "injection") ? (
        <div className="model-warning route-warning">
          <AlertTriangle size={16} />
          <span>{t("pkPreview.warnings.injectionAssumption")}</span>
        </div>
      ) : null}
      <div className="metrics-grid">
        <Metric label={t("pkPreview.metrics.current")} value={analysis.current.toFixed(3)} unit={profile.unit} />
        <Metric label={t("pkPreview.metrics.peak")} value={analysis.peak.concentration.toFixed(3)} unit={profile.unit} />
        <Metric label={t("pkPreview.metrics.trough")} value={analysis.trough.concentration.toFixed(3)} unit={profile.unit} />
        <Metric label={usingRecordedPk ? t("pkPreview.metrics.nextDue") : t("pkPreview.metrics.scheduledNext")} value={analysis.nextDoseHours.toFixed(1)} unit="h" />
      </div>
      <ConcentrationChart
        samples={simulation.samples}
        min={profile.referenceMin}
        max={profile.referenceMax}
        referenceBandValidated={profile.referenceBandValidated}
        peakTime={analysis.peak.time}
        troughTime={analysis.trough.time}
        nowTime={activeNowHours}
        unit={profile.unit}
        anchorTime={usingRecordedPk ? recordedAnchorTime : undefined}
      />
      <div className="controls-grid">
        {!usingRecordedPk ? (
          <>
            <ControlBlock label={t("pkPreview.controls.dose")}>
              <Slider
                value={doseMg}
                min={5}
                max={80}
                step={5}
                onChange={(value) => {
                  setDoseMg(value);
                  onNotify({ title: t("pkPreview.notices.doseUpdated"), detail: `${value} mg`, tone: "info" });
                }}
                suffix="mg"
              />
            </ControlBlock>
            <ControlBlock label={t("pkPreview.controls.chartTime")}>
              <Slider
                value={scheduledNowHours}
                min={0}
                max={48}
                step={0.5}
                onChange={(value) => {
                  setScheduledNowHours(value);
                  onNotify({ title: t("pkPreview.notices.chartTimeUpdated"), detail: `${value} h`, tone: "info" });
                }}
                suffix="h"
              />
            </ControlBlock>
            <ControlBlock label={t("pkPreview.controls.regimenState")}>
              <Segmented
                value={regimenMode}
                options={[
                  ["steady-state", t("pkPreview.controls.regimenOptions.steadyState")],
                  ["first-dose", t("pkPreview.controls.regimenOptions.firstDose")]
                ]}
                onChange={(value) => {
                  setRegimenMode(value as "first-dose" | "steady-state");
                  onNotify({
                    title: t("pkPreview.notices.regimenUpdated"),
                    detail: value === "steady-state" ? t("pkPreview.controls.regimenOptions.steadyState") : t("pkPreview.controls.regimenOptions.firstDose"),
                    tone: "info"
                  });
                }}
              />
            </ControlBlock>
          </>
        ) : (
          <>
            <ControlBlock label={t("pkPreview.controls.recordedAnchor")}>
              <div className="pk-anchor-readout">
                <strong>{anchorLabel}</strong>
                <span>
                  {selectedMedicationEvents.length > 0
                    ? t("pkPreview.records.currentOffset", { hours: activeNowHours.toFixed(1) })
                    : t("pkPreview.records.noRecords")}
                </span>
              </div>
            </ControlBlock>
            <ControlBlock label={t("pkPreview.controls.recordedOffset")}>
              <Slider value={recordedOffsetHours} min={0} max={48} step={0.5} onChange={setRecordedOffsetHours} suffix="h" />
            </ControlBlock>
          </>
        )}
        <ControlBlock label={t("pkPreview.controls.bodyWeight")}>
          <Slider
            value={weightKg}
            min={40}
            max={120}
            step={1}
            onChange={(value) => {
              setWeightKg(value);
              onNotify({ title: t("pkPreview.notices.weightUpdated"), detail: `${value} kg`, tone: "info" });
            }}
            suffix="kg"
          />
        </ControlBlock>
        <ControlBlock label={t("pkPreview.controls.cypMetabolizer")}>
          <Segmented
            value={metabolizer}
            options={[
              ["slow", t("pkPreview.controls.metabolizerOptions.slow")],
              ["normal", t("pkPreview.controls.metabolizerOptions.normal")],
              ["fast", t("pkPreview.controls.metabolizerOptions.fast")]
            ]}
            onChange={(value) => {
              setMetabolizer(value as CypMetabolizer);
              onNotify({ title: t("pkPreview.notices.cypUpdated"), detail: t(`pkPreview.controls.metabolizerOptions.${value}`), tone: "info" });
            }}
          />
        </ControlBlock>
      </div>
      {!hasReferenceBand ? (
        <div className="model-warning route-warning">
          <AlertTriangle size={16} />
          <span>{t("pkPreview.warnings.noReferenceBand")}</span>
        </div>
      ) : !profile.referenceBandValidated ? (
        <div className="model-warning route-warning">
          <AlertTriangle size={16} />
          <span>{t("pkPreview.warnings.provisionalReferenceBand")}</span>
        </div>
      ) : null}
      <div className="pk-record-strip">
        <QueueItem label={t("pkPreview.records.sourceLabel")} value={usingRecordedPk ? t("pkPreview.records.sourceRecorded") : t("pkPreview.records.sourceScheduled")} />
        <QueueItem label={t("pkPreview.records.recordedDoses")} value={String(selectedMedicationEvents.length)} warning={usingRecordedPk && selectedMedicationEvents.length === 0} />
        <QueueItem
          label={usingRecordedPk ? t("pkPreview.records.anchorLabel") : t("pkPreview.records.chartFocus")}
          value={usingRecordedPk ? anchorLabel : t("pkPreview.records.focusValue", { hours: activeNowHours.toFixed(1) })}
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
