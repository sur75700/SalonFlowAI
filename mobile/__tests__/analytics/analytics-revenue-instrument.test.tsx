import fs from "fs";
import path from "path";

const mobileRoot = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(
    path.join(mobileRoot, relativePath),
    "utf8"
  );
}

describe("Analytics Revenue Intelligence", () => {
  const commandCenter = read(
    "components/analytics-v2/AnalyticsCommandCenterV2.tsx"
  );
  const revenueSource = read(
    "components/dashboard-v2/cloud/RevenueAnalyticsV2.tsx"
  );
  const dashboardComposition = read(
    "components/dashboard-v2/cloud/DashboardV2Composition.tsx"
  );

  it("reuses one shared real-data revenue renderer", () => {
    expect(commandCenter).toContain(
      'RevenueAnalyticsV2 from "../dashboard-v2/cloud/RevenueAnalyticsV2"'
    );
    const start = commandCenter.indexOf("function RevenuePulse({");
    const end = commandCenter.indexOf("\nfunction ExecutiveBrief(", start);
    const pulse = commandCenter.slice(start, end);

    expect(pulse).toContain("point.current");
    expect(pulse).toContain("point.previous");
    expect(pulse).not.toContain("fetch(");
    expect(pulse).not.toContain("api.get(");
    expect(pulse).not.toContain("api.post(");
  });

  it("keeps compact and fullscreen Analytics on the Emerald variant", () => {
    expect(commandCenter).toContain(
      'visualVariant="analyticsEmerald"'
    );
    expect(revenueSource).toContain(
      "const isEmerald = visualVariant === 'analyticsEmerald'"
    );
    expect(revenueSource).toContain(
      "visualVariant={visualVariant}"
    );
    expect(revenueSource).toContain(
      "strokeWidth={isEmerald ? 3.4 : 2.8}"
    );
    expect(revenueSource).toContain(
      "strokeWidth={isEmerald ? 3.8 : 3.2}"
    );
    expect(revenueSource).toContain(
      "DashboardThemeBackground"
    );
    expect(revenueSource).toContain(
      "styles.immersiveRootEmerald"
    );
  });

  it("names selected-point semantics separately from previous-period comparison", () => {
    expect(revenueSource).toContain(
      "currentSeries[\n          resolvedActiveIndex - 1"
    );
    expect(commandCenter).toContain(
      'previousIntervalLabel={st("Previous interval")}'
    );
    expect(commandCenter).toContain(
      'changeLabel={st("Change vs previous interval")}'
    );
    expect(commandCenter).toContain(
      'changePercentLabel={st("Change % vs previous interval")}'
    );
    expect(commandCenter).toContain(
      'currentSeriesLabel={st("Current Period Revenue")}'
    );
    expect(commandCenter).toContain(
      'comparisonSeriesLabel={st("Previous Period Revenue")}'
    );
    expect(revenueSource).toContain(
      "previousIntervalLabel}: {previousPoint.label}"
    );
  });

  it("keeps both Revenue legends in fullscreen", () => {
    expect(revenueSource).toContain(
      "{!!comparisonSeries && ("
    );
    expect(revenueSource).toContain(
      "{comparisonSeriesLabel}"
    );
    expect(revenueSource).toContain(
      "styles.immersiveFooterItem"
    );
  });

  it("keeps Dashboard on the Royal default contract", () => {
    expect(revenueSource).toContain(
      "visualVariant = 'dashboardRoyal'"
    );
    expect(revenueSource).toContain(
      "primary: colors.royal"
    );
    expect(revenueSource).toContain(
      "lineStart: colors.cosmosBlue"
    );
    expect(revenueSource).toContain(
      "lineMid: colors.cosmosViolet"
    );
    expect(revenueSource).toContain(
      "lineEnd: colors.cosmosMagenta"
    );
    expect(dashboardComposition).not.toContain(
      'visualVariant="analyticsEmerald"'
    );
    expect(dashboardComposition).not.toContain(
      'visualVariant="dashboardRoyal"'
    );
  });

  it("retains trader-grade accessible fullscreen interaction without polling", () => {
    for (const token of [
      "PanResponder.create",
      "interactionPanResponder.panHandlers",
      'accessibilityRole="adjustable"',
      "onAccessibilityAction",
      "activeScaledPoint",
      "activeDeltaPercent",
      "activeShare",
      "periodTotal",
    ]) {
      expect(revenueSource).toContain(token);
    }

    for (const forbidden of [
      "setInterval(",
      "requestAnimationFrame(",
      "Animated.loop",
    ]) {
      expect(revenueSource).not.toContain(forbidden);
    }
  });
});
