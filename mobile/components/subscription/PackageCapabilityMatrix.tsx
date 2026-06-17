import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { PRICING_PLANS } from "../../lib/pricing/plans";
import { CURRENT_PLAN, FeatureCode, hasFeature } from "../../lib/subscription/features";
import { UI } from "../../lib/theme/tokens";

const FEATURE_ROWS: { code: FeatureCode; labelKey: string }[] = [
  { code: "dashboard", labelKey: "Feature Dashboard" },
  { code: "appointments", labelKey: "Feature Appointments" },
  { code: "clients", labelKey: "Feature Clients" },
  { code: "services", labelKey: "Feature Services" },
  { code: "reports", labelKey: "Feature Reports" },
  { code: "basic_analytics", labelKey: "Feature Basic Analytics" },
  { code: "ai_forecast", labelKey: "Feature AI Forecast" },
  { code: "growth_insights", labelKey: "Feature Growth Insights" },
  { code: "revenue_simulator", labelKey: "Feature Revenue Simulator" },
  { code: "opportunity_matrix", labelKey: "Feature Opportunity Matrix" },
  { code: "multi_location", labelKey: "Feature Multi Location" },
  { code: "advanced_ai", labelKey: "Feature Advanced AI" },
  { code: "priority_support", labelKey: "Feature Priority Support" },
];

export default function PackageCapabilityMatrix() {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>{t("Plan Capability Matrix", locale)}</Text>
      <Text style={styles.subtitle}>
        {t("Plan Capability Matrix Subtitle", locale)}
      </Text>

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.featureHeader]}>
          {t("Feature", locale)}
        </Text>
        {PRICING_PLANS.map((plan) => (
          <Text
            key={plan.code}
            style={[
              styles.headerCell,
              plan.code === CURRENT_PLAN ? styles.currentPlanText : null,
            ]}
          >
            {t(plan.nameKey, locale)}
          </Text>
        ))}
      </View>

      {FEATURE_ROWS.map((feature) => (
        <View key={feature.code} style={styles.row}>
          <Text style={styles.featureName}>{t(feature.labelKey, locale)}</Text>
          {PRICING_PLANS.map((plan) => {
            const enabled = hasFeature(plan.code, feature.code);
            const isCurrentPlan = plan.code === CURRENT_PLAN;

            return (
              <View
                key={`${plan.code}-${feature.code}`}
                style={[
                  styles.statusCell,
                  isCurrentPlan ? styles.currentPlanCell : null,
                ]}
              >
                <Text style={enabled ? styles.enabled : styles.disabled}>
                  {enabled ? "✓" : "—"}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
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
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingBottom: 10,
    marginBottom: 6,
  },
  headerCell: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
  },
  featureHeader: {
    flex: 1.55,
    textAlign: "left",
  },
  currentPlanText: {
    color: "#f2d17a",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51,65,85,0.55)",
    paddingVertical: 10,
  },
  featureName: {
    flex: 1.55,
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "800",
    paddingRight: 8,
  },
  statusCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 4,
  },
  currentPlanCell: {
    backgroundColor: "rgba(242,209,122,0.09)",
  },
  enabled: {
    color: "#f2d17a",
    fontSize: 15,
    fontWeight: "900",
  },
  disabled: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "900",
  },
});
