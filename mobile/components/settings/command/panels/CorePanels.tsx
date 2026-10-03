import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppLanguage } from "../../../../contexts/LanguageContext";
import { useDashboardTheme } from "../../../../hooks/useDashboardTheme";
import { languageLabels, type AppLanguage } from "../../../../lib/i18n";
import { DASHBOARD_THEMES, DASHBOARD_THEME_IDS, type DashboardThemeId } from "../../../../lib/theme/dashboardThemes";
import { settingsCopy } from "../../../../lib/settings/copy";
import type { SettingsSnapshot } from "../../../../lib/settings/contracts";
import { SettingsButton, SettingsFactRow, SettingsNotice, SettingsSectionShell } from "../SettingsPrimitives";

function minuteLabel(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function AccountSettingsPanel({ snapshot }: { snapshot: SettingsSnapshot }) {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);
  const user = snapshot.account.user;

  return (
    <SettingsSectionShell title={copy.sectionLabels.account} subtitle={copy.accountSubtitle}>
      {snapshot.account.loading ? (
        <SettingsNotice state="CACHED" text={copy.loading} />
      ) : user ? (
        <>
          <SettingsFactRow label={copy.emailLabel} value={user.email || copy.unavailable} state={user.email ? "LIVE" : "NOT_AVAILABLE"} />
          <SettingsFactRow label={copy.fullNameLabel} value={user.full_name || copy.unavailable} state={user.full_name ? "LIVE" : "NOT_AVAILABLE"} />
          <SettingsFactRow label={copy.roleLabel} value={user.role || copy.unavailable} state={user.role ? "DERIVED" : "NOT_AVAILABLE"} detail={copy.roleDetail} />
          <SettingsFactRow label={copy.emailVerificationLabel} value={user.email_verified ? copy.verified : copy.notVerified} state="LIVE" />
          <SettingsFactRow label={copy.createdLabel} value={user.created_at || copy.unavailable} state={user.created_at ? "LIVE" : "NOT_AVAILABLE"} />
          <SettingsFactRow label={copy.thisDeviceLabel} value={copy.signedIn} state="DERIVED" detail={copy.thisDeviceDetail} />
        </>
      ) : (
        <SettingsNotice text={copy.accountDetailsUnavailable} />
      )}
    </SettingsSectionShell>
  );
}

export function WorkspaceSettingsPanel({ snapshot }: { snapshot: SettingsSnapshot }) {
  const { language } = useAppLanguage();
  const copy = settingsCopy(language);
  const resource = snapshot.workspace;
  const config = resource.value?.configuration ?? null;

  return (
    <SettingsSectionShell title={copy.sectionLabels.workspace} subtitle={copy.workspaceSubtitle}>
      <SettingsNotice state="NOT_AVAILABLE" text={copy.workspaceUnavailable} />
      {resource.loading ? (
        <SettingsNotice state="CACHED" text={copy.loading} />
      ) : resource.state === "ERROR" ? (
        <>
          <SettingsNotice state="ERROR" text={copy.actionFailed} />
          <SettingsButton label={copy.retry} onPress={() => void resource.refresh()} />
        </>
      ) : config ? (
        <>
          <SettingsFactRow
            label={copy.operationalProfile}
            value={config.status}
            state="LIVE"
            detail={`${copy.revisionLabel} ${config.revision}`}
          />
          <SettingsFactRow label={copy.timezoneLabel} value={config.timezone} state="LIVE" />
          <SettingsFactRow label={copy.slotDurationLabel} value={`${config.slot_duration_minutes} ${copy.minutesShort}`} state="LIVE" />
          {config.weekly_business_hours.map((day) => (
            <SettingsFactRow
              key={day.weekday}
              label={copy.weekdays[day.weekday] ?? String(day.weekday)}
              value={
                day.intervals.length
                  ? day.intervals.map((interval) => `${minuteLabel(interval.start_minute)}–${minuteLabel(interval.end_minute)}`).join(", ")
                  : copy.closed
              }
              state="LIVE"
            />
          ))}
        </>
      ) : (
        <SettingsNotice text={copy.workspaceNotConfigured} />
      )}
    </SettingsSectionShell>
  );
}

