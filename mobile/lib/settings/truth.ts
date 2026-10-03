import type { SettingsTruthState } from "./contracts";

export const SETTINGS_TRUTH_STATES: readonly SettingsTruthState[] = [
  "LIVE",
  "CACHED",
  "CONFIGURED",
  "DERIVED",
  "ESTIMATED",
  "NOT_CONNECTED",
  "NOT_AVAILABLE",
  "PLAN_RESTRICTED",
  "PERMISSION_RESTRICTED",
  "ERROR",
  "OFFLINE",
] as const;

export function isUnavailableTruthState(state: SettingsTruthState): boolean {
  return [
    "NOT_CONNECTED",
    "NOT_AVAILABLE",
    "PLAN_RESTRICTED",
    "PERMISSION_RESTRICTED",
    "ERROR",
    "OFFLINE",
  ].includes(state);
}
