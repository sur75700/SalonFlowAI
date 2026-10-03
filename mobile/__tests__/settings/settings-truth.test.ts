import { SETTINGS_TRUTH_STATES, isUnavailableTruthState } from "../../lib/settings/truth";

describe("settings truth model", () => {
  it("contains the frozen eleven truth classes", () => {
    expect(SETTINGS_TRUTH_STATES).toEqual([
      "LIVE", "CACHED", "CONFIGURED", "DERIVED", "ESTIMATED", "NOT_CONNECTED",
      "NOT_AVAILABLE", "PLAN_RESTRICTED", "PERMISSION_RESTRICTED", "ERROR", "OFFLINE",
    ]);
  });

  it("distinguishes unavailable states from observed/configured states", () => {
    expect(isUnavailableTruthState("NOT_AVAILABLE")).toBe(true);
    expect(isUnavailableTruthState("ERROR")).toBe(true);
    expect(isUnavailableTruthState("LIVE")).toBe(false);
    expect(isUnavailableTruthState("CONFIGURED")).toBe(false);
  });
});
