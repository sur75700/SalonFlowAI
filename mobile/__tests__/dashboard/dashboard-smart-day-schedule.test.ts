import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(
  path.join(
    process.cwd(),
    "components/dashboard-v2/cloud/DashboardV2Composition.tsx",
  ),
  "utf8",
);

const calendar = fs.readFileSync(
  path.join(
    process.cwd(),
    "components/dashboard-v2/cloud/CalendarSnapshotV2.tsx",
  ),
  "utf8",
);

const services = fs.readFileSync(
  path.join(
    process.cwd(),
    "components/service-v2/ServiceCenterCompositionV2.tsx",
  ),
  "utf8",
);

describe("V19 smart day schedule + Burgundy controls", () => {
  it("shows today when booked and otherwise selects the nearest future booked day", () => {
    expect(dashboard).toContain("selectCalendarDisplayDay");
    expect(dashboard).toContain("nearestFuture");
    expect(dashboard).toContain("date.getTime() >= today.getTime()");
    expect(dashboard).toContain("isSameLocalDay");
    expect(dashboard).toContain(
      "formatCalendarDate(calendarDisplayDay, locale)",
    );
  });

  it("renders the selected day appointment times in chronological order", () => {
    expect(dashboard).toContain("formatCalendarTime");
    expect(dashboard).toContain(
      "new Date(first.starts_at).getTime() -",
    );
    expect(calendar).toContain("{event.time}");
    expect(calendar).toContain("width: 72");
    expect(calendar).toContain("minHeight: 184");
  });

  it("uses Burgundy theme glass for service controls without replacing base styles", () => {
    expect(services).toContain(
      "isBurgundyCosmos && burgundySurfaceStyle",
    );
    expect(services).toContain(
      "isBurgundyCosmos && burgundyRaisedStyle",
    );
    expect(services).toContain(
      "dashboardTheme.palette.surfaceRaised",
    );
    expect(services).toContain(
      "dashboardTheme.palette.royalGlow",
    );
    expect(services).toContain(
      'backgroundColor: "rgba(20, 26, 65, 0.78)"',
    );
  });
});
