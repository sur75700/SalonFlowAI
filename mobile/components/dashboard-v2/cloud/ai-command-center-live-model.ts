import type {
  AICommandCenterV2Props,
  AIInsight,
  FocusItem,
  ForecastSeriesPoint,
  InsightTone,
  TrendDirection,
} from "./AICommandCenterV2";
import type {
  IntelligenceDecisionRequest,
  IntelligenceDecisionResponse,
  MetricResponse,
  RecommendationResponse,
  SignalResponse,
} from "../../../types/intelligence";

export type IntelligencePeriod = "7d" | "30d" | "90d";

export type AICommandCenterLiveModel = Readonly<
  Pick<
    AICommandCenterV2Props,
    | "healthLabel"
    | "aiScore"
    | "confidenceLabel"
    | "insights"
    | "recommendations"
    | "todaysFocus"
    | "forecast"
  >
>;

export type AICommandCenterLiveModelOptions = Readonly<{
  translateText?: (
    value: string | null | undefined
  ) => string | undefined;
  mapTone?: (
    value: string | null | undefined
  ) => InsightTone;
  confidenceLabels?: Readonly<
    Record<
      IntelligenceDecisionResponse["confidence"]["level"],
      string
    >
  >;
  fallbacks?: Readonly<{
    insightTitle: string;
    insightDescription: string;
    recommendationTitle: string;
    recommendationDescription: string;
    forecastHeadline: string;
    forecastDescription: string;
    forecastLabel: string;
  }>;
  forecastLabels?: Readonly<{
    sevenDays: string;
    thirtyDays: string;
  }>;
}>;

const PERIOD_DAYS: Readonly<Record<IntelligencePeriod, number>> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const SIGNAL_ORDER: Readonly<Record<SignalResponse["severity"], number>> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
  info: 3,
};

function createEmptyModel(): AICommandCenterLiveModel {
  return {
    healthLabel: "",
    aiScore: 0,
    confidenceLabel: "",
    insights: [],
    recommendations: [],
    todaysFocus: [],
    forecast: {
      headline: "",
      series: [],
    },
  };
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatUtcDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();

  if (!/^[A-Z]{3,8}$/.test(normalized)) {
    throw new TypeError(
      "Intelligence currency must contain 3-8 ASCII letters"
    );
  }

  return normalized;
}

function translate(
  value: string,
  options: AICommandCenterLiveModelOptions,
  fallback?: string
): string {
  return (
    options.translateText?.(value)?.trim() ||
    fallback?.trim() ||
    value.trim()
  );
}

function defaultSignalTone(
  severity: SignalResponse["severity"]
): InsightTone {
  switch (severity) {
    case "critical":
      return "danger";
    case "warning":
      return "warning";
    case "opportunity":
      return "positive";
    case "info":
    default:
      return "neutral";
  }
}

function signalTone(
  severity: SignalResponse["severity"],
  options: AICommandCenterLiveModelOptions
): InsightTone {
  return (
    options.mapTone?.(severity) ??
    defaultSignalTone(severity)
  );
}

function recommendationTone(priority: number): InsightTone {
  if (priority <= 1) return "danger";
  if (priority <= 3) return "warning";
  return "neutral";
}

function titleCase(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  return (
    normalized.charAt(0).toUpperCase() +
    normalized.slice(1).toLowerCase()
  );
}

function sortedSignals(
  response: IntelligenceDecisionResponse
): SignalResponse[] {
  return response.signals
    .slice()
    .sort(
      (first, second) =>
        SIGNAL_ORDER[first.severity] -
          SIGNAL_ORDER[second.severity] ||
        first.code.localeCompare(second.code)
    );
}

function sortedRecommendations(
  response: IntelligenceDecisionResponse
): RecommendationResponse[] {
  return response.recommendations
    .slice()
    .sort(
      (first, second) =>
        first.priority - second.priority ||
        first.code.localeCompare(second.code)
    );
}

function metricValue(metric: MetricResponse): string {
  const value = Number.isInteger(metric.value)
    ? String(metric.value)
    : String(Number(metric.value.toFixed(2)));

  return metric.unit?.trim()
    ? `${value} ${metric.unit.trim()}`
    : value;
}

