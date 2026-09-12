import React from "react";
import { Platform } from "react-native";

import {
  DEFAULT_DASHBOARD_THEME_ID,
  isDashboardThemeId,
  resolveDashboardTheme,
  type DashboardThemeDefinition,
  type DashboardThemeId,
} from "../lib/theme/dashboardThemes";

export const DASHBOARD_THEME_STORAGE_KEY =
  "salonflowai.dashboard.theme.v1";

export interface DashboardThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getBrowserStorage():
  DashboardThemeStorage | null {
  if (Platform.OS !== "web") {
    return null;
  }

  try {
    const candidate = (
      globalThis as typeof globalThis & {
        localStorage?: DashboardThemeStorage;
      }
    ).localStorage;

    return candidate ?? null;
  } catch {
    return null;
  }
}

export function readDashboardThemePreference(
  storage:
    DashboardThemeStorage | null =
      getBrowserStorage()
): DashboardThemeId {
  if (!storage) {
    return DEFAULT_DASHBOARD_THEME_ID;
  }

  try {
    const value = storage.getItem(
      DASHBOARD_THEME_STORAGE_KEY
    );

    return isDashboardThemeId(value)
      ? value
      : DEFAULT_DASHBOARD_THEME_ID;
  } catch {
    return DEFAULT_DASHBOARD_THEME_ID;
  }
}

export function writeDashboardThemePreference(
  storage: DashboardThemeStorage | null,
  value: DashboardThemeId
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      DASHBOARD_THEME_STORAGE_KEY,
      value
    );
  } catch {
    // Storage failure must not break the Dashboard.
  }
}

type DashboardThemeContextValue = Readonly<{
  selectedThemeId: DashboardThemeId;
  theme: DashboardThemeDefinition;
  setTheme: (value: DashboardThemeId) => void;
}>;

const fallbackContext:
  DashboardThemeContextValue = {
    selectedThemeId:
      DEFAULT_DASHBOARD_THEME_ID,
    theme: resolveDashboardTheme(
      DEFAULT_DASHBOARD_THEME_ID
    ),
    setTheme: () => undefined,
  };

const DashboardThemeContext =
  React.createContext<
    DashboardThemeContextValue
  >(fallbackContext);

export function DashboardThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    selectedThemeId,
    setSelectedThemeId,
  ] = React.useState<DashboardThemeId>(
    () => readDashboardThemePreference()
  );

  const setTheme = React.useCallback(
    (value: DashboardThemeId) => {
      const next =
        isDashboardThemeId(value)
          ? value
          : DEFAULT_DASHBOARD_THEME_ID;

      setSelectedThemeId(next);

      writeDashboardThemePreference(
        getBrowserStorage(),
        next
      );
    },
    []
  );

  const value = React.useMemo(
    () => ({
      selectedThemeId,
      theme: resolveDashboardTheme(
        selectedThemeId
      ),
      setTheme,
    }),
    [selectedThemeId, setTheme]
  );

  return (
    <DashboardThemeContext.Provider
      value={value}
    >
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme():
  DashboardThemeContextValue {
  return React.useContext(
    DashboardThemeContext
  );
}
