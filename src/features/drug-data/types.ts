import type { DrugProfile, ReleaseModel } from "../pk-engine/types";

export type ReviewStatus = "seed" | "needs-review" | "reviewed" | "rejected";

export type SourceKind = "curated" | "openfda-label" | "dailymed" | "rxnorm";
export type MappingSource = "manual" | "rxnorm" | "wikidata" | "pubchem" | "openfda" | "doselab";

export interface DrugNameMapping {
  canonicalSearchTerm: string;
  aliasesEn: string[];
  aliasesZh: string[];
  rxNormIds: string[];
  sources: MappingSource[];
}

export interface OpenFdaMapping {
  searchTerm: string;
  ndcExactQuery: string;
  ndcLooseQuery: string;
  labelQuery: string;
}

export interface DrugRegistryEntry {
  id: string;
  genericName: string;
  genericNameZh: string;
  brandNames: string[];
  aliases: string[];
  category: "opioid" | "stimulant" | "sedative" | "antidepressant" | "antipsychotic" | "mood-stabilizer" | "other";
  controlled: boolean;
  defaultDoseMg: number;
  defaultIntervalHours: number;
  releaseModel: ReleaseModel;
  profile: DrugProfile;
  mapping: DrugNameMapping;
  openFda: OpenFdaMapping;
  openFdaQuery: string;
  reviewStatus: ReviewStatus;
  sourceNotes: string[];
}

export interface DrugRegistrySearchResult {
  query: string;
  normalizedQuery: string;
  hasCjk: boolean;
  unmatchedCjk: boolean;
  resolvedMapping: DrugMappingResolution | null;
  entries: DrugRegistryEntry[];
}

export interface DrugMappingRecord {
  id: string;
  canonicalName: string;
  category: DrugRegistryEntry["category"];
  aliasesZh: string[];
  sources: MappingSource[];
}

export interface DrugMappingResolution extends DrugMappingRecord {
  matchedAlias: string;
  matchedLocale: "en" | "zh";
}

export interface OpenFdaCatalogCandidate {
  id: string;
  canonicalName: string;
  brandName: string;
  genericName: string;
  manufacturer: string;
  productNdc: string;
  packageNdc: string[];
  route: string[];
  dosageForm: string;
  marketingStatus: string;
  rxcui: string[];
  query: string;
  labelQuery: string;
  resolvedMapping: DrugMappingResolution | null;
}

export interface OpenFdaCatalogSearchResult {
  query: string;
  normalizedQuery: string;
  hasCjk: boolean;
  unmatchedCjk: boolean;
  resolvedMapping: DrugMappingResolution | null;
  exactQuery: string;
  looseQuery: string;
  candidates: OpenFdaCatalogCandidate[];
}

export interface OpenFdaLabelResult {
  id?: string;
  set_id?: string;
  effective_time?: string;
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    substance_name?: string[];
    route?: string[];
    product_type?: string[];
    rxcui?: string[];
  };
  clinical_pharmacology?: string[];
  pharmacokinetics?: string[];
  indications_and_usage?: string[];
  warnings?: string[];
  boxed_warning?: string[];
  drug_interactions?: string[];
}

export interface PkFactCandidate {
  id: string;
  label: string;
  value: string;
  unit?: string;
  section: "clinical_pharmacology" | "pharmacokinetics";
  evidence: string;
  reviewStatus: "needs-review";
}

export interface LabelExtractionResult {
  labelId: string;
  source: SourceKind;
  effectiveTime?: string;
  brandNames: string[];
  genericNames: string[];
  route: string[];
  candidates: PkFactCandidate[];
}

