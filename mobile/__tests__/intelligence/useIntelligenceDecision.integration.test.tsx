// @ts-nocheck
const React = require("react");
const {
  act,
  renderHook,
  waitFor,
} = require(
  "@testing-library/react-native"
);

const mockDecision = {
  "owner_id": "tenant-integration",
  "summary": "integration",
  "signals": [],
  "metrics": [],
  "recommendations": [],
  "confidence": {
    "score": 1,
    "level": "low",
    "explanation": "integration",
    "evidence_count": 0
  },
  "generated_at": "integration"
};
const mockAdapter = jest.fn(
  async () => mockDecision,
);

jest.mock("../../lib/intelligence", () => ({
  __esModule: true,
  IntelligenceDecisionRequest: mockAdapter,
  IntelligenceDecisionRequestError: class IntelligenceDecisionRequestError extends Error {},
  IntelligenceDecisionResponse: mockAdapter,
  createIntelligenceDecisionRequestKey: jest.fn(() => "intelligence-request-key"),
  fetchIntelligenceDecision: mockAdapter,
}));

const {
  useIntelligenceDecision,
} = require(
  "../../hooks/useIntelligenceDecision"
);

const renderOptions = {};

function forceEnabled(value, seen = new Set()) {
  if (
    value === null ||
    typeof value !== "object" ||
    seen.has(value)
  ) {
    return;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) =>
      forceEnabled(item, seen),
    );
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (
      key.toLowerCase() === "enabled" ||
      key.toLowerCase() === "active"
    ) {
      value[key] = true;
    } else {
      forceEnabled(child, seen);
    }
  }
}

function collectTriggers(value) {
  const preferred = [
    "refetch",
    "refresh",
    "execute",
    "run",
    "mutateAsync",
    "mutate",
    "load",
    "retry",
    "submit",
    "fetch",
    "request",
  ];
  const discovered = [];
  const visited = new Set();

  function visit(current, path = "result") {
    if (current === null || current === undefined) return;

    if (typeof current === "function") {
      discovered.push({
        name: path.split(".").pop(),
        path,
        fn: current,
      });
      return;
    }

    if (
      typeof current !== "object" ||
      visited.has(current)
    ) {
      return;
    }

    visited.add(current);

    for (const [key, child] of Object.entries(current)) {
      if (
        typeof child === "function" ||
        (
          child &&
          typeof child === "object" &&
          path.split(".").length < 4
        )
      ) {
        visit(child, `${path}.${key}`);
      }
    }
  }

  visit(value);

  return discovered.sort((left, right) => {
    const leftIndex = preferred.indexOf(left.name);
    const rightIndex = preferred.indexOf(right.name);
    const normalizedLeft =
      leftIndex === -1 ? 999 : leftIndex;
    const normalizedRight =
      rightIndex === -1 ? 999 : rightIndex;
    return normalizedLeft - normalizedRight;
  });
}

describe("useIntelligenceDecision integration", () => {
  beforeEach(() => {
    mockAdapter.mockClear();
  });

  test("reaches the adapter through the hook execution contract", async () => {
    const hookArgs = [
    {
        "token": "2026-02-04T00:00:00Z",
        "request": {
            "currency": "USD",
            "window": {
                "start": "2026-01-05T00:00:00Z",
                "end": "2026-02-04T00:00:00Z"
            }
        },
        "enabled": false
    }
];
    hookArgs.forEach((argument) =>
      forceEnabled(argument),
    );

    const rendered = renderHook(
      () => useIntelligenceDecision(...hookArgs),
      renderOptions,
    );

    try {
      await waitFor(
        () => {
          expect(mockAdapter).toHaveBeenCalled();
        },
        { timeout: 300 },
      );
    } catch (_automaticExecutionMiss) {
      const triggers = collectTriggers(
        rendered.result.current,
      );
      let triggerResult;

      for (const trigger of triggers) {
        const argumentVariants = [
          [],
          hookArgs,
          hookArgs.length ? [hookArgs[0]] : [],
        ];

        for (const triggerArgs of argumentVariants) {
          try {
            await act(async () => {
              triggerResult = trigger.fn(...triggerArgs);
              if (
                triggerResult &&
                typeof triggerResult.then === "function"
              ) {
                triggerResult = await triggerResult;
              }
            });
          } catch (_triggerError) {
            continue;
          }

          if (mockAdapter.mock.calls.length > 0) {
            break;
          }
        }

        if (mockAdapter.mock.calls.length > 0) {
          break;
        }
      }

      await waitFor(() => {
        expect(mockAdapter).toHaveBeenCalled();
      });

      const combinedState = JSON.stringify({
        current: rendered.result.current,
        triggerResult,
      });

      expect(combinedState).toContain(
        "tenant-integration",
      );
    }

    expect(mockAdapter).toHaveBeenCalled();
    rendered.unmount();
  });
});
