import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import {
  API_BASE_URL,
  authHeaders,
} from "../api";
import {
  buildReportExportPath,
  normalizeReportApiError,
} from "./api";
import type {
  ReportFormat,
  ReportQuery,
  ReportType,
} from "./contracts";

const MIME_TYPES: Record<ReportFormat, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  xlsx:
    "application/vnd.openxmlformats-officedocument." +
    "spreadsheetml.sheet",
  docx:
    "application/vnd.openxmlformats-officedocument." +
    "wordprocessingml.document",
};

export type ReportDownloadResult = {
  filename: string;
  platform: "web" | "native";
  shared: boolean;
  uri?: string;
};

function headersRecord(
  token: string,
): Record<string, string> {
  return authHeaders(token) as Record<
    string,
    string
  >;
}

function headerValue(
  headers: Record<string, unknown> | undefined,
  wanted: string,
): string | undefined {
  if (!headers) return undefined;

  const match = Object.entries(headers).find(
    ([name]) =>
      name.toLowerCase() === wanted.toLowerCase(),
  );

  return typeof match?.[1] === "string"
    ? match[1]
    : undefined;
}

export function filenameFromContentDisposition(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;

  const utf8 = value.match(
    /filename\*=UTF-8''([^;]+)/i,
  );

  if (utf8?.[1]) {
    try {
      return decodeURIComponent(
        utf8[1].replace(/^["']|["']$/g, ""),
      );
    } catch {
      return utf8[1].replace(
        /^["']|["']$/g,
        "",
      );
    }
  }

  const plain = value.match(
    /filename\s*=\s*"([^"]+)"/i,
  );

  if (plain?.[1]) return plain[1];

  const unquoted = value.match(
    /filename\s*=\s*([^;]+)/i,
  );

  return unquoted?.[1]?.trim().replace(
    /^["']|["']$/g,
    "",
  );
}

function fallbackFilename(
  reportType: ReportType,
  format: ReportFormat,
  query: ReportQuery,
): string {
  const start = query.startDate || "report";
  const end = query.endDate || start;
  const locale = query.locale || "en";

  return (
    `salonflow_${reportType}_` +
    `${start}_${end}_${locale}.${format}`
  );
}

async function parseFetchFailure(
  response: Response,
): Promise<never> {
  const raw = await response.text();

  let data: unknown = raw;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw
      ? { detail: raw }
      : null;
  }

  throw normalizeReportApiError(
    {
      response: {
        status: response.status,
        data,
      },
    },
    "Failed to export report",
  );
}

export async function downloadReportExport(
  token: string,
  reportType: ReportType,
  format: ReportFormat,
  query: ReportQuery,
): Promise<ReportDownloadResult> {
  const relativePath = buildReportExportPath(
    reportType,
    format,
    query,
  );

  const url = `${API_BASE_URL}${relativePath}`;
  const headers = headersRecord(token);
  const fallback = fallbackFilename(
    reportType,
    format,
    query,
  );

  if (Platform.OS === "web") {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return parseFetchFailure(response);
    }

    const blob = await response.blob();

    const filename =
      filenameFromContentDisposition(
        response.headers.get(
          "content-disposition",
        ),
      ) || fallback;

    const blobUrl =
      window.URL.createObjectURL(blob);

    try {
      const anchor =
        document.createElement("a");

      anchor.href = blobUrl;
      anchor.download = filename;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      window.URL.revokeObjectURL(blobUrl);
    }

    return {
      filename,
      platform: "web",
      shared: false,
    };
  }

  if (!FileSystem.documentDirectory) {
    throw new Error(
      "Report document directory is unavailable",
    );
  }

  const localUri =
    FileSystem.documentDirectory + fallback;

  const result = await FileSystem.downloadAsync(
    url,
    localUri,
    {
      headers,
    },
  );

  if (
    result.status < 200 ||
    result.status >= 300
  ) {
    let data: unknown = {
      detail: "Report export failed",
    };

    try {
      const raw =
        await FileSystem.readAsStringAsync(
          result.uri,
        );

      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = {
            detail: raw,
          };
        }
      }
    } catch {
      data = {
        detail: "Report export failed",
      };
    }

    throw normalizeReportApiError(
      {
        response: {
          status: result.status,
          data,
        },
      },
      "Failed to export report",
    );
  }

  const filename =
    filenameFromContentDisposition(
      headerValue(
        result.headers as Record<
          string,
          unknown
        >,
        "content-disposition",
      ),
    ) || fallback;

  const canShare =
    await Sharing.isAvailableAsync();

  if (!canShare) {
    return {
      filename,
      platform: "native",
      shared: false,
      uri: result.uri,
    };
  }

  await Sharing.shareAsync(result.uri, {
    mimeType: MIME_TYPES[format],
    dialogTitle:
      `SalonFlowAI ${format.toUpperCase()} report`,
  });

  return {
    filename,
    platform: "native",
    shared: true,
    uri: result.uri,
  };
}
