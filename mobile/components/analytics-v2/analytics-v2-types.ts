import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type AnalyticsTabKey =
  | "overview"
  | "revenue"
  | "clients"
  | "services"
  | "operations"
  | "ai";

export type AnalyticsPeriodKey = "7d" | "30d" | "90d";

export type AnalyticsTone =
  | "violet"
  | "emerald"
  | "cyan"
  | "gold"
  | "rose"
  | "green";

export type AnalyticsIconName =
  ComponentProps<typeof Ionicons>["name"];

export type AnalyticsTrendDirection =
  | "up"
  | "down"
  | "flat";

export type AnalyticsKpiPreview = {
  id: string;
  label: string;
  value: string;
  delta: string;
  context: string;
  tone: AnalyticsTone;
  icon: AnalyticsIconName;
  direction: AnalyticsTrendDirection;
  trend: number[];
};

export type AnalyticsRevenuePoint = {
  label: string;
  current: number;
  previous: number;
};

export type AnalyticsServicePreview = {
  id: string;
  name: string;
  revenue: string;
  bookings: number;
  share: number;
  tone: AnalyticsTone;
};

export type AnalyticsStatusPreview = {
  id: string;
  label: string;
  value: number;
  tone: AnalyticsTone;
};

export type AnalyticsActionPreview = {
  id: string;
  priority: "Critical" | "High" | "Growth";
  confidence: number;
  title: string;
  description: string;
  impact: string;
  actionLabel: string;
  tone: AnalyticsTone;
  icon: AnalyticsIconName;
};

export type AnalyticsClientSignalPreview = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: AnalyticsTone;
};

export type AnalyticsOpportunityPreview = {
  id: string;
  title: string;
  impact: "High" | "Medium";
  effort: "Low" | "High";
  value: string;
  tone: AnalyticsTone;
};

export type AnalyticsPreviewModel = {
  overline: string;
  title: string;
  subtitle: string;
  previewLabel: string;
  lastUpdated: string;

  kpis: AnalyticsKpiPreview[];
  revenueSeries: AnalyticsRevenuePoint[];
  services: AnalyticsServicePreview[];
  statuses: AnalyticsStatusPreview[];
  actions: AnalyticsActionPreview[];
  clientSignals: AnalyticsClientSignalPreview[];
  opportunities: AnalyticsOpportunityPreview[];

  aiScore: number;
  aiStatus: string;
  primarySignal: string;
  nextAction: string;
  expectedImpact: string;

  heatmap: number[][];
};
