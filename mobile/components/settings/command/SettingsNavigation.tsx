import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAppLanguage } from "../../../contexts/LanguageContext";
import { useDashboardTheme } from "../../../hooks/useDashboardTheme";
import { settingsCopy } from "../../../lib/settings/copy";
import type { SettingsSectionGroup, SettingsSectionId } from "../../../lib/settings/contracts";
import { SETTINGS_SECTIONS } from "../../../lib/settings/sections";

const GROUP_ORDER: readonly SettingsSectionGroup[] = ["core", "protection", "business", "intelligence", "connections", "trust", "danger"];

export default function SettingsNavigation({ selected, onSelect, compact, open, onToggle, query, onQueryChange }: { selected: SettingsSectionId; onSelect: (id: SettingsSectionId) => void; compact: boolean; open: boolean; onToggle: () => void; query: string; onQueryChange: (value: string) => void }) {
  const { language } = useAppLanguage();
  const { theme, selectedThemeId } = useDashboardTheme();
  const copy = settingsCopy(language);
  const settingsAccent = selectedThemeId === "royal_gold_cosmos" ? theme.palette.gold : theme.palette.royal;
  const normalized = query.trim().toLocaleLowerCase();
  const visible = useMemo(() => SETTINGS_SECTIONS.filter((section) => {
    if (!normalized) return true;
    const haystack = [section.id, copy.sectionLabels[section.id], ...section.searchAliases].join(" ").toLocaleLowerCase();
    return haystack.includes(normalized);
  }), [copy.sectionLabels, normalized]);

  const content = (
    <View style={styles.navBody}>
      <TextInput accessibilityLabel={copy.search} placeholder={copy.search} placeholderTextColor={theme.palette.textTertiary} value={query} onChangeText={onQueryChange} style={[styles.search, { color: theme.palette.textPrimary, backgroundColor: theme.palette.surfaceRaised, borderColor: theme.palette.border }]} />
      {GROUP_ORDER.map((group) => {
        const items = visible.filter((section) => section.group === group);
        if (!items.length) return null;
        return (
          <View key={group} style={styles.group}>
            {copy.groupLabels[group] ? (
              <View style={styles.groupHeader}>
                <View style={[styles.groupMarker, { backgroundColor: settingsAccent }]} />
                <Text style={[styles.groupLabel, { color: settingsAccent }]}>{copy.groupLabels[group]}</Text>
                <View style={[styles.groupRule, { backgroundColor: `${settingsAccent}30` }]} />
              </View>
            ) : null}
            {items.map((section) => {
              const active = section.id === selected;
              return (
                <Pressable
                  key={section.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => onSelect(section.id)}
                  style={({ pressed }) => [
                    styles.item,
                    {
                      backgroundColor: active ? `${settingsAccent}14` : "transparent",
                      borderColor: active ? `${settingsAccent}88` : "transparent",
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  {active ? <View pointerEvents="none" style={[styles.activeBar, { backgroundColor: settingsAccent }]} /> : null}
                  <Text
                    style={[
                      styles.itemText,
                      {
                        color: active ? settingsAccent : theme.palette.textSecondary,
                        fontWeight: active ? "900" : "800",
                      },
                    ]}
                  >
                    {copy.sectionLabels[section.id]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={[styles.compactButton, { borderColor: theme.palette.borderStrong, backgroundColor: theme.palette.surface }]}>
          <Text style={[styles.compactTitle, { color: theme.palette.textPrimary }]}>{copy.sectionLabels[selected]}</Text>
          <Text style={[styles.compactHint, { color: settingsAccent }]}>{open ? copy.close : copy.browse}</Text>
        </Pressable>
        {open ? <ScrollView nestedScrollEnabled style={[styles.compactMenu, { backgroundColor: theme.palette.surface, borderColor: theme.palette.border }]} contentContainerStyle={styles.compactMenuContent}>{content}</ScrollView> : null}
      </View>
    );
  }

  return <ScrollView style={styles.desktopScroll} contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator>{content}</ScrollView>;
}

const styles = StyleSheet.create({
  desktopScroll: { width: 250, flex: 1, minHeight: 0, flexShrink: 1 },
  desktopContent: { paddingBottom: 140 },
  navBody: { gap: 12 },
  search: { minHeight: 44, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, fontSize: 13, fontWeight: "700" },
  group: { gap: 5, marginTop: 2 },
  groupHeader: { minHeight: 24, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 3 },
  groupMarker: { width: 3, height: 14, borderRadius: 999 },
  groupLabel: { fontSize: 10, lineHeight: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.25 },
  groupRule: { flex: 1, height: StyleSheet.hairlineWidth, minWidth: 18 },
  item: { position: "relative", overflow: "hidden", minHeight: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, justifyContent: "center" },
  activeBar: { position: "absolute", left: 0, top: 8, bottom: 8, width: 2, borderTopRightRadius: 999, borderBottomRightRadius: 999 },
  itemText: { fontSize: 12, lineHeight: 17, fontWeight: "800" },
  compactWrap: { gap: 10 },
  compactButton: { minHeight: 50, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  compactTitle: { flex: 1, fontSize: 14, fontWeight: "900" },
  compactHint: { fontSize: 11, fontWeight: "900" },
  compactMenu: { borderWidth: 1, borderRadius: 18, maxHeight: 460 },
  compactMenuContent: { padding: 12 },
});