function forecastMetrics(
  metrics: readonly MetricResponse[]
): MetricResponse[] {
  const explicitlyForecast = metrics.filter((metric) =>
    /forecast|projected|prediction|next[._-]/i.test(metric.key)
  );

  return explicitlyForecast.slice(0, 6);
}

function forecastTrend(
  metrics: readonly MetricResponse[]
): Readonly<{
  label?: string;
  direction?: TrendDirection;
}> {
  const comparable = metrics.find(
    (metric) =>
      metric.comparison_value !== null &&
      metric.comparison_value !== undefined &&
      Number.isFinite(metric.comparison_value)
  );

  if (!comparable) {
    return {};
  }

  const delta = comparable.value - Number(comparable.comparison_value);
  const direction: TrendDirection =
    delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  return {
    label: `${comparable.label}: ${metricValue(comparable)}`,
    direction,
  };
}

export function buildIntelligenceDecisionRequest(
  period: IntelligencePeriod,
  currency: string,
  now: Date = new Date()
): IntelligenceDecisionRequest {
  if (!Number.isFinite(now.getTime())) {
    throw new TypeError("Intelligence request date is invalid");
  }

  const days = PERIOD_DAYS[period];
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  return Object.freeze({
    currency: normalizeCurrency(currency),
    window: Object.freeze({
      start: formatUtcDate(start),
      end: formatUtcDate(end),
      label: `dashboard-${period}`,
    }),
  });
}

export function buildAICommandCenterLiveModel(
  response: IntelligenceDecisionResponse | null,
  options: AICommandCenterLiveModelOptions = {}
): AICommandCenterLiveModel {
  if (!response) {
    return createEmptyModel();
  }

  const confidenceScore = clampScore(
    response.confidence.score * 100
  );
  const signals = sortedSignals(response);
  const recommendations = sortedRecommendations(response);
  const selectedForecastMetrics = forecastMetrics(response.metrics);
  const trend = forecastTrend(selectedForecastMetrics);

  const insights: AIInsight[] = signals
    .slice(0, 3)
    .map((signal) => ({
      title: translate(
        signal.title,
        options,
        options.fallbacks?.insightTitle
      ),
      description: translate(
        signal.description,
        options,
        options.fallbacks?.insightDescription
      ),
      tone: signalTone(signal.severity, options),
    }));

  const todaysFocus: FocusItem[] = recommendations
    .slice(0, 3)
    .map((recommendation) => ({
      label: translate(
        recommendation.title,
        options,
        options.fallbacks?.recommendationTitle
      ),
      detail: translate(
        recommendation.description,
        options,
        options.fallbacks?.recommendationDescription
      ),
      tone: recommendationTone(recommendation.priority),
    }));

  const forecastSeries: ForecastSeriesPoint[] =
    selectedForecastMetrics.map((metric) => {
      const stableLabel = /(?:^|[._-])7d(?:$|[._-])/i.test(
        metric.key
      )
        ? options.forecastLabels?.sevenDays
        : /(?:^|[._-])30d(?:$|[._-])/i.test(metric.key)
          ? options.forecastLabels?.thirtyDays
          : options.fallbacks?.forecastLabel;

      return {
        label: translate(
          metric.label,
          options,
          stableLabel
        ),
        value: metric.value,
      };
    });

  return {
    healthLabel:
      options.confidenceLabels?.[
        response.confidence.level
      ] || titleCase(response.confidence.level),
    aiScore: confidenceScore,
    confidenceLabel: `${confidenceScore}%`,
    insights,
    recommendations: recommendations
      .slice(0, 3)
      .map((item) =>
        translate(
          item.title,
          options,
          options.fallbacks?.recommendationTitle
        )
      ),
    todaysFocus,
    forecast: {
      headline: translate(
        response.summary,
        options,
        options.fallbacks?.forecastHeadline
      ),
      helperText: translate(
        response.confidence.explanation,
        options,
        options.fallbacks?.forecastDescription
      ),
      trendLabel: trend.label
        ? translate(
            trend.label,
            options,
            options.fallbacks?.forecastLabel
          )
        : undefined,
      trendDirection: trend.direction,
      series: forecastSeries,
    },
  };
}
