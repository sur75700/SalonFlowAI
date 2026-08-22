import {
  REPORT_FORMATS,
  REPORT_TYPES,
  assertReportCatalog,
  assertReportDocument,
} from "../../lib/reports/contracts";
import {
  buildReportExportPath,
  buildReportPreviewPath,
  buildReportQueryString,
  normalizeReportApiError,
} from "../../lib/reports/api";

jest.mock("../../lib/api", () => ({
  api: {
    get: jest.fn(),
  },
  authHeaders: (token?: string) =>
    token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  isAuthError: (
    error: {
      response?: {
        status?: number;
      };
    },
  ) => {
    const status = error?.response?.status;

    return status === 401 || status === 403;
  },
}));

const catalogFixture = {
  schema_version: 1,
  report_types: [
    {
      report_type: "daily-summary",
      title_key: "reports.daily_summary.title",
      period: "single_calendar_date",
      filters: [
        "status",
        "client_id",
        "service_id",
      ],
      currency_mode: "not_applicable",
    },
    {
      report_type: "appointments",
      title_key: "reports.appointments.title",
      period:
        "inclusive_calendar_date_range",
      filters: [
        "status",
        "client_id",
        "service_id",
      ],
      currency_mode: "not_applicable",
    },
    {
      report_type: "revenue-summary",
      title_key:
        "reports.revenue_summary.title",
      period:
        "inclusive_calendar_date_range",
      filters: [],
      currency_mode: "required_fiat",
    },
    {
      report_type: "client-summary",
      title_key:
        "reports.client_summary.title",
      period:
        "inclusive_calendar_date_range",
      filters: [],
      currency_mode: "required_fiat",
    },
    {
      report_type: "service-performance",
      title_key:
        "reports.service_performance.title",
      period:
        "inclusive_calendar_date_range",
      filters: ["service_id"],
      currency_mode: "required_fiat",
    },
    {
      report_type: "capacity-utilization",
      title_key:
        "reports.capacity_utilization.title",
      period:
        "inclusive_calendar_date_range",
      filters: [],
      currency_mode: "not_applicable",
    },
  ],
  formats: [
    "pdf",
    "txt",
    "csv",
    "xlsx",
    "docx",
  ],
  limits: {
    preview_rows: 100,
    export_rows: 10000,
    range_days: 366,
    maximum_values_per_filter: 50,
  },
  status_values: [
    "scheduled",
    "completed",
    "cancelled",
  ],
  date_semantics: {
    input: "YYYY-MM-DD",
    range:
      "inclusive_local_calendar_dates",
    mongo:
      "start_utc_inclusive_end_utc_exclusive",
    daily_default:
      "owner_local_today_when_dates_omitted",
  },
  money: {
    fiat_report_currencies: [
      "AMD",
      "USD",
      "EUR",
      "RUB",
    ],
    report_currency_semantics:
      "explicit_original_currency_no_automatic_conversion",
    market_assets: [
      {
        code: "BTC",
        atomic_unit: "satoshi",
        atomic_units_per_asset: 100000000,
        report_currency: false,
        live_quotes: "deferred_dashboard",
      },
    ],
  },
  saved_history: false,
  report_type_count: 6,
};

