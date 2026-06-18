import type { ConcentrationSample } from "../../features/pk-engine/types";

export function ConcentrationChart({
  samples,
  min,
  max,
  peakTime,
  troughTime,
  nowTime
}: {
  samples: ConcentrationSample[];
  min: number;
  max: number;
  peakTime: number;
  troughTime: number;
  nowTime: number;
}) {
  const width = 920;
  const height = 270;
  const padding = { top: 28, right: 24, bottom: 38, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
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

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Plasma concentration over 48 hours">
        <rect x={padding.left} y={y(max)} width={plotWidth} height={Math.max(0, y(min) - y(max))} className="reference-band" rx="4" />
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
        {peak ? <PeakMarker x={x(peak.time)} y={y(peak.concentration)} kind="peak" /> : null}
        {trough ? <PeakMarker x={x(trough.time)} y={y(trough.concentration)} kind="trough" /> : null}
      </svg>
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
