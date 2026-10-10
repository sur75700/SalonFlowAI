import React from "react";
import { act, fireEvent, render, renderHook, waitFor, within } from "@testing-library/react-native";

import RoyalMarketPulseV2 from "../../components/dashboard-v2/cloud/RoyalMarketPulseV2";
import { useMarketPulse } from "../../hooks/useMarketPulse";
import { api } from "../../lib/api";
import { t } from "../../lib/i18n";
import {
  buildAmdMarketPanels,
  buildReferenceMarketPanels,
  deriveMarketCrossRate,
  type MarketPulseResponse,
} from "../../lib/market";

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
}));

jest.mock("../../hooks/useDashboardTheme", () => ({
  useDashboardTheme: () => ({
    theme: {
      palette: {
        surface: "#171938",
        border: "rgba(255,255,255,0.07)",
        royal: "#7C5CFF",
      },
    },
  }),
}));

type ApiGet = (
  url: string,
  config?: Readonly<{ signal?: AbortSignal; headers?: Record<string, string> }>,
) => Promise<Readonly<{ data: unknown }>>;

const apiGet = api.get as unknown as jest.MockedFunction<ApiGet>;

const PULSE: MarketPulseResponse = {
  generated_at: "2026-09-06T20:00:00+00:00",
  quotes: [
    { pair: "USD/AMD", base_currency: "USD", quote_currency: "AMD", asset_class: "FIAT", rate: 385.5, change: 0.2, change_type: "ABSOLUTE", state: "FRESH", source: "CBA", source_timestamp: "2026-09-06T19:00:00+00:00", fetched_at: "2026-09-06T19:01:00+00:00" },
    { pair: "EUR/AMD", base_currency: "EUR", quote_currency: "AMD", asset_class: "FIAT", rate: 451.2, change: -0.3, change_type: "ABSOLUTE", state: "STALE", source: "CBA", source_timestamp: "2026-09-06T19:00:00+00:00", fetched_at: "2026-09-06T19:01:00+00:00" },
    { pair: "RUB/AMD", base_currency: "RUB", quote_currency: "AMD", asset_class: "FIAT", rate: null, change: null, change_type: "ABSOLUTE", state: "UNAVAILABLE", source: "CBA", source_timestamp: null, fetched_at: "2026-09-06T19:01:00+00:00" },
    { pair: "BTC/USD", base_currency: "BTC", quote_currency: "USD", asset_class: "MARKET_ASSET", rate: 101234.5, change: 1.25, change_type: "PERCENT", state: "FRESH", source: "COINBASE", source_timestamp: "2026-09-06T19:00:00+00:00", fetched_at: "2026-09-06T19:01:00+00:00" },
  ],
};

