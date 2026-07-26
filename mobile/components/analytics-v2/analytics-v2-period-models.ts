import type {
  AnalyticsPeriodKey,
  AnalyticsPreviewModel,
} from "./analytics-v2-types";

function patchById<T extends { id: string }>(
  items: readonly T[],
  overrides: Record<string, Partial<T>>
): T[] {
  return items.map(
    (item) =>
      ({
        ...item,
        ...(overrides[item.id] ?? {}),
      }) as T
  );
}

/**
 * PRESENTATION-ONLY PERIOD ENGINE.
 *
 * These deterministic models exist only to demonstrate
 * period interaction and visual responsiveness.
 *
 * They are not real salon analytics.
 */
export function getAnalyticsPreviewModelForPeriod(
  base: AnalyticsPreviewModel,
  period: AnalyticsPeriodKey
): AnalyticsPreviewModel {
  if (period === "30d") {
    return {
      ...base,
      previewLabel: "Preview-only · 30D window",
      lastUpdated: "30-day preview window",
    };
  }

  if (period === "7d") {
    return {
      ...base,

      previewLabel: "Preview-only · 7D window",
      lastUpdated: "7-day preview window",

      kpis: patchById(base.kpis, {
        revenue: {
          value: "AMD 612K",
          delta: "+6.8%",
          context: "vs previous 7 days",
          trend: [42, 47, 51, 49, 56, 61, 68],
        },
        bookings: {
          value: "63",
          delta: "+4.9%",
          context: "3 additional bookings",
          trend: [38, 44, 41, 49, 52, 59, 63],
        },
        clients: {
          value: "65%",
          delta: "+2.4%",
          context: "weekly repeat behavior",
          trend: [54, 56, 57, 59, 61, 63, 65],
        },
        ticket: {
          value: "AMD 14.2K",
          delta: "+1.2%",
          context: "completed appointments",
          trend: [47, 48, 46, 49, 50, 51, 52],
        },
        cancellation: {
          value: "8.1%",
          delta: "-0.6%",
          context: "slightly improved this week",
          trend: [66, 63, 61, 58, 55, 51, 48],
        },
        growth: {
          value: "+5.4%",
          delta: "Stable",
          context: "short-term performance signal",
          trend: [39, 43, 46, 49, 52, 56, 61],
        },
      }),

      revenueSeries: [
        { label: "Mon", current: 72, previous: 68 },
        { label: "Tue", current: 84, previous: 76 },
        { label: "Wed", current: 79, previous: 74 },
        { label: "Thu", current: 96, previous: 82 },
        { label: "Fri", current: 104, previous: 91 },
        { label: "Sat", current: 121, previous: 103 },
        { label: "Sun", current: 116, previous: 109 },
      ],

      services: patchById(base.services, {
        s1: {
          revenue: "AMD 168K",
          bookings: 12,
          share: 92,
        },
        s2: {
          revenue: "AMD 121K",
          bookings: 9,
          share: 74,
        },
        s3: {
          revenue: "AMD 92K",
          bookings: 8,
          share: 61,
        },
        s4: {
          revenue: "AMD 74K",
          bookings: 7,
          share: 49,
        },
        s5: {
          revenue: "AMD 53K",
          bookings: 6,
          share: 37,
        },
      }),

      statuses: patchById(base.statuses, {
        completed: { value: 42 },
        scheduled: { value: 13 },
        cancelled: { value: 5 },
        other: { value: 3 },
      }),

      clientSignals: patchById(base.clientSignals, {
        retention: {
          value: "71%",
          hint: "Healthy weekly retention",
        },
        new: {
          value: "9",
          hint: "New clients this week",
        },
        "at-risk": {
          value: "3",
          hint: "Immediate review candidates",
        },
        "high-value": {
          value: "8",
          hint: "Strong weekly contribution",
        },
      }),

      actions: patchById(base.actions, {
        a1: {
          impact: "Potential recovery: AMD 168K",
          confidence: 84,
        },
        a2: {
          impact: "Growth opportunity: AMD 84K",
          confidence: 82,
        },
        a3: {
          impact: "Protected value: AMD 49K",
          confidence: 78,
        },
      }),

      opportunities: patchById(base.opportunities, {
        o1: { value: "AMD 168K" },
        o2: { value: "AMD 84K" },
        o3: { value: "AMD 49K" },
        o4: { value: "AMD 27K" },
      }),

      aiScore: 74,
      aiStatus: "Stable",

      primarySignal:
        "Weekly revenue is improving, while short-term cancellation friction remains the clearest operational concern.",

      nextAction:
        "Review this week’s at-risk appointments and clients.",

      expectedImpact:
        "Preview impact: AMD 168K",

      heatmap: [
        [1, 2, 2, 3, 3, 2],
        [2, 3, 3, 4, 3, 2],
        [2, 3, 4, 4, 3, 2],
        [3, 4, 5, 4, 4, 3],
        [4, 5, 5, 5, 4, 3],
        [3, 4, 5, 4, 3, 2],
        [1, 2, 2, 2, 1, 1],
      ],
    };
  }

  return {
    ...base,

    previewLabel: "Preview-only · 90D window",
    lastUpdated: "90-day preview window",

    kpis: patchById(base.kpis, {
      revenue: {
        value: "AMD 6.92M",
        delta: "+24.7%",
        context: "vs previous 90 days",
        trend: [27, 32, 38, 45, 51, 59, 67, 78],
      },
      bookings: {
        value: "731",
        delta: "+19.3%",
        context: "118 additional bookings",
        trend: [29, 35, 42, 47, 55, 62, 70, 81],
      },
      clients: {
        value: "72%",
        delta: "+7.8%",
        context: "strong long-term retention",
        trend: [48, 52, 55, 59, 63, 67, 70, 72],
      },
      ticket: {
        value: "AMD 15.3K",
        delta: "+5.6%",
        context: "completed appointments",
        trend: [41, 44, 46, 48, 51, 54, 57, 61],
      },
      cancellation: {
        value: "6.2%",
        delta: "-2.9%",
        context: "strong quarterly improvement",
        trend: [72, 67, 63, 58, 52, 47, 42, 37],
      },
      growth: {
        value: "+22.8%",
        delta: "Excellent",
        context: "long-term performance signal",
        trend: [25, 31, 38, 46, 55, 64, 73, 84],
      },
    }),

    revenueSeries: [
      { label: "W1", current: 442, previous: 371 },
      { label: "W2", current: 518, previous: 409 },
      { label: "W3", current: 547, previous: 438 },
      { label: "W4", current: 603, previous: 482 },
      { label: "W5", current: 648, previous: 526 },
      { label: "W6", current: 694, previous: 552 },
      { label: "W7", current: 731, previous: 589 },
      { label: "W8", current: 776, previous: 621 },
      { label: "W9", current: 823, previous: 654 },
      { label: "W10", current: 881, previous: 702 },
    ],

    services: patchById(base.services, {
      s1: {
        revenue: "AMD 1.84M",
        bookings: 122,
        share: 94,
      },
      s2: {
        revenue: "AMD 1.36M",
        bookings: 94,
        share: 78,
      },
      s3: {
        revenue: "AMD 1.08M",
        bookings: 82,
        share: 67,
      },
      s4: {
        revenue: "AMD 874K",
        bookings: 73,
        share: 55,
      },
      s5: {
        revenue: "AMD 625K",
        bookings: 64,
        share: 43,
      },
    }),

    statuses: patchById(base.statuses, {
      completed: { value: 486 },
      scheduled: { value: 167 },
      cancelled: { value: 45 },
      other: { value: 33 },
    }),

    clientSignals: patchById(base.clientSignals, {
      retention: {
        value: "79%",
        hint: "Strong quarterly retention",
      },
      new: {
        value: "102",
        hint: "New clients over 90 days",
      },
      "at-risk": {
        value: "14",
        hint: "Long-term reactivation pool",
      },
      "high-value": {
        value: "68",
        hint: "Strong quarterly contribution",
      },
    }),

    actions: patchById(base.actions, {
      a1: {
        impact: "Potential recovery: AMD 1.54M",
        confidence: 93,
      },
      a2: {
        impact: "Growth opportunity: AMD 821K",
        confidence: 91,
      },
      a3: {
        impact: "Protected value: AMD 502K",
        confidence: 88,
      },
    }),

    opportunities: patchById(base.opportunities, {
      o1: { value: "AMD 1.54M" },
      o2: { value: "AMD 821K" },
      o3: { value: "AMD 502K" },
      o4: { value: "AMD 286K" },
    }),

    aiScore: 84,
    aiStatus: "Excellent",

    primarySignal:
      "Quarterly revenue, retention and service demand show sustained strength with a high-confidence expansion opportunity.",

    nextAction:
      "Scale the strongest service while protecting delivery quality.",

    expectedImpact:
      "Preview impact: AMD 1.54M",

    heatmap: [
      [2, 3, 3, 4, 4, 3],
      [3, 4, 4, 5, 4, 3],
      [3, 4, 5, 5, 5, 4],
      [4, 5, 5, 5, 5, 4],
      [5, 5, 5, 5, 5, 5],
      [4, 5, 5, 5, 4, 3],
      [2, 3, 3, 4, 3, 2],
    ],
  };
}
