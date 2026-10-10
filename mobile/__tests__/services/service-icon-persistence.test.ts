import fs from "node:fs";
import path from "node:path";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("V18 service icon persistence", () => {
  it("adds icon_key to the service model and mutations", () => {
    expect(read("types/models.ts")).toContain(
      "icon_key?: string | null"
    );
    expect(read("hooks/useMutations.ts")).toContain(
      "icon_key?: string | null"
    );
  });

  it("persists the selected service icon through create and edit", () => {
    const container = read(
      "components/service-v2/ServiceCenterContainerV2.tsx"
    );
    expect(container).toContain('icon_key: ""');
    expect(container).toContain(
      "icon_key: createValues.icon_key || null"
    );
    expect(container).toContain(
      "icon_key: editValues.icon_key || null"
    );
  });

  it("renders the premium icon picker and explicit icon override", () => {
    const composition = read(
      "components/service-v2/ServiceCenterCompositionV2.tsx"
    );
    const picker = read(
      "components/service-v2/ServiceIconPickerV2.tsx"
    );
    expect(composition).toContain("<ServiceIconPickerV2");
    expect(composition).toContain(
      "resolveServiceIconName(iconKey)"
    );
    expect(picker).toContain("SERVICE_ICON_OPTIONS");
    expect(picker).toContain('"haircut"');
    expect(picker).toContain('"makeup"');
    expect(picker).toContain('"bridal"');
  });
});
