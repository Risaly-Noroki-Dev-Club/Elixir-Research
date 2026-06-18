import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

export function UnavailableNotice({ label }: { label: string }) {
  const { t } = useI18n();

  return (
    <div className="unavailable-notice">
      <AlertTriangle size={16} />
      <span>{t("app.notImplemented", { label })}</span>
    </div>
  );
}
