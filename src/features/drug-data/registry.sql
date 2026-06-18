DROP TABLE IF EXISTS drug_registry_alias;
DROP TABLE IF EXISTS drug_registry;
DROP TABLE IF EXISTS drug_name_mapping_alias;
DROP TABLE IF EXISTS drug_name_mapping;

CREATE TABLE drug_registry (
  id TEXT PRIMARY KEY,
  generic_name TEXT NOT NULL,
  generic_name_zh TEXT NOT NULL,
  brand_names_json TEXT NOT NULL,
  aliases_json TEXT NOT NULL,
  category TEXT NOT NULL,
  controlled INTEGER NOT NULL CHECK (controlled IN (0, 1)),
  default_dose_mg REAL NOT NULL,
  default_interval_hours REAL NOT NULL,
  release_model TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  rxnorm_ids_json TEXT NOT NULL,
  mapping_sources_json TEXT NOT NULL,
  openfda_search_term TEXT NOT NULL,
  openfda_ndc_exact_query TEXT NOT NULL,
  openfda_ndc_loose_query TEXT NOT NULL,
  openfda_label_query TEXT NOT NULL,
  review_status TEXT NOT NULL,
  source_notes_json TEXT NOT NULL,
  search_text_normalized TEXT NOT NULL
);

CREATE TABLE drug_registry_alias (
  drug_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  alias_normalized TEXT NOT NULL,
  alias_kind TEXT NOT NULL,
  alias_priority INTEGER NOT NULL,
  FOREIGN KEY (drug_id) REFERENCES drug_registry(id)
);

CREATE TABLE drug_name_mapping (
  id TEXT PRIMARY KEY,
  canonical_name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  aliases_zh_json TEXT NOT NULL,
  sources_json TEXT NOT NULL
);

CREATE TABLE drug_name_mapping_alias (
  mapping_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  alias_normalized TEXT NOT NULL,
  alias_locale TEXT NOT NULL,
  alias_priority INTEGER NOT NULL,
  FOREIGN KEY (mapping_id) REFERENCES drug_name_mapping(id)
);

CREATE INDEX idx_drug_registry_generic_name ON drug_registry(generic_name);
CREATE INDEX idx_drug_registry_alias_normalized ON drug_registry_alias(alias_normalized);
CREATE INDEX idx_drug_name_mapping_alias_normalized ON drug_name_mapping_alias(alias_normalized);

