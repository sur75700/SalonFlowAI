import React from "react";
import {
  Pressable,
  Text,
} from "react-native";

import {
  fireEvent,
  render,
} from "@testing-library/react-native";

import {
  DASHBOARD_THEMES,
  DEFAULT_DASHBOARD_THEME_ID,
  isDashboardThemeId,
  resolveDashboardTheme,
} from "../../lib/theme/dashboardThemes";

import {
  DASHBOARD_THEME_STORAGE_KEY,
  DashboardThemeProvider,
  readDashboardThemePreference,
  useDashboardTheme,
  writeDashboardThemePreference,
  type DashboardThemeStorage,
} from "../../hooks/useDashboardTheme";

import AICommandCenterV2 from "../../components/dashboard-v2/cloud/AICommandCenterV2";
import { t } from "../../lib/i18n";

class MemoryStorage
  implements DashboardThemeStorage {
  private values =
    new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(
    key: string,
    value: string
  ): void {
    this.values.set(key, value);
  }
}

function ThemeProbe() {
  const {
    selectedThemeId,
    setTheme,
  } = useDashboardTheme();

  return (
    <Pressable
      testID="theme-switch"
      onPress={() =>
        setTheme("royal_gold_cosmos")
      }
    >
      <Text testID="theme-value">
        {selectedThemeId}
      </Text>
    </Pressable>
  );
}

function AICommandCenterProbe() {
  return (
    <AICommandCenterV2
      labels={{
        commandCenter: "AI Command Center",
        score: "AI Score",
        todaysFocus: "Today's Focus",
        forecast: "Forecast",
        insights: "Insights",
        recommendations: "Recommendations",
        emptyFocus: "No focus",
        emptyInsights: "No insights",
        caughtUp: "Caught up",
        loading: "Loading",
        refreshing: "Refreshing",
        unavailable: "Unavailable",
        retry: "Retry",
        locked: "Locked",
        upgrade: "Upgrade",
        expand: "Expand AI Command Center",
        close: "Close AI Command Center",
        fullView: "Full intelligence view",
      }}
      healthLabel="High"
      aiScore={100}
      confidenceLabel="100%"
      todaysFocus={[
        {
          label: "Recover idle capacity",
          detail: "Consolidate low-demand working periods and launch focused demand-generation actions for idle slots.",
          tone: "warning",
        },
      ]}
      forecast={{
        headline: "Analyzed 2 trusted signals and 29 validated metrics across 4 trusted domains.",
        helperText: "Validated metric coverage includes 4 of 4 trusted domains. | metric: Revenue growth=-64.87 percent",
        series: [],
      }}
      insights={[
        {
          title: "Capacity is mostly idle",
          description: "Capacity utilization is only 0.64% and 3100 slots remain available.",
          tone: "warning",
        },
      ]}
      recommendations={["Recover idle capacity"]}
    />
  );
}

