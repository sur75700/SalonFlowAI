import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";

export type SettingsSectionKey =
  | "core"
  | "subscription"
  | "ai"
  | "operations"
  | "enterprise";

type Props = {
  onNavigate: (key: SettingsSectionKey) => void;
};

const NAV_ITEMS: { key: SettingsSectionKey; labelKey: string }[] = [
  { key: "core", labelKey: "Smart Nav Core" },
  { key: "subscription", labelKey: "Smart Nav Subscription" },
  { key: "ai", labelKey: "Smart Nav AI" },
  { key: "operations", labelKey: "Smart Nav Operations" },
  { key: "enterprise", labelKey: "Smart Nav Enterprise" },
];

export default function SmartNavigationBar({ onNavigate }: Props) {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t("Smart Navigation", locale)}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {NAV_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => onNavigate(item.key)}
            style={styles.chip}
          >
            <Text style={styles.chipText}>{t(item.labelKey, locale)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  content: {
    paddingRight: 20,
    gap: 10,
  },
  chip: {
    backgroundColor: "rgba(242,209,122,0.12)",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(242,209,122,0.42)",
  },
  chipText: {
    color: "#f2d17a",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
