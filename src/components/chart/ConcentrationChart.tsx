import { useMemo, useState, type PointerEvent } from "react";
import { formatMedicationTime } from "../../features/medication/dateTime";
import type { ConcentrationSample } from "../../features/pk-engine/types";
import { useI18n } from "../../i18n/I18nProvider";

interface HoverState {
  sample: ConcentrationSample;
  lineX: number;
  pointX: number;
  pointY: number;
  horizontal: "left" | "right";
  vertical: "above" | "below";
  clockTime?: string;
}

export function ConcentrationChart({
  samples,
  min,
  max,
  referenceBandValidated,
  peakTime,
  troughTime,
  nowTime,
  unit = "mg/L",
  anchorTime
}: {
  samples: ConcentrationSample[];
  min: number;
  max: number;
  referenceBandValidated?: boolean;
  peakTime: number;
  troughTime: number;
  nowTime: number;
  unit?: string;
  anchorTime?: string;
}) {
  const { locale, t } = useI18n();
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const width = 920;
  const height = 270;
  const padding = { top: 28, right: 24, bottom: 38, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const interactiveSamples = useMemo(() => samples.filter((sample) => sample.time >= 0), [samples]);

  if (samples.length === 0) {
    return <div className="chart-wrap chart-wrap-empty">{t("pkPreview.chart.noSamples")}</div>;
  }

  const yMax = Math.max(max * 1.25, ...samples.map((sample) => sample.concentration)) || 0.02;
  const xMax = samples[samples.length - 1]?.time ?? 48;
  const x = (time: number) => padding.left + (time / xMax) * plotWidth;
  const y = (value: number) => padding.top + plotHeight - (value / yMax) * plotHeight;
  const path = samples
    .map((sample, index) => `${index === 0 ? "M" : "L"} ${x(sample.time).toFixed(2)} ${y(sample.concentration).toFixed(2)}`)
    .join(" ");
  const peak = samples.reduce((nearest, sample) => (Math.abs(sample.time - peakTime) < Math.abs(nearest.time - peakTime) ? sample : nearest), samples[0]);
  const trough = samples.reduce((nearest, sample) => (Math.abs(sample.time - troughTime) < Math.abs(nearest.time - troughTime) ? sample : nearest), samples[0]);
  const ticks = [0, 6, 12, 18, 24, 30, 36, 42, 48];
  const hasReferenceBand = Number.isFinite(min) && Number.isFinite(max) && max > min && max > 0;

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (interactiveSamples.length === 0) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const lineX = clamp(((event.clientX - bounds.left) / bounds.width) * width, padding.left, padding.left + plotWidth);
    const projectedTime = ((lineX - padding.left) / plotWidth) * xMax;
    const sample = interactiveSamples.reduce((nearest, current) =>
      Math.abs(current.time - projectedTime) < Math.abs(nearest.time - projectedTime) ? current : nearest
    );
    const pointX = x(sample.time);
    const pointY = y(sample.concentration);
    const absoluteClock = anchorTime
      ? formatMedicationTime(new Date(new Date(anchorTime).getTime() + sample.time * 3_600_000).toISOString(), locale)
      : undefined;

    setHovered({
      sample,
      lineX,
      pointX,
      pointY,
      horizontal: lineX > width - 220 ? "left" : "right",
      vertical: pointY < 92 ? "below" : "above",
      clockTime: absoluteClock
    });
  }

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t("pkPreview.chart.ariaLabel")}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovered(null)}
      >
        {hasReferenceBand ? (
          <rect
            x={padding.left}
            y={y(max)}
            width={plotWidth}
            height={Math.max(0, y(min) - y(max))}
            className={referenceBandValidated ? "reference-band validated" : "reference-band provisional"}
            rx="4"
          />
        ) : null}
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} y1={padding.top} x2={x(tick)} y2={padding.top + plotHeight} className="grid-line" />
            <text x={x(tick)} y={height - 14} textAnchor="middle" className="axis-text">
              {tick}h
            </text>
          </g>
        ))}
        {[0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax].map((tick) => (
          <g key={tick}>
            <line x1={padding.left} y1={y(tick)} x2={width - padding.right} y2={y(tick)} className="grid-line horizontal" />
            <text x={padding.left - 12} y={y(tick) + 4} textAnchor="end" className="axis-text">
              {tick.toFixed(3)}
            </text>
          </g>
        ))}
        <path d={path} className="concentration-path" />
        <line x1={x(nowTime)} y1={padding.top} x2={x(nowTime)} y2={padding.top + plotHeight} className="now-line" />
        {hovered ? <line x1={hovered.lineX} y1={padding.top} x2={hovered.lineX} y2={padding.top + plotHeight} className="hover-line" /> : null}
        {hovered ? <circle cx={hovered.pointX} cy={hovered.pointY} r="4.5" className="hover-dot" /> : null}
        {peak ? <PeakMarker x={x(peak.time)} y={y(peak.concentration)} kind="peak" /> : null}
        {trough ? <PeakMarker x={x(trough.time)} y={y(trough.concentration)} kind="trough" /> : null}
      </svg>
      {hovered ? (
        <div
          className="chart-tooltip"
          data-horizontal={hovered.horizontal}
          data-vertical={hovered.vertical}
          style={{ left: `${(hovered.lineX / width) * 100}%`, top: `${(hovered.pointY / height) * 100}%` }}
        >
          <strong>{t("pkPreview.tooltip.title")}</strong>
          <dl>
            <div>
              <dt>{t("pkPreview.tooltip.offsetTime")}</dt>
              <dd>{t("pkPreview.tooltip.offsetValue", { hours: hovered.sample.time.toFixed(1) })}</dd>
            </div>
            {hovered.clockTime ? (
              <div>
                <dt>{t("pkPreview.tooltip.clockTime")}</dt>
                <dd>{hovered.clockTime}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t("pkPreview.tooltip.concentration")}</dt>
              <dd>{t("pkPreview.tooltip.concentrationValue", { value: hovered.sample.concentration.toFixed(3), unit })}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function PeakMarker({ x, y, kind }: { x: number; y: number; kind: "peak" | "trough" }) {
  const points =
    kind === "peak"
      ? `${x},${y - 9} ${x - 6},${y + 4} ${x + 6},${y + 4}`
      : `${x},${y + 9} ${x - 6},${y - 4} ${x + 6},${y - 4}`;
  return <polygon points={points} className="marker" />;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
