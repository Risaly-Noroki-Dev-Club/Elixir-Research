import type { ReactNode } from "react";

export function ControlBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="control-block">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  suffix,
  onChange
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="slider-row">
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
      <strong>
        {value} {suffix}
      </strong>
    </div>
  );
}

export function Segmented({
  value,
  options,
  onChange
}: {
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented">
      {options.map(([optionValue, label]) => (
        <button key={optionValue} type="button" className={value === optionValue ? "active" : ""} onClick={() => onChange(optionValue)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function ToggleRow({
  label,
  selected,
  onChange
}: {
  label: string;
  selected: boolean;
  onChange: () => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={selected} onChange={onChange} />
    </label>
  );
}
