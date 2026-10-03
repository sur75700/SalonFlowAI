import type { BillingStatus, CurrentUser } from "../api";
import type { DashboardThemeId } from "../theme/dashboardThemes";
import type { AppLanguage } from "../i18n";

export type SettingsTruthState =
  | "LIVE"
  | "CACHED"
  | "CONFIGURED"
  | "DERIVED"
  | "ESTIMATED"
  | "NOT_CONNECTED"
  | "NOT_AVAILABLE"
  | "PLAN_RESTRICTED"
  | "PERMISSION_RESTRICTED"
  | "ERROR"
  | "OFFLINE";

export type SettingsSectionId =
  | "overview"
  | "account"
  | "workspace"
  | "appearance"
  | "security"
  | "privacy"
  | "team"
  | "billing"
  | "intelligence"
  | "governance"
  | "notifications"
  | "integrations"
  | "status"
  | "audit"
  | "authority"
  | "danger";

export type SettingsSectionGroup =
  | "core"
  | "protection"
  | "business"
  | "intelligence"
  | "connections"
  | "trust"
  | "danger";

export type CapacityTimeInterval = {
  start_minute: number;
  end_minute: number;
};

export type CapacityBusinessDay = {
  weekday: number;
  intervals: CapacityTimeInterval[];
};

export type CapacityConfiguration = {
  id: string;
  schema_version: number;
  revision: number;
  status: "draft" | "active";
  timezone: string;
  slot_duration_minutes: number;
  weekly_business_hours: CapacityBusinessDay[];
  created_at: string;
  updated_at: string;
};

export type CapacityConfigurationResponse = {
  configuration: CapacityConfiguration | null;
};

export type BillingPlan = {
  code: "free" | "pro" | "business" | "enterprise";
  name: string;
  monthly_price: number | null;
  currency: string;
  highlighted: boolean;
  features: string[];
};

export type BillingPlansResponse = {
  plans: BillingPlan[];
  provider: string;
  billing_ready: boolean;
};

export type BackendHealth = {
  status: string;
};

export type SettingsResourceState<T> = {
  value: T | null;
  state: SettingsTruthState;
  loading: boolean;
  error: string | null;
  observedAt: string | null;
};

export type SettingsSnapshot = {
  token: string;
  account: {
    user: CurrentUser | null;
    loading: boolean;
  };
  billing: {
    status: BillingStatus | null;
    loading: boolean;
    refresh: () => Promise<void>;
  };
  workspace: SettingsResourceState<CapacityConfigurationResponse> & { refresh: () => Promise<void> };
  billingPlans: SettingsResourceState<BillingPlansResponse> & { refresh: () => Promise<void> };
  backendHealth: SettingsResourceState<BackendHealth> & { refresh: () => Promise<void> };
  theme: DashboardThemeId;
  language: AppLanguage;
};
