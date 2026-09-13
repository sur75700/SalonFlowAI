import {
  buildCapacitySnapshot,
  buildClientRetentionPulse,
  buildFinalDashboardEnrichment,
  buildHeroAIConfidence,
} from "../../lib/dashboard/finalEnrichment";
import type { IntelligenceDecisionResponse } from "../../types/intelligence";
import type { AnalyticsData } from "../../types/models";
import { t } from "../../lib/i18n";

function decision(
  overrides: Partial<IntelligenceDecisionResponse> = {},
): IntelligenceDecisionResponse {
  return {
    owner_id: "owner-1",
    summary: "Decision summary",
    signals: [],
    metrics: [
      {
        key: "capacity.utilization_percent",
        label: "Capacity utilization",
        value: 112.4,
        unit: "percent",
      },
      {
        key: "capacity.available_slots",
        label: "Available slots",
        value: 7,
        unit: "slots",
      },
      {
        key: "capacity.idle_hours",
        label: "Idle capacity",
        value: 5.5,
        unit: "hours",
      },
    ],
    recommendations: [],
    confidence: {
      score: 0.94,
      level: "high",
      explanation: "Strong evidence",
      evidence_count: 3,
    },
    generated_at: "2026-09-08T09:00:00+00:00",
    ...overrides,
  };
}

function analytics(): AnalyticsData {
  return {
    currency: "AMD",
    totals: {
      total_revenue_snapshot: 0,
      completed_revenue: 0,
      scheduled_pipeline: 0,
      cancelled_value: 0,
      avg_completed_booking_value: 0,
    },
    top_services: [],
    revenue_last_7_days: [],
    client_summary: {
      total_clients: 20,
      new_clients: 8,
      returning_clients: 12,
      vip_clients: 3,
      inactive_clients: 5,
      retention_score: 60,
    },
    client_risk: {
      at_risk_clients: 6,
      high_risk_clients: 4,
      lost_clients: 2,
      reactivation_opportunity: 999999,
      risk_score: 40,
    },
  };
}

