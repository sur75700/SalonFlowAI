import fs from "fs";
import path from "path";
import { analyticsV2SurfaceT } from "../../components/analytics-v2/analytics-v2-i18n";

const mobileRoot = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(
    path.join(mobileRoot, relativePath),
    "utf8"
  );
}

describe("Analytics professional cross-platform export", () => {
  const source = read(
    "components/analytics-v2/AnalyticsExportSheetV2.tsx"
  );

  it("uses Blob download on web and existing Expo filesystem/share transport on native", () => {
    expect(source).toContain('from "expo-file-system/legacy"');
    expect(source).toContain('from "expo-sharing"');
    expect(source).toContain('Platform.OS === "web"');
    expect(source).toContain("new Blob");
    expect(source).toContain("URL.createObjectURL");
    expect(source).toContain("FileSystem.writeAsStringAsync");
    expect(source).toContain("Sharing.isAvailableAsync");
    expect(source).toContain("Sharing.shareAsync");
    expect(source).not.toContain("function downloadFile(");
    expect(source).not.toContain("window.setTimeout(");
  });

  it("builds Excel-friendly CSV with BOM, CRLF, quoting and formula-injection defense", () => {
    expect(source).toContain("CSV_FORMULA_PREFIX_PATTERN");
    expect(source).toContain("CSV_NUMERIC_TEXT_PATTERN");
    expect(source).toContain('return "\\uFEFF" + rows');
    expect(source).toContain('.join("\\r\\n")');
    expect(source).toContain("protectedText.replaceAll");
    expect(source).toContain("\\uFF1D");
    expect(source).toContain("\\uFF20");
  });

  it("creates professional portable filenames and truthful native outcomes", () => {
    expect(source).toContain("sanitizeFilenamePart");
    expect(source).toContain('.normalize("NFKC")');
    expect(source).toContain("buildProfessionalFilename");
    expect(source).toContain("SalonFlowAI-Analytics-${mode}-${period}-");
    expect(source).toContain("generatedAtIso.slice(0, 10)");
    expect(source).toContain("SalonFlowAI Analytics · ${periodLabel} ·");
    expect(source).toContain("native-share-unavailable");
    expect(source).toContain(
      "Export ready in the system share sheet."
    );
    expect(source).toContain(
      "Export prepared, but sharing is unavailable on this device."
    );
  });

  it("honors Revenue and Operations selections in the print-ready report", () => {
    expect(source).toContain("const revenueRows = sections.revenue");
    expect(source).toContain("const operationRows = sections.operations");
    expect(source).toContain('t("Current Period Revenue")');
    expect(source).toContain('t("Previous Period Revenue")');
    expect(source).toContain('t("Booking Status")');
  });

  it("embeds the selected Royal Cosmos background into the PDF-ready report", () => {
    expect(source).toContain('from "../../hooks/useDashboardTheme"');
    expect(source).toContain("selectedThemeId");
    expect(source).toContain('royal-cosmos.jpg');
    expect(source).toContain('royal-gold-cosmos.jpg');
    expect(source).toContain("resolveExportBackgroundDataUrl");
    expect(source).toContain('class="cosmos-background"');
    expect(source).toContain('src="${backgroundDataUrl}"');
    expect(source).toContain("print-color-adjust: exact");
    expect(source).toContain("FileSystem.EncodingType.Base64");
  });

  it("exports metadata with the same selected model snapshot", () => {
    expect(source).toContain('["SalonFlowAI Analytics"]');
    expect(source).toContain('t("Selected period")');
    expect(source).toContain('t("Data mode")');
    expect(source).toContain('t("Generated at")');
    expect(source).toContain("generatedAtIso");
    expect(source).toContain(
      "{count} bookings · {share}% vs the most-booked service"
    );
  });
});

describe("Analytics zero-defect surface localization", () => {
  const keys = [
    "Current Period Revenue",
    "Previous Period Revenue",
    "Previous interval",
    "Change vs previous interval",
    "Change % vs previous interval",
    "Share of current period",
    "Interval",
    "SELECTED STATUS",
    "SELECTED SERVICE",
    "SELECTED CLIENT SIGNAL",
    "SELECTED DEMAND WINDOW",
    "Low",
    "High",
    "Export ready in the system share sheet.",
    "Export prepared, but sharing is unavailable on this device.",
    "Export could not be prepared.",
  ];

  it("has non-English translations for every new visible key", () => {
    for (const key of keys) {
      for (const locale of ["hy", "ru", "fr"]) {
        const translated = analyticsV2SurfaceT(locale, key);
        expect(translated).toBeTruthy();
        expect(translated).not.toBe(key);
      }
    }
  });

  it("preserves placeholder parity across locales", () => {
    const cases: Array<{
      key: string;
      params: Record<string, string | number>;
    }> = [
      {
        key: "This status represents {percent}% of {total} bookings in the selected period.",
        params: { percent: 98, total: 42 },
      },
      {
        key: "{count} bookings · {share}% of busiest-service booking volume",
        params: { count: 12, share: 86 },
      },
      {
        key: "Demand intensity: {value}/5",
        params: { value: 4 },
      },
    ];

    for (const testCase of cases) {
      for (const locale of ["en", "hy", "ru", "fr"]) {
        const rendered = analyticsV2SurfaceT(
          locale,
          testCase.key,
          testCase.params
        );
        expect(rendered).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it("localizes every weekday", () => {
    for (const day of [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]) {
      for (const locale of ["hy", "ru", "fr"]) {
        expect(analyticsV2SurfaceT(locale, day)).not.toBe(day);
      }
    }
  });
});
