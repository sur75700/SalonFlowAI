import { selectNextBestActions } from "../../lib/dashboard/nextBestAction";
import type { IntelligenceDecisionResponse } from "../../types/intelligence";

function decision(
  recommendationCount = 1,
  overrides: Partial<IntelligenceDecisionResponse> = {},
): IntelligenceDecisionResponse {
  const recommendations = Array.from({ length: recommendationCount }, (_, index) => ({
    code: `rec_${index + 1}`,
    title: `Action ${index + 1}`,
    description: `Description ${index + 1}`,
    priority: recommendationCount - index,
    expected_impacts: [
      {
        metric: index % 3 === 0 ? "revenue" : index % 3 === 1 ? "cancellation_risk" : "capacity_utilization",
        estimated_change: 10 + index,
        unit: "%",
        timeframe_days: 14,
      },
    ],
  }));
  const signals = recommendations.map((recommendation) => ({
    code: recommendation.code,
    title: `${recommendation.title} signal`,
    description: "Authoritative signal",
    severity: "opportunity" as const,
    evidence: [
      {
        source: "provider_family",
        description: `Evidence for ${recommendation.code}`,
        value: indexSafeNumber(recommendation.priority),
        observed_at: "2026-09-06T18:00:00+00:00",
      },
    ],
  }));
  return {
    owner_id: "owner-1",
    summary: "Decision summary",
    signals,
    metrics: [],
    recommendations,
    confidence: {
      score: 0.91,
      level: "high",
      explanation: "Strong evidence",
      evidence_count: signals.length,
    },
    generated_at: "2026-09-06T18:01:00+00:00",
    ...overrides,
  };
}

function indexSafeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

describe("selectNextBestActions", () => {
  it("returns zero actions without a decision", () => {
    expect(selectNextBestActions(null)).toEqual([]);
  });

  it("returns one evidence-backed action and propagates evidence, impact and confidence", () => {
    const source = decision(1);
    const actions = selectNextBestActions(source);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      code: "rec_1",
      category: "MAKE_MONEY",
      destination: "/(tabs)/analytics",
      confidence: source.confidence,
    });
    expect(actions[0].evidence).toEqual(source.signals[0].evidence);
    expect(actions[0].expectedImpacts).toEqual(source.recommendations[0].expected_impacts);
  });

  it("orders deterministically by priority then code and caps output at three", () => {
    const source = decision(5);
    const first = selectNextBestActions(source);
    const second = selectNextBestActions(source);
    expect(first).toHaveLength(3);
    expect(first.map((item) => item.priority)).toEqual([1, 2, 3]);
    expect(second).toEqual(first);
  });

  it("maps supported impact semantics into the three frozen categories", () => {
    const source = decision(3);
    const actions = selectNextBestActions(source);
    expect(actions.map((item) => item.category).sort()).toEqual(
      ["MAKE_MONEY", "PREVENT_LOSS", "IMPROVE_OPERATIONS"].sort(),
    );
  });

  it("fails closed when recommendation evidence cannot be joined authoritatively", () => {
    const source = decision(1, { signals: [] });
    expect(selectNextBestActions(source)).toEqual([]);
  });

  it("fails closed for unsupported impact metrics", () => {
    const source = decision(1);
    const unsupported: IntelligenceDecisionResponse = {
      ...source,
      recommendations: [
        {
          ...source.recommendations[0],
          expected_impacts: [
            { metric: "mystery_metric", estimated_change: 1, unit: "%", timeframe_days: 7 },
          ],
        },
      ],
    };
    expect(selectNextBestActions(unsupported)).toEqual([]);
  });

  it("returns no actions when advanced_ai is not entitled", () => {
    expect(selectNextBestActions(decision(2), { entitled: false })).toEqual([]);
  });

  it("does not mutate the Intelligence response or execute any action", () => {
    const source = decision(2);
    const before = JSON.stringify(source);
    const actions = selectNextBestActions(source);
    expect(JSON.stringify(source)).toBe(before);
    expect(actions.every((action) => typeof action.destination === "string")).toBe(true);
  });
});
