import { useI18n } from "../../i18n/I18nProvider";

export function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const label = ["seed", "needs-review", "reviewed", "rejected"].includes(status) ? t(`status.${status}`) : status;
  return <span className={`status-pill ${status}`}>{label}</span>;
}

export function AnalysisPill({ status }: { status: "research" | "low" | "in-range" | "high" }) {
  const { t } = useI18n();
  const text =
    status === "research"
      ? t("pkPreview.analysis.research")
      : status === "in-range"
        ? t("pkPreview.analysis.inRange")
        : status === "high"
          ? t("pkPreview.analysis.high")
          : t("pkPreview.analysis.low");

  return <span className={`analysis-pill ${status}`}>{text}</span>;
}
