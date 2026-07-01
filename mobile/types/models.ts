export type SummaryData = {
  total_clients: number;
  total_services: number;
  total_appointments: number;
  scheduled_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  today_appointments: number;
};

export type ClientItem = {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type ServiceItem = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  currency: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
};

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export type AppointmentItem = {
  id: string;
  client_id: string;
  client_name: string;
  service_id?: string | null;
  service_name?: string | null;
  starts_at: string;
  ends_at?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type AnalyticsTotals = {
  total_revenue_snapshot: number;
  completed_revenue: number;
  scheduled_pipeline: number;
  cancelled_value: number;
  avg_completed_booking_value: number;
};

export type AnalyticsTopService = {
  service_name: string;
  bookings_count: number;
  revenue: number;
};

export type AnalyticsRevenuePoint = {
  date: string;
  completed_revenue: number;
};

export type AnalyticsInsight = {
  type: string;
  tone: string;
  code?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  action_code?: string;
  action_params?: Record<string, string | number | boolean | null | undefined>;
  priority_level?: string;
  confidence?: number;
  impact_code?: string;
  opportunity_code?: string;
  opportunity_amount?: number;
  title: string;
  message: string;
  priority?: number;
};

export type AnalyticsForecast = {
  revenue_7_days: number;
  revenue_30_days: number;
  confidence: number;
  trend: string;
};

export type AnalyticsRiskSummary = {
  active_risks: number;
  highest_risk_code: string;
  highest_risk_score: number;
  risk_level: string;
};

export type AnalyticsGrowthSummary = {
  growth_score: number;
  growth_level: string;
  best_service: string;
  growth_opportunity: number;
  recommended_action: string;
};

export type AnalyticsExecutiveDecision = {
  decision_score: number;
  decision_level: string;
  headline: string;
  primary_action: string;
  secondary_action: string;
  expected_impact: number;
};

export type AnalyticsClientSummary = {
  total_clients: number;
  new_clients: number;
  returning_clients: number;
  vip_clients: number;
  inactive_clients: number;
  retention_score: number;
};

export type AnalyticsClientRisk = {
  at_risk_clients: number;
  high_risk_clients: number;
  lost_clients: number;
  reactivation_opportunity: number;
  risk_score: number;
};

export type AnalyticsMission = {
  priority: number;
  code: string;
  title: string;
  impact: number;
  confidence: number;
  action: string;
  urgency?: string;
  roi_score?: number;
  execution_window_days?: number;
  action_label?: string;
  execution_playbook?: string;
  expected_result?: string;
};


export type AnalyticsRevenueSimulatorScenario = {
  code: string;
  title: string;
  projected_revenue: number;
  delta: number;
  confidence: number;
  action: string;
  difficulty: string;
};

export type AnalyticsRevenueSimulator = {
  base_revenue: number;
  completed_revenue: number;
  scheduled_pipeline: number;
  cancelled_value: number;
  scenarios: AnalyticsRevenueSimulatorScenario[];
  best_scenario?: AnalyticsRevenueSimulatorScenario;
};

export type AnalyticsAIContract = {
  version: string;
  mode: string;
  null_safety: string;
  mobile_safe: boolean;
  backward_compatible: boolean;
};

export type AnalyticsAIDataQuality = {
  score: number;
  level: string;
};

export type AnalyticsConfidenceBreakdown = {
  forecast_confidence: number;
  growth_signal: number;
  risk_pressure: number;
  client_retention: number;
  client_risk: number;
  data_quality: number;
};

export type AnalyticsNextBestAction = {
  code: string;
  label: string;
  expected_result: string;
  execution_window_days: number;
  roi_score: number;
};

export type AnalyticsAIReasoning = {
  ai_engine_version: string;
  ai_mode: string;
  data_quality_score: number;
  decision_score: number;
  confidence_breakdown: AnalyticsConfidenceBreakdown;
  decision_explanation: string;
  next_best_action: AnalyticsNextBestAction;
};

export type AnalyticsDecisionPriorityAction = {
  rank: number;
  code: string;
  action: string;
  label: string;
  priority_score: number;
  roi_priority: number;
  urgency_score: number;
  confidence_score: number;
  expected_impact: number;
  execution_window_days: number;
  rationale: string;
};

export type AnalyticsDecisionPriority = {
  version: string;
  top_action: AnalyticsDecisionPriorityAction;
  ranked_actions: AnalyticsDecisionPriorityAction[];
  decision_rationale: string;
};

export type AnalyticsData = {
  // Live analytics API aliases
  total_revenue?: number;
  completed_revenue?: number;
  scheduled_pipeline?: number;
  cancelled_value?: number;
  avg_completed_ticket?: number;
  completedRevenue?: number;
  scheduledPipeline?: number;
  cancelledValue?: number;
  avgCompletedTicket?: number;
  revenueTrend?: any[];
  topPerformingServices?: any[];
  top_performing_services?: any[];

  currency: string;
  totals: AnalyticsTotals;
  top_services: AnalyticsTopService[];
  revenue_last_7_days: AnalyticsRevenuePoint[];
  forecast?: AnalyticsForecast;
  risk_summary?: AnalyticsRiskSummary;
  growth_summary?: AnalyticsGrowthSummary;
  executive_decision?: AnalyticsExecutiveDecision;
  client_summary?: AnalyticsClientSummary;
  client_risk?: AnalyticsClientRisk;
  mission_control?: AnalyticsMission[];
  performance_center?: {
    overall_efficiency: number;
    revenue_efficiency: number;
    client_efficiency: number;
    service_efficiency: number;
    operational_efficiency: number;
  };
  revenue_simulator?: AnalyticsRevenueSimulator;
  ai_engine_version?: string;
  ai_mode?: string;
  ai_contract?: AnalyticsAIContract;
  ai_data_quality?: AnalyticsAIDataQuality;
  ai_reasoning?: AnalyticsAIReasoning;
  confidence_breakdown?: AnalyticsConfidenceBreakdown;
  next_best_action?: AnalyticsNextBestAction;
  decision_priority?: AnalyticsDecisionPriority;
  benchmark_center?: {
    benchmark_score: number;
    salon_tier: string;
    percentile_rank: number;
    top_percent: number;
    revenue_score: number;
    client_score: number;
    service_score: number;
    operations_score: number;
  };
  insights?: AnalyticsInsight[];
};