const labels = {
  title: "Royal Market Pulse",
  subtitle: "Market context",
  fresh: "Fresh",
  stale: "Stale",
  unavailable: "Unavailable",
  loading: "Loading",
  refreshing: "Refreshing",
  retry: "Retry",
  source: "Source",
  inspect: "Inspect rate",
  referenceRate: "Reference rate",
  from: "From",
  to: "To",
  derived: "Derived from",
  derivedNote: "Derived from loaded authoritative quotes.",
  conversionUnavailable: "Conversion unavailable",
  close: "Close",
  expand: "Expand market pulse",
  fullView: "Live currency command center",
  referenceCurrency: "Reference currency",
  referenceMatrixNote: "All four panels follow the selected reference currency.",
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("Royal Market Pulse", () => {
  it("localizes market fullscreen controls and AI confidence labels in all supported locales", () => {
    expect(t("High", "en")).toBe("High");
    expect(t("High", "hy")).toBe("Բարձր");
    expect(t("High", "ru")).toBe("Высокий");
    expect(t("High", "fr")).toBe("Élevé");
    expect(t("Market Full View", "hy")).toBe("Արժույթների կենդանի հրամանային կենտրոն");
    expect(t("Market Expand", "ru")).toBe("Развернуть рыночный пульс");
    expect(t("Market Full View", "fr")).toBe("Centre de commande des devises en direct");
    expect(t("Market Reference Currency", "hy")).toBe("Հենակետային արժույթ");
    expect(t("Market Reference Currency", "ru")).toBe("Опорная валюта");
    expect(t("Market Reference Currency", "fr")).toBe("Devise de référence");
  });

  it("renders the initial loading state explicitly", () => {
    const screen = render(
      <RoyalMarketPulseV2 data={null} status="loading" labels={labels} locale="en" />,
    );
    expect(screen.getByText("Loading")).toBeTruthy();
  });

  it("renders fully unavailable providers without fabricated zero quotes", () => {
    const unavailable: MarketPulseResponse = {
      ...PULSE,
      quotes: PULSE.quotes.map((quote) => ({
        ...quote,
        rate: null,
        change: null,
        state: "UNAVAILABLE" as const,
        source_timestamp: null,
      })),
    };
    const screen = render(
      <RoyalMarketPulseV2 data={unavailable} status="success" labels={labels} locale="en" />,
    );
    expect(screen.getAllByText("Unavailable")).toHaveLength(4);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });

  it("renders success, stale, unavailable and BTC market-asset states", () => {
    const screen = render(
      <RoyalMarketPulseV2 data={PULSE} status="success" labels={labels} locale="en" />,
    );
    expect(screen.getByText("USD/AMD")).toBeTruthy();
    expect(screen.getByText("BTC/AMD")).toBeTruthy();
    expect(screen.getByText("Stale")).toBeTruthy();
    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.getByText(/BTC\/USD × USD\/AMD/)).toBeTruthy();
  });

  it("derives truthful cross-rates only from available canonical quotes", () => {
    const eurUsd = deriveMarketCrossRate(PULSE, "EUR", "USD");
    expect(eurUsd).not.toBeNull();
    expect(eurUsd?.rate).toBeCloseTo(451.2 / 385.5, 6);
    expect(eurUsd?.state).toBe("STALE");
    expect(eurUsd?.sources).toEqual(["CBA"]);

    expect(deriveMarketCrossRate(PULSE, "RUB", "USD")).toBeNull();
  });

  it("builds four AMD-centric panels and derives BTC/AMD from loaded canonical quotes only", () => {
    const panels = buildAmdMarketPanels(PULSE);
    expect(panels.map((panel) => panel.pair)).toEqual([
      "USD/AMD",
      "EUR/AMD",
      "RUB/AMD",
      "BTC/AMD",
    ]);

    const btcAmd = panels[3];
    expect(btcAmd.derived).toBe(true);
    expect(btcAmd.asset_class).toBe("MARKET_ASSET");
    expect(btcAmd.rate).toBeCloseTo(101234.5 * 385.5, 4);
    expect(btcAmd.sources).toEqual(["COINBASE", "CBA"]);
    expect(btcAmd.source_pairs).toEqual(["BTC/USD", "USD/AMD"]);
  });

  it("rebuilds the four-panel matrix around any selected reference currency without network data", () => {
    const usdPanels = buildReferenceMarketPanels(PULSE, "USD");
    expect(usdPanels.map((panel) => panel.pair)).toEqual([
      "AMD/USD",
      "EUR/USD",
      "RUB/USD",
      "BTC/USD",
    ]);

    const eurUsd = usdPanels.find((panel) => panel.pair === "EUR/USD");
    expect(eurUsd?.rate).toBeCloseTo(451.2 / 385.5, 6);
    expect(eurUsd?.derived).toBe(true);
    expect(eurUsd?.state).toBe("STALE");

    const btcUsd = usdPanels.find((panel) => panel.pair === "BTC/USD");
    expect(btcUsd?.rate).toBeCloseTo(101234.5, 6);
    expect(btcUsd?.derived).toBe(false);
    expect(btcUsd?.asset_class).toBe("MARKET_ASSET");

    const rubUsd = usdPanels.find((panel) => panel.pair === "RUB/USD");
    expect(rubUsd?.state).toBe("UNAVAILABLE");
    expect(rubUsd?.rate).toBeNull();
  });

  it("renders recognizable currency symbols with canonical codes in compact and fullscreen selectors", () => {
    const screen = render(
      <RoyalMarketPulseV2 data={PULSE} status="success" labels={labels} locale="en" />,
    );

    expect(within(screen.getByTestId("market-inline-reference-AMD")).getByText("֏ AMD")).toBeTruthy();
    expect(within(screen.getByTestId("market-inline-reference-USD")).getByText("$ USD")).toBeTruthy();
    expect(within(screen.getByTestId("market-inline-reference-EUR")).getByText("€ EUR")).toBeTruthy();
    expect(within(screen.getByTestId("market-inline-reference-RUB")).getByText("₽ RUB")).toBeTruthy();
    expect(within(screen.getByTestId("market-inline-reference-BTC")).getByText("₿ BTC")).toBeTruthy();

    fireEvent.press(screen.getByTestId("market-pulse-expand"));
    const modal = screen.getByTestId("market-pulse-modal");
    expect(within(within(modal).getByTestId("market-reference-AMD")).getByText("֏ AMD")).toBeTruthy();
    expect(within(within(modal).getByTestId("market-reference-BTC")).getByText("₿ BTC")).toBeTruthy();
    expect(within(within(modal).getByTestId("market-fullscreen-base-USD")).getByText("$ USD")).toBeTruthy();
    expect(within(within(modal).getByTestId("market-fullscreen-quote-currency-EUR")).getByText("€ EUR")).toBeTruthy();
  });

  it("keeps compact mode clean and switches the four live panels instantly by reference currency", () => {
    const screen = render(
      <RoyalMarketPulseV2 data={PULSE} status="success" labels={labels} locale="en" />,
    );

    expect(screen.getByTestId("market-inline-reference-switcher")).toBeTruthy();
    expect(screen.queryByTestId("market-detail-panel")).toBeNull();
    expect(screen.getByTestId("market-quote-USD/AMD")).toBeTruthy();
    expect(screen.getByTestId("market-quote-EUR/AMD")).toBeTruthy();
    expect(screen.getByTestId("market-quote-RUB/AMD")).toBeTruthy();
    expect(screen.getByTestId("market-quote-BTC/AMD")).toBeTruthy();

    fireEvent.press(screen.getByTestId("market-inline-reference-USD"));
    expect(screen.getByTestId("market-quote-AMD/USD")).toBeTruthy();
    expect(screen.getByTestId("market-quote-EUR/USD")).toBeTruthy();
    expect(screen.getByTestId("market-quote-RUB/USD")).toBeTruthy();
    expect(screen.getByTestId("market-quote-BTC/USD")).toBeTruthy();
    expect(screen.queryByTestId("market-quote-USD/AMD")).toBeNull();

    fireEvent.press(screen.getByTestId("market-inline-reference-BTC"));
    expect(screen.getByTestId("market-quote-AMD/BTC")).toBeTruthy();
    expect(screen.getByTestId("market-quote-USD/BTC")).toBeTruthy();
    expect(screen.getByTestId("market-quote-EUR/BTC")).toBeTruthy();
    expect(screen.getByTestId("market-quote-RUB/BTC")).toBeTruthy();
    expect(screen.queryByTestId("market-detail-panel")).toBeNull();
  });

  it("carries the compact reference into fullscreen while preserving the full converter playground", () => {
    const screen = render(
      <RoyalMarketPulseV2 data={PULSE} status="success" labels={labels} locale="en" />,
    );

    fireEvent.press(screen.getByTestId("market-inline-reference-USD"));
    fireEvent.press(screen.getByTestId("market-quote-EUR/USD"));
    fireEvent.press(screen.getByTestId("market-pulse-expand"));

    const modal = screen.getByTestId("market-pulse-modal");
    expect(within(modal).getByTestId("market-reference-USD")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-AMD/USD")).toBeTruthy();
    const detail = within(modal).getByTestId("market-fullscreen-detail-panel");
    expect(within(detail).getByText("EUR/USD")).toBeTruthy();
    expect(within(detail).getByText(/1 EUR = .* USD/)).toBeTruthy();
  });

  it("opens a fullscreen live currency matrix and lets every supported currency become the four-panel reference", () => {
    const screen = render(
      <RoyalMarketPulseV2 data={PULSE} status="success" labels={labels} locale="en" />,
    );

    fireEvent.press(screen.getByTestId("market-pulse-expand"));
    const modal = screen.getByTestId("market-pulse-modal");
    expect(within(modal).getByText("Live currency command center")).toBeTruthy();
    expect(within(modal).getByTestId("market-reference-matrix")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-USD/AMD")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-EUR/AMD")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-RUB/AMD")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-BTC/AMD")).toBeTruthy();

    fireEvent.press(within(modal).getByTestId("market-reference-USD"));
    expect(within(modal).getByTestId("market-fullscreen-quote-AMD/USD")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-EUR/USD")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-RUB/USD")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-BTC/USD")).toBeTruthy();
    expect(within(modal).queryByTestId("market-fullscreen-quote-USD/AMD")).toBeNull();

    fireEvent.press(within(modal).getByTestId("market-fullscreen-quote-EUR/USD"));
    const detail = within(modal).getByTestId("market-fullscreen-detail-panel");
    expect(within(detail).getByText("EUR/USD")).toBeTruthy();
    expect(within(detail).getByText(/1 EUR = .* USD/)).toBeTruthy();

    fireEvent.press(within(modal).getByTestId("market-reference-BTC"));
    expect(within(modal).getByTestId("market-fullscreen-quote-AMD/BTC")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-USD/BTC")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-EUR/BTC")).toBeTruthy();
    expect(within(modal).getByTestId("market-fullscreen-quote-RUB/BTC")).toBeTruthy();

    fireEvent.press(screen.getByTestId("market-pulse-close"));
    expect(screen.queryByTestId("market-pulse-modal")).toBeNull();
  });

  it("performs one canonical request, not one request per quote, and ignores unrelated rerenders", async () => {
    apiGet.mockResolvedValue({ data: PULSE });
    const clearToken = jest.fn();
    const { result, rerender } = renderHook(
      ({ token, themeRevision }: { token: string; themeRevision: number }) => {
        void themeRevision;
        return useMarketPulse({ token, clearToken, refreshIntervalMs: 60_000 });
      },
      { initialProps: { token: "token", themeRevision: 0 } },
    );
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledWith(
      "/market/pulse",
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
        signal: expect.any(Object),
      }),
    );
    expect(result.current.data?.quotes).toHaveLength(4);
    rerender({ token: "token", themeRevision: 1 });
    await act(async () => undefined);
    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it("retains valid data during refresh", async () => {
    let resolveRefresh: ((value: Readonly<{ data: unknown }>) => void) | undefined;
    apiGet
      .mockResolvedValueOnce({ data: PULSE })
      .mockImplementationOnce(
        () => new Promise<Readonly<{ data: unknown }>>((resolve) => { resolveRefresh = resolve; }),
      );
    const { result } = renderHook(() =>
      useMarketPulse({ token: "token", clearToken: jest.fn(), refreshIntervalMs: 60_000 }),
    );
    await waitFor(() => expect(result.current.status).toBe("success"));
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.status).toBe("refreshing"));
    expect(result.current.data).toEqual(PULSE);
    await act(async () => resolveRefresh?.({ data: PULSE }));
    await waitFor(() => expect(result.current.status).toBe("success"));
  });

  it("uses existing session semantics on authentication failure", async () => {
    const clearToken = jest.fn();
    apiGet.mockRejectedValue({ response: { status: 401 } });
    const { result } = renderHook(() =>
      useMarketPulse({ token: "token", clearToken, refreshIntervalMs: 60_000 }),
    );
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(clearToken).toHaveBeenCalledTimes(1);
  });

  it("aborts the request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    apiGet.mockImplementation(
      async (_url, config) => {
        capturedSignal = config?.signal;
        return new Promise<Readonly<{ data: unknown }>>(() => undefined);
      },
    );
    const hook = renderHook(() =>
      useMarketPulse({ token: "token", clearToken: jest.fn(), refreshIntervalMs: 60_000 }),
    );
    await waitFor(() => expect(capturedSignal).toBeDefined());
    hook.unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });
});
