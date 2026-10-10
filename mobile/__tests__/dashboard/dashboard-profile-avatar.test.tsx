import fs from "node:fs";
import path from "node:path";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("V18 profile avatar contract", () => {
  it("exposes real avatar data on the current-user contract", () => {
    const api = read("lib/api.ts");
    expect(api).toContain("avatar_url?: string | null");
    expect(api).toContain(
      'avatar_source?: "custom" | "google" | "initials"'
    );
    expect(api).toContain("uploadProfileAvatar");
    expect(api).toContain("deleteProfileAvatar");
  });

  it("renders real avatar images in the Dashboard account UI", () => {
    const greeting = read(
      "components/dashboard-v2/cloud/ExecutiveGreetingV2.tsx"
    );
    const composition = read(
      "components/dashboard-v2/cloud/DashboardV2Composition.tsx"
    );
    expect(greeting).toContain("accountMenu.avatarUrl");
    expect(greeting).toContain("accountAvatarImage");
    expect(greeting).toContain("accountAvatarLargeImage");
    expect(composition).toContain("avatarUrl: avatarUrl || undefined");
    expect(composition).toContain("onChangeAvatar");
  });

  it("supports gallery selection in the profile-avatar hook", () => {
    const hook = read("hooks/useProfileAvatar.ts");
    expect(hook).toContain("launchImageLibraryAsync");
    expect(hook).toContain("allowsEditing: true");
    expect(hook).toContain("uploadProfileAvatar");
  });

  it("surfaces the profile photo inside Settings", () => {
    const settings = read(
      "components/settings/command/panels/CorePanels.tsx"
    );
    expect(settings).toContain("avatarUrl");
    expect(settings).toContain("choosePhoto");
    expect(settings).toContain("avatarImage");
  });
});
