import type { LabelExtractionResult, OpenFdaLabelResult, PkFactCandidate } from "./types";

const OPENFDA_LABEL_ENDPOINT = "https://api.fda.gov/drug/label.json";

export function buildOpenFdaLabelUrl(query: string, limit = 3) {
  const params = new URLSearchParams({
    search: query,
    limit: String(limit)
  });
  return `${OPENFDA_LABEL_ENDPOINT}?${params.toString()}`;
}

export async function fetchOpenFdaLabels(query: string, limit = 3): Promise<OpenFdaLabelResult[]> {
  const response = await fetch(buildOpenFdaLabelUrl(query, limit));
  if (!response.ok) {
    throw new Error(`openFDA label request failed: ${response.status}`);
  }
  const payload = (await response.json()) as { results?: OpenFdaLabelResult[] };
  return payload.results ?? [];
}

export function extractPkFacts(label: OpenFdaLabelResult): LabelExtractionResult {
  const sections = [
    ["pharmacokinetics", label.pharmacokinetics ?? []],
    ["clinical_pharmacology", label.clinical_pharmacology ?? []]
  ] as const;

  const candidates = sections.flatMap(([section, paragraphs]) =>
    paragraphs.flatMap((paragraph, paragraphIndex) => extractCandidates(paragraph, section, paragraphIndex))
  );

  return {
    labelId: label.set_id ?? label.id ?? "unknown-label",
    source: "openfda-label",
    effectiveTime: label.effective_time,
    brandNames: label.openfda?.brand_name ?? [],
    genericNames: label.openfda?.generic_name ?? [],
    route: label.openfda?.route ?? [],
    candidates
  };
}

function extractCandidates(
  text: string,
  section: "clinical_pharmacology" | "pharmacokinetics",
  paragraphIndex: number
): PkFactCandidate[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const patterns = [
    {
      label: "half-life",
      regex: /\b(?:half-life|half life|t1\/2|terminal half-life)\b[^.]{0,120}?(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/gi
    },
    {
      label: "Tmax",
      regex: /\b(?:Tmax|T max|time to (?:maximum|peak)[^.]{0,30})\b[^.]{0,120}?(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/gi
    },
    {
      label: "Cmax",
      regex: /\b(?:Cmax|C max|peak plasma concentration)\b[^.]{0,120}?(\d+(?:\.\d+)?)\s*(ng\/mL|mcg\/mL|mg\/L|pg\/mL)\b/gi
    },
    {
      label: "bioavailability",
      regex: /\b(?:bioavailability|absolute bioavailability|oral bioavailability)\b[^.]{0,120}?(\d+(?:\.\d+)?)\s*(%)\b/gi
    }
  ];

  return patterns.flatMap((pattern) => {
    const matches = [...cleaned.matchAll(pattern.regex)];
    return matches.slice(0, 4).map((match, matchIndex) => ({
      id: `${section}-${paragraphIndex}-${pattern.label}-${matchIndex}`,
      label: pattern.label,
      value: match[1],
      unit: match[2],
      section,
      evidence: excerpt(cleaned, match.index ?? 0),
      reviewStatus: "needs-review" as const
    }));
  });
}

function excerpt(text: string, index: number) {
  const start = Math.max(0, index - 90);
  const end = Math.min(text.length, index + 170);
  return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
}

