import type { MedicationEvent } from "./types";

const HOUR_IN_MS = 3_600_000;
type SupportedLocale = "en" | "zh-Hans" | "zh-Hant" | "ja";

export function formatDatetimeLocal(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function splitDatetimeLocal(value: string) {
  const [datePart = "", timePart = ""] = value.split("T");

  return {
    datePart,
    timePart: timePart.slice(0, 5) || "00:00"
  };
}

export function mergeDatetimeLocal(datePart: string, timePart: string) {
  if (!datePart) return "";
  return `${datePart}T${(timePart || "00:00").slice(0, 5)}`;
}

export function formatMedicationTime(value: string, locale: SupportedLocale = "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function getLatestMedicationEventTime(events: MedicationEvent[], fallback = new Date()) {
  const latestMs = events.reduce<number | null>((latest, event) => {
    const eventMs = new Date(event.takenAt).getTime();
    if (!Number.isFinite(eventMs)) return latest;
    if (latest === null || eventMs > latest) return eventMs;
    return latest;
  }, null);

  return latestMs === null ? fallback.toISOString() : new Date(latestMs).toISOString();
}

export function getHoursBetween(startTime: string, endTime: string | Date) {
  const startMs = new Date(startTime).getTime();
  const endMs = typeof endTime === "string" ? new Date(endTime).getTime() : endTime.getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  return (endMs - startMs) / HOUR_IN_MS;
}

function resolveIntlLocale(locale: SupportedLocale) {
  if (locale === "zh-Hans") return "zh-CN";
  if (locale === "zh-Hant") return "zh-TW";
  if (locale === "ja") return "ja-JP";
  return "en-US";
}
