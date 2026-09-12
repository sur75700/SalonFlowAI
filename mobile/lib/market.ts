import { api, authHeaders } from "./api";

export type MarketQuoteState = "FRESH" | "STALE" | "UNAVAILABLE";
export type MarketAssetClass = "FIAT" | "MARKET_ASSET";
export type MarketChangeType = "ABSOLUTE" | "PERCENT";
export type MarketPair = "USD/AMD" | "EUR/AMD" | "RUB/AMD" | "BTC/USD";

export type MarketQuote = Readonly<{
  pair: MarketPair;
  base_currency: string;
  quote_currency: string;
  asset_class: MarketAssetClass;
  rate: number | null;
  change: number | null;
  change_type: MarketChangeType;
  state: MarketQuoteState;
  source: "CBA" | "COINBASE";
  source_timestamp: string | null;
  fetched_at: string;
}>;

export type MarketPulseResponse = Readonly<{
  quotes: readonly MarketQuote[];
  generated_at: string;
}>;

export class MarketPulseRequestError extends Error {
  readonly authFailure: boolean;
  readonly status: number | null;
  readonly sourceError: unknown;

  constructor(
    message: string,
    options: Readonly<{
      authFailure: boolean;
      status: number | null;
      sourceError: unknown;
    }>,
  ) {
    super(message);
    this.name = "MarketPulseRequestError";
    this.authFailure = options.authFailure;
    this.status = options.status;
    this.sourceError = options.sourceError;
  }
}

const EXPECTED_PAIRS: readonly MarketPair[] = [
  "USD/AMD",
  "EUR/AMD",
  "RUB/AMD",
  "BTC/USD",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readHttpStatus(error: unknown): number | null {
  if (!isRecord(error) || !isRecord(error.response)) return null;
  const status = error.response.status;
  return typeof status === "number" && Number.isInteger(status) ? status : null;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${path} must be a non-empty string`);
  }
  return value;
}

function requireDateTime(value: unknown, path: string): string {
  const text = requireString(value, path);
  if (Number.isNaN(Date.parse(text)) || !/(?:Z|[+-]\d{2}:\d{2})$/.test(text)) {
    throw new TypeError(`${path} must be a timezone-aware ISO date-time`);
  }
  return text;
}

function optionalFiniteNumber(value: unknown, path: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${path} must be finite or null`);
  }
  return value;
}

function parseQuote(value: unknown, index: number): MarketQuote {
  if (!isRecord(value)) throw new TypeError(`quotes[${index}] must be an object`);
  const pair = value.pair;
  if (!EXPECTED_PAIRS.includes(pair as MarketPair)) {
    throw new TypeError(`quotes[${index}].pair is unsupported`);
  }
  const state = value.state;
  if (state !== "FRESH" && state !== "STALE" && state !== "UNAVAILABLE") {
    throw new TypeError(`quotes[${index}].state is unsupported`);
  }
  const assetClass = value.asset_class;
  if (assetClass !== "FIAT" && assetClass !== "MARKET_ASSET") {
    throw new TypeError(`quotes[${index}].asset_class is unsupported`);
  }
  const changeType = value.change_type;
  if (changeType !== "ABSOLUTE" && changeType !== "PERCENT") {
    throw new TypeError(`quotes[${index}].change_type is unsupported`);
  }
  const source = value.source;
  if (source !== "CBA" && source !== "COINBASE") {
    throw new TypeError(`quotes[${index}].source is unsupported`);
  }

  const rate = optionalFiniteNumber(value.rate, `quotes[${index}].rate`);
  const change = optionalFiniteNumber(value.change, `quotes[${index}].change`);
  const sourceTimestamp =
    value.source_timestamp === null
      ? null
      : requireDateTime(value.source_timestamp, `quotes[${index}].source_timestamp`);
  const fetchedAt = requireDateTime(value.fetched_at, `quotes[${index}].fetched_at`);

  if (state === "UNAVAILABLE") {
    if (rate !== null || sourceTimestamp !== null) {
      throw new TypeError(`quotes[${index}] unavailable quote carries market data`);
    }
  } else if (rate === null || rate <= 0 || sourceTimestamp === null) {
    throw new TypeError(`quotes[${index}] available quote is incomplete`);
  }

  const base = requireString(value.base_currency, `quotes[${index}].base_currency`);
  const quote = requireString(value.quote_currency, `quotes[${index}].quote_currency`);
  const expectedSource = pair === "BTC/USD" ? "COINBASE" : "CBA";
  const expectedClass = pair === "BTC/USD" ? "MARKET_ASSET" : "FIAT";
  const expectedChangeType = pair === "BTC/USD" ? "PERCENT" : "ABSOLUTE";
  if (source !== expectedSource || assetClass !== expectedClass || changeType !== expectedChangeType) {
    throw new TypeError(`quotes[${index}] provider semantics are invalid`);
  }

  return Object.freeze({
    pair: pair as MarketPair,
    base_currency: base,
    quote_currency: quote,
    asset_class: assetClass,
    rate,
    change,
    change_type: changeType,
    state,
    source,
    source_timestamp: sourceTimestamp,
    fetched_at: fetchedAt,
  });
}

export function parseMarketPulseResponse(value: unknown): MarketPulseResponse {
  if (!isRecord(value) || !Array.isArray(value.quotes)) {
    throw new TypeError("Market Pulse response must contain quotes");
  }
  if (value.quotes.length !== EXPECTED_PAIRS.length) {
    throw new TypeError("Market Pulse response must contain four canonical quotes");
  }
  const quotes = value.quotes.map(parseQuote);
  quotes.forEach((quote, index) => {
    if (quote.pair !== EXPECTED_PAIRS[index]) {
      throw new TypeError("Market Pulse quote order is non-canonical");
    }
  });
  return Object.freeze({
    quotes: Object.freeze(quotes),
    generated_at: requireDateTime(value.generated_at, "generated_at"),
  });
}

export async function fetchMarketPulse(
  token: string,
  signal?: AbortSignal,
): Promise<MarketPulseResponse> {
  if (!token.trim()) {
    throw new MarketPulseRequestError("Authentication is required", {
      authFailure: true,
      status: 401,
      sourceError: null,
    });
  }
  try {
    const response = await api.get<unknown>("/market/pulse", {
      headers: authHeaders(token),
      signal,
    });
    return parseMarketPulseResponse(response.data);
  } catch (error) {
    if (signal?.aborted) throw error;
    const status = readHttpStatus(error);
    const authFailure = status === 401 || status === 403;
    throw new MarketPulseRequestError(
      authFailure ? "Market Pulse session is unavailable" : "Unable to load Market Pulse",
      { authFailure, status, sourceError: error },
    );
  }
}
