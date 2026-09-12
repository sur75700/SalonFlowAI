import React from "react";
import { act, render, renderHook, waitFor } from "@testing-library/react-native";

import RoyalMarketPulseV2 from "../../components/dashboard-v2/cloud/RoyalMarketPulseV2";
import { useMarketPulse } from "../../hooks/useMarketPulse";
import { api } from "../../lib/api";
import type { MarketPulseResponse } from "../../lib/market";

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
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("Royal Market Pulse", () => {
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
    expect(screen.getByText("BTC/USD")).toBeTruthy();
    expect(screen.getByText("Stale")).toBeTruthy();
    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.getByText("Source: COINBASE")).toBeTruthy();
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
