import type {
  AnalyticsClientRisk,
  AnalyticsClientSummary,
  AnalyticsData,
} from "../../types/models";
import type {
  IntelligenceDecisionResponse,
  MetricResponse,
} from "../../types/intelligence";

export type EnrichmentState =
  | "loading"
  | "refreshing"
  | "available"
  | "empty"
  | "unavailable"
  | "not_entitled";

export type IntelligenceViewStatus =
  | "idle"
  | "loading"
  | "refreshing"
  | "success"
  | "not_entitled"
  | "error";

export type HeroAIConfidenceState = Exclude<EnrichmentState, "empty">;

export type HeroAIConfidenceModel = Readonly<{
  state: HeroAIConfidenceState;
  valuePercent: number | null;
  level: "low" | "medium" | "high" | null;
}>;

export type CapacitySnapshotModel = Readonly<{
  state: EnrichmentState;
  utilizationPercent: number | null;
  availableSlots: number | null;
  idleHours: number | null;
  windowLabel: string | null;
}>;

export type ClientRetentionPulseModel = Readonly<{
  state: EnrichmentState;
  totalClients: number | null;
  singleAppointmentClients: number | null;
  repeatHistoryClients: number | null;
  inactiveClients: number | null;
  returningRatioPercent: number | null;
  atRiskClients: number | null;
  highRiskClients: number | null;
  lostClients: number | null;
  riskScore: number | null;
}>;

export type FinalDashboardEnrichmentModel = Readonly<{
  heroConfidence: HeroAIConfidenceModel;
  capacity: CapacitySnapshotModel;
  clientRetention: ClientRetentionPulseModel;
}>;

