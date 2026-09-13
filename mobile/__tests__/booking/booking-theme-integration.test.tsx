import fs from "fs";
import path from "path";

function source(relative: string): string {
  return fs.readFileSync(
    path.resolve(__dirname, "../..", relative),
    "utf8",
  );
}

describe("Booking shared Royal Cosmos authority", () => {
  test("theme provider is owned by the app shell", () => {
    const root = source("app/_layout.tsx");
    const dashboard = source(
      "components/dashboard-v2/cloud/DashboardV2Composition.tsx",
    );

    expect(root).toContain("DashboardThemeProvider");
    expect(root).toContain("<DashboardThemeProvider>");
    expect(dashboard).not.toContain("DashboardThemeProvider");
  });

  test("Booking consumes the Dashboard theme background", () => {
    const booking = source(
      "components/booking-v2/BookingCenterCompositionV2.tsx",
    );

    expect(booking).toContain(
      "DashboardThemeBackground",
    );
    expect(booking).not.toContain(
      "RoyalCosmosBackground",
    );
  });
});
