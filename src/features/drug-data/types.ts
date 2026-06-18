import type { DrugProfile, ReleaseModel } from "../pk-engine/types";

export type ReviewStatus = "seed" | "needs-review" | "reviewed" | "rejected";

export type SourceKind = "curated" | "openfda-label" | "dailymed" | "rxnorm";

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
  openFdaQuery: string;
  reviewStatus: ReviewStatus;
  sourceNotes: string[];
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

