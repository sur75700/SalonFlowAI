import { api, authHeaders } from "./api";

export type MarketQuoteState = "FRESH" | "STALE" | "UNAVAILABLE";
export type MarketAssetClass = "FIAT" | "MARKET_ASSET";
export type MarketChangeType = "ABSOLUTE" | "PERCENT";
export type MarketPair = "USD/AMD" | "EUR/AMD" | "RUB/AMD" | "BTC/USD";
export type MarketDisplayCurrency = "AMD" | "USD" | "EUR" | "RUB" | "BTC";

export const MARKET_DISPLAY_CURRENCIES: readonly MarketDisplayCurrency[] = [
  "AMD",
  "USD",
  "EUR",
  "RUB",
  "BTC",
];

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

export type DerivedMarketRate = Readonly<{
  base_currency: MarketDisplayCurrency;
  quote_currency: MarketDisplayCurrency;
  rate: number;
  state: Exclude<MarketQuoteState, "UNAVAILABLE">;
  sources: readonly MarketQuote["source"][];
  source_pairs: readonly MarketPair[];
}>;

export type AmdMarketPanelPair =
  | "USD/AMD"
  | "EUR/AMD"
  | "RUB/AMD"
  | "BTC/AMD";

export type AmdMarketPanelQuote = Readonly<{
  pair: AmdMarketPanelPair;
  base_currency: Exclude<MarketDisplayCurrency, "AMD">;
  quote_currency: "AMD";
  asset_class: MarketAssetClass;
  rate: number | null;
  change: number | null;
  change_percent: number | null;
  state: MarketQuoteState;
  sources: readonly MarketQuote["source"][];
  source_pairs: readonly MarketPair[];
  derived: boolean;
}>;

export type ReferenceMarketPanelQuote = Readonly<{
  pair: `${MarketDisplayCurrency}/${MarketDisplayCurrency}`;
  base_currency: MarketDisplayCurrency;
  quote_currency: MarketDisplayCurrency;
  asset_class: MarketAssetClass;
  rate: number | null;
  change: number | null;
  change_percent: number | null;
  state: MarketQuoteState;
  sources: readonly MarketQuote["source"][];
  source_pairs: readonly MarketPair[];
  derived: boolean;
}>;

function percentFromAbsoluteChange(
  rate: number | null,
  change: number | null,
): number | null {
  if (rate === null || change === null) return null;
  const previousRate = rate - change;
  if (!Number.isFinite(previousRate) || previousRate === 0) return null;
  return (change / Math.abs(previousRate)) * 100;
}

function combineQuoteState(
  first: MarketQuoteState,
  second: MarketQuoteState,
): MarketQuoteState {
  if (first === "UNAVAILABLE" || second === "UNAVAILABLE") return "UNAVAILABLE";
  if (first === "STALE" || second === "STALE") return "STALE";
  return "FRESH";
}

function buildCanonicalAmdPanel(quote: MarketQuote): AmdMarketPanelQuote {
  const baseCurrency = quote.base_currency as Exclude<MarketDisplayCurrency, "AMD">;
  const sourcePairs: MarketPair[] = [quote.pair];
  const sources: MarketQuote["source"][] = [quote.source];

  return Object.freeze({
    pair: quote.pair as Exclude<AmdMarketPanelPair, "BTC/AMD">,
    base_currency: baseCurrency,
    quote_currency: "AMD" as const,
    asset_class: quote.asset_class,
    rate: quote.rate,
    change: quote.change,
    change_percent: percentFromAbsoluteChange(quote.rate, quote.change),
    state: quote.state,
    sources: Object.freeze(sources),
    source_pairs: Object.freeze(sourcePairs),
    derived: false,
  });
}

