import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppLanguage } from "../../../contexts/LanguageContext";
import { useDashboardTheme } from "../../../hooks/useDashboardTheme";
import { settingsCopy } from "../../../lib/settings/copy";
import type { SettingsTruthState } from "../../../lib/settings/contracts";

const MUTED_TRUTH_STATES: readonly SettingsTruthState[] = [
  "NOT_AVAILABLE",
  "NOT_CONNECTED",
  "PLAN_RESTRICTED",
  "PERMISSION_RESTRICTED",
];

function isMutedTruthState(state: SettingsTruthState): boolean {
  return MUTED_TRUTH_STATES.includes(state);
}

function useSettingsVisuals() {
  const { theme, selectedThemeId } = useDashboardTheme();
  const settingsAccent = selectedThemeId === "royal_gold_cosmos" ? theme.palette.gold : theme.palette.royal;
  return { theme, settingsAccent };
}

export function SettingsSectionShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { theme, settingsAccent } = useSettingsVisuals();

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: theme.palette.surface,
          borderColor: theme.palette.borderStrong,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.shellAura,
          { backgroundColor: `${settingsAccent}0D` },
        ]}
      />
      <View
        pointerEvents="none"
        style={[styles.topRail, { backgroundColor: settingsAccent }]}
      />

      <View style={styles.headingRow}>
        <View
          pointerEvents="none"
          style={[
            styles.headingMark,
            {
              borderColor: `${settingsAccent}66`,
              backgroundColor: `${settingsAccent}14`,
            },
          ]}
        >
          <View
            style={[
              styles.headingMarkCore,
              { backgroundColor: settingsAccent },
            ]}
          />
        </View>

        <View style={styles.headingCopy}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.palette.textPrimary }]}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: theme.palette.textSecondary },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        pointerEvents="none"
        style={[styles.headerRule, { backgroundColor: theme.palette.border }]}
      />

      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function SettingsStatusBadge({
  state,
}: {
  state: SettingsTruthState;
}) {
  const { language } = useAppLanguage();
  const { theme, settingsAccent } = useSettingsVisuals();
  const copy = settingsCopy(language);

  const negative = ["ERROR", "OFFLINE"].includes(state);
  const muted = isMutedTruthState(state);

  const color = negative
    ? theme.palette.negative
    : muted
      ? theme.palette.textTertiary
      : state === "LIVE"
        ? theme.palette.positive
        : settingsAccent;

  return (
    <Text
      style={[
        styles.badge,
        {
          color,
          borderColor: `${color}88`,
          backgroundColor: `${color}12`,
        },
      ]}
    >
      {copy.truthLabels[state]}
    </Text>
  );
}

export function SettingsFactRow({
  label,
  value,
  state,
  detail,
}: {
  label: string;
  value: string;
  state: SettingsTruthState;
  detail?: string;
}) {
  const { theme, settingsAccent } = useSettingsVisuals();
  const muted = isMutedTruthState(state);

  return (
    <View
      style={[
        styles.row,
        {
          minHeight: muted ? 68 : 78,
          paddingVertical: muted ? 11 : 14,
          borderColor: muted ? theme.palette.border : theme.palette.borderStrong,
          backgroundColor: theme.palette.surfaceRaised,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.rowAccent,
          {
            backgroundColor: muted ? theme.palette.textTertiary : settingsAccent,
            opacity: muted ? 0.34 : 0.72,
          },
        ]}
      />

      <View style={styles.rowMain}>
        <Text style={[styles.label, { color: theme.palette.textSecondary }]}>
          {label}
        </Text>

        <Text
          selectable
          style={[styles.value, { color: theme.palette.textPrimary }]}
        >
          {value}
        </Text>

        {detail ? (
          <Text style={[styles.detail, { color: theme.palette.textTertiary }]}>
            {detail}
          </Text>
        ) : null}
      </View>

      <SettingsStatusBadge state={state} />
    </View>
  );
}

export function SettingsNotice({
  text,
  state = "NOT_AVAILABLE",
}: {
  text: string;
  state?: SettingsTruthState;
}) {
  const { theme, settingsAccent } = useSettingsVisuals();
  const noticeAccent = ["ERROR", "OFFLINE"].includes(state)
    ? theme.palette.negative
    : isMutedTruthState(state)
      ? theme.palette.textTertiary
      : settingsAccent;

  return (
    <View
      style={[
        styles.notice,
        {
          borderColor: theme.palette.borderStrong,
          backgroundColor: theme.palette.surfaceRaised,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.noticeRail,
          { backgroundColor: noticeAccent, opacity: isMutedTruthState(state) ? 0.5 : 0.82 },
        ]}
      />

      <View style={styles.noticeBody}>
        <SettingsStatusBadge state={state} />

        <Text
          style={[styles.noticeText, { color: theme.palette.textSecondary }]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

export function SettingsEmptyState({
  text,
  state = "NOT_AVAILABLE",
}: {
  text: string;
  state?: SettingsTruthState;
}) {
  const { theme, settingsAccent } = useSettingsVisuals();
  const accent = isMutedTruthState(state) ? theme.palette.textTertiary : settingsAccent;

  return (
    <View
      style={[
        styles.emptyState,
        {
          borderColor: `${accent}55`,
          backgroundColor: theme.palette.surfaceRaised,
        },
      ]}
    >
      <View style={[styles.emptyMark, { borderColor: `${accent}70`, backgroundColor: `${accent}0D` }]}>
        <View style={[styles.emptyMarkCore, { backgroundColor: accent }]} />
      </View>
      <View style={styles.emptyCopy}>
        <SettingsStatusBadge state={state} />
        <Text style={[styles.emptyText, { color: theme.palette.textSecondary }]}>{text}</Text>
      </View>
    </View>
  );
}

export function SettingsButton({
  label,
  onPress,
  disabled = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const { theme, settingsAccent } = useSettingsVisuals();
  const accent = danger ? theme.palette.danger : settingsAccent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: `${accent}99`,
          backgroundColor: disabled
            ? theme.palette.surfaceRaised
            : `${accent}14`,
          opacity: pressed ? 0.82 : disabled ? 0.55 : 1,
          transform: [{ scale: pressed ? 0.992 : 1 }],
        },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: disabled ? theme.palette.textTertiary : accent,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    gap: 14,
  },

  shellAura: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -120,
    right: -70,
  },

  topRail: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 28,
    height: 2,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    zIndex: 1,
  },

  headingMark: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  headingMarkCore: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },

  headingCopy: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.35,
  },

  subtitle: {
    marginTop: 5,
    maxWidth: 820,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },

  headerRule: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },

  body: {
    gap: 12,
  },

  row: {
    position: "relative",
    overflow: "hidden",
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },

  rowAccent: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 2,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },

  rowMain: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 3,
  },

  label: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.72,
  },

  value: {
    marginTop: 5,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },

  detail: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    overflow: "hidden",
  },

  notice: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 18,
  },

  noticeRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },

  noticeBody: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 10,
  },

  noticeText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },

  emptyState: {
    minHeight: 132,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  emptyMark: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyMarkCore: {
    width: 8,
    height: 8,
    borderRadius: 999,
    opacity: 0.72,
  },

  emptyCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    gap: 10,
  },

  emptyText: {
    maxWidth: 680,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },

  button: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    letterSpacing: 0.15,
  },
});
