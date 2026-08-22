import {
  api,
  authHeaders,
  isAuthError,
} from "../api";
import {
  assertReportCatalog,
  assertReportDocument,
} from "./contracts";
import type {
  ReportCatalog,
  ReportDocument,
  ReportFormat,
  ReportQuery,
  ReportType,
} from "./contracts";

export type ReportApiError = Error & {
  status?: number;
  code?: string;
  auth?: boolean;
  forbidden?: boolean;
};

function encodePair(
  key: string,
  value: string,
): string {
  return (
    `${encodeURIComponent(key)}=` +
    encodeURIComponent(value)
  );
}

export function buildReportQueryString(
  query: ReportQuery,
): string {
  const pairs: string[] = [];

  const append = (
    key: string,
    value: string | undefined,
  ) => {
    if (value !== undefined) {
      pairs.push(encodePair(key, value));
    }
  };

  const appendMany = (
    key: string,
    values: readonly string[] | undefined,
  ) => {
    values?.forEach((value) => {
      pairs.push(encodePair(key, value));
    });
  };

  append("start_date", query.startDate);
  append("end_date", query.endDate);
  append("locale", query.locale);

  appendMany("status", query.status);
  appendMany("client_id", query.clientId);
  appendMany("service_id", query.serviceId);

  append("currency", query.currency);

  return pairs.join("&");
}

function withQuery(
  path: string,
  query: ReportQuery,
): string {
  const serialized = buildReportQueryString(query);

  return serialized
    ? `${path}?${serialized}`
    : path;
}

export function buildReportPreviewPath(
  reportType: ReportType,
  query: ReportQuery,
): string {
  return withQuery(
    `/reports/v2/${reportType}/preview`,
    query,
  );
}

export function buildReportExportPath(
  reportType: ReportType,
  format: ReportFormat,
  query: ReportQuery,
): string {
  return withQuery(
    `/reports/v2/${reportType}/${format}`,
    query,
  );
}

function detailFromResponseData(
  data: unknown,
): {
  code?: string;
  message?: string;
} {
  if (
    typeof data !== "object" ||
    data === null
  ) {
    return {};
  }

  const detail = (
    data as Record<string, unknown>
  ).detail;

  if (typeof detail === "string") {
    return {
      code: detail,
      message: detail,
    };
  }

  if (
    typeof detail === "object" &&
    detail !== null &&
    !Array.isArray(detail)
  ) {
    const record =
      detail as Record<string, unknown>;

    return {
      code:
        typeof record.code === "string"
          ? record.code
          : undefined,
      message:
        typeof record.message === "string"
          ? record.message
          : typeof record.code === "string"
            ? record.code
            : undefined,
    };
  }

  return {};
}

export function normalizeReportApiError(
  error: unknown,
  fallbackMessage = "Report request failed",
): ReportApiError {
  const candidate =
    error as {
      response?: {
        status?: number;
        data?: unknown;
      };
      message?: string;
    };

  const status = candidate?.response?.status;
  const detail = detailFromResponseData(
    candidate?.response?.data,
  );

  const normalized = new Error(
    detail.message ||
      candidate?.message ||
      fallbackMessage,
  ) as ReportApiError;

  normalized.status = status;
  normalized.code = detail.code;

  const sharedAuthClassification =
    isAuthError(error);

  normalized.auth =
    sharedAuthClassification &&
    status === 401;

  normalized.forbidden =
    status === 403;

  return normalized;
}

export async function fetchReportCatalog(
  token: string,
): Promise<ReportCatalog> {
  try {
    const response = await api.get<unknown>(
      "/reports/v2/catalog",
      {
        headers: authHeaders(token),
      },
    );

    assertReportCatalog(response.data);

    return response.data;
  } catch (error) {
    throw normalizeReportApiError(
      error,
      "Failed to load report catalog",
    );
  }
}

export async function fetchReportPreview(
  token: string,
  reportType: ReportType,
  query: ReportQuery,
): Promise<ReportDocument> {
  try {
    const response = await api.get<unknown>(
      buildReportPreviewPath(
        reportType,
        query,
      ),
      {
        headers: authHeaders(token),
      },
    );

    assertReportDocument(response.data);

    return response.data;
  } catch (error) {
    throw normalizeReportApiError(
      error,
      "Failed to load report preview",
    );
  }
}
