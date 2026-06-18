export const drugDataModuleManifest = {
  id: "drug-data",
  name: "Drug Data Registry",
  version: "0.2.0",
  status: "review",
  safetyLevel: "clinical-review-required",
  storageKeys: ["er:v1:selected-drug", "er:v1:drug-query"],
  sourceNotes: [
    "Local curated registry drives all runtime drug search.",
    "openFDA queries are reviewed mapping artifacts, not direct user-input passthrough.",
    "Controlled-substance mappings require clinical review before parameter promotion."
  ]
} as const;