INSERT INTO drug_registry (
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
) VALUES
(
  'oxycodone-cr',
  'oxycodone hydrochloride',
  '盐酸羟考酮',
  '["OxyContin"]',
  '["oxycodone hydrochloride","oxycodone","OxyContin","盐酸羟考酮","羟考酮"]',
  'opioid',
  1,
  20,
  12,
  'biphasic-cr',
  '{"id":"oxycodone-cr-demo","name":"Oxycodone CR (OxyContin)","subtitle":"Biphasic CR 12 h dosing opioid safety gate","unit":"mg/L","bioavailability":0.72,"apparentVdLPerKg":2.6,"halfLifeHours":4.5,"absorptionPhases":[{"label":"early release","fraction":0.35,"absorptionRate":0.95,"lagHours":0},{"label":"controlled release","fraction":0.65,"absorptionRate":0.18,"lagHours":0.6}],"referenceMin":0.01,"referenceMax":0.08,"referenceBandValidated":false,"modelNote":"Two-input absorption demo. Not calibrated for dosing, analgesia, tolerance, renal or hepatic impairment, or safety decisions.","interactionTags":["opioid","cyp3a4-substrate","cns-depressant-risk"]}',
  '["7804"]',
  '["manual","rxnorm","openfda"]',
  'oxycodone',
  'brand_name:"oxycodone"+generic_name:"oxycodone"',
  'brand_name:oxycodone+generic_name:oxycodone',
  'openfda.brand_name:"OXYCONTIN"+openfda.generic_name:"OXYCODONE"',
  'needs-review',
  '["DailyMed/FDA label required before parameter promotion","PMID 26977300","PMID 31597014"]',
  'oxycodone hydrochloride oxycodone oxycontin 盐酸羟考酮 羟考酮 opioid'
),
(
  'methylphenidate-er',
  'methylphenidate hydrochloride',
  '盐酸哌甲酯',
  '["Concerta","Ritalin LA"]',
  '["methylphenidate hydrochloride","methylphenidate","Concerta","Ritalin LA","盐酸哌甲酯","哌甲酯","专注达"]',
  'stimulant',
  1,
  18,
  24,
  'biphasic-cr',
  '{"id":"methylphenidate-er-placeholder","name":"Methylphenidate ER","subtitle":"Extended release placeholder model","unit":"mg/L","bioavailability":0.3,"apparentVdLPerKg":2.7,"halfLifeHours":3.5,"absorptionPhases":[{"label":"immediate layer","fraction":0.22,"absorptionRate":1.1,"lagHours":0},{"label":"osmotic release","fraction":0.78,"absorptionRate":0.16,"lagHours":1.2}],"referenceMin":0.004,"referenceMax":0.02,"referenceBandValidated":false,"modelNote":"Placeholder profile. Pull FDA label and curated PK review before showing patient-facing estimates.","interactionTags":["stimulant","cns-active"]}',
  '["32937"]',
  '["manual","rxnorm","openfda"]',
  'methylphenidate',
  'brand_name:"methylphenidate"+generic_name:"methylphenidate"',
  'brand_name:methylphenidate+generic_name:methylphenidate',
  'openfda.generic_name:"METHYLPHENIDATE"',
  'seed',
  '["Seed mapping only; parameters are placeholders"]',
  'methylphenidate hydrochloride methylphenidate concerta ritalin la 盐酸哌甲酯 哌甲酯 专注达 stimulant'
),
(
  'quetiapine-ir',
  'quetiapine fumarate',
  '富马酸喹硫平',
  '["Seroquel"]',
  '["quetiapine fumarate","quetiapine","Seroquel","富马酸喹硫平","喹硫平","思瑞康"]',
  'antipsychotic',
  0,
  50,
  12,
  'standard-ir',
  '{"id":"quetiapine-ir-placeholder","name":"Quetiapine IR","subtitle":"Immediate release placeholder model","unit":"mg/L","bioavailability":1,"apparentVdLPerKg":10,"halfLifeHours":6,"absorptionPhases":[{"label":"oral absorption","fraction":1,"absorptionRate":1.05,"lagHours":0}],"referenceMin":0.05,"referenceMax":0.5,"referenceBandValidated":false,"modelNote":"Placeholder profile. Needs reviewed source parameters and metabolite handling before use.","interactionTags":["cyp3a4-substrate","cns-depressant-risk"]}',
  '["8076"]',
  '["manual","rxnorm","openfda"]',
  'quetiapine',
  'brand_name:"quetiapine"+generic_name:"quetiapine"',
  'brand_name:quetiapine+generic_name:quetiapine',
  'openfda.generic_name:"QUETIAPINE"',
  'seed',
  '["Seed mapping only; parameters are placeholders"]',
  'quetiapine fumarate quetiapine seroquel 富马酸喹硫平 喹硫平 思瑞康 antipsychotic'
);

INSERT INTO drug_registry_alias (drug_id, alias, alias_normalized, alias_kind, alias_priority) VALUES
  ('oxycodone-cr', 'oxycodone hydrochloride', 'oxycodone hydrochloride', 'generic-en', 0),
  ('oxycodone-cr', 'oxycodone', 'oxycodone', 'generic-en', 1),
  ('oxycodone-cr', 'OxyContin', 'oxycontin', 'brand-en', 2),
  ('oxycodone-cr', 'oxycodone cr', 'oxycodone cr', 'formulation-en', 3),
  ('oxycodone-cr', '盐酸羟考酮', '盐酸羟考酮', 'generic-zh', 0),
  ('oxycodone-cr', '羟考酮', '羟考酮', 'generic-zh', 1),
  ('methylphenidate-er', 'methylphenidate hydrochloride', 'methylphenidate hydrochloride', 'generic-en', 0),
  ('methylphenidate-er', 'methylphenidate', 'methylphenidate', 'generic-en', 1),
  ('methylphenidate-er', 'Concerta', 'concerta', 'brand-en', 2),
  ('methylphenidate-er', 'Ritalin LA', 'ritalin la', 'brand-en', 3),
  ('methylphenidate-er', '盐酸哌甲酯', '盐酸哌甲酯', 'generic-zh', 0),
  ('methylphenidate-er', '哌甲酯', '哌甲酯', 'generic-zh', 1),
  ('methylphenidate-er', '专注达', '专注达', 'brand-zh', 2),
  ('quetiapine-ir', 'quetiapine fumarate', 'quetiapine fumarate', 'generic-en', 0),
  ('quetiapine-ir', 'quetiapine', 'quetiapine', 'generic-en', 1),
  ('quetiapine-ir', 'Seroquel', 'seroquel', 'brand-en', 2),
  ('quetiapine-ir', '富马酸喹硫平', '富马酸喹硫平', 'generic-zh', 0),
  ('quetiapine-ir', '喹硫平', '喹硫平', 'generic-zh', 1),
  ('quetiapine-ir', '思瑞康', '思瑞康', 'brand-zh', 2);
