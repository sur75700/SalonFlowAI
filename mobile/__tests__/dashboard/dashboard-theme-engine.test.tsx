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
  }
);
