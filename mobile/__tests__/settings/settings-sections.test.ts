import { SETTINGS_SECTIONS, isSettingsSectionId } from "../../lib/settings/sections";

describe("settings section registry", () => {
  it("has exactly sixteen unique stable destinations", () => {
    expect(SETTINGS_SECTIONS).toHaveLength(16);
    expect(new Set(SETTINGS_SECTIONS.map((item) => item.id)).size).toBe(16);
  });

  it("accepts only registered ids", () => {
    for (const section of SETTINGS_SECTIONS) expect(isSettingsSectionId(section.id)).toBe(true);
    expect(isSettingsSectionId("admin-set-plan")).toBe(false);
    expect(isSettingsSectionId("unknown")).toBe(false);
  });

  it("contains localized search aliases for high-value settings domains", () => {
    const billing = SETTINGS_SECTIONS.find((item) => item.id === "billing");
    const security = SETTINGS_SECTIONS.find((item) => item.id === "security");
    expect(billing?.searchAliases).toEqual(expect.arrayContaining(["բաժանորդագրություն", "подписка", "abonnement"]));
    expect(security?.searchAliases).toEqual(expect.arrayContaining(["գաղտնաբառ", "пароль", "mot de passe"]));
  });
});
