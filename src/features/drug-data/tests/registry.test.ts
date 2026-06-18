import { describe, expect, it } from "vitest";
import { registryFixture } from "../fixtures/registryFixture";
import { listDrugRegistry, searchDrugRegistry } from "../registry";
import { containsCjk, looseContains, normalizeDrugSearchQuery } from "../search";

describe("drug registry search", () => {
  it("loads the embedded registry", async () => {
    const entries = await listDrugRegistry();
    expect(entries.length).toBeGreaterThanOrEqual(3);
    expect(entries[0]?.openFda.labelQuery ?? entries[0]?.openFdaQuery).toBeTruthy();
  });

  it("resolves a Chinese alias locally before any FDA query would run", async () => {
    const result = await searchDrugRegistry(registryFixture.query);
    expect(result.unmatchedCjk).toBe(false);
    expect(result.entries[0]?.mapping.canonicalSearchTerm).toBe(registryFixture.canonicalSearchTerm);
    expect(result.entries[0]?.openFda.labelQuery).toBe(registryFixture.labelQuery);
  });

  it("supports exact and loose English alias matches", async () => {
    const exact = await searchDrugRegistry("Concerta");
    const loose = await searchDrugRegistry("certa");
    expect(exact.entries[0]?.id).toBe("methylphenidate-er");
    expect(loose.entries[0]?.id).toBe("methylphenidate-er");
  });

  it("marks missing CJK mappings as local misses", async () => {
    const result = await searchDrugRegistry("不存在的药");
    expect(result.hasCjk).toBe(true);
    expect(result.unmatchedCjk).toBe(true);
    expect(result.entries).toHaveLength(0);
  });
});

describe("drug registry search helpers", () => {
  it("normalizes search input", () => {
    expect(normalizeDrugSearchQuery("  OxyContin   CR ")).toBe("oxycontin cr");
  });

  it("detects CJK input", () => {
    expect(containsCjk("盐酸羟考酮")).toBe(true);
    expect(containsCjk("oxycodone")).toBe(false);
  });

  it("matches loose Chinese aliases like DoseLab", () => {
    expect(looseContains("盐酸羟考酮", "羟考酮")).toBe(true);
  });
});
