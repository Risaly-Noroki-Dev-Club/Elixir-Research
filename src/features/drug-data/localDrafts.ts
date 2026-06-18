import type { DrugProfile } from "../pk-engine/types";
import { normalizeDrugSearchQuery } from "./search";
import type { DrugRegistryEntry, ReviewStatus } from "./types";

const draftStorageKey = "er:v1:drug-registry-drafts";

function isBrowser() {
  return typeof window !== "undefined";
}

function escapeSqlLiteral(value: string) {
  return value.replace(/'/g, "''");
}

function jsonLiteral(value: unknown) {
  return `'${escapeSqlLiteral(JSON.stringify(value))}'`;
}

function textLiteral(value: string) {
  return `'${escapeSqlLiteral(value)}'`;
}

function numberLiteral(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

function safeArray(value: string[]) {
  return Array.from(new Set(value.filter(Boolean)));
}

export function createPlaceholderDrugProfile(name: string): DrugProfile {
  return {
    id: `${normalizeDrugSearchQuery(name).replace(/\s+/g, "-")}-draft-profile`,
    name,
    subtitle: "Placeholder review-gated profile",
    unit: "mg/L",
    bioavailability: 1,
    apparentVdLPerKg: 1,
    halfLifeHours: 12,
    absorptionPhases: [{ label: "placeholder oral absorption", fraction: 1, absorptionRate: 0.5, lagHours: 0 }],
    referenceMin: 0,
    referenceMax: 0,
    referenceBandValidated: false,
    modelNote: "Placeholder profile created from openFDA search. Requires scientific review before simulation use.",
    interactionTags: ["draft", "review-required"]
  };
}

export function loadDrugRegistryDraftEntries() {
  if (!isBrowser()) {
    return [] as DrugRegistryEntry[];
  }

  const raw = window.localStorage.getItem(draftStorageKey);
  if (!raw) {
    return [] as DrugRegistryEntry[];
  }

  try {
    const parsed = JSON.parse(raw) as DrugRegistryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as DrugRegistryEntry[];
  }
}

export function persistDrugRegistryDraftEntry(entry: DrugRegistryEntry) {
  if (!isBrowser()) {
    return;
  }

  const current = loadDrugRegistryDraftEntries();
  const next = [entry, ...current.filter((draft) => draft.id !== entry.id)];
  window.localStorage.setItem(draftStorageKey, JSON.stringify(next));
}

export function buildDrugRegistryDraftSql() {
  const drafts = loadDrugRegistryDraftEntries();
  if (drafts.length === 0) {
    return "";
  }

  const statements: string[] = [];

  for (const draft of drafts) {
    const aliases = safeArray([draft.genericName, draft.genericNameZh, ...draft.brandNames, ...draft.aliases]);
    const searchText = normalizeDrugSearchQuery(
      [draft.genericName, draft.genericNameZh, ...draft.brandNames, ...draft.aliases, draft.category].join(" ")
    );

    statements.push(`
INSERT OR REPLACE INTO drug_registry (
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
  source_notes_json,
  search_text_normalized
) VALUES (
  ${textLiteral(draft.id)},
  ${textLiteral(draft.genericName)},
  ${textLiteral(draft.genericNameZh)},
  ${jsonLiteral(draft.brandNames)},
  ${jsonLiteral(aliases)},
  ${textLiteral(draft.category)},
  ${draft.controlled ? 1 : 0},
  ${numberLiteral(draft.defaultDoseMg)},
  ${numberLiteral(draft.defaultIntervalHours)},
  ${textLiteral(draft.releaseModel)},
  ${jsonLiteral(draft.profile)},
  ${jsonLiteral(draft.mapping.rxNormIds)},
  ${jsonLiteral(draft.mapping.sources)},
  ${textLiteral(draft.openFda.searchTerm)},
  ${textLiteral(draft.openFda.ndcExactQuery)},
  ${textLiteral(draft.openFda.ndcLooseQuery)},
  ${textLiteral(draft.openFda.labelQuery)},
  ${textLiteral(draft.reviewStatus)},
  ${jsonLiteral(draft.sourceNotes)},
  ${textLiteral(searchText)}
);`);

    statements.push(`DELETE FROM drug_registry_alias WHERE drug_id = ${textLiteral(draft.id)};`);

    aliases.forEach((alias, index) => {
      const aliasKind = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(alias) ? "generic-zh" : "generic-en";
      statements.push(`INSERT INTO drug_registry_alias (drug_id, alias, alias_normalized, alias_kind, alias_priority) VALUES (
  ${textLiteral(draft.id)},
  ${textLiteral(alias)},
  ${textLiteral(normalizeDrugSearchQuery(alias))},
  ${textLiteral(aliasKind)},
  ${index}
);`);
    });
  }

  return statements.join("\n");
}

export function createDraftRegistryEntry(input: {
  id: string;
  genericName: string;
  genericNameZh: string;
  brandNames: string[];
  aliases: string[];
  category: DrugRegistryEntry["category"];
  controlled?: boolean;
  releaseModel?: DrugRegistryEntry["releaseModel"];
  reviewStatus?: ReviewStatus;
  rxNormIds?: string[];
  mappingSources?: DrugRegistryEntry["mapping"]["sources"];
  openFda: DrugRegistryEntry["openFda"];
  sourceNotes: string[];
}) {
  const aliases = safeArray([input.genericName, input.genericNameZh, ...input.brandNames, ...input.aliases]);

  return {
    id: input.id,
    genericName: input.genericName,
    genericNameZh: input.genericNameZh,
    brandNames: safeArray(input.brandNames),
    aliases,
    category: input.category,
    controlled: Boolean(input.controlled),
    defaultDoseMg: 0,
    defaultIntervalHours: 24,
    releaseModel: input.releaseModel ?? "standard-ir",
    profile: createPlaceholderDrugProfile(input.brandNames[0] ?? input.genericName),
    mapping: {
      canonicalSearchTerm: input.openFda.searchTerm,
      aliasesEn: aliases.filter((alias) => !/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(alias)),
      aliasesZh: aliases.filter((alias) => /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(alias)),
      rxNormIds: input.rxNormIds ?? [],
      sources: input.mappingSources ?? ["manual", "openfda"]
    },
    openFda: input.openFda,
    openFdaQuery: input.openFda.labelQuery,
    reviewStatus: input.reviewStatus ?? "needs-review",
    sourceNotes: input.sourceNotes
  } satisfies DrugRegistryEntry;
}
