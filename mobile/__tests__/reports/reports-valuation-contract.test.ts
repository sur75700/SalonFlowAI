import {
  buildReportQueryString,
} from "../../lib/reports/query";

import {
  REPORT_VALUATION_CURRENCIES,
} from "../../lib/reports/contracts";

import type {
  ReportQuery,
} from "../../lib/reports/contracts";


describe("Reports valuation query contract", () => {
  it("exposes the supported valuation targets", () => {
    expect(
      REPORT_VALUATION_CURRENCIES,
    ).toEqual([
      "AMD",
      "USD",
      "EUR",
      "RUB",
      "BTC",
    ]);
  });


  it("keeps Original mode free of valuation_currency", () => {
    const query: ReportQuery = {
      currency: "AMD",
      locale: "en",
    };

    const result =
      buildReportQueryString(query);

    expect(result).toContain(
      "currency=AMD",
    );

    expect(result).not.toContain(
      "valuation_currency",
    );
  });


  it("sends fiat valuation separately from source currency", () => {
    const query: ReportQuery = {
      currency: "AMD",
      valuationCurrency: "USD",
      locale: "en",
    };

    const result =
      buildReportQueryString(query);

    expect(result).toContain(
      "currency=AMD",
    );

    expect(result).toContain(
      "valuation_currency=USD",
    );
  });


  it("sends BTC only as valuation_currency", () => {
    const query: ReportQuery = {
      currency: "AMD",
      valuationCurrency: "BTC",
      locale: "en",
    };

    const result =
      buildReportQueryString(query);

    const params =
      new URLSearchParams(result);

    expect(
      params.get("currency"),
    ).toBe("AMD");

    expect(
      params.get("valuation_currency"),
    ).toBe("BTC");
  });
});
