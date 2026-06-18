import { AlertTriangle } from "lucide-react";

export function UnavailableNotice({ label }: { label: string }) {
  return (
    <div className="unavailable-notice">
      <AlertTriangle size={16} />
      <span>{label} 当前是导航占位，功能 N/A。药物库仍可继续使用。</span>
    </div>
  );
}
