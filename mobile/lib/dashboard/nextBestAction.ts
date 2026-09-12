import type {
  ConfidenceResponse,
  EvidenceResponse,
  ExpectedImpactResponse,
  IntelligenceDecisionResponse,
  RecommendationResponse,
} from "../../types/intelligence";

export type NextBestActionCategory =
  | "MAKE_MONEY"
  | "PREVENT_LOSS"
  | "IMPROVE_OPERATIONS";

export type NextBestActionDestination =
  | "/(tabs)/analytics"
  | "/(tabs)/appointments"
  | "/(tabs)/services";

export type NextBestAction = Readonly<{
  code: string;
  title: string;
  description: string;
  priority: number;
  category: NextBestActionCategory;
  evidence: readonly EvidenceResponse[];
  expectedImpacts: readonly ExpectedImpactResponse[];
  confidence: ConfidenceResponse;
  destination: NextBestActionDestination;
}>;

const MAX_ACTIONS = 3;

function classifyRecommendation(
  recommendation: RecommendationResponse,
): NextBestActionCategory | null {
  if (recommendation.expected_impacts.length === 0) return null;
  const metrics = recommendation.expected_impacts
    .map((impact) => impact.metric.trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
  if (!metrics) return null;
  if (/cancel|no[_ -]?show|churn|loss|risk|retention/.test(metrics)) {
    return "PREVENT_LOSS";
  }
  if (/revenue|booking|sales|ticket|client[_ -]?value|income/.test(metrics)) {
    return "MAKE_MONEY";
  }
  if (/capacity|utilization|efficien|operation|service|schedule|throughput/.test(metrics)) {
    return "IMPROVE_OPERATIONS";
  }
  return null;
}

function destinationFor(category: NextBestActionCategory): NextBestActionDestination {
  if (category === "MAKE_MONEY") return "/(tabs)/analytics";
  if (category === "PREVENT_LOSS") return "/(tabs)/appointments";
  return "/(tabs)/services";
}

export function selectNextBestActions(
  response: IntelligenceDecisionResponse | null,
  options: Readonly<{ entitled?: boolean }> = {},
): readonly NextBestAction[] {
  if (!response || options.entitled === false) return Object.freeze([]);
  if (
    !Number.isFinite(response.confidence.score) ||
    response.confidence.score < 0 ||
    response.confidence.score > 1
  ) {
    return Object.freeze([]);
  }

  const evidenceBySignalCode = new Map<string, readonly EvidenceResponse[]>();
  response.signals.forEach((signal) => {
    const code = signal.code.trim();
    const evidence = signal.evidence.filter(
      (item) => item.source.trim() && item.description.trim() && item.observed_at.trim(),
    );
    if (code && evidence.length > 0) evidenceBySignalCode.set(code, evidence);
  });

  const actions = response.recommendations
    .slice()
    .sort((first, second) => first.priority - second.priority || first.code.localeCompare(second.code))
    .flatMap((recommendation): NextBestAction[] => {
      const evidence = evidenceBySignalCode.get(recommendation.code.trim());
      const category = classifyRecommendation(recommendation);
      if (!evidence || evidence.length === 0 || category === null) return [];
      if (
        !Number.isInteger(recommendation.priority) ||
        recommendation.priority < 0 ||
        !recommendation.title.trim() ||
        !recommendation.description.trim()
      ) {
        return [];
      }
      const impacts = recommendation.expected_impacts.filter(
        (impact) =>
          impact.metric.trim() &&
          impact.unit.trim() &&
          Number.isFinite(impact.estimated_change) &&
          Number.isInteger(impact.timeframe_days) &&
          impact.timeframe_days > 0,
      );
      if (impacts.length !== recommendation.expected_impacts.length) return [];
      return [
        Object.freeze({
          code: recommendation.code,
          title: recommendation.title,
          description: recommendation.description,
          priority: recommendation.priority,
          category,
          evidence: Object.freeze(evidence.slice()),
          expectedImpacts: Object.freeze(impacts.slice()),
          confidence: response.confidence,
          destination: destinationFor(category),
        }),
      ];
    })
    .slice(0, MAX_ACTIONS);

  return Object.freeze(actions);
}
