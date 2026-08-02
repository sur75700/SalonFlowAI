import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

type AIUsageMetric = {
  labelKey: string;
  valueKey: string;
};

const AI_USAGE_METRICS: AIUsageMetric[] = [
  { labelKey: "AI Requests Today", valueKey: "AI Usage Requests Today Value" },
  { labelKey: "AI Requests This Month", valueKey: "AI Usage Requests Month Value" },
  { labelKey: "AI Forecast Usage", valueKey: "AI Usage Forecast Value" },
  { labelKey: "Growth Insights Usage", valueKey: "AI Usage Growth Value" },
  { labelKey: "Revenue Simulator Usage", valueKey: "AI Usage Simulator Value" },
  { labelKey: "Opportunity Matrix Usage", valueKey: "AI Usage Matrix Value" },
  { labelKey: "Estimated AI Cost", valueKey: "AI Usage Cost Value" },
  { labelKey: "AI Efficiency Score", valueKey: "AI Usage Efficiency Value" },
];

export default function AIUsageAnalyticsCenter() {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>🧠 {t("AI Usage Analytics Center", locale)}</Text>
      <Text style={styles.subtitle}>{t("AI Usage Analytics Center Subtitle", locale)}</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryValue}>{t("AI Usage Mode Foundation", locale)}</Text>
        <Text style={styles.summaryLabel}>{t("AI Usage Analytics", locale)}</Text>
      </View>

      <View style={styles.metricList}>
        {AI_USAGE_METRICS.map((metric) => (
          <View key={metric.labelKey} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{t(metric.labelKey, locale)}</Text>
            <Text style={styles.metricValue}>{t(metric.valueKey, locale)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>{t("AI Usage Foundation Note", locale)}</Text>
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
    fontSize: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  metricList: {
    gap: 10,
  },
  metricRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 6,
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 14,
  },
});
