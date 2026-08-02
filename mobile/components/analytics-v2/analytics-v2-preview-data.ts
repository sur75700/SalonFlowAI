import type {
  AnalyticsPreviewModel,
} from "./analytics-v2-types";

/**
 * PRESENTATION-ONLY DATA.
 *
 * This file exists only to render Analytics V2 during visual design.
 * None of these values represent a real salon or production analytics.
 * The real data adapter will replace this file after visual approval.
 */
export const analyticsV2PreviewModel: AnalyticsPreviewModel = {
  overline: "SALONFLOW AI",
  title: "Salon Intelligence",
  subtitle:
    "Business health, risks, growth and opportunities in one intelligent command center.",
  previewLabel: "Preview-only design data",
  lastUpdated: "Updated moments ago",

  kpis: [
    {
      id: "revenue",
      label: "Completed Revenue",
      value: "AMD 2.38M",
      delta: "+18.4%",
      context: "vs previous 30 days",
      tone: "emerald",
      icon: "cash-outline",
      direction: "up",
      trend: [32, 39, 38, 52, 57, 66, 74, 79],
    },
    {
      id: "bookings",
      label: "Bookings",
      value: "248",
      delta: "+12.7%",
      context: "28 additional bookings",
      tone: "violet",
      icon: "calendar-outline",
      direction: "up",
      trend: [30, 38, 36, 47, 51, 62, 60, 72],
    },
    {
      id: "clients",
      label: "Returning Clients",
      value: "68%",
      delta: "+5.2%",
      context: "healthy repeat behavior",
      tone: "cyan",
      icon: "people-outline",
      direction: "up",
      trend: [48, 50, 55, 54, 59, 63, 65, 68],
    },
    {
      id: "ticket",
      label: "Average Ticket",
      value: "AMD 14.8K",
      delta: "+3.1%",
      context: "completed appointments",
      tone: "gold",
      icon: "receipt-outline",
      direction: "up",
      trend: [42, 45, 44, 48, 49, 51, 50, 54],
    },
    {
      id: "cancellation",
      label: "Cancellation Rate",
      value: "7.4%",
      delta: "-1.8%",
      context: "improved period over period",
      tone: "rose",
      icon: "warning-outline",
      direction: "down",
      trend: [67, 62, 58, 56, 52, 49, 45, 42],
    },
    {
      id: "growth",
      label: "Business Growth",
      value: "+16.2%",
      delta: "Strong",
      context: "combined performance signal",
      tone: "green",
      icon: "trending-up-outline",
      direction: "up",
      trend: [24, 31, 36, 45, 52, 58, 69, 76],
    },
  ],

  revenueSeries: [
    { label: "01", current: 118, previous: 106 },
    { label: "04", current: 132, previous: 112 },
    { label: "07", current: 127, previous: 121 },
    { label: "10", current: 154, previous: 128 },
    { label: "13", current: 149, previous: 137 },
    { label: "16", current: 176, previous: 142 },
    { label: "19", current: 191, previous: 151 },
    { label: "22", current: 184, previous: 158 },
    { label: "25", current: 214, previous: 167 },
    { label: "28", current: 236, previous: 179 },
  ],

  services: [
    {
      id: "s1",
      name: "Balayage Signature",
      revenue: "AMD 648K",
      bookings: 42,
      share: 92,
      tone: "violet",
    },
    {
      id: "s2",
      name: "Bridal Makeup",
      revenue: "AMD 486K",
      bookings: 31,
      share: 76,
      tone: "gold",
    },
    {
      id: "s3",
      name: "Keratin Treatment",
      revenue: "AMD 372K",
      bookings: 28,
      share: 63,
      tone: "emerald",
    },
    {
      id: "s4",
      name: "Facial Glow",
      revenue: "AMD 284K",
      bookings: 25,
      share: 52,
      tone: "cyan",
    },
    {
      id: "s5",
      name: "Nail Art",
      revenue: "AMD 196K",
      bookings: 22,
      share: 39,
      tone: "rose",
    },
  ],

  statuses: [
    {
      id: "completed",
      label: "Completed",
      value: 164,
      tone: "emerald",
    },
    {
      id: "scheduled",
      label: "Scheduled",
      value: 52,
      tone: "violet",
    },
    {
      id: "cancelled",
      label: "Cancelled",
      value: 18,
      tone: "rose",
    },
    {
      id: "other",
      label: "Other",
      value: 14,
      tone: "gold",
    },
  ],

  clientSignals: [
    {
      id: "retention",
      label: "Retention",
      value: "74%",
      hint: "Stable and improving",
      tone: "emerald",
    },
    {
      id: "new",
      label: "New Clients",
      value: "36",
      hint: "This preview period",
      tone: "cyan",
    },
    {
      id: "at-risk",
      label: "At-risk Clients",
      value: "8",
      hint: "Require attention",
      tone: "rose",
    },
    {
      id: "high-value",
      label: "High-value Clients",
      value: "24",
      hint: "Strong revenue contribution",
      tone: "gold",
    },
  ],

  actions: [
    {
      id: "a1",
      priority: "Critical",
      confidence: 89,
      title: "Recover at-risk clients",
      description:
        "A focused reactivation campaign could recover clients who exceeded their normal booking rhythm.",
      impact: "Potential recovery: AMD 648K",
      actionLabel: "Review clients",
      tone: "rose",
      icon: "shield-checkmark-outline",
    },
    {
      id: "a2",
      priority: "Growth",
      confidence: 86,
      title: "Scale your strongest service",
      description:
        "Balayage leads both demand and revenue contribution in this design scenario.",
      impact: "Growth opportunity: AMD 312K",
      actionLabel: "Review service",
      tone: "emerald",
      icon: "rocket-outline",
    },
    {
      id: "a3",
      priority: "High",
      confidence: 81,
      title: "Reduce cancellation friction",
      description:
        "The largest avoidable operational loss appears before high-value appointments.",
      impact: "Protected value: AMD 184K",
      actionLabel: "Open playbook",
      tone: "gold",
      icon: "bulb-outline",
    },
  ],

  opportunities: [
    {
      id: "o1",
      title: "Reactivate clients",
      impact: "High",
      effort: "Low",
      value: "AMD 648K",
      tone: "emerald",
    },
    {
      id: "o2",
      title: "Promote Balayage",
      impact: "High",
      effort: "Low",
      value: "AMD 312K",
      tone: "violet",
    },
    {
      id: "o3",
      title: "Reduce cancellations",
      impact: "High",
      effort: "High",
      value: "AMD 184K",
      tone: "rose",
    },
    {
      id: "o4",
      title: "Raise average ticket",
      impact: "Medium",
      effort: "High",
      value: "AMD 96K",
      tone: "gold",
    },
  ],

  aiScore: 78,
  aiStatus: "Healthy",
  primarySignal:
    "Revenue momentum is strong, but client reactivation remains the clearest near-term opportunity.",
  nextAction: "Launch a focused reactivation review.",
  expectedImpact: "Preview impact: AMD 648K",

  heatmap: [
    [1, 2, 3, 2, 4, 3],
    [2, 3, 4, 5, 4, 2],
    [2, 4, 5, 5, 4, 3],
    [3, 5, 5, 4, 5, 4],
    [4, 5, 4, 5, 5, 4],
    [3, 4, 5, 4, 3, 2],
    [1, 2, 2, 3, 2, 1],
  ],
};
