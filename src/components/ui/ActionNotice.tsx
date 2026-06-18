import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";
import type { ActionNotice as ActionNoticeModel } from "../../app/types";

export function ActionNotice({ notice }: { notice: ActionNoticeModel }) {
  const tone = notice.tone ?? "info";
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? TriangleAlert : tone === "danger" ? XCircle : Info;

  return (
    <div className={`action-notice ${tone}`} role="status" aria-live="polite">
      <Icon className="action-notice-icon" size={18} />
      <div>
        <strong>{notice.title}</strong>
        {notice.detail ? <span>{notice.detail}</span> : null}
      </div>
    </div>
  );
}
