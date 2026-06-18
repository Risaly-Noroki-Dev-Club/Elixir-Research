import type { NotFoundContext } from "../../app/types";
import { useI18n } from "../../i18n/I18nProvider";

export function NotFoundPage({ context, onBack }: { context: NotFoundContext; onBack: () => void }) {
  const { tx } = useI18n();
  const browserStatus = getBrowserStatus();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1>{tx({ en: "This module is not wired yet", zh: "功能还没有接入" })}</h1>
        <p>{tx({ en: "The interaction exists, but this build does not have a real destination page yet.", zh: "这个按钮已经接上交互了，但当前版本还没有对应页面。" })}</p>
        <div className="trace-grid">
          <TraceItem label="module" value={context.module} />
          <TraceItem label="action" value={context.action} />
          <TraceItem label="source" value={context.source} />
          <TraceItem label="path" value={browserStatus.path} />
          <TraceItem label="online" value={browserStatus.online} />
          <TraceItem label="viewport" value={browserStatus.viewport} />
          <TraceItem label="language" value={browserStatus.language} />
          <TraceItem label="storage" value={browserStatus.storage} />
        </div>
        <button className="primary-button" onClick={onBack}>
          {tx({ en: "Back to Drug Library", zh: "返回药物库" })}
        </button>
      </div>
    </div>
  );
}

function TraceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="trace-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getBrowserStatus() {
  const storage = (() => {
    try {
      localStorage.setItem("er:storage-check", "ok");
      localStorage.removeItem("er:storage-check");
      return "localStorage available";
    } catch {
      return "localStorage blocked";
    }
  })();

  return {
    path: window.location.pathname || "/",
    online: navigator.onLine ? "online" : "offline",
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language || "unknown",
    storage
  };
}
