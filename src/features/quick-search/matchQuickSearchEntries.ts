import type { Locale } from "../../i18n/I18nProvider";
import en from "../../i18n/locales/en.json";
import ja from "../../i18n/locales/ja.json";
import zhHans from "../../i18n/locales/zh-Hans.json";
import zhHant from "../../i18n/locales/zh-Hant.json";
import { quickSearchEntries, type QuickSearchEntry } from "./searchIndex";

type TranslationNode = string | string[] | { [key: string]: TranslationNode };
type TranslationCatalog = Record<string, TranslationNode>;

const catalogs: Record<Locale, TranslationCatalog> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  ja
};

export interface QuickSearchMatch {
  entry: QuickSearchEntry;
  title: string;
  description: string;
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function getNode(catalog: TranslationCatalog, key: string): TranslationNode | undefined {
  const segments = key.split(".");
  let cursor: TranslationNode | undefined = catalog;

  for (const segment of segments) {
    if (!cursor || typeof cursor === "string" || Array.isArray(cursor)) {
      return undefined;
    }
    cursor = cursor[segment];
  }

  return cursor;
}

function resolveString(locale: Locale, key: string) {
  const node = getNode(catalogs[locale], key) ?? getNode(catalogs.en, key);
  return typeof node === "string" ? node : key;
}

function resolveKeywordList(locale: Locale, key: string) {
  const node = getNode(catalogs[locale], key) ?? getNode(catalogs.en, key);
  return Array.isArray(node) ? node.filter((item): item is string => typeof item === "string") : [];
}

function buildHaystack(entry: QuickSearchEntry) {
  const values: string[] = [];

  for (const locale of Object.keys(catalogs) as Locale[]) {
    values.push(resolveString(locale, entry.titleKey));
    values.push(resolveString(locale, entry.descriptionKey));
    values.push(...resolveKeywordList(locale, entry.keywordsKey));
  }

  return values.join(" ").toLowerCase();
}

function scoreMatch(haystack: string, query: string) {
  if (!query) {
    return 1;
  }
  if (haystack === query) {
    return 500;
  }
  if (haystack.startsWith(query)) {
    return 420;
  }
  if (haystack.includes(query)) {
    return 320;
  }
  return 0;
}

export function matchQuickSearchEntries(query: string, locale: Locale): QuickSearchMatch[] {
  const normalizedQuery = normalizeQuery(query);

  return quickSearchEntries
    .map((entry) => {
      const title = resolveString(locale, entry.titleKey);
      const description = resolveString(locale, entry.descriptionKey);
      const haystack = buildHaystack(entry);

      return {
        entry,
        title,
        description,
        score: scoreMatch(haystack, normalizedQuery)
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .map(({ score: _score, ...match }) => match);
}
