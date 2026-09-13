import * as React from "react";

export type RevenuePreset =
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "ytd"
  | "1y"
  | "all"
  | "custom";

export type RevenueTimeCurrency =
  | "AMD"
  | "USD"
  | "EUR"
  | "RUB";

export interface RevenueTimeSeriesPoint {
  bucket_start: string;
  bucket_end: string;
  label: string;
  value: number;
  completed_count: number;
}

export interface RevenueTimeSeriesRange {
  start_local: string;
  end_local: string;
  start_utc: string;
  end_utc: string;
}

export interface RevenueTimeSeriesSummary {
  completed_revenue: number;
  delta: number;
  delta_percent: number | null;
  completed_count: number;
}

export interface RevenueTimeSeriesData {
  contract_version?: string;
  preset: RevenuePreset;
  currency: RevenueTimeCurrency;
  timezone: string;
  timezone_source?: string;
  range: RevenueTimeSeriesRange;
  granularity: string;
  earliest_trusted_at?: string | null;
  summary: RevenueTimeSeriesSummary;
  series: RevenueTimeSeriesPoint[];
  comparison_series: RevenueTimeSeriesPoint[];
  warnings: string[];
}

export interface RevenueTimeSeriesRequestIdentity {
  preset: RevenuePreset;
  currency: RevenueTimeCurrency;
  dateFrom?: string;
  dateTo?: string;
}

export interface UseRevenueTimeSeriesOptions {
  token: string | null;
  preset: RevenuePreset;
  currency: RevenueTimeCurrency;
  dateFrom?: string;
  dateTo?: string;
  enabled?: boolean;
}

export interface UseRevenueTimeSeriesResult {
  data: RevenueTimeSeriesData | null;
  trustedRequest:
    RevenueTimeSeriesRequestIdentity | null;
  loading: boolean;
  error: string;
}

const VALID_PRESETS =
  new Set<RevenuePreset>([
    "24h",
    "7d",
    "30d",
    "90d",
    "ytd",
    "1y",
    "all",
    "custom",
  ]);

const VALID_CURRENCIES =
  new Set<RevenueTimeCurrency>([
    "AMD",
    "USD",
    "EUR",
    "RUB",
  ]);

const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}$/;

export function buildRevenueTimeSeriesParams({
  preset,
  currency,
  dateFrom,
  dateTo,
}: {
  preset: RevenuePreset;
  currency: RevenueTimeCurrency;
  dateFrom?: string;
  dateTo?: string;
}): Record<string, string | boolean> | null {
  if (
    !VALID_PRESETS.has(preset) ||
    !VALID_CURRENCIES.has(currency)
  ) {
    return null;
  }

  const params:
    Record<string, string | boolean> = {
      preset,
      currency,
      compare: true,
    };

  if (preset !== "custom") {
    return params;
  }

  const from =
    dateFrom?.trim() ?? "";

  const to =
    dateTo?.trim() ?? "";

  if (
    !ISO_DATE_RE.test(from) ||
    !ISO_DATE_RE.test(to) ||
    from > to
  ) {
    return null;
  }

  params.date_from = from;
  params.date_to = to;

  return params;
}

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isNonNegativeInteger(
  value: unknown
): value is number {
  return (
    Number.isInteger(value) &&
    Number(value) >= 0
  );
}

