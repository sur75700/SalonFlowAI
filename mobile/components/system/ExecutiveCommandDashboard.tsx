import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

type ExecutiveMetric = {
  labelKey: string;
  valueKey: string;
  statusKey: string;
};

const EXECUTIVE_METRICS: ExecutiveMetric[] = [
  {
    labelKey: "Executive Workspace Health",
    valueKey: "Executive Workspace Health Value",
    statusKey: "Executive Workspace Health Status",
  },
  {
    labelKey: "Executive Security Score",
    valueKey: "Executive Security Score Value",
    statusKey: "Executive Security Score Status",
  },
  {
    labelKey: "Executive AI Status",
    valueKey: "Executive AI Status Value",
    statusKey: "Executive AI Status Detail",
  },
  {
    labelKey: "Executive Revenue Status",
    valueKey: "Executive Revenue Status Value",
    statusKey: "Executive Revenue Status Detail",
  },
  {
    labelKey: "Executive Team Members",
    valueKey: "Executive Team Members Value",
    statusKey: "Executive Team Members Detail",
  },
  {
    labelKey: "Executive Integrations",
    valueKey: "Executive Integrations Value",
    statusKey: "Executive Integrations Detail",
  },
];

export default function ExecutiveCommandDashboard() {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>👑 {t("Executive Command Dashboard", locale)}</Text>
      <Text style={styles.subtitle}>{t("Executive Command Dashboard Subtitle", locale)}</Text>

      <View style={styles.grid}>
        {EXECUTIVE_METRICS.map((metric) => (
          <View key={metric.labelKey} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t(metric.labelKey, locale)}</Text>
            <Text style={styles.metricValue}>{t(metric.valueKey, locale)}</Text>
            <Text style={styles.metricStatus}>{t(metric.statusKey, locale)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>{t("Executive Command Dashboard Note", locale)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.88)",
    borderRadius: UI.radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f2d17a",
  },
  overline: {
    color: "#f2d17a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 7,
  },
  metricStatus: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 5,
  },
  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 14,
  },
});
