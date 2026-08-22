import React from "react";
import {
  act,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";

import ReportsCommandCenterV2 from "../../components/reports/ReportsCommandCenterV2";

import {
  fetchReportCatalog,
  fetchReportPreview,
} from "../../lib/reports/api";

import {
  downloadReportExport,
} from "../../lib/reports/download";

import type {
  ReportCatalog,
  ReportDocument,
} from "../../lib/reports/contracts";

jest.mock("../../lib/reports/api", () => ({
  fetchReportCatalog: jest.fn(),
  fetchReportPreview: jest.fn(),
}));

jest.mock("../../lib/reports/download", () => ({
  downloadReportExport: jest.fn(),
}));

const mockedCatalog =
  fetchReportCatalog as jest.MockedFunction<
    typeof fetchReportCatalog
  >;

const mockedPreview =
  fetchReportPreview as jest.MockedFunction<
    typeof fetchReportPreview
  >;

const mockedDownload =
  downloadReportExport as jest.MockedFunction<
    typeof downloadReportExport
  >;

const catalog: ReportCatalog = {
  schema_version: 1,
  report_types: [
    {
      report_type: "daily-summary",
      title_key:
        "reports.daily_summary.title",
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
      title_key:
        "reports.appointments.title",
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
        live_quotes:
          "deferred_dashboard",
      },
    ],
  },
  saved_history: false,
  report_type_count: 3,
};