describe("dashboard final enrichment projection", () => {
  it("converts authoritative Intelligence confidence from 0-1 to 0-100 exactly once", () => {
    expect(buildHeroAIConfidence("success", decision())).toEqual({
      state: "available",
      valuePercent: 94,
      level: "high",
    });

    expect(
      buildHeroAIConfidence(
        "success",
        decision({
          confidence: {
            score: 0,
            level: "low",
            explanation: "Measured zero",
            evidence_count: 1,
          },
        }),
      ),
    ).toEqual({
      state: "available",
      valuePercent: 0,
      level: "low",
    });
  });

  it("fails closed for malformed or out-of-range confidence instead of fabricating zero", () => {
    expect(
      buildHeroAIConfidence(
        "success",
        decision({
          confidence: {
            score: 1.01,
            level: "high",
            explanation: "bad",
            evidence_count: 1,
          },
        }),
      ),
    ).toEqual({
      state: "unavailable",
      valuePercent: null,
      level: null,
    });
  });

  it("suppresses retained Intelligence data when entitlement is denied", () => {
    expect(buildHeroAIConfidence("not_entitled", decision()).valuePercent).toBeNull();
    expect(buildCapacitySnapshot("not_entitled", decision(), "Last 7 Days").state).toBe(
      "not_entitled",
    );
  });

  it("reads the three exact capacity metrics with exact units and preserves over-capacity", () => {
    expect(buildCapacitySnapshot("success", decision(), "Last 7 Days")).toEqual({
      state: "available",
      utilizationPercent: 112.4,
      availableSlots: 7,
      idleHours: 5.5,
      windowLabel: "Last 7 Days",
    });
  });

  it("fails closed when the capacity metric collection is malformed at runtime", () => {
    const malformed = {
      ...decision(),
      metrics: null,
    } as unknown as IntelligenceDecisionResponse;

    expect(
      buildCapacitySnapshot(
        "success",
        malformed,
        "Last 7 Days",
      ).state,
    ).toBe("unavailable");
  });

  it("rejects duplicate, missing or wrong-unit capacity facts as unavailable", () => {
    const source = decision();
    const duplicate = decision({
      metrics: [...source.metrics, source.metrics[0]],
    });
    expect(buildCapacitySnapshot("success", duplicate, "Last 7 Days").state).toBe(
      "unavailable",
    );

    const wrongUnit = decision({
      metrics: source.metrics.map((metric) =>
        metric.key === "capacity.available_slots"
          ? { ...metric, unit: "bookings" }
          : metric,
      ),
    });
    expect(buildCapacitySnapshot("success", wrongUnit, "Last 7 Days").state).toBe(
      "unavailable",
    );
  });

  it("projects backend-defined client classifications without summing overlapping risk groups", () => {
    const result = buildClientRetentionPulse(analytics(), {
      loading: false,
      refreshing: false,
      error: false,
      scopeSafe: true,
    });

    expect(result).toMatchObject({
      state: "available",
      totalClients: 20,
      singleAppointmentClients: 8,
      repeatHistoryClients: 12,
      inactiveClients: 5,
      returningRatioPercent: 60,
      atRiskClients: 6,
      highRiskClients: 4,
      lostClients: 2,
      riskScore: 40,
    });
    expect(result.atRiskClients).toBe(6);
    expect(result.highRiskClients).toBe(4);
    expect(result.lostClients).toBe(2);
  });

  it("fails closed for impossible client-count relationships", () => {
    const malformed = analytics();
    malformed.client_summary = {
      ...malformed.client_summary!,
      total_clients: 10,
      new_clients: 8,
      returning_clients: 7,
    };

    expect(
      buildClientRetentionPulse(malformed, {
        loading: false,
        refreshing: false,
        error: false,
        scopeSafe: true,
      }).state,
    ).toBe("unavailable");
  });

  it("fails closed when either client summary or client risk is missing", () => {
    const partial: AnalyticsData = {
      ...analytics(),
      client_risk: undefined,
    };

    const result = buildClientRetentionPulse(partial, {
      loading: false,
      refreshing: false,
      error: false,
      scopeSafe: true,
    });

    expect(result.state).toBe("unavailable");
    expect(result.returningRatioPercent).toBeNull();
  });

  it("suppresses client analytics while token scope ownership is unresolved", () => {
    const result = buildClientRetentionPulse(analytics(), {
      loading: false,
      refreshing: false,
      error: false,
      scopeSafe: false,
    });

    expect(result.state).toBe("loading");
    expect(result.totalClients).toBeNull();
  });

  it("keeps a valid zero-client dataset distinct from unavailable data", () => {
    const source = analytics();
    source.client_summary = {
      total_clients: 0,
      new_clients: 0,
      returning_clients: 0,
      vip_clients: 0,
      inactive_clients: 0,
      retention_score: 0,
    };
    source.client_risk = {
      at_risk_clients: 0,
      high_risk_clients: 0,
      lost_clients: 0,
      reactivation_opportunity: 0,
      risk_score: 0,
    };

    expect(
      buildClientRetentionPulse(source, {
        loading: false,
        refreshing: false,
        error: false,
        scopeSafe: true,
      }).state,
    ).toBe("empty");
  });

  it("has HY/RU/FR parity for every new Dashboard enrichment label", () => {
    const keys = [
      "AI Confidence Live",
      "AI Confidence Refreshing",
      "AI Confidence Loading",
      "AI Confidence Unavailable",
      "AI Confidence Locked",
      "Capacity Intelligence",
      "Capacity Utilization",
      "Capacity Available Slots",
      "Capacity Idle Hours",
      "Capacity Analysis Window",
      "Capacity Loading",
      "Capacity Refreshing",
      "Capacity Unavailable",
      "Capacity Locked",
      "Client Retention Pulse",
      "Client Retention Pulse Subtitle",
      "Client Pulse Live",
      "Client Returning Ratio",
      "Client Risk Index",
      "Client Single Appointment",
      "Client Repeat History",
      "Client Inactive",
      "Client At Risk 30",
      "Client High Risk 60",
      "Client Lost 90",
      "Client Risk Groups Overlap",
      "Client Pulse Loading",
      "Client Pulse Refreshing",
      "Client Pulse Unavailable",
      "Client Pulse Empty",
    ] as const;

    for (const locale of ["hy", "ru", "fr"] as const) {
      for (const key of keys) {
        expect(t(key, locale)).not.toBe(key);
      }
    }
  });

  it("is deterministic and does not mutate Intelligence or analytics inputs", () => {
    const intelligence = decision();
    const analyticsData = analytics();
    const beforeIntelligence = JSON.stringify(intelligence);
    const beforeAnalytics = JSON.stringify(analyticsData);

    const input = {
      intelligenceStatus: "success" as const,
      intelligenceData: intelligence,
      intelligenceWindowLabel: "Last 7 Days",
      analytics: analyticsData,
      analyticsLoading: false,
      analyticsRefreshing: false,
      analyticsError: false,
      analyticsScopeSafe: true,
    };

    expect(buildFinalDashboardEnrichment(input)).toEqual(
      buildFinalDashboardEnrichment(input),
    );
    expect(JSON.stringify(intelligence)).toBe(beforeIntelligence);
    expect(JSON.stringify(analyticsData)).toBe(beforeAnalytics);
  });
});