describe(
  "Royal Cosmos Dashboard theme engine",
  () => {
    test(
      "keeps released Royal Cosmos as safe fallback",
      () => {
        expect(
          DEFAULT_DASHBOARD_THEME_ID
        ).toBe("royal_cosmos");

        expect(
          resolveDashboardTheme("unknown").id
        ).toBe("royal_cosmos");
      }
    );

    test(
      "registers Royal Gold Cosmos with preserved semantic colors",
      () => {
        const theme =
          DASHBOARD_THEMES
            .royal_gold_cosmos;

        expect(theme.id).toBe(
          "royal_gold_cosmos"
        );

        expect(theme.palette.gold).toBe(
          "#F3D184"
        );

        expect(
          theme.palette.positive
        ).toBe("#3FCF8E");

        expect(
          theme.palette.negative
        ).toBe("#F2617A");

        expect(
          theme.palette.cosmosBlue
        ).toBe("#65D4FF");
      }
    );

    test(
      "registers Burgundy Cosmos with preserved semantic colors",
      () => {
        const theme =
          DASHBOARD_THEMES
            .burgundy_cosmos;

        expect(theme.id).toBe(
          "burgundy_cosmos"
        );

        expect(theme.palette.gold).toBe(
          "#E8C97A"
        );

        expect(
          theme.palette.positive
        ).toBe("#3FCF8E");

        expect(
          theme.palette.negative
        ).toBe("#F2617A");

        expect(
          theme.palette.surface
        ).toBe(
          "rgba(18,7,16,0.90)"
        );
      }
    );

    test(
      "accepts only frozen ids",
      () => {
        expect(
          isDashboardThemeId(
            "royal_cosmos"
          )
        ).toBe(true);

        expect(
          isDashboardThemeId(
            "royal_gold_cosmos"
          )
        ).toBe(true);

        expect(
          isDashboardThemeId(
            "burgundy_cosmos"
          )
        ).toBe(true);

        expect(
          isDashboardThemeId(
            "enterprise_gold"
          )
        ).toBe(false);
      }
    );

    test(
      "persists and restores",
      () => {
        const storage =
          new MemoryStorage();

        writeDashboardThemePreference(
          storage,
          "royal_gold_cosmos"
        );

        expect(
          storage.getItem(
            DASHBOARD_THEME_STORAGE_KEY
          )
        ).toBe(
          "royal_gold_cosmos"
        );

        expect(
          readDashboardThemePreference(
            storage
          )
        ).toBe(
          "royal_gold_cosmos"
        );
      }
    );

    test(
      "persists and restores Burgundy Cosmos",
      () => {
        const storage =
          new MemoryStorage();

        writeDashboardThemePreference(
          storage,
          "burgundy_cosmos"
        );

        expect(
          storage.getItem(
            DASHBOARD_THEME_STORAGE_KEY
          )
        ).toBe(
          "burgundy_cosmos"
        );

        expect(
          readDashboardThemePreference(
            storage
          )
        ).toBe(
          "burgundy_cosmos"
        );
      }
    );

    test(
      "invalid persistence fails closed",
      () => {
        const storage =
          new MemoryStorage();

        storage.setItem(
          DASHBOARD_THEME_STORAGE_KEY,
          "invalid-theme"
        );

        expect(
          readDashboardThemePreference(
            storage
          )
        ).toBe("royal_cosmos");
      }
    );

    test(
      "switches immediately in provider memory",
      () => {
        const screen = render(
          <DashboardThemeProvider>
            <ThemeProbe />
          </DashboardThemeProvider>
        );

        fireEvent.press(
          screen.getByTestId(
            "theme-switch"
          )
        );

        expect(
          screen.getByTestId(
            "theme-value"
          ).props.children
        ).toBe(
          "royal_gold_cosmos"
        );
      }
    );

    test(
      "exposes Burgundy Cosmos label in every supported locale",
      () => {
        expect(t("Burgundy Cosmos", "en")).toBe(
          "Burgundy Cosmos"
        );
        expect(t("Burgundy Cosmos", "hy")).toBe(
          "Burgundy Cosmos"
        );
        expect(t("Burgundy Cosmos", "ru")).toBe(
          "Burgundy Cosmos"
        );
        expect(t("Burgundy Cosmos", "fr")).toBe(
          "Burgundy Cosmos"
        );
      }
    );

    test(
      "opens and closes the full AI command center without changing data ownership",
      () => {
        const screen = render(
          <DashboardThemeProvider>
            <AICommandCenterProbe />
          </DashboardThemeProvider>
        );

        fireEvent.press(
          screen.getByTestId(
            "ai-command-center-expand"
          )
        );

        expect(
          screen.getByTestId(
            "ai-command-center-modal"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "Full intelligence view"
          )
        ).toBeTruthy();

        expect(
          screen.getAllByText(
            "Recover idle capacity"
          ).length
        ).toBeGreaterThanOrEqual(2);

        fireEvent.press(
          screen.getByTestId(
            "ai-command-center-close"
          )
        );

        expect(
          screen.queryByTestId(
            "ai-command-center-modal"
          )
        ).toBeNull();
      }
    );

    test(
      "localizes AI command center expansion controls in all supported locales",
      () => {
        expect(
          t(
            "AI Command Center Expand",
            "hy"
          )
        ).toBe(
          "Մեծացնել AI հրամանային կենտրոնը"
        );

        expect(
          t(
            "AI Command Center Full View",
            "ru"
          )
        ).toBe(
          "Полный обзор AI-аналитики"
        );

        expect(
          t(
            "AI Command Center Close",
            "fr"
          )
        ).toBe(
          "Fermer le centre de commande IA"
        );
      }
    );
  }
);
