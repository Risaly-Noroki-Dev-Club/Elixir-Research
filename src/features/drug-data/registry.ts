import type { DrugRegistryEntry } from "./types";

export const drugRegistry: DrugRegistryEntry[] = [
  {
    id: "oxycodone-cr",
    genericName: "oxycodone hydrochloride",
    genericNameZh: "盐酸羟考酮",
    brandNames: ["OxyContin"],
    aliases: ["oxycodone", "奥施康定", "羟考酮", "oxycontin"],
    category: "opioid",
    controlled: true,
    defaultDoseMg: 20,
    defaultIntervalHours: 12,
    releaseModel: "biphasic-cr",
    profile: {
      id: "oxycodone-cr-demo",
      name: "Oxycodone CR (OxyContin)",
      subtitle: "Biphasic · 12 h dosing · opioid safety gate",
      unit: "mg/L",
      bioavailability: 0.72,
      apparentVdLPerKg: 2.6,
      halfLifeHours: 4.5,
      absorptionPhases: [
        { label: "early release", fraction: 0.35, absorptionRate: 0.95, lagHours: 0 },
        { label: "controlled release", fraction: 0.65, absorptionRate: 0.18, lagHours: 0.6 }
      ],
      referenceMin: 0.01,
      referenceMax: 0.08,
      referenceBandValidated: false,
      modelNote:
        "Two-input absorption demo. Not calibrated for dosing, analgesia, tolerance, renal/hepatic impairment, or safety decisions.",
      interactionTags: ["opioid", "cyp3a4-substrate", "cns-depressant-risk"]
    },
    openFdaQuery: 'openfda.brand_name:"OXYCONTIN"+openfda.generic_name:"OXYCODONE"',
    reviewStatus: "needs-review",
    sourceNotes: ["DailyMed/FDA label required before parameter promotion", "PMID 26977300", "PMID 31597014"]
  },
  {
    id: "methylphenidate-er",
    genericName: "methylphenidate hydrochloride",
    genericNameZh: "盐酸哌甲酯",
    brandNames: ["Concerta", "Ritalin LA"],
    aliases: ["methylphenidate", "哌甲酯", "专注达", "concerta", "ritalin"],
    category: "stimulant",
    controlled: true,
    defaultDoseMg: 18,
    defaultIntervalHours: 24,
    releaseModel: "biphasic-cr",
    profile: {
      id: "methylphenidate-er-placeholder",
      name: "Methylphenidate ER",
      subtitle: "Extended release · placeholder model",
      unit: "mg/L",
      bioavailability: 0.3,
      apparentVdLPerKg: 2.7,
      halfLifeHours: 3.5,
      absorptionPhases: [
        { label: "immediate layer", fraction: 0.22, absorptionRate: 1.1, lagHours: 0 },
        { label: "osmotic release", fraction: 0.78, absorptionRate: 0.16, lagHours: 1.2 }
      ],
      referenceMin: 0.004,
      referenceMax: 0.02,
      referenceBandValidated: false,
      modelNote: "Placeholder profile. Pull FDA label and curated PK review before showing patient-facing estimates.",
      interactionTags: ["stimulant", "cns-active"]
    },
    openFdaQuery: 'openfda.generic_name:"METHYLPHENIDATE"',
    reviewStatus: "seed",
    sourceNotes: ["Seed mapping only; parameters are placeholders"]
  },
  {
    id: "quetiapine-ir",
    genericName: "quetiapine fumarate",
    genericNameZh: "富马酸喹硫平",
    brandNames: ["Seroquel"],
    aliases: ["quetiapine", "喹硫平", "思瑞康", "seroquel"],
    category: "antipsychotic",
    controlled: false,
    defaultDoseMg: 50,
    defaultIntervalHours: 12,
    releaseModel: "standard-ir",
    profile: {
      id: "quetiapine-ir-placeholder",
      name: "Quetiapine IR",
      subtitle: "Immediate release · placeholder model",
      unit: "mg/L",
      bioavailability: 1,
      apparentVdLPerKg: 10,
      halfLifeHours: 6,
      absorptionPhases: [{ label: "oral absorption", fraction: 1, absorptionRate: 1.05, lagHours: 0 }],
      referenceMin: 0.05,
      referenceMax: 0.5,
      referenceBandValidated: false,
      modelNote: "Placeholder profile. Needs reviewed source parameters and metabolite handling before use.",
      interactionTags: ["cyp3a4-substrate", "cns-depressant-risk"]
    },
    openFdaQuery: 'openfda.generic_name:"QUETIAPINE"',
    reviewStatus: "seed",
    sourceNotes: ["Seed mapping only; parameters are placeholders"]
  }
];

export function searchRegistry(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return drugRegistry;

  return drugRegistry.filter((entry) => {
    const haystack = [
      entry.genericName,
      entry.genericNameZh,
      ...entry.brandNames,
      ...entry.aliases,
      entry.category
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