function documentFor(
  reportType:
    | "daily-summary"
    | "appointments",
  marker: string,
): ReportDocument {
  return {
    schema_version: 1,
    report_type: reportType,
    title_key:
      reportType === "daily-summary"
        ? "reports.daily_summary.title"
        : "reports.appointments.title",
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
      "2026-08-22T15:00:00Z",
    applied_filters: {},
    metrics: {},
    columns: ["marker"],
    rows: [[marker]],
    warnings: [],
    total_rows: 1,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;

  const promise = new Promise<T>(
    (resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    },
  );

  return {
    promise,
    resolve,
    reject,
  };
}

describe(
  "Phase 63D Reports Command Center hardening",
  () => {
    beforeEach(() => {
      jest.clearAllMocks();

      mockedCatalog.mockResolvedValue(
        catalog,
      );
    });

    test(
      "ignores a stale preview that resolves after report selection changes",
      async () => {
        const first =
          deferred<ReportDocument>();

        const second =
          deferred<ReportDocument>();

        mockedPreview
          .mockImplementationOnce(
            () => first.promise,
          )
          .mockImplementationOnce(
            () => second.promise,
          );

        const view = render(
          <ReportsCommandCenterV2
            token="token"
            locale="en"
            refreshKey={0}
            onAuthExpired={jest.fn()}
          />,
        );

        await waitFor(() => {
          expect(
            mockedCatalog,
          ).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
          expect(
            view.queryAllByText(
              "Appointments",
            ).length,
          ).toBeGreaterThan(0);
        });

        fireEvent.press(
          view.getByText(
            "Load trusted preview",
          ),
        );

        await waitFor(() => {
          expect(
            mockedPreview,
          ).toHaveBeenCalledTimes(1);
        });

        fireEvent.press(
          view.getAllByText(
            "Appointments",
          )[0],
        );

        fireEvent.press(
          view.getByText(
            "Load trusted preview",
          ),
        );

        await waitFor(() => {
          expect(
            mockedPreview,
          ).toHaveBeenCalledTimes(2);
        });

        await act(async () => {
          second.resolve(
            documentFor(
              "appointments",
              "fresh-appointments-preview",
            ),
          );

          await second.promise;
        });

        await waitFor(() => {
          expect(
            view.getByText(
              "fresh-appointments-preview",
            ),
          ).toBeTruthy();
        });

        await act(async () => {
          first.resolve(
            documentFor(
              "daily-summary",
              "stale-daily-preview",
            ),
          );

          await first.promise;
        });

        await waitFor(() => {
          expect(
            view.queryByText(
              "stale-daily-preview",
            ),
          ).toBeNull();

          expect(
            view.getByText(
              "fresh-appointments-preview",
            ),
          ).toBeTruthy();
        });
      },
    );

    test(
      "keeps export center closed until a trusted preview exists",
      async () => {
        mockedPreview.mockResolvedValue(
          documentFor(
            "daily-summary",
            "trusted-preview",
          ),
        );

        const view = render(
          <ReportsCommandCenterV2
            token="token"
            locale="en"
            refreshKey={0}
            onAuthExpired={jest.fn()}
          />,
        );

        await waitFor(() => {
          expect(
            mockedCatalog,
          ).toHaveBeenCalledTimes(1);
        });

        fireEvent.press(
          view.getByText(
            "Open export center",
          ),
        );

        expect(
          view.queryByText(
            "ROYAL COSMOS EXPORT",
          ),
        ).toBeNull();

        fireEvent.press(
          view.getByText(
            "Load trusted preview",
          ),
        );

        await waitFor(() => {
          expect(
            view.getByText(
              "trusted-preview",
            ),
          ).toBeTruthy();
        });

        fireEvent.press(
          view.getByText(
            "Open export center",
          ),
        );

        await waitFor(() => {
          expect(
            view.getByText(
              "ROYAL COSMOS EXPORT",
            ),
          ).toBeTruthy();
        });
      },
    );

    test(
      "failed export stays handled and keeps the sheet open",
      async () => {
        mockedPreview.mockResolvedValue(
          documentFor(
            "daily-summary",
            "export-preview",
          ),
        );

        mockedDownload.mockRejectedValue(
          new Error("network down"),
        );

        const view = render(
          <ReportsCommandCenterV2
            token="token"
            locale="en"
            refreshKey={0}
            onAuthExpired={jest.fn()}
          />,
        );

        await waitFor(() => {
          expect(
            mockedCatalog,
          ).toHaveBeenCalledTimes(1);
        });

        fireEvent.press(
          view.getByText(
            "Load trusted preview",
          ),
        );

        await waitFor(() => {
          expect(
            view.getByText(
              "export-preview",
            ),
          ).toBeTruthy();
        });

        fireEvent.press(
          view.getByText(
            "Open export center",
          ),
        );

        fireEvent.press(
          view.getByText("PDF"),
        );

        await waitFor(() => {
          expect(
            view.getByText("Report export failed."),
          ).toBeTruthy();

          expect(
            view.getByText(
              "ROYAL COSMOS EXPORT",
            ),
          ).toBeTruthy();
        });
      },
    );

    test(
      "403 entitlement denial does not expire the user session",
      async () => {
        const onAuthExpired =
          jest.fn();

        mockedCatalog.mockRejectedValueOnce(
          Object.assign(
            new Error("forbidden"),
            {
              status: 403,
              auth: false,
              forbidden: true,
            },
          ),
        );

        const view = render(
          <ReportsCommandCenterV2
            token="token"
            locale="en"
            refreshKey={0}
            onAuthExpired={
              onAuthExpired
            }
          />,
        );

        await waitFor(() => {
          expect(
            view.getByText(
              "Reports access is not enabled for this account.",
            ),
          ).toBeTruthy();
        });

        expect(
          onAuthExpired,
        ).not.toHaveBeenCalled();
      },
    );

    test(
      "401 authentication expiry calls the session-expiry boundary",
      async () => {
        const onAuthExpired =
          jest.fn();

        mockedCatalog.mockRejectedValueOnce(
          Object.assign(
            new Error("expired"),
            {
              status: 401,
              auth: true,
              forbidden: false,
            },
          ),
        );

        render(
          <ReportsCommandCenterV2
            token="token"
            locale="en"
            refreshKey={0}
            onAuthExpired={
              onAuthExpired
            }
          />,
        );

        await waitFor(() => {
          expect(
            onAuthExpired,
          ).toHaveBeenCalledTimes(1);
        });
      },
    );

    test(
      "maps the authoritative capacity 422 code to the explicit capacity state",
      async () => {
        mockedPreview.mockRejectedValueOnce(
          Object.assign(
            new Error(
              "422_capacity_unavailable",
            ),
            {
              status: 422,
              code:
                "422_capacity_unavailable",
              auth: false,
              forbidden: false,
            },
          ),
        );

        const view = render(
          <ReportsCommandCenterV2
            token="token"
            locale="en"
            refreshKey={0}
            onAuthExpired={jest.fn()}
          />,
        );

        await waitFor(() => {
          expect(
            mockedCatalog,
          ).toHaveBeenCalledTimes(1);
        });

        fireEvent.press(
          view.getByText(
            "Capacity Utilization",
          ),
        );

        fireEvent.press(
          view.getByText(
            "Load trusted preview",
          ),
        );

        await waitFor(() => {
          expect(
            view.getByText(
              "Trusted capacity data is unavailable for this period.",
            ),
          ).toBeTruthy();
        });
      },
    );

    test(
      "renders Armenian product copy without English catalog leakage",
      async () => {
        const view = render(
          <ReportsCommandCenterV2
            token="token"
            locale="hy"
            refreshKey={0}
            onAuthExpired={jest.fn()}
          />,
        );

        await waitFor(() => {
          expect(
            mockedCatalog,
          ).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
          expect(
            view.getByText(
              "Հաշվետվությունների ընտրանի",
            ),
          ).toBeTruthy();

          expect(
            view.getByText(
              "Բացել վստահելի նախադիտումը",
            ),
          ).toBeTruthy();

          expect(
            view.queryByText(
              "Report catalog",
            ),
          ).toBeNull();

          expect(
            view.queryByText(
              "Single day",
            ),
          ).toBeNull();

          expect(
            view.queryByText(
              "Currency required",
            ),
          ).toBeNull();
        });
      },
    );
  },
);
