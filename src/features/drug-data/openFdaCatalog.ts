import { createDraftRegistryEntry } from "./localDrafts";
import { containsCjk, normalizeDrugSearchQuery } from "./search";
import { resolveDrugSearchMapping } from "./mapping";
import type { OpenFdaCatalogCandidate, OpenFdaCatalogSearchResult } from "./types";

const OPENFDA_NDC_ENDPOINT = "https://api.fda.gov/drug/ndc.json";

interface OpenFdaNdcResult {
  brand_name?: string;
  generic_name?: string;
  labeler_name?: string;
  product_ndc?: string;
  package_ndc?: string[];
  route?: string[];
  dosage_form?: string;
  marketing_status?: string;
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    route?: string[];
    rxcui?: string[];
  };
}

function buildOpenFdaNdcUrl(query: string, limit = 8) {
  const params = new URLSearchParams({
    search: query,
    limit: String(limit)
  });
  return `${OPENFDA_NDC_ENDPOINT}?${params.toString()}`;
}

function buildExactQuery(term: string) {
  return `brand_name:"${term}"+generic_name:"${term}"`;
}

function buildLooseQuery(term: string) {
  return `brand_name:${term}+generic_name:${term}`;
}

async function queryOpenFdaNdc(query: string, limit = 8) {
  const response = await fetch(buildOpenFdaNdcUrl(query, limit));
  if (response.status === 404) {
    return [] as OpenFdaNdcResult[];
  }
  if (!response.ok) {
    throw new Error(`openFDA NDC request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { results?: OpenFdaNdcResult[] };
  return payload.results ?? [];
}

function normalizeCandidateId(value: string) {
  return normalizeDrugSearchQuery(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "draft-drug";
}

function mapCandidate(
  result: OpenFdaNdcResult,
  query: string,
  exactQuery: string,
  resolvedMapping: OpenFdaCatalogSearchResult["resolvedMapping"]
): OpenFdaCatalogCandidate {
  const brandName = result.brand_name ?? result.openfda?.brand_name?.[0] ?? resolvedMapping?.canonicalName ?? "Unknown brand";
  const genericName = result.generic_name ?? result.openfda?.generic_name?.[0] ?? resolvedMapping?.canonicalName ?? "unknown";
  const canonicalName = resolvedMapping?.canonicalName ?? genericName;
  const route = result.route ?? result.openfda?.route ?? [];
  const labelQuery = `openfda.brand_name:"${brandName.toUpperCase()}"${genericName ? `+openfda.generic_name:"${genericName.toUpperCase()}"` : ""}`;

  return {
    id: result.product_ndc ? `draft-${result.product_ndc}` : `draft-${normalizeCandidateId(`${canonicalName}-${brandName}`)}`,
    canonicalName,
    brandName,
    genericName,
    manufacturer: result.labeler_name ?? "Unknown manufacturer",
    productNdc: result.product_ndc ?? "unknown-ndc",
    packageNdc: result.package_ndc ?? [],
    route,
    dosageForm: result.dosage_form ?? "unknown dosage form",
    marketingStatus: result.marketing_status ?? "unknown",
    rxcui: result.openfda?.rxcui ?? [],
    query: exactQuery,
    labelQuery,
    resolvedMapping
  };
}

export async function searchOpenFdaCatalog(query: string): Promise<OpenFdaCatalogSearchResult> {
  const normalizedQuery = normalizeDrugSearchQuery(query);
  const hasCjk = containsCjk(query);
  const resolvedMapping = await resolveDrugSearchMapping(query);

  if (!normalizedQuery) {
    return {
      query,
      normalizedQuery,
      hasCjk,
      unmatchedCjk: false,
      resolvedMapping: null,
      exactQuery: "",
      looseQuery: "",
      candidates: []
    };
  }

  if (hasCjk && !resolvedMapping) {
    return {
      query,
      normalizedQuery,
      hasCjk,
      unmatchedCjk: true,
      resolvedMapping: null,
      exactQuery: "",
      looseQuery: "",
      candidates: []
    };
  }

  const canonical = resolvedMapping?.canonicalName ?? normalizedQuery;
  const exactQuery = buildExactQuery(canonical);
  const looseQuery = buildLooseQuery(canonical);

  let results = await queryOpenFdaNdc(exactQuery);
  if (results.length === 0) {
    results = await queryOpenFdaNdc(looseQuery);
  }

  return {
    query,
    normalizedQuery,
    hasCjk,
    unmatchedCjk: hasCjk && !resolvedMapping,
    resolvedMapping,
    exactQuery,
    looseQuery,
    candidates: results.map((result) => mapCandidate(result, query, exactQuery, resolvedMapping))
  };
}

export function createRegistryDraftFromOpenFdaCandidate(candidate: OpenFdaCatalogCandidate) {
  return createDraftRegistryEntry({
    id: candidate.id,
    genericName: candidate.genericName,
    genericNameZh: candidate.resolvedMapping?.aliasesZh[0] ?? candidate.genericName,
    brandNames: [candidate.brandName],
    aliases: [candidate.canonicalName, ...(candidate.resolvedMapping?.aliasesZh ?? [])],
    category: candidate.resolvedMapping?.category ?? "other",
    rxNormIds: candidate.rxcui,
    mappingSources: candidate.resolvedMapping ? [...candidate.resolvedMapping.sources, "openfda"] : ["manual", "openfda"],
    openFda: {
      searchTerm: candidate.canonicalName,
      ndcExactQuery: candidate.query,
      ndcLooseQuery: buildLooseQuery(candidate.canonicalName),
      labelQuery: candidate.labelQuery
    },
    sourceNotes: [
      "Draft created from openFDA NDC catalog search",
      `product_ndc:${candidate.productNdc}`,
      `manufacturer:${candidate.manufacturer}`,
      `route:${candidate.route.join(",") || "unknown"}`
    ]
  });
}
