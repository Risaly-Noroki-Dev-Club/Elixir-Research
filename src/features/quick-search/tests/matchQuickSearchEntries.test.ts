import { describe, expect, it } from "vitest";
import { matchQuickSearchEntries } from "../matchQuickSearchEntries";

describe("quick search matching", () => {
  it("matches English keywords", () => {
    const matches = matchQuickSearchEntries("course", "en");
    expect(matches[0]?.entry.id).toBe("course-tracker");
  });

  it("matches Simplified Chinese keywords from i18n catalogs", () => {
    const matches = matchQuickSearchEntries("药库", "zh-Hans");
    expect(matches[0]?.entry.id).toBe("library");
  });

  it("keeps localized titles for the active locale", () => {
    const matches = matchQuickSearchEntries("リマインダー", "ja");
    expect(matches[0]?.title).toBe("服薬リマインダー");
  });
});
