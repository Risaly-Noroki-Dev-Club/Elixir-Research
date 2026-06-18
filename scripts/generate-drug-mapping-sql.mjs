import fs from "node:fs";
import path from "node:path";

const sourcePath = "C:/Users/Administrator/Documents/GitHub/DoseLab/assets/data/zh_drug_map.json";
const targetPath = path.resolve("src/features/drug-data/drug_name_mapping.sql");

const categoryMap = new Map([
  ["ssri", "antidepressant"],
  ["snri", "antidepressant"],
  ["atypical_antidepressant", "antidepressant"],
  ["antidepressant_combo", "antidepressant"],
  ["tca", "antidepressant"],
  ["maoi", "antidepressant"],
  ["adhd", "stimulant"],
  ["benzodiazepine", "sedative"],
  ["z_drug", "sedative"],
  ["sleep", "sedative"],
  ["anxiolytic", "sedative"],
  ["mood_stabilizer", "mood-stabilizer"],
  ["antiepileptic", "mood-stabilizer"],
  ["atypical_antipsychotic", "antipsychotic"],
  ["typical_antipsychotic", "antipsychotic"]
]);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeSql(value) {
  return String(value).replace(/'/g, "''");
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function localCategory(value) {
  return categoryMap.get(value) ?? "other";
}

const rows = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const mappingValues = [];
const aliasValues = [];

for (const row of rows) {
  const id = slugify(row.en);
  const zhAliases = Array.from(new Set((row.zh ?? []).filter(Boolean)));
  mappingValues.push(
    `('${escapeSql(id)}','${escapeSql(row.en)}','${escapeSql(localCategory(row.category))}','${escapeSql(JSON.stringify(zhAliases))}','["manual","doselab"]')`
  );

  aliasValues.push(`('${escapeSql(id)}','${escapeSql(row.en)}','${escapeSql(normalize(row.en))}','en',0)`);
  zhAliases.forEach((alias, index) => {
    aliasValues.push(`('${escapeSql(id)}','${escapeSql(alias)}','${escapeSql(normalize(alias))}','zh',${index})`);
  });
}

const sql = `INSERT INTO drug_name_mapping (id, canonical_name_en, category, aliases_zh_json, sources_json) VALUES
${mappingValues.join(",\n")};

INSERT INTO drug_name_mapping_alias (mapping_id, alias, alias_normalized, alias_locale, alias_priority) VALUES
${aliasValues.join(",\n")};
`;

fs.writeFileSync(targetPath, sql, "utf8");
console.log(`wrote ${rows.length} mapping rows to ${targetPath}`);
