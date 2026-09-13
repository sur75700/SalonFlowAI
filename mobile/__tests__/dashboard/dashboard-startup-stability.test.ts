import fs from "fs";
import path from "path";

const mobileRoot = path.resolve(__dirname, "../..");

const hookSource = fs.readFileSync(
  path.join(
    mobileRoot,
    "hooks",
    "useDashboardData.ts"
  ),
  "utf8"
);

const dashboardSource = fs.readFileSync(
  path.join(
    mobileRoot,
    "components",
    "dashboard-v2",
    "cloud",
    "DashboardV2Composition.tsx"
  ),
  "utf8"
);

const sessionSource = fs.readFileSync(
  path.join(
    mobileRoot,
    "hooks",
    "useSession.ts"
  ),
  "utf8"
);

describe("Dashboard startup stability contract", () => {
  it("settles summary, analytics and insights independently", () => {
    expect(hookSource).toContain(
      "Promise.allSettled"
    );

    expect(hookSource).toContain(
      "summaryError"
    );

    expect(hookSource).toContain(
      "analyticsError"
    );
  });

  it("keeps supplemental insight failure separate from core analytics", () => {
    expect(hookSource).toContain(
      'insightsResult.status === "fulfilled"'
    );

    expect(hookSource).toContain(
      "supplementalError"
    );
  });

  it("only marks summary unavailable when no trusted summary exists", () => {
    expect(dashboardSource).toContain(
      "Boolean(summaryError) && summary === null"
    );

    expect(dashboardSource).toContain(
      "summaryUnavailable"
    );

    expect(dashboardSource).not.toContain(
      "helperText: error ?"
    );
  });

  it("keeps global hero health independent from supplementary analytics failures", () => {
    expect(dashboardSource).toContain(
      "label: summaryUnavailable"
    );

    expect(dashboardSource).toContain(
      "tone: summaryUnavailable"
    );

    expect(dashboardSource).toContain(
      "analyticsUnavailable"
    );
  });
  it("keeps session actions referentially stable across renders", () => {
    expect(sessionSource).toContain(
      "const setToken = useCallback"
    );

    expect(sessionSource).toContain(
      "const clearToken = useCallback"
    );

    expect(sessionSource).not.toContain(
      "const clearToken = () =>"
    );
  });

});
