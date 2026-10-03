import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { useAppLanguage } from "../../../contexts/LanguageContext";
import { useDashboardTheme } from "../../../hooks/useDashboardTheme";
import { useSettingsSnapshot } from "../../../hooks/useSettingsSnapshot";
import { settingsCopy } from "../../../lib/settings/copy";
import type { SettingsSectionId } from "../../../lib/settings/contracts";
import { isSettingsSectionId } from "../../../lib/settings/sections";
import SettingsNavigation from "./SettingsNavigation";
import SettingsPanelRouter from "./SettingsPanelRouter";

export default function SettingsCommandCenter() {
  const { language } = useAppLanguage();
  const { theme, selectedThemeId } = useDashboardTheme();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ section?: string }>();
  const routeSection = isSettingsSectionId(params.section) ? params.section : "overview";
  const [selected, setSelected] = useState<SettingsSectionId>(routeSection);
  const [query, setQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const compact = width < 980;
  const copy = settingsCopy(language);
  const snapshot = useSettingsSnapshot(selected);
  const settingsAccent = selectedThemeId === "royal_gold_cosmos" ? theme.palette.gold : theme.palette.royal;
  const themeIdentity = selectedThemeId === "royal_gold_cosmos" ? "ROYAL GOLD COSMOS" : "ROYAL COSMOS";

  useEffect(() => {
    setSelected(routeSection);
  }, [routeSection]);

  const select = (id: SettingsSectionId) => {
    setSelected(id);
    setMobileNavOpen(false);
    setQuery("");
    router.setParams({ section: id });
  };

  const navigation = (
    <SettingsNavigation
      selected={selected}
      onSelect={select}
      compact={compact}
      open={mobileNavOpen}
      onToggle={() => setMobileNavOpen((value) => !value)}
      query={query}
      onQueryChange={setQuery}
    />
  );

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.masthead,
          {
            borderBottomColor: theme.palette.border,
            backgroundColor: theme.palette.surface,
          },
        ]}
      >
        <View pointerEvents="none" style={[styles.mastheadAccent, { backgroundColor: settingsAccent }]} />
        <View style={styles.mastheadTopRow}>
          <Text style={[styles.overline, { color: settingsAccent }]}>SALONFLOWAI</Text>
          <View
            style={[
              styles.themePill,
              {
                borderColor: `${settingsAccent}66`,
                backgroundColor: `${settingsAccent}10`,
              },
            ]}
          >
            <View style={[styles.themePillDot, { backgroundColor: settingsAccent }]} />
            <Text style={[styles.themePillText, { color: theme.palette.textSecondary }]}>{themeIdentity}</Text>
          </View>
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.palette.textPrimary }]}>{copy.title}</Text>
        <Text style={[styles.subtitle, { color: theme.palette.textSecondary }]}>{copy.subtitle}</Text>
      </View>

      {compact ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.compactContent}>
          {navigation}
          <SettingsPanelRouter selected={selected} snapshot={snapshot} onSelect={select} />
        </ScrollView>
      ) : (
        <View style={styles.desktopBody}>
          <View style={[styles.rail, { borderRightColor: theme.palette.border }]}>{navigation}</View>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.contentScroll} contentContainerStyle={styles.content}>
            <SettingsPanelRouter selected={selected} snapshot={snapshot} onSelect={select} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  masthead: { position: "relative", overflow: "hidden", paddingHorizontal: 22, paddingTop: 14, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  mastheadAccent: { position: "absolute", left: 22, top: 0, width: 148, height: 2, borderBottomLeftRadius: 999, borderBottomRightRadius: 999 },
  mastheadTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  overline: { fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 1.7 },
  themePill: { minHeight: 30, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 7 },
  themePillDot: { width: 6, height: 6, borderRadius: 999 },
  themePillText: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 0.8 },
  title: { fontSize: 27, lineHeight: 33, fontWeight: "900", marginTop: 4, letterSpacing: -0.45 },
  subtitle: { fontSize: 13, lineHeight: 20, marginTop: 4, maxWidth: 900, fontWeight: "600" },
  desktopBody: { flex: 1, minHeight: 0, flexDirection: "row", width: "100%", maxWidth: 1360, alignSelf: "center" },
  rail: { width: 280, minHeight: 0, padding: 18, paddingBottom: 0, borderRightWidth: StyleSheet.hairlineWidth },
  contentScroll: { flex: 1, minHeight: 0 },
  content: { padding: 22, paddingBottom: 140 },
  compactContent: { padding: 16, paddingBottom: 140, gap: 14 },
});
