import { useCallback, useEffect, useState } from "react";

import { api, authHeaders, isAuthError } from "../lib/api";
import type { AnalyticsData, SummaryData } from "../types/models";

type HookBaseState = {
  loading: boolean;
  refreshing: boolean;
  error: string;
};

type SummaryHookResult = HookBaseState & {
  summary: SummaryData | null;
  reload: () => Promise<void>;
  refresh: () => void;
};

type AnalyticsHookResult = HookBaseState & {
  summary: SummaryData | null;
  analytics: AnalyticsData | null;
  reload: () => Promise<void>;
  refresh: () => void;
};

export function useSummaryData(
  token: string,
  clearToken: () => void
): SummaryHookResult {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setSummary(null);
      return;
    }

    try {
      setError("");

      const response = await api.get("/appointments/dashboard/summary", {
        headers: authHeaders(token),
      });

      setSummary(response.data);
    } catch (err: any) {
      if (isAuthError(err)) {
        clearToken();
        setSummary(null);
        setError("");
        return;
      }

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load summary"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, clearToken]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return {
    summary,
    loading,
    refreshing,
    error,
    reload: load,
    refresh,
  };
}

export function useAnalyticsData(
  token: string,
  clearToken: () => void
): AnalyticsHookResult {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setSummary(null);
      setAnalytics(null);
      return;
    }

    try {
      setError("");

      const [summaryRes, analyticsRes] = await Promise.all([
        api.get("/appointments/dashboard/summary", {
          headers: authHeaders(token),
        }),
        api.get("/analytics/dashboard", {
          headers: authHeaders(token),
        }),
      ]);

      setSummary(summaryRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err: any) {
      if (isAuthError(err)) {
        clearToken();
        setSummary(null);
        setAnalytics(null);
        setError("");
        return;
      }

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load analytics"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, clearToken]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return {
    summary,
    analytics,
    loading,
    refreshing,
    error,
    reload: load,
    refresh,
  };
}
