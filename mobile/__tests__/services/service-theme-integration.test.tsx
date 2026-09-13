import fs from "fs";
import path from "path";

const mobileRoot = path.resolve(__dirname, "../..");

const read = (relativePath: string) =>
  fs.readFileSync(
    path.join(mobileRoot, relativePath),
    "utf8"
  );

describe("Services Royal Cosmos theme integration", () => {
  it("uses the shared Dashboard background authority", () => {
    const source = read(
      "components/service-v2/ServiceCenterCompositionV2.tsx"
    );

    expect(source).toContain(
      'import DashboardThemeBackground from "../dashboard-v2/cloud/DashboardThemeBackground";'
    );

    expect(source).toContain(
      "<DashboardThemeBackground style={styles.root}>"
    );

    expect(source).toContain(
      "</DashboardThemeBackground>"
    );

    expect(source).not.toContain(
      "RoyalCosmosBackground"
    );
  });

  it("does not introduce another theme provider", () => {
    const source = read(
      "components/service-v2/ServiceCenterCompositionV2.tsx"
    );

    expect(source).not.toContain(
      "<DashboardThemeProvider"
    );

    expect(source).not.toContain(
      "createContext("
    );
  });
});
