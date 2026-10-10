import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    "components/service-v2/ServiceCenterCompositionV2.tsx",
  ),
  "utf8",
);

describe("Services Burgundy create + scroll", () => {
  it("uses a real viewport-constrained web scroll owner", () => {
    expect(source).toContain('Platform.OS === "web"');
    expect(source).toContain("maxHeight: Math.max(440, height - 64)");
    expect(source).toContain("nestedScrollEnabled");
    expect(source).toContain('keyboardShouldPersistTaps="handled"');
  });

  it("keeps Royal/Gold create tone and adds Burgundy-only CTA tone", () => {
    expect(source).toContain('tone === "purple" && styles.actionPurple');
    expect(source).toContain('tone === "burgundy" && styles.actionBurgundy');
    expect(source).toContain('isBurgundyCosmos ? "burgundy" : "purple"');
  });

  it("uses deep-wine Burgundy create panel material", () => {
    expect(source).toContain("isBurgundySheet");
    expect(source).toContain("dashboardTheme.palette.surface");
    expect(source).toContain("dashboardTheme.palette.borderStrong");
    expect(source).toContain("styles.sheetBurgundyGlowTop");
    expect(source).toContain("styles.sheetBurgundyGlowBottom");
  });

  it("uses Burgundy-aware input shells without replacing base inputs", () => {
    expect(source).toContain("isBurgundyField");
    expect(source).toContain('backgroundColor: "rgba(13,8,15,0.82)"');
    expect(source).toContain("dashboardTheme.palette.textPrimary");
    expect(source).toContain('placeholderTextColor={');
  });
});
