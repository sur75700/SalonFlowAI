import fs from "node:fs";
import path from "node:path";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

const dashboard = read(
  "components/dashboard-v2/cloud/DashboardV2Composition.tsx",
);
const calendar = read(
  "components/dashboard-v2/cloud/CalendarSnapshotV2.tsx",
);
const greeting = read(
  "components/dashboard-v2/cloud/ExecutiveGreetingV2.tsx",
);
const avatarHook = read("hooks/useProfileAvatar.ts");
const api = read("lib/api.ts");

describe("V19C avatar reliability + schedule polish", () => {
  it("keeps the smart day schedule and themes the event rows", () => {
    expect(dashboard).toContain("selectCalendarDisplayDay");
    expect(calendar).toContain("theme.palette.surfaceRaised");
    expect(calendar).toContain("theme.palette.borderStrong");
    expect(calendar).toContain("theme.palette.gold");
    expect(calendar).toContain("maxWidth: 320");
  });

  it("makes profile photo selection actionable and errors visible", () => {
    expect(dashboard).toContain("avatarError");
    expect(greeting).toContain("accountMenu.avatarError");
    expect(greeting).toContain("accountAvatarLargePressed");
    expect(greeting).toContain(
      'accessibilityLabel="Choose profile photo"',
    );
  });

  it("supports native permissions and browser blob multipart fallback", () => {
    expect(avatarHook).toContain(
      "requestMediaLibraryPermissionsAsync",
    );
    expect(api).toContain('asset.uri.startsWith("blob:")');
    expect(api).toContain("response.blob()");
  });
});
