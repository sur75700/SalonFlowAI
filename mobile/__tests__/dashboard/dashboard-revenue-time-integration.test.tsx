// @ts-nocheck
import fs from "fs";
import path from "path";

import {
  buildRevenueTimeSeriesParams,
  parseRevenueTimeSeriesResponse,
} from "../../hooks/useRevenueTimeSeries";
import {
  getRevenueTimeIntelligenceCopy,
} from "../../lib/i18n";

jest.mock("../../lib/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

const readMobileSource = (
  relativePath: string
) =>
  fs.readFileSync(
    path.join(
      __dirname,
      "../..",
      relativePath
    ),
    "utf8"
  );

describe(
  "Revenue Time Intelligence mobile integration",
  () => {
    test(
      "builds server-owned preset params without owner or timezone",
      () => {
        expect(
          buildRevenueTimeSeriesParams({
            preset: "30d",
            currency: "AMD",
          })
        ).toEqual({
          preset: "30d",
          currency: "AMD",
          compare: true,
        });
      }
    );

    test(
      "builds valid custom owner-local date params",
      () => {
        expect(
          buildRevenueTimeSeriesParams({
            preset: "custom",
            currency: "USD",
            dateFrom:
              "2026-08-01",
            dateTo:
              "2026-08-31",
          })
        ).toEqual({
          preset: "custom",
          currency: "USD",
          compare: true,
          date_from:
            "2026-08-01",
          date_to:
            "2026-08-31",
        });
      }
    );

    test(
      "fails closed for incomplete or reversed custom range",
      () => {
        expect(
          buildRevenueTimeSeriesParams({
            preset: "custom",
            currency: "AMD",
            dateFrom:
              "2026-09-02",
            dateTo:
              "2026-09-01",
          })
        ).toBeNull();

        expect(
          buildRevenueTimeSeriesParams({
            preset: "custom",
            currency: "AMD",
            dateFrom:
              "2026-09-01",
          })
        ).toBeNull();
      }
    );

    test(
      "accepts trusted server response and preserves bucket values",
      () => {
        const response =
          parseRevenueTimeSeriesResponse({
            contract_version: "1",
            preset: "7d",
            currency: "AMD",
            timezone:
              "Asia/Yerevan",
            timezone_source:
              "salon_capacity_profile",
            range: {
              start_local:
                "2026-08-29T00:00:00+04:00",
              end_local:
                "2026-09-05T00:00:00+04:00",
              start_utc:
                "2026-08-28T20:00:00Z",
              end_utc:
                "2026-09-04T20:00:00Z",
            },
            granularity: "day",
            earliest_trusted_at:
              "2026-01-01T00:00:00Z",
            summary: {
              completed_revenue:
                12500,
              delta: 500,
              delta_percent:
                4.1667,
              completed_count: 4,
            },
            series: [
              {
                bucket_start:
                  "2026-09-01T00:00:00+04:00",
                bucket_end:
                  "2026-09-02T00:00:00+04:00",
                label: "Sep 1",
                value: 12500,
                completed_count: 4,
              },
            ],
            comparison_series: [],
            warnings: [],
          });

        expect(
          response.series[0]
        ).toMatchObject({
          label: "Sep 1",
          value: 12500,
        });
      }
    );

    test(
      "fails closed above the trusted 240 bucket bound",
      () => {
        const points =
          Array.from(
            { length: 241 },
            (_, index) => ({
              bucket_start:
                `2026-01-01T00:00:${String(index % 60).padStart(2, "0")}Z`,
              bucket_end:
                `2026-01-01T01:00:${String(index % 60).padStart(2, "0")}Z`,
              label:
                `Point ${index}`,
              value: index,
              completed_count: 1,
            })
          );

        expect(() =>
          parseRevenueTimeSeriesResponse({
            preset: "all",
            currency: "AMD",
            timezone: "UTC",
            range: {
              start_local:
                "2026-01-01T00:00:00Z",
              end_local:
                "2026-09-01T00:00:00Z",
              start_utc:
                "2026-01-01T00:00:00Z",
              end_utc:
                "2026-09-01T00:00:00Z",
            },
            granularity: "day",
            summary: {
              completed_revenue:
                100,
              delta: 0,
              delta_percent: 0,
              completed_count: 1,
            },
            series: points,
            comparison_series: [],
            warnings: [],
          })
        ).toThrow(
          /trusted bucket bound/i
        );
      }
    );

    test(
      "hook defers lib/api module evaluation until fetch effect",
      () => {
        const source =
          readMobileSource(
            "hooks/useRevenueTimeSeries.ts"
          );

        expect(source).not.toMatch(
          /^import\s+.*from\s+["']\.\.\/lib\/api["'];/m
        );

        expect(source).toContain(
          'await import("../lib/api")'
        );
      }
    );

    test(
      "hook has latest-request-wins and trusted request identity",
      () => {
        const source =
          readMobileSource(
            "hooks/useRevenueTimeSeries.ts"
          );

        expect(source).toContain(
          "requestIdRef"
        );

        expect(source).toContain(
          "requestId !=="
        );

        expect(source).toContain(
          "trustedRequest"
        );

        expect(source).toContain(
          "setTrustedRequest"
        );
      }
    );

    test(
      "Dashboard owns all eight Revenue Time presets",
      () => {
        const source =
          readMobileSource(
            "components/dashboard-v2/cloud/DashboardV2Composition.tsx"
          );

        for (const preset of [
          "'24h'",
          "'7d'",
          "'30d'",
          "'90d'",
          "'ytd'",
          "'1y'",
          "'all'",
          "'custom'",
        ]) {
          expect(source).toContain(
            preset
          );
        }
      }
    );

    test(
      "Revenue Time copy exists in all supported languages",
      () => {
        for (const language of [
          "en",
          "hy",
          "ru",
          "fr",
        ]) {
          const copy =
            getRevenueTimeIntelligenceCopy(
              language
            );

          expect(
            copy.customRange
          ).toBeTruthy();

          expect(
            copy.previousPeriod
          ).toBeTruthy();

          expect(
            copy.usingUtcTime
          ).toBeTruthy();

          expect(
            copy.dataNotice
          ).toBeTruthy();
        }
      }
    );
  }
);
