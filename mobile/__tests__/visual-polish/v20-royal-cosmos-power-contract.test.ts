import fs from "node:fs";
import path from "node:path";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

const retention = read(
  "components/dashboard-v2/cloud/ClientRetentionPulseV2.tsx",
);
const bookingBuilder = read(
  "components/booking-v2/buildBookingListItemV2.ts",
);
const bookingCard = read(
  "components/booking-v2/BookingCardV3.tsx",
);
const bookingSheet = read(
  "components/booking-v2/CreateBookingSheetV2.tsx",
);
const serviceIcons = read(
  "components/service-v2/ServiceIconPickerV2.tsx",
);
const analyticsPreview = read(
  "components/analytics-v2/AnalyticsInsightSheetV2.tsx",
);
const analyticsLive = read(
  "components/analytics-v2/AnalyticsLiveInsightSheetV2.tsx",
);
const reportExport = read(
  "components/reports/ReportExportSheet.tsx",
);
const settings = read(
  "components/settings/command/SettingsPrimitives.tsx",
);

describe("V20 Royal Cosmos final power contract", () => {
  it("makes client retention an immersive expandable intelligence surface", () => {
    expect(retention).toContain("setExpanded(true)");
    expect(retention).toContain("DashboardThemeBackground");
    expect(retention).toContain('name="expand-outline"');
    expect(retention).toContain("styles.modalPanel");
  });

  it("opens read-only booking details from the card while preserving explicit edit flow", () => {
    expect(bookingBuilder).toContain("onPress: options.onOpen");
    expect(bookingBuilder).toContain("onEdit: options.onEdit");
    expect(bookingBuilder).not.toContain("onPress: options.onEdit");
    expect(bookingCard).toContain('selectedThemeId === "royal_cosmos"');
    expect(bookingCard).toContain("royalCosmosSurfaceStyle");
    expect(bookingSheet).toContain("royalSurfaceStyle");
    expect(bookingSheet).toContain("royalRaisedStyle");
  });

  it("extends the persisted service icon studio to auto detailing businesses", () => {
    for (const key of [
      "car_wash",
      "detailing",
      "interior",
      "ceramic",
      "paint",
      "polish",
      "tint",
      "wheels",
      "engine",
      "protection",
    ]) {
      expect(serviceIcons).toContain(`key: "${key}"`);
    }
    expect(serviceIcons).toContain("SERVICE_ICON_LABELS");
    expect(serviceIcons).toContain("hy:");
    expect(serviceIcons).toContain("ru:");
    expect(serviceIcons).toContain("fr:");
  });

  it("brings the active cosmos background into analytics deep dives", () => {
    expect(analyticsPreview).toContain("DashboardThemeBackground");
    expect(analyticsLive).toContain("DashboardThemeBackground");
    expect(analyticsPreview).toContain('rgba(2,4,10,0.58)');
    expect(analyticsLive).toContain('rgba(2,4,10,0.58)');
  });

  it("gives report export formats active-theme glass and format-specific aura", () => {
    expect(reportExport).toContain("useDashboardTheme");
    expect(reportExport).toContain("DashboardThemeBackground");
    expect(reportExport).toContain("FORMAT_VISUALS");
    expect(reportExport).toContain("theme.palette.surfaceRaised");
  });

  it("keeps settings behavior while strengthening premium surface depth", () => {
    expect(settings).toContain("shadowColor: settingsAccent");
    expect(settings).toContain("shadowOpacity: 0.16");
    expect(settings).toContain("SettingsStatusBadge");
  });
});
