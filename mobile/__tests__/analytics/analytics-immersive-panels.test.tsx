import fs from "fs";
import path from "path";

const mobileRoot = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(
    path.join(mobileRoot, relativePath),
    "utf8"
  );
}

describe("Analytics immersive intelligence system", () => {
  const commandCenter = read(
    "components/analytics-v2/AnalyticsCommandCenterV2.tsx"
  );
  const immersive = read(
    "components/analytics-v2/AnalyticsImmersivePanelV2.tsx"
  );

  it("uses one shared Cosmos fullscreen shell for all four blocks", () => {
    for (const kind of [
      "booking-status",
      "top-services",
      "client-health",
      "demand-heatmap",
    ]) {
      expect(commandCenter).toContain(`kind="${kind}"`);
    }

    expect(immersive).toContain("<Modal");
    expect(immersive).toContain("DashboardThemeBackground");
    expect(immersive).toContain("accessibilityViewIsModal");
    expect(immersive).toContain("onRequestClose");
  });

  it("keeps fullscreen expansion presentation-only", () => {
    for (const forbidden of [
      "fetch(",
      "api.get(",
      "api.post(",
      "useAppointmentsData(",
      "setInterval(",
      "requestAnimationFrame(",
    ]) {
      expect(immersive).not.toContain(forbidden);
    }
  });

  it("defaults Booking Status to a meaningful nonzero dominant state and suppresses zero arcs", () => {
    expect(immersive).toContain("dominantStatus");
    expect(immersive).toContain("item.value > 0");
    expect(immersive).toContain("item.value > best.value");
    expect(immersive).toContain("if (length <= 0)");
    expect(immersive).toContain('t("SELECTED STATUS")');
    expect(immersive).toContain(
      "This status represents {percent}% of {total} bookings in the selected period."
    );
  });

  it("explains service ranking using its actual booking-volume denominator", () => {
    expect(immersive).toContain(
      "{count} bookings · {share}% of busiest-service booking volume"
    );
    expect(immersive).toContain('t("SELECTED SERVICE")');
    expect(immersive).not.toContain(
      ">\n            SELECTED SERVICE\n"
    );
  });

  it("provides source-backed client metric explanations", () => {
    for (const source of [
      "Share of active clients in this period who also had earlier activity.",
      "Clients created or first seen during the selected period.",
      "Clients with a completed appointment in the previous period but none in this period.",
      "Clients whose completed revenue is at least twice the current average ticket.",
    ]) {
      expect(immersive).toContain(source);
    }
    expect(immersive).toContain('t("SELECTED CLIENT SIGNAL")');
  });

  it("expands Heatmap responsively with a real 1-to-5 intensity legend", () => {
    expect(immersive).toContain("hottestCell");
    expect(immersive).toContain("cellWidth");
    expect(immersive).toContain("cellHeight");
    expect(immersive).toContain('t("Low")');
    expect(immersive).toContain('t("High")');
    expect(immersive).toContain(
      't("Demand intensity: {value}/5"'
    );
    expect(immersive).toContain('t("SELECTED DEMAND WINDOW")');
  });

  it("supports desktop hover and immediate touch selection", () => {
    const hoverCount = immersive.split("onHoverIn=").length - 1;
    const pressInCount = immersive.split("onPressIn=").length - 1;

    expect(hoverCount).toBeGreaterThanOrEqual(4);
    expect(pressInCount).toBeGreaterThanOrEqual(4);
    expect(immersive).toContain("setSelectedId(status.id)");
    expect(immersive).toContain("setSelectedId(service.id)");
    expect(immersive).toContain("setSelectedId(signal.id)");
    expect(immersive).toContain("setSelectedCell({");
  });

  it("reuses current period model data for all expanded panels", () => {
    expect(commandCenter).toContain("statuses={model.statuses}");
    expect(commandCenter).toContain("services={model.services}");
    expect(commandCenter).toContain("clientSignals={model.clientSignals}");
    expect(commandCenter).toContain("heatmap={model.heatmap}");
  });
});