export function AppearanceSettingsPanel() {
  const { language, setLanguage } = useAppLanguage();
  const { selectedThemeId, setTheme, theme } = useDashboardTheme();
  const copy = settingsCopy(language);
  const settingsAccent = selectedThemeId === "royal_gold_cosmos" ? theme.palette.gold : theme.palette.royal;
  const [themeDraft, setThemeDraft] = useState<DashboardThemeId>(selectedThemeId);
  const [languageDraft, setLanguageDraft] = useState<AppLanguage>(language);

  useEffect(() => setThemeDraft(selectedThemeId), [selectedThemeId]);
  useEffect(() => setLanguageDraft(language), [language]);

  const themeSaveLabel = Platform.OS === "web" ? copy.browserSaved : copy.sessionOnly;

  return (
    <SettingsSectionShell title={copy.sectionLabels.appearance} subtitle={copy.appearanceSubtitle}>
      <Text style={[styles.groupTitle, { color: theme.palette.textPrimary }]}>{copy.themeLabel}</Text>
      <View style={styles.optionGrid}>
        {DASHBOARD_THEME_IDS.map((id) => {
          const definition = DASHBOARD_THEMES[id];
          const active = themeDraft === id;
          const optionAccent = id === "royal_gold_cosmos" ? definition.palette.gold : definition.palette.royal;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setThemeDraft(id)}
              style={[
                styles.themeOption,
                {
                  backgroundColor: definition.palette.surface,
                  borderColor: active ? optionAccent : definition.palette.border,
                },
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: definition.palette.royal }]} />
              <View style={[styles.swatch, { backgroundColor: definition.palette.gold }]} />
              <Text style={[styles.optionText, { color: definition.palette.textPrimary }]}>
                {id === "royal_cosmos" ? "Royal Cosmos" : "Royal Gold Cosmos"}
              </Text>
              {active ? <Text style={[styles.currentText, { color: optionAccent }]}>{copy.current}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <SettingsButton label={copy.applyTheme} onPress={() => setTheme(themeDraft)} disabled={themeDraft === selectedThemeId} />
      <SettingsNotice state="CONFIGURED" text={themeSaveLabel} />

      <Text style={[styles.groupTitle, { color: theme.palette.textPrimary }]}>{copy.languageLabel}</Text>
      <View style={styles.optionGrid}>
        {(["en", "hy", "ru", "fr"] as AppLanguage[]).map((item) => {
          const active = languageDraft === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setLanguageDraft(item)}
              style={[
                styles.languageOption,
                {
                  backgroundColor: theme.palette.surfaceRaised,
                  borderColor: active ? settingsAccent : theme.palette.border,
                },
              ]}
            >
              <Text style={[styles.optionText, { color: theme.palette.textPrimary }]}>{languageLabels[item]}</Text>
              {active ? <Text style={[styles.currentText, { color: settingsAccent }]}>{copy.current}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <SettingsButton label={copy.applyLanguage} onPress={() => setLanguage(languageDraft)} disabled={languageDraft === language} />
      <SettingsNotice state="CONFIGURED" text={copy.sessionOnly} />
    </SettingsSectionShell>
  );
}

const styles = StyleSheet.create({
  groupTitle: { fontSize: 14, fontWeight: "900", marginTop: 4 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeOption: { flexGrow: 1, flexBasis: 200, minHeight: 110, borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  languageOption: { flexGrow: 1, flexBasis: 150, minHeight: 70, borderWidth: 1, borderRadius: 16, padding: 14, justifyContent: "center", gap: 6 },
  swatch: { width: 34, height: 8, borderRadius: 999 },
  optionText: { fontSize: 14, fontWeight: "900" },
  currentText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
});
