import fs from "fs";
import path from "path";

const mobileRoot = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(
    path.join(mobileRoot, relativePath),
    "utf8"
  );
}

describe("Analytics shared Royal Cosmos theme integration", () => {
  it("uses the root Dashboard theme background on live status and command surfaces", () => {
    const realContainer = read(
      "components/analytics-v2/AnalyticsRealContainerV2.tsx"
    );

    const commandCenter = read(
      "components/analytics-v2/AnalyticsCommandCenterV2.tsx"
    );

    const rootLayout = read("app/_layout.tsx");

    expect(rootLayout).toContain(
      "DashboardThemeProvider"
    );

    expect(realContainer).toContain(
      "DashboardThemeBackground"
    );

    expect(commandCenter).toContain(
      "DashboardThemeBackground"
    );

    expect(realContainer).not.toContain(
      "RoyalCosmosBackground"
    );

    expect(commandCenter).not.toContain(
      "RoyalCosmosBackground"
    );
  });
});