export type BuildFinalDashboardEnrichmentInput = Readonly<{
  intelligenceStatus: IntelligenceViewStatus;
  intelligenceData: IntelligenceDecisionResponse | null;
  intelligenceWindowLabel: string | null;
  analytics: AnalyticsData | null;
  analyticsLoading: boolean;
  analyticsRefreshing: boolean;
  analyticsError: boolean;
  analyticsScopeSafe: boolean;
}>;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    isFiniteNumber(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

function isPercent(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 100;
}

function readUniqueMetric(
  metrics: unknown,
  key: string,
  unit: string,
  validate: (value: unknown) => boolean,
): number | null {
  if (!Array.isArray(metrics)) {
    return null;
  }

  const matches = metrics.filter(
    (metric): metric is MetricResponse =>
      typeof metric === "object" &&
      metric !== null &&
      "key" in metric &&
      (metric as { key?: unknown }).key === key,
  );

  if (matches.length !== 1) {
    return null;
  }

  const metric = matches[0];

  if (metric.unit !== unit || !validate(metric.value)) {
    return null;
  }

  return metric.value;
}

export function buildHeroAIConfidence(
  status: IntelligenceViewStatus,
  data: IntelligenceDecisionResponse | null,
): HeroAIConfidenceModel {
  if (status === "not_entitled") {
    return {
      state: "not_entitled",
      valuePercent: null,
      level: null,
    };
  }

  if (status === "idle" || status === "loading") {
    return {
      state: "loading",
      valuePercent: null,
      level: null,
    };
  }

  if (status === "error" || data === null) {
    return {
      state: "unavailable",
      valuePercent: null,
      level: null,
    };
  }

  const score = data.confidence?.score;
  const level = data.confidence?.level;

  if (
    !isFiniteNumber(score) ||
    score < 0 ||
    score > 1 ||
    (level !== "low" && level !== "medium" && level !== "high")
  ) {
    return {
      state: "unavailable",
      valuePercent: null,
      level: null,
    };
  }

  return {
    state: status === "refreshing" ? "refreshing" : "available",
    valuePercent: Math.round(score * 100),
    level,
  };
}

export function buildCapacitySnapshot(
  status: IntelligenceViewStatus,
  data: IntelligenceDecisionResponse | null,
  windowLabel: string | null,
): CapacitySnapshotModel {
  if (status === "not_entitled") {
    return {
      state: "not_entitled",
      utilizationPercent: null,
      availableSlots: null,
      idleHours: null,
      windowLabel,
    };
  }

  if (status === "idle" || status === "loading") {
    return {
      state: "loading",
      utilizationPercent: null,
      availableSlots: null,
      idleHours: null,
      windowLabel,
    };
  }

  if (status === "error" || data === null) {
    return {
      state: "unavailable",
      utilizationPercent: null,
      availableSlots: null,
      idleHours: null,
      windowLabel,
    };
  }

  const utilizationPercent = readUniqueMetric(
    data.metrics,
    "capacity.utilization_percent",
    "percent",
    (value) => isFiniteNumber(value) && value >= 0,
  );
  const availableSlots = readUniqueMetric(
    data.metrics,
    "capacity.available_slots",
    "slots",
    isNonNegativeInteger,
  );
  const idleHours = readUniqueMetric(
    data.metrics,
    "capacity.idle_hours",
    "hours",
    (value) => isFiniteNumber(value) && value >= 0,
  );

  if (
    utilizationPercent === null ||
    availableSlots === null ||
    idleHours === null ||
    !windowLabel
  ) {
    return {
      state: "unavailable",
      utilizationPercent: null,
      availableSlots: null,
      idleHours: null,
      windowLabel,
    };
  }

  return {
    state: status === "refreshing" ? "refreshing" : "available",
    utilizationPercent,
    availableSlots,
    idleHours,
    windowLabel,
  };
}

function validateClientSummary(
  value: AnalyticsClientSummary | undefined,
): value is AnalyticsClientSummary {
  return Boolean(
    value &&
      isNonNegativeInteger(value.total_clients) &&
      isNonNegativeInteger(value.new_clients) &&
      isNonNegativeInteger(value.returning_clients) &&
      isNonNegativeInteger(value.vip_clients) &&
      isNonNegativeInteger(value.inactive_clients) &&
      isPercent(value.retention_score),
  );
}

function validateClientRisk(
  value: AnalyticsClientRisk | undefined,
): value is AnalyticsClientRisk {
  return Boolean(
    value &&
      isNonNegativeInteger(value.at_risk_clients) &&
      isNonNegativeInteger(value.high_risk_clients) &&
      isNonNegativeInteger(value.lost_clients) &&
      isPercent(value.risk_score),
  );
}

export function buildClientRetentionPulse(
  analytics: AnalyticsData | null,
  options: Readonly<{
    loading: boolean;
    refreshing: boolean;
    error: boolean;
    scopeSafe: boolean;
  }>,
): ClientRetentionPulseModel {
  if (!options.scopeSafe) {
    return {
      state: "loading",
      totalClients: null,
      singleAppointmentClients: null,
      repeatHistoryClients: null,
      inactiveClients: null,
      returningRatioPercent: null,
      atRiskClients: null,
      highRiskClients: null,
      lostClients: null,
      riskScore: null,
    };
  }

  if (options.loading && analytics === null) {
    return {
      state: "loading",
      totalClients: null,
      singleAppointmentClients: null,
      repeatHistoryClients: null,
      inactiveClients: null,
      returningRatioPercent: null,
      atRiskClients: null,
      highRiskClients: null,
      lostClients: null,
      riskScore: null,
    };
  }

  if (options.error || analytics === null) {
    return {
      state: "unavailable",
      totalClients: null,
      singleAppointmentClients: null,
      repeatHistoryClients: null,
      inactiveClients: null,
      returningRatioPercent: null,
      atRiskClients: null,
      highRiskClients: null,
      lostClients: null,
      riskScore: null,
    };
  }

  const summary = analytics.client_summary;
  const risk = analytics.client_risk;

  if (!validateClientSummary(summary) || !validateClientRisk(risk)) {
    return {
      state: "unavailable",
      totalClients: null,
      singleAppointmentClients: null,
      repeatHistoryClients: null,
      inactiveClients: null,
      returningRatioPercent: null,
      atRiskClients: null,
      highRiskClients: null,
      lostClients: null,
      riskScore: null,
    };
  }

  const clientCountsConsistent =
    summary.new_clients <= summary.total_clients &&
    summary.returning_clients <= summary.total_clients &&
    summary.new_clients + summary.returning_clients <= summary.total_clients &&
    summary.vip_clients <= summary.total_clients &&
    summary.inactive_clients <= summary.total_clients &&
    risk.at_risk_clients <= summary.total_clients &&
    risk.high_risk_clients <= summary.total_clients &&
    risk.lost_clients <= summary.total_clients;

  if (!clientCountsConsistent) {
    return {
      state: "unavailable",
      totalClients: null,
      singleAppointmentClients: null,
      repeatHistoryClients: null,
      inactiveClients: null,
      returningRatioPercent: null,
      atRiskClients: null,
      highRiskClients: null,
      lostClients: null,
      riskScore: null,
    };
  }

  if (summary.total_clients === 0) {
    return {
      state: "empty",
      totalClients: 0,
      singleAppointmentClients: summary.new_clients,
      repeatHistoryClients: summary.returning_clients,
      inactiveClients: summary.inactive_clients,
      returningRatioPercent: summary.retention_score,
      atRiskClients: risk.at_risk_clients,
      highRiskClients: risk.high_risk_clients,
      lostClients: risk.lost_clients,
      riskScore: risk.risk_score,
    };
  }

  return {
    state: options.refreshing ? "refreshing" : "available",
    totalClients: summary.total_clients,
    singleAppointmentClients: summary.new_clients,
    repeatHistoryClients: summary.returning_clients,
    inactiveClients: summary.inactive_clients,
    returningRatioPercent: summary.retention_score,
    atRiskClients: risk.at_risk_clients,
    highRiskClients: risk.high_risk_clients,
    lostClients: risk.lost_clients,
    riskScore: risk.risk_score,
  };
}

export function buildFinalDashboardEnrichment(
  input: BuildFinalDashboardEnrichmentInput,
): FinalDashboardEnrichmentModel {
  return {
    heroConfidence: buildHeroAIConfidence(
      input.intelligenceStatus,
      input.intelligenceData,
    ),
    capacity: buildCapacitySnapshot(
      input.intelligenceStatus,
      input.intelligenceData,
      input.intelligenceWindowLabel,
    ),
    clientRetention: buildClientRetentionPulse(input.analytics, {
      loading: input.analyticsLoading,
      refreshing: input.analyticsRefreshing,
      error: input.analyticsError,
      scopeSafe: input.analyticsScopeSafe,
    }),
  };
}
