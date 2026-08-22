export const REPORT_TYPES = [
  "daily-summary",
  "appointments",
  "revenue-summary",
  "client-summary",
  "service-performance",
  "capacity-utilization",
] as const;

export const REPORT_FORMATS = [
  "pdf",
  "txt",
  "csv",
  "xlsx",
  "docx",
] as const;

export const REPORT_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
] as const;

export const REPORT_FIAT_CURRENCIES = [
  "AMD",
  "USD",
  "EUR",
  "RUB",
] as const;

export const REPORT_LOCALES = [
  "en",
  "hy",
  "ru",
  "fr",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
export type ReportFormat = (typeof REPORT_FORMATS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportFiatCurrency =
  (typeof REPORT_FIAT_CURRENCIES)[number];
export type ReportLocale = (typeof REPORT_LOCALES)[number];

export type ReportFilterName =
  | "status"
  | "client_id"
  | "service_id";

export type ReportPeriodMode =
  | "single_calendar_date"
  | "inclusive_calendar_date_range";

export type ReportCurrencyMode =
  | "not_applicable"
  | "required_fiat";

export type ReportCatalogEntry = {
  report_type: ReportType;
  title_key: string;
  period: ReportPeriodMode;
  filters: ReportFilterName[];
  currency_mode: ReportCurrencyMode;
};

export type ReportCatalogLimits = {
  preview_rows: number;
  export_rows: number;
  range_days: number;
  maximum_values_per_filter: number;
};

export type ReportCatalog = {
  schema_version: number;
  report_types: ReportCatalogEntry[];
  formats: ReportFormat[];
  limits: ReportCatalogLimits;
  status_values: ReportStatus[];
  date_semantics: {
    input: string;
    range: string;
    mongo: string;
    daily_default: string;
  };
  money: {
    fiat_report_currencies: ReportFiatCurrency[];
    report_currency_semantics: string;
    market_assets: {
      code: string;
      atomic_unit: string;
      atomic_units_per_asset: number;
      report_currency: boolean;
      live_quotes: string;
    }[];
  };
  saved_history: boolean;
  report_type_count: number;
};

export type ReportPeriod = {
  start_date: string;
  end_date: string;
  timezone: string;
  start_utc: string;
  end_utc: string;
};

export type ReportDocument = {
  schema_version: number;
  report_type: ReportType;
  title_key: string;
  period: ReportPeriod;
  locale: ReportLocale;
  generated_at: string;
  applied_filters: Record<string, unknown>;
  metrics: Record<string, unknown>;
  columns: string[];
  rows: unknown[][];
  warnings: string[];
  total_rows: number;
};

export type ReportQuery = {
  startDate?: string;
  endDate?: string;
  locale?: ReportLocale;
  status?: ReportStatus[];
  clientId?: string[];
  serviceId?: string[];
  currency?: ReportFiatCurrency;
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

export function isReportType(
  value: unknown,
): value is ReportType {
  return (
    typeof value === "string" &&
    (REPORT_TYPES as readonly string[]).includes(value)
  );
}

export function isReportFormat(
  value: unknown,
): value is ReportFormat {
  return (
    typeof value === "string" &&
    (REPORT_FORMATS as readonly string[]).includes(value)
  );
}

export function isReportStatus(
  value: unknown,
): value is ReportStatus {
  return (
    typeof value === "string" &&
    (REPORT_STATUSES as readonly string[]).includes(value)
  );
}

export function isReportFiatCurrency(
  value: unknown,
): value is ReportFiatCurrency {
  return (
    typeof value === "string" &&
    (REPORT_FIAT_CURRENCIES as readonly string[]).includes(
      value,
    )
  );
}

export function isReportLocale(
  value: unknown,
): value is ReportLocale {
  return (
    typeof value === "string" &&
    (REPORT_LOCALES as readonly string[]).includes(value)
  );
}

function isReportFilterName(
  value: unknown,
): value is ReportFilterName {
  return (
    value === "status" ||
    value === "client_id" ||
    value === "service_id"
  );
}

function assertPositiveInteger(
  value: unknown,
  name: string,
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `Invalid report contract field: ${name}`,
    );
  }
}

export function assertReportCatalog(
  value: unknown,
): asserts value is ReportCatalog {
  if (!isRecord(value)) {
    throw new Error("Invalid reports catalog");
  }

  if (value.schema_version !== 1) {
    throw new Error("Unsupported reports catalog schema");
  }

  if (!Array.isArray(value.report_types)) {
    throw new Error("Invalid reports catalog report_types");
  }

  for (const item of value.report_types) {
    if (!isRecord(item)) {
      throw new Error("Invalid report catalog entry");
    }

    if (!isReportType(item.report_type)) {
      throw new Error("Invalid report type");
    }

    if (!isNonEmptyString(item.title_key)) {
      throw new Error("Invalid report title key");
    }

    if (
      item.period !== "single_calendar_date" &&
      item.period !== "inclusive_calendar_date_range"
    ) {
      throw new Error("Invalid report period mode");
    }

    if (
      !Array.isArray(item.filters) ||
      !item.filters.every(isReportFilterName)
    ) {
      throw new Error("Invalid report filter matrix");
    }

    if (
      item.currency_mode !== "not_applicable" &&
      item.currency_mode !== "required_fiat"
    ) {
      throw new Error("Invalid report currency mode");
    }
  }

  if (
    !Array.isArray(value.formats) ||
    !value.formats.every(isReportFormat)
  ) {
    throw new Error("Invalid reports formats");
  }

  if (
    !Array.isArray(value.status_values) ||
    !value.status_values.every(isReportStatus)
  ) {
    throw new Error("Invalid report status values");
  }

  if (!isRecord(value.limits)) {
    throw new Error("Invalid reports limits");
  }

  assertPositiveInteger(
    value.limits.preview_rows,
    "limits.preview_rows",
  );
  assertPositiveInteger(
    value.limits.export_rows,
    "limits.export_rows",
  );
  assertPositiveInteger(
    value.limits.range_days,
    "limits.range_days",
  );
  assertPositiveInteger(
    value.limits.maximum_values_per_filter,
    "limits.maximum_values_per_filter",
  );

  if (!isRecord(value.date_semantics)) {
    throw new Error("Invalid report date semantics");
  }

  for (const field of [
    "input",
    "range",
    "mongo",
    "daily_default",
  ] as const) {
    if (!isNonEmptyString(value.date_semantics[field])) {
      throw new Error(
        `Invalid report date semantics: ${field}`,
      );
    }
  }

  if (!isRecord(value.money)) {
    throw new Error("Invalid report money contract");
  }

  if (
    !Array.isArray(value.money.fiat_report_currencies) ||
    !value.money.fiat_report_currencies.every(
      isReportFiatCurrency,
    )
  ) {
    throw new Error("Invalid fiat report currencies");
  }

  if (
    !isNonEmptyString(
      value.money.report_currency_semantics,
    )
  ) {
    throw new Error(
      "Invalid report currency semantics",
    );
  }

  if (!Array.isArray(value.money.market_assets)) {
    throw new Error("Invalid report market assets");
  }

  if (typeof value.saved_history !== "boolean") {
    throw new Error("Invalid saved history contract");
  }

  assertPositiveInteger(
    value.report_type_count,
    "report_type_count",
  );

  if (
    value.report_type_count !== value.report_types.length
  ) {
    throw new Error("Report type count mismatch");
  }
}

function assertReportPeriod(
  value: unknown,
): asserts value is ReportPeriod {
  if (!isRecord(value)) {
    throw new Error("Invalid report period");
  }

  for (const field of [
    "start_date",
    "end_date",
    "timezone",
    "start_utc",
    "end_utc",
  ] as const) {
    if (!isNonEmptyString(value[field])) {
      throw new Error(
        `Invalid report period field: ${field}`,
      );
    }
  }
}

export function assertReportDocument(
  value: unknown,
): asserts value is ReportDocument {
  if (!isRecord(value)) {
    throw new Error("Invalid report document");
  }

  if ("owner_id" in value) {
    throw new Error(
      "Private owner_id must not appear in public report",
    );
  }

  if (value.schema_version !== 1) {
    throw new Error("Unsupported report schema");
  }

  if (!isReportType(value.report_type)) {
    throw new Error("Invalid report document type");
  }

  if (!isNonEmptyString(value.title_key)) {
    throw new Error("Invalid report document title key");
  }

  if (!isReportLocale(value.locale)) {
    throw new Error("Invalid report locale");
  }

  if (!isNonEmptyString(value.generated_at)) {
    throw new Error("Invalid generated_at");
  }

  assertReportPeriod(value.period);

  if (!isRecord(value.applied_filters)) {
    throw new Error("Invalid applied filters");
  }

  if (!isRecord(value.metrics)) {
    throw new Error("Invalid report metrics");
  }

  if (!isStringArray(value.columns)) {
    throw new Error("Invalid report columns");
  }

  const columns = value.columns;

  if (
    !Array.isArray(value.rows) ||
    !value.rows.every(
      (row) =>
        Array.isArray(row) &&
        row.length === columns.length,
    )
  ) {
    throw new Error("Invalid report rows");
  }

  if (!isStringArray(value.warnings)) {
    throw new Error("Invalid report warnings");
  }

  assertPositiveInteger(
    value.total_rows,
    "total_rows",
  );

  // Preview responses can be row-limited while total_rows
  // remains the authoritative canonical count.
  if (value.rows.length > value.total_rows) {
    throw new Error(
      "Preview rows exceed canonical total_rows",
    );
  }
}

export function findReportDefinition(
  catalog: ReportCatalog,
  reportType: ReportType,
): ReportCatalogEntry {
  const definition = catalog.report_types.find(
    (item) => item.report_type === reportType,
  );

  if (!definition) {
    throw new Error(
      `Report type is absent from server catalog: ${reportType}`,
    );
  }

  return definition;
}
