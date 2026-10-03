import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useBilling } from "../contexts/BillingContext";
import { useAppLanguage } from "../contexts/LanguageContext";
import { useDashboardTheme } from "./useDashboardTheme";
import { useSession } from "./useSession";
import {
  fetchSettingsBackendHealth,
  fetchSettingsBillingPlans,
  fetchSettingsCapacityConfiguration,
} from "../lib/settings/bindings";
import type {
  BackendHealth,
  BillingPlansResponse,
  CapacityConfigurationResponse,
  SettingsResourceState,
  SettingsSectionId,
  SettingsSnapshot,
} from "../lib/settings/contracts";

function emptyResource<T>(): SettingsResourceState<T> {
  return { value: null, state: "NOT_AVAILABLE", loading: false, error: null, observedAt: null };
}

export function useSettingsSnapshot(selectedSection: SettingsSectionId): SettingsSnapshot {
  const { token, sessionUser, profileLoading } = useSession();
  const { billingStatus, billingLoading, refreshBilling } = useBilling();
  const { language } = useAppLanguage();
  const { selectedThemeId } = useDashboardTheme();
  const generationRef = useRef(0);
  const tokenRef = useRef(token);

  const [workspace, setWorkspace] = useState<SettingsResourceState<CapacityConfigurationResponse>>(emptyResource);
  const [billingPlans, setBillingPlans] = useState<SettingsResourceState<BillingPlansResponse>>(emptyResource);
  const [backendHealth, setBackendHealth] = useState<SettingsResourceState<BackendHealth>>(emptyResource);

  useEffect(() => {
    generationRef.current += 1;
    tokenRef.current = token;
    setWorkspace(emptyResource());
    setBillingPlans(emptyResource());
    setBackendHealth(emptyResource());
  }, [token]);

  const loadWorkspace = useCallback(async () => {
    const requestToken = token;
    const generation = generationRef.current;
    if (!requestToken) {
      setWorkspace({ value: null, state: "NOT_AVAILABLE", loading: false, error: null, observedAt: null });
      return;
    }
    setWorkspace((current) => ({ ...current, loading: true, error: null }));
    try {
      const value = await fetchSettingsCapacityConfiguration(requestToken);
      if (generation !== generationRef.current || requestToken !== tokenRef.current) return;
      setWorkspace({ value, state: "LIVE", loading: false, error: null, observedAt: new Date().toISOString() });
    } catch {
      if (generation !== generationRef.current || requestToken !== tokenRef.current) return;
      setWorkspace({ value: null, state: "ERROR", loading: false, error: "load_failed", observedAt: null });
    }
  }, [token]);

  const loadBillingPlans = useCallback(async () => {
    const generation = generationRef.current;
    setBillingPlans((current) => ({ ...current, loading: true, error: null }));
    try {
      const value = await fetchSettingsBillingPlans();
      if (generation !== generationRef.current) return;
      setBillingPlans({ value, state: "LIVE", loading: false, error: null, observedAt: new Date().toISOString() });
    } catch {
      if (generation !== generationRef.current) return;
      setBillingPlans({ value: null, state: "ERROR", loading: false, error: "load_failed", observedAt: null });
    }
  }, []);

  const loadBackendHealth = useCallback(async () => {
    const generation = generationRef.current;
    setBackendHealth((current) => ({ ...current, loading: true, error: null }));
    try {
      const value = await fetchSettingsBackendHealth();
      if (generation !== generationRef.current) return;
      setBackendHealth({ value, state: "LIVE", loading: false, error: null, observedAt: new Date().toISOString() });
    } catch {
      if (generation !== generationRef.current) return;
      setBackendHealth({ value: null, state: "ERROR", loading: false, error: "load_failed", observedAt: null });
    }
  }, []);

  useEffect(() => {
    if (selectedSection === "workspace" && !workspace.loading && !workspace.value && !workspace.error) void loadWorkspace();
  }, [loadWorkspace, selectedSection, workspace.error, workspace.loading, workspace.value]);

  useEffect(() => {
    if ((selectedSection === "billing" || selectedSection === "integrations") && !billingPlans.loading && !billingPlans.value && !billingPlans.error) void loadBillingPlans();
  }, [billingPlans.error, billingPlans.loading, billingPlans.value, loadBillingPlans, selectedSection]);

  useEffect(() => {
    if ((selectedSection === "status" || selectedSection === "overview") && !backendHealth.loading && !backendHealth.value && !backendHealth.error) void loadBackendHealth();
  }, [backendHealth.error, backendHealth.loading, backendHealth.value, loadBackendHealth, selectedSection]);

  return useMemo(() => ({
    token,
    account: { user: sessionUser, loading: profileLoading },
    billing: { status: billingStatus, loading: billingLoading, refresh: refreshBilling },
    workspace: { ...workspace, refresh: loadWorkspace },
    billingPlans: { ...billingPlans, refresh: loadBillingPlans },
    backendHealth: { ...backendHealth, refresh: loadBackendHealth },
    theme: selectedThemeId,
    language,
  }), [backendHealth, billingLoading, billingPlans, billingStatus, language, loadBackendHealth, loadBillingPlans, loadWorkspace, profileLoading, refreshBilling, selectedThemeId, sessionUser, token, workspace]);
}
