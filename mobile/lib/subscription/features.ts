import type { PricingPlanCode } from "../pricing/plans";

export type FeatureCode =
  | "dashboard"
  | "appointments"
  | "clients"
  | "services"
  | "reports"
  | "basic_analytics"
  | "ai_forecast"
  | "growth_insights"
  | "risk_center"
  | "client_intelligence"
  | "mission_control"
  | "performance_center"
  | "benchmark_center"
  | "revenue_simulator"
  | "opportunity_matrix"
  | "multi_location"
  | "advanced_ai"
  | "priority_support";

export const CURRENT_PLAN: PricingPlanCode = "business";

export const PLAN_FEATURES: Record<PricingPlanCode, FeatureCode[]> = {
  free: [
    "dashboard",
    "appointments",
    "clients",
    "services",
    "basic_analytics",
  ],
  pro: [
    "dashboard",
    "appointments",
    "clients",
    "services",
    "reports",
    "basic_analytics",
    "ai_forecast",
    "growth_insights",
    "risk_center",
    "client_intelligence",
  ],
  business: [
    "dashboard",
    "appointments",
    "clients",
    "services",
    "reports",
    "basic_analytics",
    "ai_forecast",
    "growth_insights",
    "risk_center",
    "client_intelligence",
    "mission_control",
    "performance_center",
    "benchmark_center",
    "revenue_simulator",
    "opportunity_matrix",
  ],
  enterprise: [
    "dashboard",
    "appointments",
    "clients",
    "services",
    "reports",
    "basic_analytics",
    "ai_forecast",
    "growth_insights",
    "risk_center",
    "client_intelligence",
    "mission_control",
    "performance_center",
    "benchmark_center",
    "revenue_simulator",
    "opportunity_matrix",
    "multi_location",
    "advanced_ai",
    "priority_support",
  ],
};

export function hasFeature(
  plan: PricingPlanCode = CURRENT_PLAN,
  feature: FeatureCode
): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

export function requireFeature(
  plan: PricingPlanCode = CURRENT_PLAN,
  feature: FeatureCode
): { allowed: boolean; feature: FeatureCode; plan: PricingPlanCode } {
  return {
    allowed: hasFeature(plan, feature),
    feature,
    plan,
  };
}
