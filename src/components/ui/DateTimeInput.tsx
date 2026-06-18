import { CalendarClock, Clock3 } from "lucide-react";
import { mergeDatetimeLocal, splitDatetimeLocal } from "../../features/medication/dateTime";

interface DateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSetNow?: () => void;
}

export function DateTimeInput({ value, onChange, onSetNow }: DateTimeInputProps) {
  const { datePart, timePart } = splitDatetimeLocal(value);

  return (
    <div className="datetime-input-row">
      <label className="datetime-inline-input">
        <CalendarClock size={18} />
        <input
          type="date"
          value={datePart}
          onChange={(event) => onChange(mergeDatetimeLocal(event.target.value, timePart))}
        />
      </label>
      <label className="datetime-inline-input">
        <Clock3 size={18} />
        <input
          type="time"
          value={timePart}
          step={60}
          onChange={(event) => onChange(mergeDatetimeLocal(datePart, event.target.value))}
        />
      </label>
      {onSetNow ? (
        <button className="secondary-button datetime-now-button" type="button" onClick={onSetNow}>
          现在
        </button>
      ) : null}
    </div>
  );
}
