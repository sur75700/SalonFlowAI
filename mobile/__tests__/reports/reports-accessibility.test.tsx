import fs from "node:fs";
import path from "node:path";

const mobileRoot = path.resolve(
  __dirname,
  "../..",
);

function source(
  relativePath: string,
): string {
  return fs.readFileSync(
    path.join(
      mobileRoot,
      relativePath,
    ),
    "utf8",
  );
}

describe(
  "reports accessibility contract",
  () => {
    test(
      "exposes meaningful filter semantics",
      () => {
        const filter = source(
          "components/reports/ReportFilterPanel.tsx",
        );

        expect(filter).toMatch(
          /accessibilityLabel=\{t\(\s*"reports\.commandCenter\.clients"/,
        );

        expect(filter).toMatch(
          /accessibilityLabel=\{t\(\s*"reports\.commandCenter\.services"/,
        );

        expect(
          (
            filter.match(
              /reports\.commandCenter\.dateHint/g,
            ) ?? []
          ).length,
        ).toBeGreaterThanOrEqual(2);

        expect(filter).toContain(
          'accessibilityRole="checkbox"',
        );

        expect(filter).toContain(
          'accessibilityRole="radio"',
        );

        expect(filter).toContain(
          "checked: active",
        );

        expect(filter).toContain(
          "disabled,",
        );
      },
    );

    test(
      "exposes catalog and export semantics",
      () => {
        const catalog = source(
          "components/reports/ReportCatalogSelector.tsx",
        );

        const exportSheet = source(
          "components/reports/ReportExportSheet.tsx",
        );

        expect(catalog).toContain(
          "accessibilityHint={description}",
        );

        expect(exportSheet).toContain(
          "accessibilityViewIsModal",
        );

        expect(exportSheet).toContain(
          "reports.commandCenter.formatDescriptions.${format}",
        );

        expect(exportSheet).toContain(
          "accessibilityState={{",
        );
      },
    );

    test(
      "exposes command actions with explicit accessible state",
      () => {
        const command = source(
          "components/reports/ReportsCommandCenterV2.tsx",
        );

        expect(command).toContain(
          '"reports.commandCenter.dismiss"',
        );

        expect(command).toContain(
          '"reports.commandCenter.loadPreview"',
        );

        expect(command).toContain(
          '"reports.commandCenter.openExport"',
        );

        expect(command).toContain(
          "busy: previewLoading",
        );
      },
    );
  },
);