function isString(
  value: unknown
): value is string {
  return typeof value === "string";
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parsePoint(
  value: unknown
): RevenueTimeSeriesPoint {
  if (!isRecord(value)) {
    throw new Error(
      "Invalid revenue time-series point"
    );
  }

  const {
    bucket_start,
    bucket_end,
    label,
    value: revenueValue,
    completed_count,
  } = value;

  if (
    !isString(bucket_start) ||
    !isString(bucket_end) ||
    !isString(label) ||
    !isFiniteNumber(revenueValue) ||
    !isNonNegativeInteger(completed_count)
  ) {
    throw new Error(
      "Invalid revenue time-series point"
    );
  }

  return {
    bucket_start,
    bucket_end,
    label,
    value: revenueValue,
    completed_count,
  };
}

export function parseRevenueTimeSeriesResponse(
  value: unknown
): RevenueTimeSeriesData {
  if (!isRecord(value)) {
    throw new Error(
      "Invalid revenue time-series response"
    );
  }

  const preset =
    value.preset as RevenuePreset;

  const currency =
    value.currency as RevenueTimeCurrency;

  if (
    !VALID_PRESETS.has(preset) ||
    !VALID_CURRENCIES.has(currency)
  ) {
    throw new Error(
      "Invalid revenue time-series identity"
    );
  }

  if (
    !isString(value.timezone) ||
    !isString(value.granularity) ||
    !isRecord(value.range) ||
    !isRecord(value.summary) ||
    !Array.isArray(value.series) ||
    !Array.isArray(value.comparison_series) ||
    !Array.isArray(value.warnings)
  ) {
    throw new Error(
      "Invalid revenue time-series structure"
    );
  }

  if (
    value.series.length > 240 ||
    value.comparison_series.length > 240
  ) {
    throw new Error(
      "Revenue time-series exceeds trusted bucket bound"
    );
  }

  const range =
    value.range;

  if (
    !isString(range.start_local) ||
    !isString(range.end_local) ||
    !isString(range.start_utc) ||
    !isString(range.end_utc)
  ) {
    throw new Error(
      "Invalid revenue time-series range"
    );
  }

  const summary =
    value.summary;

  if (
    !isFiniteNumber(
      summary.completed_revenue
    ) ||
    !isFiniteNumber(summary.delta) ||
    !(
      summary.delta_percent === null ||
      isFiniteNumber(
        summary.delta_percent
      )
    ) ||
    !isNonNegativeInteger(
      summary.completed_count
    )
  ) {
    throw new Error(
      "Invalid revenue time-series summary"
    );
  }

  if (
    value.warnings.some(
      (warning) => !isString(warning)
    )
  ) {
    throw new Error(
      "Invalid revenue time-series warning"
    );
  }

  return {
    contract_version:
      isString(value.contract_version)
        ? value.contract_version
        : undefined,
    preset,
    currency,
    timezone: value.timezone,
    timezone_source:
      isString(value.timezone_source)
        ? value.timezone_source
        : undefined,
    range: {
      start_local:
        range.start_local,
      end_local:
        range.end_local,
      start_utc:
        range.start_utc,
      end_utc:
        range.end_utc,
    },
    granularity:
      value.granularity,
    earliest_trusted_at:
      value.earliest_trusted_at === null ||
      isString(
        value.earliest_trusted_at
      )
        ? value.earliest_trusted_at
        : undefined,
    summary: {
      completed_revenue:
        summary.completed_revenue,
      delta:
        summary.delta,
      delta_percent:
        summary.delta_percent,
      completed_count:
        summary.completed_count,
    },
    series:
      value.series.map(parsePoint),
    comparison_series:
      value.comparison_series.map(
        parsePoint
      ),
    warnings:
      [...value.warnings],
  };
}

function errorMessage(
  error: unknown
): string {
  if (
    isRecord(error) &&
    isRecord(error.response) &&
    isRecord(error.response.data)
  ) {
    const detail =
      error.response.data.detail;

    if (isString(detail)) {
      return detail;
    }

    if (
      isRecord(detail) &&
      isString(detail.message)
    ) {
      return detail.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Failed to load revenue history";
}

/**
 * API ownership remains in mobile/lib/api.
 *
 * Critical V2.3 boundary rule:
 * this module MUST NOT evaluate lib/api at module-load time.
 * Resolution happens only when the fetch effect actually executes.
 */
async function loadRevenueApi() {
  const module =
    await import("../lib/api");

  return module.api;
}

export function useRevenueTimeSeries({
  token,
  preset,
  currency,
  dateFrom,
  dateTo,
  enabled = true,
}: UseRevenueTimeSeriesOptions):
  UseRevenueTimeSeriesResult {
  const [
    data,
    setData,
  ] =
    React.useState<
      RevenueTimeSeriesData | null
    >(null);

  const [
    trustedRequest,
    setTrustedRequest,
  ] =
    React.useState<
      RevenueTimeSeriesRequestIdentity | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    React.useState(false);

  const [
    error,
    setError,
  ] =
    React.useState("");

  const requestIdRef =
    React.useRef(0);

  const lastTokenRef =
    React.useRef<string | null>(token);

  React.useEffect(() => {
    if (
      lastTokenRef.current !== token
    ) {
      lastTokenRef.current = token;
      setData(null);
      setTrustedRequest(null);
    }

    if (
      !enabled ||
      !token
    ) {
      setLoading(false);
      setError("");

      if (!token) {
        setData(null);
        setTrustedRequest(null);
      }

      return;
    }

    const params =
      buildRevenueTimeSeriesParams({
        preset,
        currency,
        dateFrom,
        dateTo,
      });

    if (!params) {
      setLoading(false);
      setError(
        "Invalid revenue date range"
      );
      return;
    }

    const requestIdentity:
      RevenueTimeSeriesRequestIdentity = {
        preset,
        currency,
        ...(preset === "custom"
          ? {
              dateFrom:
                dateFrom?.trim(),
              dateTo:
                dateTo?.trim(),
            }
          : {}),
      };

    const requestId =
      requestIdRef.current + 1;

    requestIdRef.current =
      requestId;

    let active = true;

    setLoading(true);
    setError("");

    void (async () => {
      try {
        const api =
          await loadRevenueApi();

        const response =
          await api.get(
            "/analytics/revenue/time-series",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              params,
            }
          );

        const trusted =
          parseRevenueTimeSeriesResponse(
            response.data
          );

        if (
          !active ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        setData(trusted);
        setTrustedRequest(
          requestIdentity
        );
        setError("");
      } catch (requestError) {
        if (
          !active ||
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        setError(
          errorMessage(
            requestError
          )
        );
      } finally {
        if (
          active &&
          requestId ===
            requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [
    token,
    preset,
    currency,
    dateFrom,
    dateTo,
    enabled,
  ]);

  return {
    data,
    trustedRequest,
    loading,
    error,
  };
}
