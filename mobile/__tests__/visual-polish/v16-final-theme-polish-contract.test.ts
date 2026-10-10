import fs from "node:fs";
import path from "node:path";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("V16 final theme-aware visual polish", () => {
  it("uses SalonFlowAI as the visible premium wordmark", () => {
    const files = [
      "components/booking-v2/BookingCommandHeaderV2.tsx",
      "components/client-v2/ClientCommandHeaderV2.tsx",
      "components/service-v2/ServiceCenterContainerV2.tsx",
      "components/analytics-v2/AnalyticsCommandCenterV2.tsx",
      "app/(tabs)/reports.tsx",
    ];
    for (const file of files) {
      expect(read(file)).toContain("SalonFlowAI");
    }
  });

  it("ties the wordmark accent to the active theme", () => {
    for (const file of [
      "components/booking-v2/BookingCommandHeaderV2.tsx",
      "components/client-v2/ClientCommandHeaderV2.tsx",
      "components/service-v2/ServiceCenterCompositionV2.tsx",
      "components/analytics-v2/AnalyticsCommandCenterV2.tsx",
      "app/(tabs)/reports.tsx",
    ]) {
      const source = read(file);
      expect(source).toContain('"royal_gold_cosmos"');
      expect(source).toContain("dashboardTheme.palette.gold");
      expect(source).toContain("dashboardTheme.palette.royal");
    }
  });

  it("hardens the services vertical scroll owner", () => {
    const source = read("components/service-v2/ServiceCenterCompositionV2.tsx");
    expect(source).toContain("styles.mainScroll");
    expect(source).toContain('Platform.OS === "web"');
    expect(source).toContain("maxHeight: Math.max(440, height - 64)");
    expect(source).toContain("nestedScrollEnabled");
    expect(source).toContain("minHeight: 0");
    expect(source).toContain("paddingBottom: 120");
  });

  it("moves reports into the active-theme glass family", () => {
    const command = read("components/reports/ReportsCommandCenterV2.tsx");
    const catalog = read("components/reports/ReportCatalogSelector.tsx");
    expect(command).toContain("dashboardTheme.palette.surface");
    expect(command).toContain("dashboardTheme.palette.borderStrong");
    expect(catalog).toContain("dashboardTheme.palette.surfaceRaised");
    expect(catalog).toContain("brandAccent");
  });

  it("upgrades the bottom navigation into a royal glass dock", () => {
    const layout = read("app/(tabs)/_layout.tsx");
    const icons = read("components/ui/icon-symbol.tsx");
    expect(layout).toContain("styles.iconShell");
    expect(layout).toContain("tabBarActiveTintColor: brandAccent");
    expect(layout).toContain("dashboardTheme.palette.surface");
    expect(icons).toContain("'gearshape.fill': 'settings'");
    expect(icons).toContain("'chart.bar.fill': 'insights'");
    expect(icons).toContain("'doc.text.fill': 'article'");
  });
});