function buildBtcAmdPanel(data: MarketPulseResponse): AmdMarketPanelQuote {
  const btcUsd = data.quotes.find((quote) => quote.pair === "BTC/USD");
  const usdAmd = data.quotes.find((quote) => quote.pair === "USD/AMD");
  const sourcePairs: MarketPair[] = ["BTC/USD", "USD/AMD"];
  const sources: MarketQuote["source"][] = ["COINBASE", "CBA"];

  if (
    !btcUsd ||
    !usdAmd ||
    btcUsd.state === "UNAVAILABLE" ||
    usdAmd.state === "UNAVAILABLE" ||
    btcUsd.rate === null ||
    usdAmd.rate === null
  ) {
    return Object.freeze({
      pair: "BTC/AMD" as const,
      base_currency: "BTC" as const,
      quote_currency: "AMD" as const,
      asset_class: "MARKET_ASSET" as const,
      rate: null,
      change: null,
      change_percent: null,
      state: "UNAVAILABLE" as const,
      sources: Object.freeze(sources),
      source_pairs: Object.freeze(sourcePairs),
      derived: true,
    });
  }

  const rate = btcUsd.rate * usdAmd.rate;
  let change: number | null = null;
  let changePercent: number | null = null;

  if (btcUsd.change !== null && usdAmd.change !== null) {
    const btcPreviousFactor = 1 + btcUsd.change / 100;
    const previousUsdAmd = usdAmd.rate - usdAmd.change;

    if (
      Number.isFinite(btcPreviousFactor) &&
      btcPreviousFactor > 0 &&
      Number.isFinite(previousUsdAmd) &&
      previousUsdAmd > 0
    ) {
      const previousBtcUsd = btcUsd.rate / btcPreviousFactor;
      const previousBtcAmd = previousBtcUsd * previousUsdAmd;

      if (Number.isFinite(previousBtcAmd) && previousBtcAmd > 0) {
        change = rate - previousBtcAmd;
        changePercent = (change / previousBtcAmd) * 100;
      }
    }
  }

  return Object.freeze({
    pair: "BTC/AMD" as const,
    base_currency: "BTC" as const,
    quote_currency: "AMD" as const,
    asset_class: "MARKET_ASSET" as const,
    rate,
    change,
    change_percent: changePercent,
    state: combineQuoteState(btcUsd.state, usdAmd.state),
    sources: Object.freeze(sources),
    source_pairs: Object.freeze(sourcePairs),
    derived: true,
  });
}

export function buildAmdMarketPanels(
  data: MarketPulseResponse,
): readonly AmdMarketPanelQuote[] {
  const usd = data.quotes.find((quote) => quote.pair === "USD/AMD");
  const eur = data.quotes.find((quote) => quote.pair === "EUR/AMD");
  const rub = data.quotes.find((quote) => quote.pair === "RUB/AMD");

  if (!usd || !eur || !rub) {
    return Object.freeze([]);
  }

  return Object.freeze([
    buildCanonicalAmdPanel(usd),
    buildCanonicalAmdPanel(eur),
    buildCanonicalAmdPanel(rub),
    buildBtcAmdPanel(data),
  ]);
}

type MarketRateEdge = Readonly<{
  from: MarketDisplayCurrency;
  to: MarketDisplayCurrency;
  rate: number;
  state: Exclude<MarketQuoteState, "UNAVAILABLE">;
  source: MarketQuote["source"];
  pair: MarketPair;
}>;

function isDisplayCurrency(value: string): value is MarketDisplayCurrency {
  return MARKET_DISPLAY_CURRENCIES.includes(value as MarketDisplayCurrency);
}

function availableRateEdges(data: MarketPulseResponse): readonly MarketRateEdge[] {
  const edges: MarketRateEdge[] = [];

  data.quotes.forEach((quote) => {
    if (
      quote.state === "UNAVAILABLE" ||
      quote.rate === null ||
      quote.rate <= 0 ||
      !isDisplayCurrency(quote.base_currency) ||
      !isDisplayCurrency(quote.quote_currency)
    ) {
      return;
    }

    const state = quote.state as Exclude<MarketQuoteState, "UNAVAILABLE">;
    edges.push({
      from: quote.base_currency,
      to: quote.quote_currency,
      rate: quote.rate,
      state,
      source: quote.source,
      pair: quote.pair,
    });
    edges.push({
      from: quote.quote_currency,
      to: quote.base_currency,
      rate: 1 / quote.rate,
      state,
      source: quote.source,
      pair: quote.pair,
    });
  });

  return edges;
}

