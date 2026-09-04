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
  summaryError: string;
  analyticsError: string;
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
  const [summaryError, setSummaryError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      setSummary(null);
      setAnalytics(null);
      setError("");
      setSummaryError("");
      setAnalyticsError("");
      return;
    }

    try {
      setError("");
      setSummaryError("");
      setAnalyticsError("");

      const [
        summaryResult,
        analyticsResult,
        insightsResult,
      ] = await Promise.allSettled([
        api.get("/appointments/dashboard/summary", {
          headers: authHeaders(token),
        }),
        api.get("/analytics/dashboard", {
          headers: authHeaders(token),
        }),
        api.get("/analytics/insights", {
          headers: authHeaders(token),
        }),
      ]);

      const rejectedReasons = [
        summaryResult,
        analyticsResult,
        insightsResult,
      ]
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected"
        )
        .map((result) => result.reason);

      if (
        rejectedReasons.some((reason) =>
          isAuthError(reason)
        )
      ) {
        clearToken();
        setSummary(null);
        setAnalytics(null);
        setError("");
        setSummaryError("");
        setAnalyticsError("");
        return;
      }

      const messageFor = (
        reason: unknown,
        fallback: string
      ) => {
        const caught = reason as any;

        return (
          caught?.response?.data?.detail ||
          caught?.message ||
          fallback
        );
      };

      let nextSummaryError = "";
      let nextAnalyticsError = "";
      let supplementalError = "";

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value.data);
      } else {
        nextSummaryError = messageFor(
          summaryResult.reason,
          "Failed to load summary"
        );
      }

      if (analyticsResult.status === "fulfilled") {
        const analyticsRes = analyticsResult.value;
        const totals = analyticsRes.data?.totals ?? {};

        const insightsData =
          insightsResult.status === "fulfilled"
            ? insightsResult.value.data
            : undefined;

        setAnalytics({
          ...analyticsRes.data,
          completedRevenue:
            analyticsRes.data.completedRevenue ??
            analyticsRes.data.completed_revenue ??
            totals.completed_revenue ??
            analyticsRes.data.total_revenue ??
            0,
          scheduledPipeline:
            analyticsRes.data.scheduledPipeline ??
            analyticsRes.data.scheduled_pipeline ??
            totals.scheduled_pipeline ??
            0,
          cancelledValue:
            analyticsRes.data.cancelledValue ??
            analyticsRes.data.cancelled_value ??
            totals.cancelled_value ??
            0,
          avgCompletedTicket:
            analyticsRes.data.avgCompletedTicket ??
            analyticsRes.data.avg_completed_ticket ??
            totals.avg_completed_booking_value ??
            0,
          topPerformingServices:
            analyticsRes.data.topPerformingServices ??
            analyticsRes.data.top_performing_services ??
            analyticsRes.data.top_services ??
            [],
          forecast: insightsData?.forecast,
          risk_summary: insightsData?.risk_summary,
          growth_summary: insightsData?.growth_summary,
          executive_decision:
            insightsData?.executive_decision,
          client_summary: insightsData?.client_summary,
          client_risk: insightsData?.client_risk,
          mission_control:
            insightsData?.mission_control ?? [],
          performance_center:
            insightsData?.performance_center,
          benchmark_center:
            insightsData?.benchmark_center,
          revenue_simulator:
            insightsData?.revenue_simulator,
          insights: insightsData?.insights ?? [],
        });
      } else {
        nextAnalyticsError = messageFor(
          analyticsResult.reason,
          "Failed to load analytics"
        );
      }

      if (insightsResult.status === "rejected") {
        supplementalError = messageFor(
          insightsResult.reason,
          "Failed to load analytics insights"
        );
      }

      setSummaryError(nextSummaryError);
      setAnalyticsError(nextAnalyticsError);
      setError(
        nextSummaryError ||
          nextAnalyticsError ||
          supplementalError
      );
    } catch (err: any) {
      if (isAuthError(err)) {
        clearToken();
        setSummary(null);
        setAnalytics(null);
        setError("");
        setSummaryError("");
        setAnalyticsError("");
        return;
      }

      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to load dashboard data";

      setError(message);
      setSummaryError(message);
      setAnalyticsError(message);
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
    summaryError,
    analyticsError,
    reload: load,
    refresh,
  };
}