describe("Phase 63D report client contract", () => {
  test("accepts the frozen backend catalog shape", () => {
    expect(() =>
      assertReportCatalog(catalogFixture),
    ).not.toThrow();

    expect(REPORT_TYPES).toHaveLength(6);
    expect(REPORT_FORMATS).toEqual([
      "pdf",
      "txt",
      "csv",
      "xlsx",
      "docx",
    ]);
  });

  test("serializes repeated FastAPI query keys without brackets", () => {
    expect(
      buildReportQueryString({
        startDate: "2026-08-01",
        endDate: "2026-08-22",
        locale: "hy",
        status: [
          "scheduled",
          "completed",
        ],
        clientId: ["abc", "def"],
        serviceId: ["service-1"],
        currency: "AMD",
      }),
    ).toBe(
      "start_date=2026-08-01" +
        "&end_date=2026-08-22" +
        "&locale=hy" +
        "&status=scheduled" +
        "&status=completed" +
        "&client_id=abc" +
        "&client_id=def" +
        "&service_id=service-1" +
        "&currency=AMD",
    );
  });

  test("builds canonical preview and export paths", () => {
    expect(
      buildReportPreviewPath(
        "appointments",
        {
          startDate: "2026-08-01",
          endDate: "2026-08-22",
          locale: "en",
        },
      ),
    ).toBe(
      "/reports/v2/appointments/preview" +
        "?start_date=2026-08-01" +
        "&end_date=2026-08-22" +
        "&locale=en",
    );

    expect(
      buildReportExportPath(
        "service-performance",
        "xlsx",
        {
          startDate: "2026-08-01",
          endDate: "2026-08-22",
          locale: "fr",
          serviceId: ["507f1f77bcf86cd799439011"],
          currency: "EUR",
        },
      ),
    ).toContain(
      "/reports/v2/service-performance/xlsx?",
    );
  });

  test("accepts preview truncation while preserving total_rows", () => {
    const preview = {
      schema_version: 1,
      report_type: "appointments",
      title_key: "reports.appointments.title",
      period: {
        start_date: "2026-08-01",
        end_date: "2026-08-22",
        timezone: "Asia/Yerevan",
        start_utc:
          "2026-07-31T20:00:00Z",
        end_utc:
          "2026-08-22T20:00:00Z",
      },
      locale: "en",
      generated_at:
        "2026-08-22T14:00:00Z",
      applied_filters: {},
      metrics: {},
      columns: ["id", "status"],
      rows: [
        ["a", "scheduled"],
        ["b", "completed"],
      ],
      warnings: [],
      total_rows: 250,
    };

    expect(() =>
      assertReportDocument(preview),
    ).not.toThrow();
  });

  test("fails closed if private owner_id leaks publicly", () => {
    const leaked = {
      schema_version: 1,
      owner_id: "secret-owner",
      report_type: "daily-summary",
      title_key:
        "reports.daily_summary.title",
      period: {
        start_date: "2026-08-22",
        end_date: "2026-08-22",
        timezone: "UTC",
        start_utc:
          "2026-08-22T00:00:00Z",
        end_utc:
          "2026-08-23T00:00:00Z",
      },
      locale: "en",
      generated_at:
        "2026-08-22T14:00:00Z",
      applied_filters: {},
      metrics: {},
      columns: [],
      rows: [],
      warnings: [],
      total_rows: 0,
    };

    expect(() =>
      assertReportDocument(leaked),
    ).toThrow(
      "Private owner_id must not appear",
    );
  });
  test("separates expired auth from reports entitlement denial", () => {
    const unauthorized =
      normalizeReportApiError({
        response: {
          status: 401,
          data: {
            detail: "authentication_required",
          },
        },
      });

    expect(unauthorized.auth).toBe(true);
    expect(unauthorized.forbidden).toBe(false);

    const forbidden =
      normalizeReportApiError({
        response: {
          status: 403,
          data: {
            detail: {
              code: "reports_entitlement_required",
            },
          },
        },
      });

    expect(forbidden.auth).toBe(false);
    expect(forbidden.forbidden).toBe(true);
    expect(forbidden.code).toBe(
      "reports_entitlement_required",
    );
  });

  test("preserves the authoritative capacity unavailable contract code", () => {
    const capacity =
      normalizeReportApiError({
        response: {
          status: 422,
          data: {
            detail: {
              code: "422_capacity_unavailable",
            },
          },
        },
      });

    expect(capacity.status).toBe(422);
    expect(capacity.code).toBe(
      "422_capacity_unavailable",
    );
    expect(capacity.auth).toBe(false);
    expect(capacity.forbidden).toBe(false);
  });

});
