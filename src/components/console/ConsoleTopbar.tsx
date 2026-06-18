import { BookOpen, Check, ChevronDown, Globe2, Moon, Palette, Sun, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NotFoundContext } from "../../app/types";
import { useI18n } from "../../i18n/I18nProvider";

interface ConsoleTopbarProps {
  theme: "dark" | "light";
  accent: string;
  onThemeChange: (theme: "dark" | "light") => void;
  onAccentChange: (accent: string) => void;
  onNotFound: (context: NotFoundContext) => void;
}

export function ConsoleTopbar({ theme, accent, onThemeChange, onAccentChange, onNotFound }: ConsoleTopbarProps) {
  const { locale, locales, setLocale, t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const activeLocale = useMemo(() => locales.find((option) => option.code === locale) ?? locales[0], [locale, locales]);

  return (
    <header className="console-topbar">
      <div />
      <div className="top-actions">
        <button className="text-action" onClick={() => onNotFound({ module: "support", action: "open_support", source: "topbar" })}>
          <BookOpen size={16} />
          {t("topbar.support")}
        </button>
        <div className="language-switcher" ref={menuRef}>
          <button
            className={menuOpen ? "text-action language-trigger active" : "text-action language-trigger"}
            title={t("topbar.switchLanguage")}
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <Globe2 size={16} />
            <span>{activeLocale.shortLabel}</span>
            <ChevronDown size={14} />
          </button>
          {menuOpen ? (
            <div className="language-menu-panel" role="menu" aria-label={t("topbar.languageMenu")}>
              {locales.map((option) => {
                const localeLabelKey = option.code === "zh-Hans" ? "zhHans" : option.code === "zh-Hant" ? "zhHant" : option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    className={option.code === locale ? "language-option active" : "language-option"}
                    onClick={() => {
                      setLocale(option.code);
                      setMenuOpen(false);
                    }}
                  >
                    <div>
                      <strong>{option.label}</strong>
                      <span>{t(`topbar.locales.${localeLabelKey}`)}</span>
                    </div>
                    {option.code === locale ? <Check size={15} /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <button className="icon-button" title={t("topbar.theme")} onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <label className="icon-button color-button" title={t("topbar.accent")}>
          <Palette size={18} />
          <input value={accent} type="color" onChange={(event) => onAccentChange(event.target.value)} />
        </label>
        <button className="avatar-button" title={t("topbar.account")} onClick={() => onNotFound({ module: "account", action: "open_profile", source: "topbar" })}>
          <UserRound size={18} />
        </button>
      </div>
    </header>
  );
}
