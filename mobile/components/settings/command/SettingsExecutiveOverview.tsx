import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppLanguage } from "../../../contexts/LanguageContext";
import { useDashboardTheme } from "../../../hooks/useDashboardTheme";
import { settingsCopy } from "../../../lib/settings/copy";
import type {
  SettingsSectionId,
  SettingsSnapshot,
  SettingsTruthState,
} from "../../../lib/settings/contracts";
import { SettingsStatusBadge } from "./SettingsPrimitives";

export default function SettingsExecutiveOverview({
  snapshot,
  onSelect,
}: {
  snapshot: SettingsSnapshot;
  onSelect: (id: SettingsSectionId) => void;
}) {
  const { language } = useAppLanguage();
  const { theme, selectedThemeId } = useDashboardTheme();
  const copy = settingsCopy(language);
  const settingsAccent = selectedThemeId === "royal_gold_cosmos" ? theme.palette.gold : theme.palette.royal;

  const user = snapshot.account.user;
  const billing = snapshot.billing.status;
  const apiLive = snapshot.backendHealth.value?.status === "ok";

  const themeName =
    snapshot.theme === "royal_cosmos"
      ? "Royal Cosmos"
      : snapshot.theme === "royal_gold_cosmos"
        ? "Royal Gold Cosmos"
        : "Burgundy Cosmos";

  const aiIncluded = Boolean(
    billing?.features?.some(
      (feature) =>
        feature.includes("ai") ||
        feature.includes("insights") ||
        feature.includes("intelligence")
    )
  );

  const facts: {
    id: SettingsSectionId;
    label: string;
    value: string;
    state: SettingsTruthState;
  }[] = [
    {
      id: "account",
      label: copy.sectionLabels.account,
      value: user?.email || copy.unavailable,
      state: user?.email ? "LIVE" : "NOT_AVAILABLE",
    },
    {
      id: "billing",
      label: copy.sectionLabels.billing,
      value: billing?.plan ? billing.plan.toUpperCase() : copy.unavailable,
      state: billing?.plan ? "LIVE" : "NOT_AVAILABLE",
    },
    {
      id: "security",
      label: copy.emailVerificationLabel,
      value: user
        ? user.email_verified
          ? copy.verified
          : copy.notVerified
        : copy.unavailable,
      state: user ? "LIVE" : "NOT_AVAILABLE",
    },
    {
      id: "intelligence",
      label: copy.sectionLabels.intelligence,
      value: aiIncluded ? copy.planAccessAvailable : copy.unavailable,
      state: billing
        ? aiIncluded
          ? "DERIVED"
          : "PLAN_RESTRICTED"
        : "NOT_AVAILABLE",
    },
    {
      id: "appearance",
      label: copy.themeLabel,
      value: `${themeName} · ${snapshot.language.toUpperCase()}`,
      state: "CONFIGURED",
    },
    {
      id: "status",
      label: copy.apiReachability,
      value: apiLive ? copy.operational : copy.unavailable,
      state: snapshot.backendHealth.loading
        ? "CACHED"
        : apiLive
          ? "LIVE"
          : snapshot.backendHealth.state,
    },
  ];

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: theme.palette.surface,
          borderColor: theme.palette.borderStrong,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.aura,
          { backgroundColor: `${settingsAccent}0D` },
        ]}
      />

      <View
        pointerEvents="none"
        style={[styles.crownRail, { backgroundColor: settingsAccent }]}
      />

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text
            style={[styles.brand, { color: settingsAccent }]}
          >
            SALONFLOWAI
          </Text>

          <Text
            accessibilityRole="header"
            style={[styles.heroTitle, { color: theme.palette.textPrimary }]}
          >
            {themeName}
          </Text>
        </View>

        <View
          style={[
            styles.localeChip,
            {
              borderColor: `${settingsAccent}66`,
              backgroundColor: `${settingsAccent}12`,
            },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              styles.localeDot,
              { backgroundColor: settingsAccent },
            ]}
          />
          <Text
            style={[styles.localeText, { color: theme.palette.textSecondary }]}
          >
            {snapshot.language.toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        pointerEvents="none"
        style={[styles.rule, { backgroundColor: theme.palette.border }]}
      />

      <View style={styles.grid}>
        {facts.map((fact, index) => (
          <Pressable
            key={`${fact.id}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`${fact.label}: ${fact.value}`}
            onPress={() => onSelect(fact.id)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.palette.surfaceRaised,
                borderColor: theme.palette.borderStrong,
                opacity: pressed ? 0.82 : 1,
                transform: [{ scale: pressed ? 0.992 : 1 }],
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.cardAccent,
                { backgroundColor: `${settingsAccent}B8` },
              ]}
            />

            <View style={styles.cardTop}>
              <Text
                style={[styles.label, { color: theme.palette.textTertiary }]}
              >
                {fact.label}
              </Text>

              <SettingsStatusBadge state={fact.state} />
            </View>

            <Text
              selectable
              style={[styles.value, { color: theme.palette.textPrimary }]}
            >
              {fact.value}
            </Text>

            <View
              pointerEvents="none"
              style={[
                styles.cardFooter,
                { backgroundColor: `${settingsAccent}10` },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    gap: 16,
  },

  aura: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -170,
    right: -80,
  },

  crownRail: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 28,
    height: 2,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },

  hero: {
    zIndex: 1,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
  },

  heroCopy: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 190,
  },

  brand: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  heroTitle: {
    marginTop: 5,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.55,
  },

  localeChip: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  localeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },

  localeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  rule: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  card: {
    position: "relative",
    overflow: "hidden",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 230,
    minWidth: 190,
    minHeight: 132,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
  },

  cardAccent: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 2,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 9,
  },

  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.75,
  },

  value: {
    marginTop: 18,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: -0.18,
  },

  cardFooter: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 11,
    height: 1,
  },
});
