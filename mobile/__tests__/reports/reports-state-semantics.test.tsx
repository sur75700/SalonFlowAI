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
  "reports state accessibility semantics",
  () => {
    test(
      "announces report errors assertively",
      () => {
        const command = source(
          "components/reports/ReportsCommandCenterV2.tsx",
        );

        expect(
          (
            command.match(
              /accessibilityRole="alert"/g,
            ) ?? []
          ).length,
        ).toBeGreaterThanOrEqual(2);

        expect(
          (
            command.match(
              /accessibilityLiveRegion="assertive"/g,
            ) ?? []
          ).length,
        ).toBeGreaterThanOrEqual(2);
      },
    );

    test(
      "announces success without interrupting the user",
      () => {
        const command = source(
          "components/reports/ReportsCommandCenterV2.tsx",
        );

        expect(command).toMatch(
          /accessibilityLiveRegion="polite"[\s\S]{0,300}>\s*\{notice\}\s*<\/Text>/,
        );
      },
    );

    test(
      "announces preview loading and empty states",
      () => {
        const preview = source(
          "components/reports/ReportPreviewPanel.tsx",
        );

        expect(preview).toMatch(
          /if \(loading\)[\s\S]{0,300}accessibilityLiveRegion="polite"/,
        );

        expect(preview).toMatch(
          /accessibilityLiveRegion="polite"[\s\S]{0,150}style=\{styles\.emptyState\}/,
        );
      },
    );

    test(
      "exposes busy and disabled preview action state",
      () => {
        const command = source(
          "components/reports/ReportsCommandCenterV2.tsx",
        );

        expect(command).toContain(
          "disabled: previewLoading",
        );

        expect(command).toContain(
          "busy: previewLoading",
        );
      },
    );
  },
);
