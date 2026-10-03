import { settingsCopy } from "../../lib/settings/copy";

const locales = ["en", "hy", "ru", "fr"] as const;

describe("settings copy parity", () => {
  it("covers all sixteen sections, truth labels and six GhostStage principles in every locale", () => {
    for (const locale of locales) {
      const copy = settingsCopy(locale);
      expect(Object.keys(copy.sectionLabels)).toHaveLength(16);
      expect(Object.keys(copy.truthLabels)).toHaveLength(11);
      expect(copy.title.length).toBeGreaterThan(3);
      expect(copy.authorityPrinciples).toHaveLength(6);
      expect(copy.releaseUnavailable.length).toBeGreaterThan(10);
      expect(copy.supportUnavailable.length).toBeGreaterThan(10);
    }
  });

  it("keeps customer-facing authority labels professional", () => {
    expect(settingsCopy("hy").sectionLabels.authority).toContain("GhostStage");
    expect(settingsCopy("hy").sectionLabels.audit).not.toBe("Audit activity");
    expect(settingsCopy("ru").sectionLabels.authority).toContain("GhostStage");
    expect(settingsCopy("fr").sectionLabels.authority).toContain("GhostStage");
  });
});
