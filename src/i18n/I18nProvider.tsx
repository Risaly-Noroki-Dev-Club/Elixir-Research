import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import zhHans from "./locales/zh-Hans.json";
import zhHant from "./locales/zh-Hant.json";

export type Locale = "en" | "zh-Hans" | "zh-Hant" | "ja";

export interface LocalizedText {
  en: string;
  zh?: string;
  "zh-Hans"?: string;
  "zh-Hant"?: string;
  ja?: string;
}

export interface LocaleOption {
  code: Locale;
  label: string;
  shortLabel: string;
}

type TranslationNode = string | string[] | { [key: string]: TranslationNode };
type TranslationCatalog = Record<string, TranslationNode>;

interface I18nContextValue {
  locale: Locale;
  locales: LocaleOption[];
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  tm: (key: string) => TranslationNode;
  tx: (message: LocalizedText, variables?: Record<string, string | number>) => string;
}

const catalogs: Record<Locale, TranslationCatalog> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  ja
};

const localeOptions: LocaleOption[] = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "zh-Hans", label: "简体中文", shortLabel: "简" },
  { code: "zh-Hant", label: "繁體中文", shortLabel: "繁" },
  { code: "ja", label: "日本語", shortLabel: "日" }
];

const I18nContext = createContext<I18nContextValue | null>(null);
const localeStorageKey = "er:locale";

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLocale = window.localStorage.getItem(localeStorageKey);
  if (storedLocale === "en" || storedLocale === "zh-Hans" || storedLocale === "zh-Hant" || storedLocale === "ja") {
    return storedLocale;
  }

  const browserLocale = navigator.language.toLowerCase();
  if (browserLocale.startsWith("zh-tw") || browserLocale.startsWith("zh-hk") || browserLocale.startsWith("zh-mo")) {
    return "zh-Hant";
  }
  if (browserLocale.startsWith("zh")) {
    return "zh-Hans";
  }
  if (browserLocale.startsWith("ja")) {
    return "ja";
  }
  return "en";
}

function interpolate(template: string, variables?: Record<string, string | number>) {
  if (!variables) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(variables[key] ?? `{${key}}`));
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

function getCatalogNode(locale: Locale, key: string) {
  return getNode(catalogs[locale], key) ?? getNode(catalogs.en, key);
}

function resolveLegacyLocalizedText(locale: Locale, message: LocalizedText) {
  if (locale === "zh-Hant") {
    return message["zh-Hant"] ?? message["zh-Hans"] ?? message.zh ?? message.en;
  }
  if (locale === "zh-Hans") {
    return message["zh-Hans"] ?? message.zh ?? message["zh-Hant"] ?? message.en;
  }
  return message[locale] ?? message.en;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      locales: localeOptions,
      setLocale: (nextLocale) => {
        setLocaleState(nextLocale);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(localeStorageKey, nextLocale);
        }
      },
      t: (key, variables) => {
        const node = getCatalogNode(locale, key);
        if (typeof node !== "string") {
          return key;
        }
        return interpolate(node, variables);
      },
      tm: (key) => {
        const node = getCatalogNode(locale, key);
        return (node ?? key) as TranslationNode;
      },
      tx: (message, variables) => interpolate(resolveLegacyLocalizedText(locale, message), variables)
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}