export function deriveMarketCrossRate(
  data: MarketPulseResponse,
  baseCurrency: MarketDisplayCurrency,
  quoteCurrency: MarketDisplayCurrency,
): DerivedMarketRate | null {
  if (baseCurrency === quoteCurrency) {
    return Object.freeze({
      base_currency: baseCurrency,
      quote_currency: quoteCurrency,
      rate: 1,
      state: "FRESH",
      sources: Object.freeze([]),
      source_pairs: Object.freeze([]),
    });
  }

  const edges = availableRateEdges(data);
  type Candidate = Readonly<{
    currency: MarketDisplayCurrency;
    rate: number;
    state: Exclude<MarketQuoteState, "UNAVAILABLE">;
    sources: readonly MarketQuote["source"][];
    sourcePairs: readonly MarketPair[];
  }>;

  const queue: Candidate[] = [{
    currency: baseCurrency,
    rate: 1,
    state: "FRESH",
    sources: [],
    sourcePairs: [],
  }];
  const visited = new Set<MarketDisplayCurrency>([baseCurrency]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const nextEdges = edges.filter((edge) => edge.from === current.currency);
    for (const edge of nextEdges) {
      if (visited.has(edge.to)) continue;

      const nextState =
        current.state === "STALE" || edge.state === "STALE" ? "STALE" : "FRESH";
      const nextSources = current.sources.includes(edge.source)
        ? current.sources
        : [...current.sources, edge.source];
      const nextPairs = current.sourcePairs.includes(edge.pair)
        ? current.sourcePairs
        : [...current.sourcePairs, edge.pair];
      const nextRate = current.rate * edge.rate;

      if (!Number.isFinite(nextRate) || nextRate <= 0) continue;

      if (edge.to === quoteCurrency) {
        return Object.freeze({
          base_currency: baseCurrency,
          quote_currency: quoteCurrency,
          rate: nextRate,
          state: nextState,
          sources: Object.freeze([...nextSources]),
          source_pairs: Object.freeze([...nextPairs]),
        });
      }

      visited.add(edge.to);
      queue.push({
        currency: edge.to,
        rate: nextRate,
        state: nextState,
        sources: nextSources,
        sourcePairs: nextPairs,
      });
    }
  }

  return null;
}

function previousCanonicalRate(quote: MarketQuote): number | null {
  if (quote.state === "UNAVAILABLE" || quote.rate === null || quote.change === null) {
    return null;
  }

  const previousRate =
    quote.change_type === "PERCENT"
      ? quote.rate / (1 + quote.change / 100)
      : quote.rate - quote.change;

  return Number.isFinite(previousRate) && previousRate > 0 ? previousRate : null;
}

function buildPreviousMarketPulseResponse(
  data: MarketPulseResponse,
): MarketPulseResponse {
  return Object.freeze({
    generated_at: data.generated_at,
    quotes: Object.freeze(
      data.quotes.map((quote) => {
        const previousRate = previousCanonicalRate(quote);
        if (previousRate === null) {
          return Object.freeze({
            ...quote,
            rate: null,
            change: null,
            state: "UNAVAILABLE" as const,
            source_timestamp: null,
          });
        }

        return Object.freeze({
          ...quote,
          rate: previousRate,
          change: null,
        });
      }),
    ),
  });
}

export function buildReferenceMarketPanels(
  data: MarketPulseResponse,
  referenceCurrency: MarketDisplayCurrency,
): readonly ReferenceMarketPanelQuote[] {
  const previousData = buildPreviousMarketPulseResponse(data);

  return Object.freeze(
    MARKET_DISPLAY_CURRENCIES
      .filter((currency) => currency !== referenceCurrency)
      .map<ReferenceMarketPanelQuote>((baseCurrency) => {
        const current = deriveMarketCrossRate(
          data,
          baseCurrency,
          referenceCurrency,
        );
        const previous = deriveMarketCrossRate(
          previousData,
          baseCurrency,
          referenceCurrency,
        );
        const directCanonical = data.quotes.some(
          (quote) =>
            quote.base_currency === baseCurrency &&
            quote.quote_currency === referenceCurrency,
        );

        if (!current) {
          return Object.freeze({
            pair: `${baseCurrency}/${referenceCurrency}` as ReferenceMarketPanelQuote["pair"],
            base_currency: baseCurrency,
            quote_currency: referenceCurrency,
            asset_class:
              baseCurrency === "BTC" || referenceCurrency === "BTC"
                ? "MARKET_ASSET" as const
                : "FIAT" as const,
            rate: null,
            change: null,
            change_percent: null,
            state: "UNAVAILABLE" as const,
            sources: Object.freeze([]),
            source_pairs: Object.freeze([]),
            derived: !directCanonical,
          });
        }

        const change = previous ? current.rate - previous.rate : null;
        const changePercent =
          change !== null && previous && previous.rate > 0
            ? (change / previous.rate) * 100
            : null;

        return Object.freeze({
          pair: `${baseCurrency}/${referenceCurrency}` as ReferenceMarketPanelQuote["pair"],
          base_currency: baseCurrency,
          quote_currency: referenceCurrency,
          asset_class:
            baseCurrency === "BTC" || referenceCurrency === "BTC"
              ? "MARKET_ASSET" as const
              : "FIAT" as const,
          rate: current.rate,
          change,
          change_percent: changePercent,
          state: current.state,
          sources: current.sources,
          source_pairs: current.source_pairs,
          derived: !directCanonical,
        });
      }),
  );
}

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
  const [expectedBase, expectedQuote] = String(pair).split("/");
  if (base !== expectedBase || quote !== expectedQuote) {
    throw new TypeError(`quotes[${index}] currency semantics are invalid`);
  }
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
