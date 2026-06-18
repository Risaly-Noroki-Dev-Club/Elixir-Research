import { getDrugRegistryDatabase } from "./database";
import { containsCjk, normalizeDrugSearchQuery } from "./search";
import type { DrugMappingRecord, DrugMappingResolution, MappingSource } from "./types";

interface MappingRow {
  id: string;
  canonical_name_en: string;
  category: DrugMappingRecord["category"];
  aliases_zh_json: string;
  sources_json: string;
  matched_alias: string;
  matched_locale: "en" | "zh";
}

function parseStringArray(value: string) {
  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function parseMappingSources(value: string) {
  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is MappingSource => typeof item === "string") : [];
}

function deserializeMappingRow(row: MappingRow): DrugMappingResolution {
  return {
    id: row.id,
    canonicalName: row.canonical_name_en,
    category: row.category,
    aliasesZh: parseStringArray(row.aliases_zh_json),
    sources: parseMappingSources(row.sources_json),
    matchedAlias: row.matched_alias,
    matchedLocale: row.matched_locale
  };
}

export async function resolveDrugSearchMapping(query: string) {
  const normalizedQuery = normalizeDrugSearchQuery(query);
  if (!normalizedQuery) {
    return null;
  }

  const database = await getDrugRegistryDatabase();
  const results = database.exec(
    `
      WITH alias_matches AS (
        SELECT
          mapping_id,
          alias,
          alias_locale,
          CASE
            WHEN alias_normalized = :query THEN 500 - alias_priority
            WHEN alias_normalized LIKE :queryPrefix THEN 420 - alias_priority
            WHEN alias_normalized LIKE :queryContains THEN 340 - alias_priority
            ELSE 0
          END AS score
        FROM drug_name_mapping_alias
        WHERE alias_normalized = :query
          OR alias_normalized LIKE :queryPrefix
          OR alias_normalized LIKE :queryContains
      ),
      ranked_matches AS (
        SELECT
          mapping_id,
          alias,
          alias_locale,
          score,
          ROW_NUMBER() OVER (PARTITION BY mapping_id ORDER BY score DESC) AS rank_in_mapping
        FROM alias_matches
      )
      SELECT
        dm.id,
        dm.canonical_name_en,
        dm.category,
        dm.aliases_zh_json,
        dm.sources_json,
        rm.alias AS matched_alias,
        rm.alias_locale AS matched_locale
      FROM ranked_matches rm
      JOIN drug_name_mapping dm ON dm.id = rm.mapping_id
      WHERE rm.rank_in_mapping = 1
      ORDER BY rm.score DESC, dm.canonical_name_en COLLATE NOCASE
      LIMIT 1
    `,
    {
      ":query": normalizedQuery,
      ":queryPrefix": `${normalizedQuery}%`,
      ":queryContains": `%${normalizedQuery}%`
    }
  );

  const row = results[0]?.values[0];
  if (!row) {
    return null;
  }

  const mappingRow = Object.fromEntries(results[0].columns.map((column, index) => [column, row[index]])) as unknown as MappingRow;
  return deserializeMappingRow(mappingRow);
}

export async function isMappedChineseDrugQuery(query: string) {
  if (!containsCjk(query)) {
    return true;
  }

  return (await resolveDrugSearchMapping(query)) !== null;
}
