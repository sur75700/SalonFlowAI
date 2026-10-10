import fs from "node:fs";
import path from "node:path";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Burgundy Cosmos theme-aware surfaces", () => {
  it("adds Burgundy-only overrides while retaining Royal base styles", () => {
    const booking = read("components/booking-v2/BookingCardV3.tsx");
    const client = read("components/client-v2/ClientCardV3.tsx");
    const service = read("components/service-v2/ServiceCenterCompositionV2.tsx");
    const analytics = read("components/analytics-v2/AnalyticsCommandCenterV2.tsx");

    for (const source of [booking, client, service, analytics]) {
      expect(source).toContain('selectedThemeId === "burgundy_cosmos"');
      expect(source).toContain("dashboardTheme.palette.surface");
    }

    expect(booking).toContain('surface: "rgba(8, 11, 31, 0.90)"');
    expect(client).toContain("surface: 'rgba(34, 24, 61, 0.92)'");
    expect(service).toContain('backgroundColor: "rgba(10, 16, 45, 0.82)"');
    expect(analytics).toContain('surface: "#0D1324"');
  });

  it("shows Burgundy Cosmos in Settings", () => {
    expect(read("components/settings/command/SettingsCommandCenter.tsx"))
      .toContain('"BURGUNDY COSMOS"');
    expect(read("components/settings/command/SettingsExecutiveOverview.tsx"))
      .toContain('"Burgundy Cosmos"');
    expect(read("components/settings/command/panels/CorePanels.tsx"))
      .toContain('"Burgundy Cosmos"');
  });

  it("uses the Burgundy asset for Analytics export", () => {
    const source = read("components/analytics-v2/AnalyticsExportSheetV2.tsx");
    expect(source).toContain("burgundy-cosmos.png");
    expect(source).toContain('value === "burgundy_cosmos"');
    expect(source).toContain('"image/png"');
  });

  it("accepts Burgundy in the mobile Reports contract", () => {
    expect(read("lib/reports/contracts.ts"))
      .toContain('value.theme_id !== "burgundy_cosmos"');
  });
});
