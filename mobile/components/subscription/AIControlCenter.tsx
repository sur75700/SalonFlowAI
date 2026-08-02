import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { FeatureCode, hasFeature } from "../../lib/subscription/features";
import { useBilling } from "../../contexts/BillingContext";
import { UI } from "../../lib/theme/tokens";

const AI_MODULES: { code: FeatureCode; titleKey: string; descriptionKey: string; requiredPlan: string }[] = [
  { code: "ai_forecast", titleKey: "AI Forecast", descriptionKey: "AI Forecast Module Subtitle", requiredPlan: "pro" },
  { code: "growth_insights", titleKey: "Growth Insights", descriptionKey: "Growth Insights Module Subtitle", requiredPlan: "pro" },
  { code: "risk_center", titleKey: "Risk Center", descriptionKey: "Risk Center Module Subtitle", requiredPlan: "pro" },
  { code: "client_intelligence", titleKey: "Client Intelligence", descriptionKey: "Client Intelligence Module Subtitle", requiredPlan: "pro" },
  { code: "mission_control", titleKey: "Mission Control", descriptionKey: "Mission Control Module Subtitle", requiredPlan: "business" },
  { code: "performance_center", titleKey: "Performance Center", descriptionKey: "Performance Center Module Subtitle", requiredPlan: "business" },
  { code: "benchmark_center", titleKey: "Benchmark Center", descriptionKey: "Benchmark Center Module Subtitle", requiredPlan: "business" },
  { code: "revenue_simulator", titleKey: "AI Revenue Simulator", descriptionKey: "Revenue Simulator Module Subtitle", requiredPlan: "business" },
  { code: "opportunity_matrix", titleKey: "AI Opportunity Matrix", descriptionKey: "Opportunity Matrix Module Subtitle", requiredPlan: "business" },
  { code: "advanced_ai", titleKey: "Advanced AI", descriptionKey: "Advanced AI Module Subtitle", requiredPlan: "enterprise" },
];

export default function AIControlCenter() {
  const { currentPlan } = useBilling();
  const { locale } = useAppPreferences();

  const activeModules = AI_MODULES.filter((module) =>
    hasFeature(currentPlan, module.code)
  ).length;

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>🤖 {t("AI Control Center", locale)}</Text>
      <Text style={styles.subtitle}>{t("AI Control Center Subtitle", locale)}</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryValue}>
          {activeModules}/{AI_MODULES.length}
        </Text>
        <Text style={styles.summaryLabel}>{t("AI Modules Active", locale)}</Text>
      </View>

      <View style={styles.moduleGrid}>
        {AI_MODULES.map((module) => {
          const enabled = hasFeature(currentPlan, module.code);

          return (
            <View
              key={module.code}
              style={[styles.moduleCard, enabled ? styles.enabledCard : styles.lockedCard]}
            >
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleTitle}>{t(module.titleKey, locale)}</Text>
                <Text style={enabled ? styles.activeBadge : styles.lockedBadge}>
                  {enabled ? t("AI Module Active", locale) : t("AI Module Locked", locale)}
                </Text>
              </View>

              <Text style={styles.moduleSubtitle}>
                {t(module.descriptionKey, locale)}
              </Text>

              {!enabled ? (
                <Text style={styles.requiredPlan}>
                  {t("Requires Plan", locale)}: {module.requiredPlan.toUpperCase()}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.86)",
    borderRadius: UI.radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  overline: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: "rgba(242,209,122,0.12)",
    borderWidth: 1,
    borderColor: "#f2d17a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  moduleGrid: {
    gap: 10,
  },
  moduleCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  enabledCard: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.42)",
  },
  lockedCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "#334155",
  },
  moduleHeader: {
    gap: 8,
    marginBottom: 8,
  },
  moduleTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  activeBadge: {
    alignSelf: "flex-start",
    color: "#22c55e",
    fontSize: 11,
    fontWeight: "900",
  },
  lockedBadge: {
    alignSelf: "flex-start",
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
  },
  moduleSubtitle: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  requiredPlan: {
    color: "#f2d17a",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 8,
  },
});
