import { buildOpenFdaLabelUrl, extractPkFacts } from "../../src/features/drug-data/openFda";
import type { OpenFdaLabelResult } from "../../src/features/drug-data/types";

interface NetlifyEvent {
  queryStringParameters?: Record<string, string | undefined> | null;
}

export const handler = async (event: NetlifyEvent) => {
  const query = event.queryStringParameters?.q?.trim();
  if (!query) {
    return json(400, { error: "Missing q query parameter." });
  }

  const upstream = await fetch(buildOpenFdaLabelUrl(query, 5));
  if (!upstream.ok) {
    return json(upstream.status, { error: "openFDA request failed." });
  }

  const payload = (await upstream.json()) as { results?: OpenFdaLabelResult[] };
  const labels = payload.results ?? [];

  return json(200, {
    query,
    count: labels.length,
    labels: labels.map((label) => extractPkFacts(label))
  });
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600"
    },
    body: JSON.stringify(body)
  };
}
