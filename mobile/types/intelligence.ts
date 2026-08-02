export type IntelligenceJsonPrimitive = string | number | boolean | null;

export type IntelligenceJsonValue =
  | IntelligenceJsonPrimitive
  | ReadonlyArray<IntelligenceJsonValue>
  | Readonly<{
      readonly [key: string]: IntelligenceJsonValue;
    }>;

export type AnalysisWindowRequest = Readonly<{
  readonly start: string;
  readonly end: string;
  readonly label?: string;
}>;

export type ConfidenceResponse = Readonly<{
  readonly score: number;
  readonly level: "low" | "medium" | "high";
  readonly explanation: string;
  readonly evidence_count: number;
}>;

export type EvidenceResponse = Readonly<{
  readonly source: string;
  readonly description: string;
  readonly value?: IntelligenceJsonValue | null;
  readonly observed_at: string;
}>;

export type ExpectedImpactResponse = Readonly<{
  readonly metric: string;
  readonly estimated_change: number;
  readonly unit: string;
  readonly timeframe_days: number;
}>;

export type MetricResponse = Readonly<{
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly unit?: string | null;
  readonly comparison_value?: number | null;
}>;

export type RecommendationResponse = Readonly<{
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly priority: number;
  readonly expected_impacts: ReadonlyArray<ExpectedImpactResponse>;
}>;

export type SignalResponse = Readonly<{
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly severity: "info" | "opportunity" | "warning" | "critical";
  readonly evidence: ReadonlyArray<EvidenceResponse>;
}>;

export type IntelligenceDecisionRequest = Readonly<{
  readonly currency?: string;
  readonly window: AnalysisWindowRequest;
}>;

export type IntelligenceDecisionResponse = Readonly<{
  readonly owner_id: string;
  readonly summary: string;
  readonly signals: ReadonlyArray<SignalResponse>;
  readonly metrics: ReadonlyArray<MetricResponse>;
  readonly recommendations: ReadonlyArray<RecommendationResponse>;
  readonly confidence: ConfidenceResponse;
  readonly generated_at: string;
}>;
