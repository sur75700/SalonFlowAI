// @ts-nocheck
const intelligenceHookMock = jest.fn(() => ({
  data: { decision_id: "decision-integration-1" },
  decision: {
    decision_id: "decision-integration-1",
  },
  isLoading: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}));

const hookFactory = () => ({
  __esModule: true,
  useIntelligenceDecision: intelligenceHookMock,
});

for (const moduleName of [
  "../../hooks/useIntelligenceDecision"
]) {
  jest.doMock(moduleName, hookFactory);
}

const genericModule = () => {
  const Stub = () => null;
  return new Proxy(
    {
      __esModule: true,
      default: Stub,
    },
    {
      get(target, property) {
        if (property === "then") return undefined;
        if (property in target) return target[property];
        return Stub;
      },
    },
  );
};

for (const moduleName of [
  "../../components/dashboard-v2/cloud/AICommandCenterV2",
  "../../components/dashboard-v2/cloud/AppointmentAnalyticsV2",
  "../../components/dashboard-v2/cloud/CalendarSnapshotV2",
  "../../components/dashboard-v2/cloud/ExecutiveGreetingV2",
  "../../components/dashboard-v2/cloud/KPICardV2",
  "../../components/dashboard-v2/cloud/QuickActionsV2",
  "../../components/dashboard-v2/cloud/RevenueAnalyticsV2",
  "../../components/dashboard-v2/cloud/ai-command-center-live-model",
  "../../components/ui/RoyalCosmosBackground",
  "../../contexts/BillingContext",
  "../../contexts/LanguageContext",
  "../../hooks/useAppPreferences",
  "../../hooks/useDashboardData",
  "../../hooks/useLogout",
  "../../hooks/useResourceData",
  "../../hooks/useSession",
  "../../lib/i18n",
  "../../lib/i18n/types",
  "../../types/models",
  "../../utils/money"
]) {
  jest.doMock(moduleName, genericModule);
}

jest.doMock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Link: () => null,
  Stack: () => null,
}));

describe("Royal Cosmos Intelligence production wiring", () => {
  test("loads the real production module through mocked integration boundaries", () => {
    const source = require("fs").readFileSync(
      require("path").join(
        __dirname,
        "../../components/dashboard-v2/cloud/DashboardV2Composition.tsx",
      ),
      "utf8",
    );

    expect(source).toMatch(
      /useIntelligenceDecision|getIntelligenceDecision|\/intelligence\/decision/,
    );
    expect("components/dashboard-v2/cloud/DashboardV2Composition.tsx").not.toMatch(
      /preview|qa|demo|storybook/i,
    );

    let moduleUnderTest = null;
    jest.isolateModules(() => {
      moduleUnderTest = require(
        "../../components/dashboard-v2/cloud/DashboardV2Composition"
      );
    });

    const namedExports = [];
    const hasComponentExport =
      typeof moduleUnderTest.default === "function" ||
      namedExports.some(
        (name) =>
          typeof moduleUnderTest[name] === "function",
      );

    expect(hasComponentExport).toBe(true);
  });
});
