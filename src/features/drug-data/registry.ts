import { getDrugRegistryDatabase, resetDrugRegistryDatabase, type SqlDatabase } from "./database";
import { resolveDrugSearchMapping } from "./mapping";
import { containsCjk, normalizeDrugSearchQuery, tokenizeDrugSearchQuery } from "./search";
import type { DrugRegistryEntry, DrugRegistrySearchResult, MappingSource } from "./types";

type SqlScalar = string | number | null | Uint8Array;
type SqlParams = Record<string, string | number | null>;

interface RegistryRow {
  id: string;
  generic_name: string;
  generic_name_zh: string;
  brand_names_json: string;
  aliases_json: string;
  category: DrugRegistryEntry["category"];
  controlled: number;
  default_dose_mg: number;
  default_interval_hours: number;
  release_model: DrugRegistryEntry["releaseModel"];
  profile_json: string;
  rxnorm_ids_json: string;
  mapping_sources_json: string;
  openfda_search_term: string;
  openfda_ndc_exact_query: string;
  openfda_ndc_loose_query: string;
  openfda_label_query: string;
  review_status: DrugRegistryEntry["reviewStatus"];
  source_notes_json: string;
}

const baseSelect = `
  SELECT
    id,
    generic_name,
    generic_name_zh,
    brand_names_json,
    aliases_json,
    category,
    controlled,
    default_dose_mg,
    default_interval_hours,
    release_model,
    profile_json,
    rxnorm_ids_json,
    mapping_sources_json,
    openfda_search_term,
    openfda_ndc_exact_query,
    openfda_ndc_loose_query,
    openfda_label_query,
    review_status,
    source_notes_json
  FROM drug_registry
`;

function mapRows(results: Array<{ columns: string[]; values: SqlScalar[][] }>) {
  return results.flatMap((result) =>
    result.values.map((valueRow) =>
      Object.fromEntries(result.columns.map((column, index) => [column, valueRow[index]])) as unknown as RegistryRow
    )
  );
}

function parseStringArray(value: string) {
  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function parseMappingSources(value: string) {
  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is MappingSource => typeof item === "string") : [];
}

function deserializeRegistryRow(row: RegistryRow): DrugRegistryEntry {
  const aliases = parseStringArray(row.aliases_json);

  return {
    id: row.id,
    genericName: row.generic_name,
    genericNameZh: row.generic_name_zh,
    brandNames: parseStringArray(row.brand_names_json),
    aliases,
    category: row.category,
    controlled: Boolean(row.controlled),
    defaultDoseMg: Number(row.default_dose_mg),
    defaultIntervalHours: Number(row.default_interval_hours),
    releaseModel: row.release_model,
    profile: JSON.parse(row.profile_json) as DrugRegistryEntry["profile"],
    mapping: {
      canonicalSearchTerm: row.openfda_search_term,
      aliasesEn: aliases.filter((alias) => !containsCjk(alias)),
      aliasesZh: aliases.filter((alias) => containsCjk(alias)),
      rxNormIds: parseStringArray(row.rxnorm_ids_json),
      sources: parseMappingSources(row.mapping_sources_json)
    },
    openFda: {
      searchTerm: row.openfda_search_term,
      ndcExactQuery: row.openfda_ndc_exact_query,
      ndcLooseQuery: row.openfda_ndc_loose_query,
      labelQuery: row.openfda_label_query
    },
    openFdaQuery: row.openfda_label_query,
    reviewStatus: row.review_status,
    sourceNotes: parseStringArray(row.source_notes_json)
  };
}

async function runRegistryQuery(sql: string, params?: SqlParams, database?: SqlDatabase) {
  const activeDatabase = database ?? (await getDrugRegistryDatabase());
  return mapRows(activeDatabase.exec(sql, params)).map(deserializeRegistryRow);
}

function buildRegistrySearchStatement(query: string) {
  const normalizedQuery = normalizeDrugSearchQuery(query);
  const tokens = tokenizeDrugSearchQuery(normalizedQuery);
  const params: SqlParams = {
    ":query": normalizedQuery,
    ":queryPrefix": `${normalizedQuery}%`,
    ":queryContains": `%${normalizedQuery}%`
  };

  const tokenClauses = tokens.map((token, index) => {
    const key = `:token${index}`;
    params[key] = `%${token}%`;
    return `dr.search_text_normalized LIKE ${key}`;
  });

  const textSearchClause = tokenClauses.length > 0 ? tokenClauses.join(" AND ") : "0";

  const sql = `
    WITH alias_matches AS (
      SELECT
        drug_id,
        MAX(
          CASE
            WHEN alias_normalized = :query THEN 500 - alias_priority
            WHEN alias_normalized LIKE :queryPrefix THEN 420 - alias_priority
            WHEN alias_normalized LIKE :queryContains THEN 340 - alias_priority
            ELSE 0
          END
        ) AS score
      FROM drug_registry_alias
      WHERE alias_normalized = :query
        OR alias_normalized LIKE :queryPrefix
        OR alias_normalized LIKE :queryContains
      GROUP BY drug_id
    ),
    text_matches AS (
      SELECT
        dr.id AS drug_id,
        220 AS score
      FROM drug_registry dr
      WHERE ${textSearchClause}
    ),
    ranked_matches AS (
      SELECT drug_id, score FROM alias_matches
      UNION ALL
      SELECT drug_id, score FROM text_matches
    ),
    collapsed_matches AS (
      SELECT
        drug_id,
        MAX(score) AS score
      FROM ranked_matches
      GROUP BY drug_id
    )
    SELECT
      dr.id,
      dr.generic_name,
      dr.generic_name_zh,
      dr.brand_names_json,
      dr.aliases_json,
      dr.category,
      dr.controlled,
      dr.default_dose_mg,
      dr.default_interval_hours,
      dr.release_model,
      dr.profile_json,
      dr.rxnorm_ids_json,
      dr.mapping_sources_json,
      dr.openfda_search_term,
      dr.openfda_ndc_exact_query,
      dr.openfda_ndc_loose_query,
      dr.openfda_label_query,
      dr.review_status,
      dr.source_notes_json
    FROM drug_registry dr
    JOIN collapsed_matches matches ON matches.drug_id = dr.id
    ORDER BY matches.score DESC, dr.generic_name COLLATE NOCASE
  `;

  return { sql, params, normalizedQuery };
}

export async function listDrugRegistry() {
  return runRegistryQuery(`${baseSelect} ORDER BY generic_name COLLATE NOCASE`);
}

export async function searchDrugRegistry(query: string): Promise<DrugRegistrySearchResult> {
  const normalizedQuery = normalizeDrugSearchQuery(query);
  const hasCjk = containsCjk(query);
  const resolvedMapping = normalizedQuery ? await resolveDrugSearchMapping(query) : null;

  if (!normalizedQuery) {
    return {
      query,
      normalizedQuery,
      hasCjk: false,
      unmatchedCjk: false,
      resolvedMapping: null,
      entries: await listDrugRegistry()
    };
  }

  const { sql, params } = buildRegistrySearchStatement(normalizedQuery);
  const entries = await runRegistryQuery(sql, params);

  return {
    query,
    normalizedQuery,
    hasCjk,
    unmatchedCjk: hasCjk && entries.length === 0 && !resolvedMapping,
    resolvedMapping,
    entries
  };
}

export async function findDrugRegistryEntryById(id: string) {
  const [entry] = await runRegistryQuery(`${baseSelect} WHERE id = :id LIMIT 1`, { ":id": id });
  return entry ?? null;
}

export { resetDrugRegistryDatabase };
