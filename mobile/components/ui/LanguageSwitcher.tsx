import React from "react";
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
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#1f1a10",
    borderColor: "#f2d17a",
  },
  chipText: {
    color: "#d2c8af",
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#f2d17a",
  },
});
