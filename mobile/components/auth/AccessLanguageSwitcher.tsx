import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppLanguage } from "../../contexts/LanguageContext";
import { useDashboardTheme } from "../../hooks/useDashboardTheme";
import { ACCESS_LANGUAGE_OPTIONS } from "./access-gateway-copy";

export default function AccessLanguageSwitcher() {
  const { language, setLanguage } = useAppLanguage();
  const { selectedThemeId, theme } = useDashboardTheme();
  const accent =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.gold
      : theme.palette.royal;
  const accentSoft =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.goldGlow
      : theme.palette.royalGlow;

  return (
    <View
      accessibilityRole="toolbar"
      style={styles.row}
    >
      {ACCESS_LANGUAGE_OPTIONS.map((option) => {
        const active = option.code === language;

        return (
          <Pressable
            key={option.code}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setLanguage(option.code)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: active
                  ? accentSoft
                  : theme.palette.surfaceRaised,
                borderColor: active
                  ? accent
                  : theme.palette.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Text style={styles.flag}>{option.flag}</Text>
            <Text
              style={[
                styles.label,
                {
                  color: active
                    ? theme.palette.textPrimary
                    : theme.palette.textSecondary,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  flag: {
    fontSize: 15,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
});
