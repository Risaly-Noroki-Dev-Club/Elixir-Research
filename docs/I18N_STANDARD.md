# I18N Standard

## Goal

Keep UI copy out of TypeScript components so translators can work in JSON without touching logic.

## Locale Files

Store locale catalogs in `src/i18n/locales/`.

Required files:

- `en.json`
- `zh-Hans.json`
- `zh-Hant.json`
- `ja.json`

`en` is the source locale and the fallback for missing keys.

## Key Rules

- Use dot-path namespaces by feature, such as `drugLibrary.remoteTitle`.
- Keep keys stable. Do not rename keys just because wording changes.
- Do not store HTML in translation strings.
- Use `{variable}` placeholders for runtime values.
- Arrays are allowed only for searchable keyword lists such as `quickSearch.entries.library.keywords`.

## Component Rules

- Use `t(key, variables)` for string rendering.
- Use `tm(key)` only when the value is an array or nested object.
- New UI modules should not introduce inline bilingual `tx({ en, zh })` literals unless they are temporary migration shims.
- Drug mapping seed data is the only place where multilingual raw names are expected to stay inside data files or SQL seed assets.

## Translator Workflow

1. Add the new English key in `en.json`.
2. Mirror the same key in `zh-Hans.json`, `zh-Hant.json`, and `ja.json`.
3. Keep placeholder names identical across locales.
4. Do not change JSON shape for one locale only.

## Review Checklist

- No missing locale key for new UI copy.
- No untranslated user-facing status labels.
- No feature-specific copy embedded in component code.
- Search keywords updated when module names or IA labels change.
