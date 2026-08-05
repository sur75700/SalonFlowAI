
import type { IntelligenceObservabilityMeta } from "../types/observability";

type HeaderBag = Readonly<{
  get?: (name: string) => unknown;
}> & Readonly<Record<string, unknown>>;

const MAX_ID_LENGTH = 128;
const SAFE_ID = /^[A-Za-z0-9._:-]+$/;

const EMPTY_META: IntelligenceObservabilityMeta = Object.freeze({
  requestId: null,
  correlationId: null,
  decisionId: null,
});

const metadataByDecision = new WeakMap<object, IntelligenceObservabilityMeta>();

function normalizeId(value: unknown): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    typeof candidate !== "string" ||
    candidate.length < 1 ||
    candidate.length > MAX_ID_LENGTH ||
    !SAFE_ID.test(candidate)
  ) {
    return null;
  }
  return candidate;
}

function readHeader(headers: unknown, name: string): string | null {
  if (typeof headers !== "object" || headers === null) {
    return null;
  }

  const bag = headers as HeaderBag;
  const direct = bag[name] ?? bag[name.toLowerCase()];
  const viaGetter =
    typeof bag.get === "function" ? bag.get(name) : undefined;

  return normalizeId(viaGetter ?? direct);
}

export function extractIntelligenceObservability(
  headers: unknown,
): IntelligenceObservabilityMeta {
  return Object.freeze({
    requestId: readHeader(headers, "X-Request-ID"),
    correlationId: readHeader(headers, "X-Correlation-ID"),
    decisionId: readHeader(headers, "X-Decision-ID"),
  });
}

export function rememberIntelligenceObservability<T extends object>(
  decision: T,
  headers: unknown,
): T {
  metadataByDecision.set(
    decision,
    extractIntelligenceObservability(headers),
  );
  return decision;
}

export function getIntelligenceObservability(
  decision: unknown,
): IntelligenceObservabilityMeta {
  if (
    (typeof decision !== "object" || decision === null) &&
    typeof decision !== "function"
  ) {
    return EMPTY_META;
  }
  return metadataByDecision.get(decision as object) ?? EMPTY_META;
}
