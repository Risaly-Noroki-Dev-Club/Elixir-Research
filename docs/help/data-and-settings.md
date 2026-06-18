# Data And Settings

## Language And Theme

- Use the language switcher in the top bar to move between English, Simplified Chinese, Traditional Chinese, and Japanese.
- Theme and accent settings are local UI preferences.

## Local Data

- Medication logs are stored in browser local storage.
- Long-term medication templates are stored separately and reused by the Course Tracker and Drug Library.
- The embedded registry is seeded from SQL and loaded through SQLite + WASM.

## Search And Mapping

- Quick search matches localized keywords from the i18n catalogs.
- Drug search uses the embedded SQL mapping table before any openFDA fallback.
- Mapping aliases should be added in SQL rather than hardcoded TypeScript arrays.

## When To Review Data

- Review openFDA drafts before operational use.
- Review controlled substances and high-risk drugs before enabling reminders or interpreting PK outputs.
- Review registry mappings if a Chinese term fails to resolve to a canonical English term.
