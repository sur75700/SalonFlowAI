import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  fetchMarketPulse,
  MarketPulseRequestError,
  type MarketPulseResponse,
} from "../lib/market";

export type MarketPulseStatus =
  | "idle"
  | "loading"
  | "refreshing"
  | "success"
  | "error";

export type UseMarketPulseOptions = Readonly<{
  token: string;
  clearToken: () => void;
  enabled?: boolean;
  refreshIntervalMs?: number;
}>;

export type UseMarketPulseResult = Readonly<{
  status: MarketPulseStatus;
  data: MarketPulseResponse | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}>;

const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useMarketPulse({
  token,
  clearToken,
  enabled = true,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
}: UseMarketPulseOptions): UseMarketPulseResult {
  const [status, setStatus] = useState<MarketPulseStatus>("idle");
  const [data, setData] = useState<MarketPulseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const sequenceRef = useRef(0);
  const lastCompletedAtRef = useRef<number>(0);
  const clearTokenRef = useRef(clearToken);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    clearTokenRef.current = clearToken;
  }, [clearToken]);

  const execute = useCallback(
    async (mode: "load" | "refresh") => {
      if (!enabled || !token) return;
      const sequence = sequenceRef.current + 1;
      sequenceRef.current = sequence;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatus(mode === "refresh" ? "refreshing" : "loading");
      setError(null);

      try {
        const next = await fetchMarketPulse(token, controller.signal);
        if (controller.signal.aborted || sequenceRef.current !== sequence) return;
        setData(next);
        setStatus("success");
        lastCompletedAtRef.current = Date.now();
      } catch (caught) {
        if (controller.signal.aborted || sequenceRef.current !== sequence) return;
        if (caught instanceof MarketPulseRequestError && caught.authFailure) {
          clearTokenRef.current();
        }
        setError(caught instanceof Error ? caught.message : "Unable to load Market Pulse");
        setStatus("error");
      } finally {
        if (sequenceRef.current === sequence) controllerRef.current = null;
      }
    },
    [enabled, token],
  );

  useEffect(() => {
    if (!enabled || !token) {
      controllerRef.current?.abort();
      controllerRef.current = null;
      sequenceRef.current += 1;
      setStatus("idle");
      setData(null);
      setError(null);
      return undefined;
    }
    void execute("load");
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
      sequenceRef.current += 1;
    };
  }, [enabled, execute, token]);

  useEffect(() => {
    if (!enabled || !token || refreshIntervalMs <= 0) return undefined;
    const interval = setInterval(() => {
      if (appStateRef.current === "active") void execute("refresh");
    }, refreshIntervalMs);
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previous = appStateRef.current;
      appStateRef.current = nextState;
      if (
        nextState === "active" &&
        previous !== "active" &&
        Date.now() - lastCompletedAtRef.current >= refreshIntervalMs
      ) {
        void execute("refresh");
      }
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled, execute, refreshIntervalMs, token]);

  const refresh = useCallback(() => {
    if (enabled && token) void execute("refresh");
  }, [enabled, execute, token]);

  return {
    status,
    data,
    error,
    loading: status === "loading",
    refreshing: status === "refreshing",
    refresh,
  };
}
