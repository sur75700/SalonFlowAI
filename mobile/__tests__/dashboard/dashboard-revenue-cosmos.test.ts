import fs from "fs";
import path from "path";

const mobileRoot = path.resolve(__dirname, "../..");

const revenueSource = fs.readFileSync(
  path.join(
    mobileRoot,
    "components",
    "dashboard-v2",
    "cloud",
    "RevenueAnalyticsV2.tsx"
  ),
  "utf8"
);

describe("Dashboard Revenue Cosmos rendering contract", () => {
  it("uses the existing SVG runtime", () => {
    expect(revenueSource).toContain(
      "from 'react-native-svg'"
    );
    expect(revenueSource).toContain(
      "function buildSmoothPath"
    );
    expect(revenueSource).toContain(
      "REVENUE_LINE_GRADIENT_ID"
    );
    expect(revenueSource).toContain(
      "REVENUE_AREA_GRADIENT_ID"
    );
    expect(revenueSource).toContain(
      "REVENUE_FLOOR_GRADIENT_ID"
    );
  });

  it("removes the legacy sampled View renderer", () => {
    expect(revenueSource).not.toContain(
      "const AREA_COLUMNS"
    );
    expect(revenueSource).not.toContain(
      "function AreaFill"
    );
    expect(revenueSource).not.toContain(
      "function LineSegments"
    );
  });

  it("preserves the trusted revenue props contract", () => {
    expect(revenueSource).toContain(
      "currentSeries: RevenueSeriesPoint[]"
    );
    expect(revenueSource).toContain(
      "comparisonSeries?: RevenueSeriesPoint[]"
    );
    expect(revenueSource).toContain(
      "axisValueFormatter?: (value: number) => string"
    );
    expect(revenueSource).toContain(
      "onPeriodChange?: (value: string) => void"
    );
  });

  it("adds no requests, polling or perpetual animation", () => {
    expect(revenueSource).not.toContain("fetch(");
    expect(revenueSource).not.toContain("api.get(");
    expect(revenueSource).not.toContain("api.post(");
    expect(revenueSource).not.toContain("setInterval(");
    expect(revenueSource).not.toContain("setTimeout(");
    expect(revenueSource).not.toContain("Animated.loop");
  });

  it("keeps comparison context and optical depth", () => {
    expect(revenueSource).toContain(
      'strokeDasharray="6 6"'
    );
    expect(revenueSource).toContain(
      "currentAreaPath"
    );
    expect(revenueSource).toContain(
      "peakPoint"
    );
    expect(revenueSource).toContain(
      "floorPoints"
    );
  });
});

describe("Dashboard Revenue Cosmos fullscreen theater contract", () => {
  it("provides a real fullscreen expansion control", () => {
    expect(revenueSource).toContain(
      "immersiveOpen"
    );

    expect(revenueSource).toContain(
      "<Modal"
    );

    expect(revenueSource).toContain(
      "ImmersiveRevenueStage"
    );

    expect(revenueSource).toContain(
      "onRequestClose"
    );
  });

  it("uses optical depth primitives without changing business data", () => {
    expect(revenueSource).toContain(
      "IMMERSIVE_NEBULA_GRADIENT_ID"
    );

    expect(revenueSource).toContain(
      "perspectivePositions"
    );

    expect(revenueSource).toContain(
      "currentSeries={currentSeries}"
    );

    expect(revenueSource).toContain(
      "comparisonSeries={comparisonSeries}"
    );
  });

  it("keeps fullscreen theater idle-safe", () => {
    expect(revenueSource).not.toContain(
      "setInterval("
    );

    expect(revenueSource).not.toContain(
      "Animated.loop"
    );

    expect(revenueSource).not.toContain(
      "requestAnimationFrame("
    );
  });
});

describe("Dashboard Revenue Cosmos interactive scientific contract", () => {
  it("supports touch and pointer scrubbing with built-in primitives", () => {
    expect(revenueSource).toContain(
      "PanResponder.create"
    );

    expect(revenueSource).toContain(
      "interactionPanResponder.panHandlers"
    );

    expect(revenueSource).toContain(
      'accessibilityRole="adjustable"'
    );
  });

  it("passes the trusted series label into fullscreen instrumentation", () => {
    expect(revenueSource).toContain(
      "currentSeriesLabel: string;"
    );

    expect(revenueSource).toContain(
      "currentSeriesLabel={currentSeriesLabel}"
    );
  });

  it("renders a selected-point crosshair and beacon", () => {
    expect(revenueSource).toContain(
      'strokeDasharray="4 6"'
    );

    expect(revenueSource).toContain(
      "activeScaledPoint"
    );

    expect(revenueSource).toContain(
      "interactionReadout"
    );
  });

  it("derives scientific readout values from trusted revenue points", () => {
    expect(revenueSource).toContain(
      "activeDelta"
    );

    expect(revenueSource).toContain(
      "activeDeltaPercent"
    );

    expect(revenueSource).toContain(
      "activeShare"
    );

    expect(revenueSource).toContain(
      "periodTotal"
    );
  });

  it("resets selected instrument state when revenue period changes", () => {
    expect(revenueSource).toContain(
      "key={selectedPeriod ?? periodLabel}"
    );
  });

  it("adds no background polling or continuous animation loop", () => {
    expect(revenueSource).not.toContain(
      "setInterval("
    );

    expect(revenueSource).not.toContain(
      "requestAnimationFrame("
    );

    expect(revenueSource).not.toContain(
      "Animated.loop"
    );
  });
});

