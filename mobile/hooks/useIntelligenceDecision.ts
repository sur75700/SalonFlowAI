import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createIntelligenceDecisionRequestKey,
  fetchIntelligenceDecision,
  IntelligenceDecisionRequestError,
} from "../lib/intelligence";
import type {
  IntelligenceDecisionRequest,
  IntelligenceDecisionResponse,
} from "../types/intelligence";

export type IntelligenceDecisionStatus =
  | "idle"
  | "loading"
  | "refreshing"
  | "success"
  | "not_entitled"
  | "error";

export type IntelligenceDecisionState = Readonly<{
  status: IntelligenceDecisionStatus;
  data: IntelligenceDecisionResponse | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  requestKey: string | null;
}>;

export type UseIntelligenceDecisionOptions = Readonly<{
  token: string;
  clearToken: () => void;
  request: IntelligenceDecisionRequest | null;
  enabled?: boolean;
}>;

export type UseIntelligenceDecisionResult =
  IntelligenceDecisionState &
    Readonly<{
      refresh: () => void;
    }>;

const IDLE_STATE: IntelligenceDecisionState = Object.freeze({
  status: "idle",
  data: null,
  error: null,
  loading: false,
  refreshing: false,
  requestKey: null,
});

type LoadMode = "load" | "refresh";

export function useIntelligenceDecision({
  token,
  clearToken,
  request,
  enabled = true,
}: UseIntelligenceDecisionOptions): UseIntelligenceDecisionResult {
  const requestStart = request?.window.start;
  const requestEnd = request?.window.end;
  const requestLabel = request?.window.label;
  const requestCurrency = request?.currency;

  const stableRequest = useMemo<
    IntelligenceDecisionRequest | null
  >(() => {
    if (!requestStart || !requestEnd) {
      return null;
    }

    const window =
      requestLabel === undefined
        ? {
            start: requestStart,
            end: requestEnd,
          }
        : {
            start: requestStart,
            end: requestEnd,
            label: requestLabel,
          };

    return requestCurrency === undefined
      ? { window }
      : {
          window,
          currency: requestCurrency,
        };
  }, [
    requestCurrency,
    requestEnd,
    requestLabel,
    requestStart,
  ]);

  const requestKey = useMemo(
    () =>
      stableRequest
        ? createIntelligenceDecisionRequestKey(stableRequest)
        : null,
    [stableRequest],
  );

  const [state, setState] =
    useState<IntelligenceDecisionState>(IDLE_STATE);
  const sequenceRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const clearTokenRef = useRef(clearToken);

  useEffect(() => {
    clearTokenRef.current = clearToken;
  }, [clearToken]);

  const execute = useCallback(
    async (mode: LoadMode) => {
      if (
        !enabled ||
        !token ||
        stableRequest === null ||
        requestKey === null
      ) {
        return;
      }

      const sequence = sequenceRef.current + 1;
      sequenceRef.current = sequence;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setState((current) => {
        const retainedData =
          mode === "refresh" ? current.data : null;
        const isRefreshing = retainedData !== null;

        return {
          status: isRefreshing ? "refreshing" : "loading",
          data: retainedData,
          error: null,
          loading: !isRefreshing,
          refreshing: isRefreshing,
          requestKey,
        };
      });

      try {
        const data = await fetchIntelligenceDecision(
          token,
          stableRequest,
          controller.signal,
        );

        if (
          controller.signal.aborted ||
          sequenceRef.current !== sequence
        ) {
          return;
        }

        setState({
          status: "success",
          data,
          error: null,
          loading: false,
          refreshing: false,
          requestKey,
        });
      } catch (error) {
        if (
          controller.signal.aborted ||
          sequenceRef.current !== sequence
        ) {
          return;
        }

        if (
          error instanceof IntelligenceDecisionRequestError &&
          error.kind === "not_entitled"
        ) {
          setState({
            status: "not_entitled",
            data: null,
            error: null,
            loading: false,
            refreshing: false,
            requestKey,
          });
          return;
        }

        if (
          error instanceof IntelligenceDecisionRequestError &&
          error.authFailure
        ) {
          clearTokenRef.current();
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load Intelligence decision";

        setState((current) => ({
          status: "error",
          data:
            mode === "refresh" ? current.data : null,
          error: message,
          loading: false,
          refreshing: false,
          requestKey,
        }));
      } finally {
        if (sequenceRef.current === sequence) {
          controllerRef.current = null;
        }
      }
    },
    [
      enabled,
      requestKey,
      stableRequest,
      token,
    ],
  );

  useEffect(() => {
    if (
      !enabled ||
      !token ||
      stableRequest === null ||
      requestKey === null
    ) {
      controllerRef.current?.abort();
      controllerRef.current = null;
      sequenceRef.current += 1;
      setState(IDLE_STATE);
      return undefined;
    }

    void execute("load");

    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
      sequenceRef.current += 1;
    };
  }, [
    enabled,
    execute,
    requestKey,
    stableRequest,
    token,
  ]);

  const refresh = useCallback(() => {
    if (
      enabled &&
      token &&
      stableRequest !== null &&
      requestKey !== null
    ) {
      void execute("refresh");
    }
  }, [
    enabled,
    execute,
    requestKey,
    stableRequest,
    token,
  ]);

  return {
    ...state,
    refresh,
  };
}
