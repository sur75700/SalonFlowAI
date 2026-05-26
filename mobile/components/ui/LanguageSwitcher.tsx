import React from "react";
import { UI } from "../../lib/theme/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { languageLabels, supportedLanguages } from "../../lib/i18n";
import { useAppLanguage } from "../../contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useAppLanguage();

  return (
    <View style={styles.wrap}>
      {supportedLanguages.map((item) => {
        const active = item === language;
        return (
          <Pressable
            key={item}
            onPress={() => setLanguage(item)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {languageLabels[item]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: UI.spacing.xs,
    marginTop: UI.spacing.sm,
    marginBottom: UI.spacing.sm,
  },
  chip: {
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: UI.radius.pill,
    paddingHorizontal: UI.spacing.md,
    paddingVertical: UI.spacing.xs,
  },
  chipActive: {
    backgroundColor: "#1f1a10",
    borderColor: "#f2d17a",
  },
  chipText: {
    color: "#d2c8af",
    fontSize: UI.font.overline,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#f2d17a",
  },
});
