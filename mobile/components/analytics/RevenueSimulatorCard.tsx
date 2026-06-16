import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";
import type { AnalyticsRevenueSimulator } from "../../types/models";

type Props = {
  simulator?: AnalyticsRevenueSimulator;
};

function money(value: number) {
  return `${Math.round(value).toLocaleString()} AMD`;
}

export default function RevenueSimulatorCard({ simulator }: Props) {
  const { locale } = useAppPreferences();

  if (!simulator) return null;

  const best = simulator.best_scenario;

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>🚀 {t("AI Revenue Simulator", locale)}</Text>

      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.value}>{money(simulator.completed_revenue)}</Text>
          <Text style={styles.label}>{t("AI Completed Revenue", locale)}</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.value}>{money(simulator.scheduled_pipeline)}</Text>
          <Text style={styles.label}>{t("AI Pipeline Revenue", locale)}</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.value}>{money(simulator.cancelled_value)}</Text>
          <Text style={styles.label}>{t("AI Cancelled Revenue", locale)}</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.value}>{money(simulator.base_revenue)}</Text>
          <Text style={styles.label}>{t("AI Current Revenue", locale)}</Text>
        </View>
      </View>

      {best ? (
        <View style={styles.bestCard}>
          <Text style={styles.bestTitle}>🏆 {t("AI Best Scenario", locale)}</Text>
          <Text style={styles.bestScenario}>{t(`AI Simulator Scenario ${best.code}`, locale as any)}</Text>
          <Text style={styles.bestGain}>+{Math.round(best.delta).toLocaleString()} AMD</Text>
          <Text style={styles.bestMeta}>{t("AI Projected Revenue", locale)}: {money(best.projected_revenue)}</Text>
          <Text style={styles.bestMeta}>{t("AI Confidence", locale)}: {best.confidence}%</Text>
        </View>
      ) : null}

      {simulator.scenarios.map((scenario) => (
        <View key={scenario.code} style={styles.scenario}>
          <Text style={styles.scenarioTitle}>{t(`AI Simulator Scenario ${scenario.code}`, locale as any)}</Text>
          <Text style={styles.scenarioGain}>+{Math.round(scenario.delta).toLocaleString()} AMD</Text>
          <Text style={styles.scenarioMeta}>{t("AI Projected Revenue", locale)}: {money(scenario.projected_revenue)}</Text>
          <Text style={styles.scenarioMeta}>
            {t("AI Confidence", locale)} {scenario.confidence}% · {t(`AI Difficulty ${scenario.difficulty}`, locale as any)}
          </Text>
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
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metric: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  value: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  bestCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(59,130,246,0.18)",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  bestTitle: {
    color: "#bfdbfe",
    fontWeight: "900",
    marginBottom: 8,
  },
  bestScenario: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  bestGain: {
    color: "#22c55e",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
  bestMeta: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  scenario: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  scenarioTitle: {
    color: "#ffffff",
    fontWeight: "900",
  },
  scenarioGain: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  scenarioMeta: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
});
