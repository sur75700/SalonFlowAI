import fs from "fs";
import path from "path";

const mobileRoot = path.resolve(__dirname, "../..");

const read = (relativePath: string) =>
  fs.readFileSync(
    path.join(mobileRoot, relativePath),
    "utf8"
  );

describe("Services final Royal Cosmos presentation", () => {
  it("uses premium cosmic tinted KPI glass", () => {
    const source = read(
      "components/service-v2/ServiceCenterCompositionV2.tsx"
    );

    expect(source).toContain(
      'backgroundColor: "rgba(91, 72, 196, 0.34)"'
    );
    expect(source).toContain(
      'backgroundColor: "rgba(10, 116, 88, 0.34)"'
    );
    expect(source).toContain(
      'backgroundColor: "rgba(146, 50, 86, 0.32)"'
    );
    expect(source).toContain(
      'backgroundColor: "rgba(166, 105, 0, 0.32)"'
    );

    expect(source).not.toContain(
      'backgroundColor: "#4B3FA0"'
    );
    expect(source).not.toContain(
      'backgroundColor: "#087A5B"'
    );
    expect(source).not.toContain(
      'backgroundColor: "#A43E5B"'
    );
    expect(source).not.toContain(
      'backgroundColor: "#B87500"'
    );
  });

  it("adds restrained cosmic depth to ServiceCard", () => {
    const source = read(
      "components/service-v2/ServiceCenterCompositionV2.tsx"
    );

    expect(source).toContain(
      "styles.cardCosmosSurface"
    );

    expect(source).toContain(
      "cardCosmosSurface: {"
    );

    expect(source).toContain(
      'backgroundColor: "rgba(10, 16, 45, 0.82)"'
    );

    expect(source).toContain(
      'borderColor: "rgba(145, 126, 255, 0.30)"'
    );
  });

  it("preserves real metric presentation", () => {
    const source = read(
      "components/service-v2/ServiceCenterCompositionV2.tsx"
    );

    expect(source).toContain("ServiceSparkline");
    expect(source).toContain("metrics?.popular");
    expect(source).toContain("metrics?.trend");
    expect(source).toContain("demandPercent");
  });

  it("preserves the existing premium create-service modal", () => {
    const source = read(
      "components/service-v2/ServiceCenterCompositionV2.tsx"
    );

    expect(source).toContain("sheetPurple");
    expect(source).toContain("sheetPurpleGlowTop");
    expect(source).toContain("sheetPurpleGlowBottom");
    expect(source).toContain("sheetScroll");
    expect(source).toContain("sheetActions");
    expect(source).toContain("maxWidth: 560");
  });
});
