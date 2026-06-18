export function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${status}`}>{status}</span>;
}

export function AnalysisPill({ status }: { status: "research" | "low" | "in-range" | "high" }) {
  const text = status === "research" ? "Unvalidated model" : status === "in-range" ? "In band" : status === "high" ? "Above band" : "Below band";
  return <span className={`analysis-pill ${status}`}>{text}</span>;
}
