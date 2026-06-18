export function QueueItem({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="queue-item">
      <span>{label}</span>
      <strong className={warning ? "warning" : ""}>{value}</strong>
    </div>
  );
}
